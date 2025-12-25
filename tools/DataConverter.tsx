import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';
import * as xmljs from 'xml-js';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon, RefreshIcon } from '../components/icons/Icons';

type Format = 'json' | 'yaml' | 'xml';
const formats: Format[] = ['json', 'yaml', 'xml'];

interface DataConverterState {
  inputData: string;
  outputData: string;
  fromFormat: Format;
  toFormat: Format;
  error: string | null;
}

const FormatSelector: React.FC<{
  label: string;
  selected: Format;
  onSelect: (format: Format) => void;
}> = ({ label, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 ml-2">{label}</h3>
      <div className="flex p-1 bg-secondary dark:bg-d-secondary rounded-xl border border-white/10 shadow-inner">
        {formats.map(format => (
          <button
            key={format}
            onClick={() => onSelect(format)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              selected === format ? 'bg-accent text-white shadow-md' : 'text-text-secondary dark:text-d-text-secondary hover:bg-white/5'
            }`}
          >
            {t(`tools.dataConverter.${format}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

const DataConverter: React.FC = () => {
  const { t } = useTranslation();
  const { state, setState } = useToolState<DataConverterState>('data-converter', {
    inputData: '{\n  "name": "DevToolbox",\n  "version": 1,\n  "features": ["formatter", "converter", "generator"]\n}',
    outputData: '',
    fromFormat: 'json',
    toFormat: 'yaml',
    error: null,
  });
  const { inputData, outputData, fromFormat, toFormat, error } = state;
  const addToast = useToasts();

  useEffect(() => {
    if (!inputData.trim()) {
      setState(s => ({ ...s, outputData: '', error: null }));
      return;
    }
    const convert = () => {
      try {
        let jsObject: any;
        if (fromFormat === 'json') jsObject = JSON.parse(inputData);
        else if (fromFormat === 'yaml') {
          jsObject = yaml.load(inputData);
          if (typeof jsObject !== 'object') jsObject = { value: jsObject };
        } else jsObject = xmljs.xml2js(inputData, { compact: true });

        let outputString: string;
        if (toFormat === 'json') outputString = JSON.stringify(jsObject, null, 2);
        else if (toFormat === 'yaml') outputString = yaml.dump(jsObject);
        else outputString = xmljs.js2xml(jsObject, { compact: true, spaces: 2 });

        setState(s => ({ ...s, outputData: outputString, error: null }));
      } catch (e: any) {
        setState(s => ({ ...s, outputData: '', error: t('tools.dataConverter.errorInvalidInput', { format: fromFormat.toUpperCase(), message: e.message }) }));
      }
    };
    const debounceTimeout = setTimeout(convert, 300);
    return () => clearTimeout(debounceTimeout);
  }, [inputData, fromFormat, toFormat, t, setState]);
  
  const handleCopy = () => {
    if (!outputData || error) return;
    navigator.clipboard.writeText(outputData).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
  };

  const handleSwap = () => {
    if (error || !outputData) return;
    setState(s => ({ ...s, inputData: s.outputData, fromFormat: s.toFormat, toFormat: s.fromFormat }));
  };
  
  return (
    <div className="flex flex-col h-full">
      <ToolHeader title={t('tools.dataConverter.pageTitle')} description={t('tools.dataConverter.pageDescription')} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <FormatSelector label={t('tools.dataConverter.from')} selected={fromFormat} onSelect={fmt => setState(s => ({ ...s, fromFormat: fmt }))} />
        <FormatSelector label={t('tools.dataConverter.to')} selected={toFormat} onSelect={fmt => setState(s => ({ ...s, toFormat: fmt }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
        <div className="flex flex-col glass-panel rounded-[2rem] overflow-hidden border-white/10">
          <label className="px-6 py-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 bg-white/5">{t('tools.dataConverter.inputLabel')}</label>
          <textarea
            value={inputData}
            onChange={(e) => setState(s => ({ ...s, inputData: e.target.value }))}
            className="flex-grow p-6 bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm resize-none placeholder:opacity-30"
            spellCheck="false"
          />
        </div>
        <div className="flex flex-col glass-panel rounded-[2rem] overflow-hidden border-white/10">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70">{t('tools.dataConverter.outputLabel')}</label>
            <div className="flex gap-2">
                 <button onClick={handleSwap} title={t('common.tooltips.swapConversion')} className="p-1.5 hover:bg-white/10 rounded-lg text-accent transition-colors"><RefreshIcon className="w-4 h-4 transform rotate-90"/></button>
                 <button onClick={handleCopy} title={t('common.tooltips.copyOutput')} className="p-1.5 hover:bg-white/10 rounded-lg text-accent transition-colors"><CopyIcon className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="flex-grow p-6 bg-black/5 dark:bg-black/20 overflow-auto relative">
             {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-mono leading-relaxed">{error}</div>}
             {!error && outputData ? (
                <pre className="text-sm text-text-primary dark:text-d-text-primary whitespace-pre-wrap font-mono leading-relaxed">{outputData}</pre>
             ) : !error && (
                <div className="text-text-secondary dark:text-d-text-secondary/30 italic text-sm">{t('tools.dataConverter.outputPlaceholder')}</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConverter;