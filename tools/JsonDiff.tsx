import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { create, type Delta } from 'jsondiffpatch';

const differ = create({
    objectHash: (obj: any, index: number) => obj.id || obj._id || `$$index:${index}`,
});

// --- 默认 JSON 数据 ---
const defaultJsonA = JSON.stringify({
  name: "John Doe",
  age: 30,
  isStudent: false,
  courses: [
    {id: "hist101", title: "History", credits: 3},
    {id: "math203", title: "Math", credits: 4}
  ]
}, null, 2);

const defaultJsonB = JSON.stringify({
  name: "John Doe",
  age: 31,
  isStudent: true,
  courses: [
    {id: "hist101", title: "History", credits: 3},
    {id: "sci404", title: "Science", credits: 4}
  ],
  contact: {
    email: "john.doe@example.com"
  }
}, null, 2);


// --- 可复用的子组件：JsonInput ---
interface JsonInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error: string | null;
    className?: string;
}

const JsonInput: React.FC<JsonInputProps> = ({ id, label, value, onChange, error }) => {
    const textAreaClass = "flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none";
    const errorClass = "mt-2 text-sm text-red-600 dark:text-red-400";

    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{label}</label>
            <textarea
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={textAreaClass}
            />
            {error && <p className={errorClass}>{error}</p>}
        </div>
    );
};


// --- 主组件：JsonDiff ---
const JsonDiff: React.FC = () => {
    const { t } = useTranslation();
    const [jsonA, setJsonA] = useState(defaultJsonA);
    const [jsonB, setJsonB] = useState(defaultJsonB);
    const [diffHtml, setDiffHtml] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ a: string | null; b: string | null }>({ a: null, b: null });

    const handleCompare = useCallback(() => {
        setDiffHtml(null);
        setErrors({ a: null, b: null });

        let parsedA, parsedB;
        try {
            parsedA = JSON.parse(jsonA);
        } catch (e: any) {
            setErrors(prev => ({ ...prev, a: t('tools.jsonDiff.errorInvalidA', { message: e.message }) }));
            return;
        }
        try {
            parsedB = JSON.parse(jsonB);
        } catch (e: any) {
            setErrors(prev => ({ ...prev, b: t('tools.jsonDiff.errorInvalidB', { message: e.message }) }));
            return;
        }

        const delta: Delta | undefined = differ.diff(parsedA, parsedB);
        
        if (delta) {
            // @ts-ignore jsondiffpatch does not provide perfect types for formatters.
            const html = (differ as any).formatters.html.format(delta, parsedA);
            setDiffHtml(html);
        } else {
            setDiffHtml(''); // Use an empty string to signify "no difference"
        }

    }, [jsonA, jsonB, t]);

    const diffResultContent = useMemo(() => {
        if (diffHtml === null) {
            return <div className="text-text-secondary dark:text-d-text-secondary p-4">{t('tools.jsonDiff.pageDescription')}</div>;
        }
        if (diffHtml === '') {
            return <div className="p-4 text-center text-text-secondary dark:text-d-text-secondary">{t('tools.jsonDiff.noDifferences')}</div>;
        }
        return <div dangerouslySetInnerHTML={{ __html: diffHtml }} />;
    }, [diffHtml, t]);

    return (
        <div className="flex flex-col h-full">
            <header>
                <h2 className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.jsonDiff.pageTitle')}</h2>
                <p className="text-text-secondary dark:text-d-text-secondary mb-6">{t('tools.jsonDiff.pageDescription')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                <JsonInput
                    id="json-a-input"
                    label={t('tools.jsonDiff.jsonA')}
                    value={jsonA}
                    onChange={setJsonA}
                    error={errors.a}
                />
                <JsonInput
                    id="json-b-input"
                    label={t('tools.jsonDiff.jsonB')}
                    value={jsonB}
                    onChange={setJsonB}
                    error={errors.b}
                />
            </div>

            <div className="mt-6">
                <button
                    onClick={handleCompare}
                    className="px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent focus:ring-opacity-75"
                    title={t('common.tooltips.compareJson')}
                >
                    {t('tools.jsonDiff.compareButton')}
                </button>
            </div>

            <section className="mt-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.jsonDiff.diffOutput')}</h3>
                <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm overflow-auto max-h-[40vh] min-h-[20vh]">
                    {diffResultContent}
                </div>
            </section>
        </div>
    );
};

export default JsonDiff;