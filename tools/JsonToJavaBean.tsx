import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToasts } from '../contexts/ToastContext';
import { CopyIcon } from '../components/icons/Icons';
import { ThemeContext } from '../App';

// --- TYPES AND STATE ---

type Mode = 'json' | 'ddl';
interface Options {
    rootClassName: string;
    useLombok: boolean;
    useSealedClasses: boolean;
    useFinalFields: boolean;
    isSerializable: boolean;
}
interface JsonToJavaState {
    input: string;
    mode: Mode;
    options: Options;
}

// --- UTILITY FUNCTIONS ---

const toCamelCase = (str: string) => {
    // A string is considered all-caps snake case if it only contains uppercase letters, numbers, and underscores.
    const isAllCapsSnake = /^[A-Z0-9_]+$/.test(str);
    
    let processedStr = str;
    if (isAllCapsSnake) {
        processedStr = str.toLowerCase();
    }
    
    // Replace snake_case and kebab-case with camelCase
    return processedStr.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
};

const toPascalCase = (str: string) => {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
};

// --- CORE CONVERSION LOGIC ---

const generateMethods = (fields: {name: string, type: string}[], options: Options, className: string): string => {
    const { useLombok, useFinalFields } = options;
    let methods = '';

    // Constructor for final fields
    if (useFinalFields) {
        const params = fields.map(f => `${f.type} ${f.name}`).join(', ');
        const assignments = fields.map(f => `        this.${f.name} = ${f.name};`).join('\n');
        methods += `\n    public ${className}(${params}) {\n${assignments}\n    }\n`;
    }

    // Getters and Setters if not using Lombok
    if (!useLombok) {
        fields.forEach(f => {
            const pascalName = toPascalCase(f.name);
            methods += `\n    public ${f.type} get${pascalName}() {\n        return this.${f.name};\n    }\n`;
            if (!useFinalFields) {
                methods += `\n    public void set${pascalName}(${f.type} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }\n`;
            }
        });
    }

    return methods;
}

const generateJavaFromJson = (jsonString: string, options: Options): string => {
    const { rootClassName, useLombok, useSealedClasses, useFinalFields, isSerializable } = options;
    const json = JSON.parse(jsonString);

    const imports = new Set<string>();
    if (useLombok) imports.add('import lombok.Data;');
    if (isSerializable) imports.add('import java.io.Serializable;');

    const generateClass = (obj: any, className: string, isRoot: boolean): string => {
        const fields: {name: string, type: string}[] = [];
        const nestedClasses: string[] = [];

        for (const key in obj) {
            const fieldName = toCamelCase(key);
            let fieldType: string;
            const value = obj[key];

            if (Array.isArray(value)) {
                imports.add('import java.util.List;');
                if (value.length > 0) {
                    const firstItem = value[0];
                    if (typeof firstItem === 'object' && firstItem !== null) {
                        const nestedClassName = toPascalCase(key) + 'Item';
                        nestedClasses.push(generateClass(firstItem, nestedClassName, false));
                        fieldType = `List<${nestedClassName}>`;
                    } else if (typeof firstItem === 'number') {
                        fieldType = `List<${Number.isInteger(firstItem) ? 'Integer' : 'Double'}>`;
                    } else if (typeof firstItem === 'boolean') {
                        fieldType = `List<Boolean>`;
                    } else {
                        fieldType = `List<String>`;
                    }
                } else {
                    fieldType = 'List<Object>';
                }
            } else if (typeof value === 'object' && value !== null) {
                const nestedClassName = toPascalCase(key);
                nestedClasses.push(generateClass(value, nestedClassName, false));
                fieldType = nestedClassName;
            } else if (typeof value === 'number') {
                fieldType = Number.isInteger(value) ? 'Integer' : 'Double';
            } else if (typeof value === 'boolean') {
                fieldType = 'boolean';
            } else {
                fieldType = 'String';
            }
            
            fields.push({ name: fieldName, type: fieldType });
        }

        const fieldDeclarations = fields.map(f => `    private ${useFinalFields ? 'final ' : ''}${f.type} ${f.name};`).join('\n');
        const methods = generateMethods(fields, options, className);

        let classHeader = '';
        if (useLombok) classHeader += '@Data\n';

        const classModifiers = isRoot ? 'public' : 'public static';
        const sealedModifier = isRoot && useSealedClasses ? 'sealed ' : '';
        const finalModifier = !isRoot && useSealedClasses ? 'final ' : '';
        const implementsClause = isSerializable ? ' implements Serializable' : '';
        
        classHeader += `${classModifiers} ${sealedModifier}${finalModifier}class ${className}${implementsClause} {\n`;

        const nestedClassString = nestedClasses.map(nc => nc.split('\n').map(line => `    ${line}`).join('\n')).join('\n\n');

        return `${classHeader}${fieldDeclarations}\n${methods}${nestedClassString ? '\n' + nestedClassString + '\n' : ''}}`;
    };

    const mainClass = generateClass(json, rootClassName, true);
    
    return (imports.size > 0 ? Array.from(imports).join('\n') + '\n\n' : '') + mainClass;
};

