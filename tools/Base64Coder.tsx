import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';

type Mode = 'encode' | 'decode';

interface Base64CoderState {
  input: string;
  output: string;
  mode: Mode;
  error: string | null;
}

const Base64Coder: React.FC = () => {
  const { t } = useTranslation();
  const { state, setState } = useToolState<Base64CoderState>('base64-coder', {
    input: '',
    output: '',
    mode: 'encode',
    error: null
  });
  const { input, output, mode, error } = state;
  const addToast = useToasts();

  useEffect(() => {
    const processText = () => {
      if (!input.trim()) {
        setState(s => ({ ...s, output: '', error: null }));
        return;
      }

      try {
        let newOutput: string;
        if (mode === 'encode') {
          // Handle UTF-8 characters correctly
          newOutput = btoa(unescape(encodeURIComponent(input)));
        } else {
          // Handle UTF-8 characters correctly
          newOutput = decodeURIComponent(escape(atob(input)));
        }
        setState(s => ({ ...s, output: newOutput, error: null }));
      } catch (e) {
        setState(s => ({ ...s, output: '', error: t('tools.base64Coder.errorInvalid') }));
      }
    };

    const debounceTimeout = setTimeout(processText, 200);
    return () => clearTimeout(debounceTimeout);
  }, [input, mode, t, setState]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
        addToast(t('common.toast.copiedSuccess'), 'success');
    }, () => {
        addToast(t('common.toast.copiedFailed'), 'error');
    });
  };

  const handleSwap = () => {
    if (error || !output) return;
    setState(s => ({
        ...s,
        input: s.output,
        mode: s.mode === 'encode' ? 'decode' : 'encode'
    }));
  };

  return (
    <div>
      <ToolHeader 
        title={t('tools.base64Coder.pageTitle')}
        description={t('tools.base64Coder.pageDescription')}
      />
      
      <div className="flex items-center justify-center space-x-4 mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="radio" name="mode" value="encode" checked={mode === 'encode'} onChange={() => setState(s => ({ ...s, mode: 'encode' }))} className="h-4 w-4 text-accent dark:text-d-accent bg-secondary dark:bg-d-secondary border-border-color dark:border-d-border-color focus:ring-accent dark:focus:ring-d-accent" />
          <span className="font-semibold text-text-primary dark:text-d-text-primary">{t('tools.base64Coder.encode')}</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="radio" name="mode" value="decode" checked={mode === 'decode'} onChange={() => setState(s => ({ ...s, mode: 'decode' }))} className="h-4 w-4 text-accent dark:text-d-accent bg-secondary dark:bg-d-secondary border-border-color dark:border-d-border-color focus:ring-accent dark:focus:ring-d-accent" />
          <span className="font-semibold text-text-primary dark:text-d-text-primary">{t('tools.base64Coder.decode')}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-350px)]">
        <div className="flex flex-col">
          <label htmlFor="base64-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.base64Coder.inputLabel')}</label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => setState(s => ({ ...s, input: e.target.value }))}
            placeholder={t('tools.base64Coder.inputPlaceholder')}
            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="base64-output" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.base64Coder.outputLabel')}</label>
          <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg overflow-auto relative">
             {error && <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md whitespace-pre-wrap">{error}</div>}
             {!error && output && (
                <pre className="text-sm text-text-primary dark:text-d-text-primary whitespace-pre-wrap break-all">
                    <code>{output}</code>
                </pre>
             )}
             {!error && !output && <div className="text-text-secondary dark:text-d-text-secondary">{t('tools.base64Coder.outputPlaceholder')}</div>}
             {!error && output && (
                <div className="absolute top-2 right-2 flex space-x-2">
                    <button onClick={handleSwap} aria-label={t('common.tooltips.swapInputOutput')} className="p-2 bg-border-color dark:bg-d-border-color rounded-md text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </button>
                    <button onClick={handleCopy} aria-label={t('common.tooltips.copyOutput')} className="p-2 bg-border-color dark:bg-d-border-color rounded-md text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64Coder;