import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { TableIcon } from '../components/icons/Icons';

interface MarkdownToExcelState {
    input: string;
}

const MarkdownToExcel: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const { state, setState } = useToolState<MarkdownToExcelState>('markdown-to-excel', {
        input: '| 姓名 | 部门 | 职位 |\n| --- | --- | --- |\n| 张三 | 研发部 | 后端工程师 |\n| 李四 | 市场部 | 客户经理 |',
    });

    const parsedTable = useMemo(() => {
        const lines = state.input.trim().split('\n');
        if (lines.length < 2) return null;

        // 识别表格行：必须包含 | 符号
        const tableLines = lines.filter(line => line.includes('|'));
        if (tableLines.length < 2) return null;

        // 解析每一行
        const data = tableLines.map(line => {
            const cells = line.split('|')
                .map(c => c.trim())
                .filter((c, i, arr) => {
                    // 过滤掉行首尾的空元素（如果 Markdown 表格以 | 开头和结尾）
                    if (i === 0 && c === '') return false;
                    if (i === arr.length - 1 && c === '') return false;
                    return true;
                });
            return cells;
        });

        // 过滤掉 Markdown 的对齐行（如 | --- | --- |）
        const filteredData = data.filter(row => {
            const isDivider = row.every(cell => /^[ \-:]+$/.test(cell));
            return !isDivider;
        });

        return filteredData.length > 0 ? filteredData : null;
    }, [state.input]);

    const handleDownload = () => {
        if (!parsedTable) {
            addToast(t('tools.markdownToExcel.noTableFound'), 'error');
            return;
        }

        try {
            const ws = XLSX.utils.aoa_to_sheet(parsedTable);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, "table_export.xlsx");
            addToast(t('common.toast.copiedSuccess'), 'success');
        } catch (error) {
            addToast(t('tools.markdownToExcel.parseError'), 'error');
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader 
                title={t('tools.markdownToExcel.pageTitle')} 
                description={t('tools.markdownToExcel.pageDescription')} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Input Area */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 ml-2">
                        {t('tools.markdownToExcel.inputLabel')}
                    </h3>
                    <div className="flex-grow glass-panel rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                        <textarea
                            value={state.input}
                            onChange={(e) => setState({ input: e.target.value })}
                            placeholder={t('tools.markdownToExcel.placeholder') as string}
                            className="w-full h-full p-6 bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary font-mono text-sm focus:outline-none resize-none placeholder:opacity-30"
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* Preview & Action Area */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70">
                            {t('tools.markdownToExcel.previewLabel')}
                        </h3>
                        <button
                            onClick={handleDownload}
                            disabled={!parsedTable}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <TableIcon className="w-4 h-4" />
                            {t('tools.markdownToExcel.downloadButton')}
                        </button>
                    </div>

                    <div className="flex-grow glass-panel rounded-[2rem] border border-white/10 overflow-auto bg-white/5 p-6">
                        {parsedTable ? (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-primary/50 dark:bg-slate-800/50">
                                            {parsedTable[0].map((cell, idx) => (
                                                <th key={idx} className="px-4 py-3 font-black text-accent dark:text-indigo-400 border-b border-white/10 uppercase tracking-tighter">
                                                    {cell}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {parsedTable.slice(1).map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                                                {row.map((cell, cellIdx) => (
                                                    <td key={cellIdx} className="px-4 py-3 text-text-primary dark:text-d-text-primary font-medium">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary/40 italic">
                                <TableIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p>{t('tools.markdownToExcel.noTableFound')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkdownToExcel;