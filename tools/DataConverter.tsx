import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';
import * as xmljs from 'xml-js';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';

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
    <div>
      <h3 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{label}</h3>
      <div className="flex space-x-2 bg-secondary dark:bg-d-secondary p-1 rounded-lg border border-border-color dark:border-d-border-color">
        {formats.map(format => (
          <button
            key={format}
            onClick={() => onSelect(format)}
            className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              selected === format
                ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow'
                : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'
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

        // 1. Parse input to JS Object
        if (fromFormat === 'json') {
          jsObject = JSON.parse(inputData);
        } else if (fromFormat === 'yaml') {
          jsObject = yaml.load(inputData);
           if (typeof jsObject === 'string' || typeof jsObject === 'number' || typeof jsObject === 'boolean' || jsObject === null) {
                // Wrap primitives to handle them consistently
                jsObject = { value: jsObject };
            }
        } else { // xml
          jsObject = xmljs.xml2js(inputData, { compact: true });
        }

        // 2. Stringify JS Object to output format
        let outputString: string;
        if (toFormat === 'json') {
          outputString = JSON.stringify(jsObject, null, 2);
        } else if (toFormat === 'yaml') {
          outputString = yaml.dump(jsObject);
        } else { // xml
          outputString = xmljs.js2xml(jsObject, { compact: true, spaces: 2 });
        }

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
    navigator.clipboard.writeText(outputData).then(() => {
        addToast(t('common.toast.copiedSuccess'), 'success');
    }, () => {
        addToast(t('common.toast.copiedFailed'), 'error');
    });
  };

  const handleSwap = () => {
    if (error || !outputData) return;
    setState(s => ({
        ...s,
        inputData: s.outputData,
        fromFormat: s.toFormat,
        toFormat: s.fromFormat,
    }));
  };
  
  return (
    <div>
      <ToolHeader 
        title={t('tools.dataConverter.pageTitle')}
        description={t('tools.dataConverter.pageDescription')}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
        <FormatSelector label={t('tools.dataConverter.from')} selected={fromFormat} onSelect={fmt => setState(s => ({ ...s, fromFormat: fmt }))} />
        <FormatSelector label={t('tools.dataConverter.to')} selected={toFormat} onSelect={fmt => setState(s => ({ ...s, toFormat: fmt }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-350px)]">
        <div className="flex flex-col">
          <label htmlFor="data-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.dataConverter.inputLabel')}</label>
          <textarea
            id="data-input"
            value={inputData}
            onChange={(e) => setState(s => ({ ...s, inputData: e.target.value }))}
            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="data-output" className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.dataConverter.outputLabel')}</label>
            <div className="flex space-x-2">
                 <button onClick={handleSwap} title={t('common.tooltips.swapConversion')} className="px-3 py-1 text-sm bg-border-color dark:bg-d-border-color rounded-md text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600">
                    {t('tools.dataConverter.swapButton')}
                </button>
                <button onClick={handleCopy} title={t('common.tooltips.copyOutput')} className="px-3 py-1 text-sm bg-border-color dark:bg-d-border-color rounded-md text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600">
                    {t('common.copy')}
                </button>
            </div>
          </div>
          <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg overflow-auto relative">
             {error && <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md whitespace-pre-wrap font-mono text-xs">{error}</div>}
             {!error && outputData && (
                <pre className="text-sm text-text-primary dark:text-d-text-primary whitespace-pre-wrap">
                    <code className="font-mono">{outputData}</code>
                </pre>
             )}
             {!error && !outputData && <div className="text-text-secondary dark:text-d-text-secondary">{t('tools.dataConverter.outputPlaceholder')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConverter;