const generateJavaFromDdl = (ddlString: string, options: Options): string => {
    const { useLombok, useFinalFields, isSerializable } = options;
    
    const tableNameMatch = ddlString.match(/CREATE TABLE `?(\w+)`?/i);
    if (!tableNameMatch) throw new Error("Could not find table name.");
    
    const className = toPascalCase(tableNameMatch[1]);
    const columnsMatch = ddlString.match(/\(([\s\S]*)\)/);
    if (!columnsMatch) throw new Error("Could not find column definitions.");

    const imports = new Set<string>();
    if (useLombok) imports.add('import lombok.Data;');
    if (isSerializable) imports.add('import java.io.Serializable;');

    const columnLines = columnsMatch[1].split('\n').filter(line => line.trim().startsWith('`'));
    
    const fieldsInfo: { name: string, type: string }[] = columnLines.map(line => {
        const parts = line.trim().match(/`(\w+)`\s+(\w+)/);
        if (!parts) return null;
        const colName = parts[1];
        const colType = parts[2].toUpperCase();
        
        const fieldName = toCamelCase(colName);
        let fieldType: string;

        if (colType.includes('INT')) {
            if (colType === 'TINYINT' && line.includes('(1)')) {
                fieldType = 'boolean';
            } else if (colType === 'BIGINT') {
                fieldType = 'Long';
            } else {
                fieldType = 'Integer';
            }
        } else if (['FLOAT', 'DOUBLE', 'REAL'].includes(colType)) {
            fieldType = 'Double';
        } else if (['DECIMAL', 'NUMERIC'].includes(colType)) {
            fieldType = 'java.math.BigDecimal';
            imports.add('import java.math.BigDecimal;');
        } else if (colType === 'DATE') {
            fieldType = 'java.time.LocalDate';
            imports.add('import java.time.LocalDate;');
        } else if (['DATETIME', 'TIMESTAMP'].includes(colType)) {
            fieldType = 'java.time.LocalDateTime';
            imports.add('import java.time.LocalDateTime;');
        } else if (colType === 'TIME') {
            fieldType = 'java.time.LocalTime';
            imports.add('import java.time.LocalTime;');
        } else if (['BOOLEAN', 'BOOL'].includes(colType)) {
            fieldType = 'boolean';
        } else if (colType.includes('BLOB') || colType.includes('BINARY')) {
            fieldType = 'byte[]';
        } else {
            fieldType = 'String';
        }

        return { name: fieldName, type: fieldType };
    }).filter((f): f is { name: string, type: string } => f !== null);

    const fieldDeclarations = fieldsInfo.map(f => `    private ${useFinalFields ? 'final ' : ''}${f.type} ${f.name};`).join('\n');
    const methods = generateMethods(fieldsInfo, options, className);

    let classDef = '';
    if (useLombok) classDef += '@Data\n';
    const implementsClause = isSerializable ? ' implements Serializable' : '';
    classDef += `public class ${className}${implementsClause} {\n${fieldDeclarations}\n${methods}\n}`;

    return (imports.size > 0 ? Array.from(imports).join('\n') + '\n\n' : '') + classDef;
};


// --- UI COMPONENTS ---

const OptionsPanel: React.FC<{ options: Options; setOptions: (o: Options) => void; mode: Mode }> = ({ options, setOptions, mode }) => {
    const { t } = useTranslation();
    const set = (key: keyof Options) => (value: any) => setOptions({ ...options, [key]: value });

    return (
        <div className="flex flex-col gap-4 p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
            <h3 className="font-semibold text-text-primary dark:text-d-text-primary">{t('tools.jsonToJavaBean.options')}</h3>
            <LabeledControl label={t('tools.jsonToJavaBean.rootClassName')}>
                <input
                    type="text"
                    value={options.rootClassName}
                    onChange={e => set('rootClassName')(e.target.value)}
                    className="w-full p-2 bg-primary dark:bg-d-primary rounded-md"
                />
            </LabeledControl>
            <div className="flex items-center justify-between">
                <label className="font-medium text-sm">{t('tools.jsonToJavaBean.useLombok')}</label>
                <input type="checkbox" checked={options.useLombok} onChange={e => set('useLombok')(e.target.checked)} />
            </div>
            <div className={`flex items-center justify-between ${mode === 'ddl' ? 'opacity-50' : ''}`}>
                <label className="font-medium text-sm">{t('tools.jsonToJavaBean.useSealed')}</label>
                <input type="checkbox" checked={options.useSealedClasses} onChange={e => set('useSealedClasses')(e.target.checked)} disabled={mode === 'ddl'}/>
            </div>
             <div className="flex items-center justify-between">
                <label className="font-medium text-sm">{t('tools.jsonToJavaBean.useFinalFields')}</label>
                <input type="checkbox" checked={options.useFinalFields} onChange={e => set('useFinalFields')(e.target.checked)} />
            </div>
            <div className="flex items-center justify-between">
                <label className="font-medium text-sm">{t('tools.jsonToJavaBean.useSerializable')}</label>
                <input type="checkbox" checked={options.isSerializable} onChange={e => set('isSerializable')(e.target.checked)} />
            </div>
        </div>
    );
};

