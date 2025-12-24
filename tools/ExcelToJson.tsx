import React, {
    useState,
    useRef,
    useCallback,
    useMemo,
    useContext
} from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { TableIcon, CopyIcon } from '../components/icons/Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../App';

interface SheetData {
    name: string;
    json: any[];
}

const ExcelToJson: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { theme } = useContext(ThemeContext);

    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setSheets([]);
        setSelectedSheet(null);
        setFileName(file.name);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetData = workbook.SheetNames.map(name => ({
                name,
                json: XLSX.utils.sheet_to_json(workbook.Sheets[name])
            }));

            if (sheetData.length === 0) {
                addToast(t('tools.excelToJson.noSheets'), 'info');
            } else {
                setSheets(sheetData);
                setSelectedSheet(sheetData[0].name);
            }
        } catch (error) {
            addToast(t('tools.excelToJson.errorParsing'), 'error');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    }, [addToast, t]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const jsonOutput = useMemo(() => {
        if (!selectedSheet) return '';
        const sheet = sheets.find(s => s.name === selectedSheet);
        return sheet ? JSON.stringify(sheet.json, null, 2) : '';
    }, [selectedSheet, sheets]);

    const handleCopy = () => {
        if (!jsonOutput) return;
        navigator.clipboard.writeText(jsonOutput).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.excelToJson.pageTitle')} description={t('tools.excelToJson.pageDescription')} />
            <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                {/* Left Panel: Upload & Sheet Selection */}
                <div className="flex flex-col gap-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="cursor-pointer h-40 p-6 bg-secondary dark:bg-d-secondary rounded-2xl border-2 border-dashed border-border-color dark:border-d-border-color hover:border-accent dark:hover:border-d-accent transition-colors flex flex-col items-center justify-center"
                    >
                         {fileName ? (
                            <div className="text-center">
                                <TableIcon className="mx-auto h-12 w-12 text-accent dark:text-d-accent" />
                                <p className="mt-2 font-semibold truncate">{fileName}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <TableIcon className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" />
                                <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary">
                                    <span className="font-semibold text-accent dark:text-d-accent">{t('tools.excelToJson.uploadFile')}</span>
                                    {' '}{t('tools.excelToJson.dropzone')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col flex-grow bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                        <h3 className="p-3 border-b border-border-color dark:border-d-border-color font-semibold">{t('tools.excelToJson.sheets')}</h3>
                        <div className="flex-grow p-2 overflow-y-auto">
                            {isProcessing ? (
                                <div className="flex items-center justify-center h-full text-text-secondary">{t('common.loading')}...</div>
                            ) : sheets.length > 0 ? (
                                <div className="space-y-1">
                                    {sheets.map(sheet => (
                                        <button
                                            key={sheet.name}
                                            onClick={() => setSelectedSheet(sheet.name)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md ${selectedSheet === sheet.name ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-primary dark:hover:bg-d-primary'}`}
                                        >
                                            {sheet.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-secondary">{t('tools.excelToJson.selectSheet')}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: JSON Output */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.excelToJson.output')}</h3>
                        {jsonOutput && (
                            <button onClick={handleCopy} title={t('common.copy') as string}>
                                <CopyIcon className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                            </button>
                        )}
                    </div>
                    <div className="flex-grow p-2 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color overflow-auto">
                        {jsonOutput ? (
                             <SyntaxHighlighter
                                language="json"
                                style={theme === 'dark' ? vscDarkPlus : vs}
                                customStyle={{ margin: 0, backgroundColor: 'transparent', height: '100%', overflow: 'auto' }}
                                codeTagProps={{ style: { fontFamily: 'monospace' } }}
                                showLineNumbers
                            >
                                {jsonOutput}
                            </SyntaxHighlighter>
                        ) : (
                             <EmptyState Icon={TableIcon} message={t('tools.excelToJson.selectSheet')} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelToJson;