const defaultJson = `{
  "id": 123,
  "product_name": "Laptop",
  "in_stock": true,
  "price": 999.99,
  "tags": ["electronics", "computer"],
  "specs": {
    "cpu": "Intel i7",
    "ram_gb": 16
  }
}`;

const defaultDdl = `CREATE TABLE \`users\` (
  \`id\` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  \`USER_NAME\` VARCHAR(255) NOT NULL,
  \`REAL_NAME\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) DEFAULT NULL,
  \`is_active\` TINYINT(1) DEFAULT '1',
  \`balance\` DECIMAL(10,2) DEFAULT '0.00',
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;`;


// --- MAIN COMPONENT ---
const JsonToJavaBean: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const addToast = useToasts();

    const { state, setState } = useToolState<JsonToJavaState>('json-to-java-bean', {
        input: defaultJson,
        mode: 'json',
        options: {
            rootClassName: 'Root',
            useLombok: true,
            useSealedClasses: false,
            useFinalFields: false,
            isSerializable: true,
        },
    });

    const { input, mode, options } = state;
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generate = () => {
            if (!input.trim()) {
                setOutput('');
                setError(null);
                return;
            }
            try {
                let result = '';
                if (mode === 'json') {
                    result = generateJavaFromJson(input, options);
                } else {
                    result = generateJavaFromDdl(input, options);
                }
                setOutput(result);
                setError(null);
            } catch (e) {
                const messageKey = mode === 'json' ? 'errorInvalidJson' : 'errorInvalidDdl';
                setError(t(`tools.jsonToJavaBean.${messageKey}`));
                setOutput('');
            }
        };

        const timeout = setTimeout(generate, 300);
        return () => clearTimeout(timeout);
    }, [input, options, mode, t]);
    
    const setMode = (newMode: Mode) => {
        setState(s => ({...s, mode: newMode, input: newMode === 'json' ? defaultJson : defaultDdl }));
        setError(null);
    }
    const setOptions = (newOptions: Options) => setState(s => ({...s, options: newOptions}));

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        });
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.jsonToJavaBean.pageTitle')} description={t('tools.jsonToJavaBean.pageDescription')} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-grow min-h-0">
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex border-b border-border-color dark:border-d-border-color">
                        <button onClick={() => setMode('json')} className={`px-4 py-2 text-sm font-semibold ${mode === 'json' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}>{t('tools.jsonToJavaBean.jsonToJava')}</button>
                        <button onClick={() => setMode('ddl')} className={`px-4 py-2 text-sm font-semibold ${mode === 'ddl' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}>{t('tools.jsonToJavaBean.ddlToJava')}</button>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow min-h-0">
                        <div className="flex flex-col">
                            <label className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.jsonToJavaBean.input')}</label>
                            <textarea
                                value={input}
                                onChange={e => setState(s => ({...s, input: e.target.value}))}
                                className="flex-grow p-2 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm resize-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.jsonToJavaBean.output')}</label>
                                <button onClick={handleCopy}><CopyIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-grow bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg overflow-auto">
                               {error && <div className="p-2 text-red-500 text-sm">{error}</div>}
                               {!error && output && (
                                <SyntaxHighlighter language="java" style={theme === 'dark' ? vscDarkPlus : vs} customStyle={{ margin: 0, backgroundColor: 'transparent' }}>
                                    {output}
                                </SyntaxHighlighter>
                               )}
                               {!error && !output && <div className="p-2 text-text-secondary dark:text-d-text-secondary text-sm">{t('tools.jsonToJavaBean.outputPlaceholder')}</div>}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <OptionsPanel options={options} setOptions={setOptions} mode={mode} />
                </div>
            </div>
        </div>
    );
};

export default JsonToJavaBean;