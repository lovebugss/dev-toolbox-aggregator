
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
// Fix: Added missing imports for RefreshIcon and CopyIcon.
import { RefreshIcon, CopyIcon } from '../components/icons/Icons';

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
          newOutput = btoa(unescape(encodeURIComponent(input)));
        } else {
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
    navigator.clipboard.writeText(output).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
  };

  const handleSwap = () => {
    if (error || !output) return;
    setState(s => ({ ...s, input: s.output, mode: s.mode === 'encode' ? 'decode' : 'encode' }));
  };

  return (
    <div>
      <ToolHeader title={t('tools.base64Coder.pageTitle')} description={t('tools.base64Coder.pageDescription')} />
      
      <div className="flex items-center justify-center gap-2 mb-8 glass-panel p-1.5 rounded-full w-fit mx-auto border-white/10">
        <button 
            onClick={() => setState(s => ({ ...s, mode: 'encode' }))}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'encode' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary dark:text-d-text-secondary hover:bg-white/5'}`}
        >
            {t('tools.base64Coder.encode')}
        </button>
        <button 
            onClick={() => setState(s => ({ ...s, mode: 'decode' }))}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'decode' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary dark:text-d-text-secondary hover:bg-white/5'}`}
        >
            {t('tools.base64Coder.decode')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
        <div className="flex flex-col glass-panel rounded-[2rem] overflow-hidden border-white/10">
          <label className="px-6 py-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 bg-white/5">{t('tools.base64Coder.inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => setState(s => ({ ...s, input: e.target.value }))}
            placeholder={t('tools.base64Coder.inputPlaceholder')}
            className="flex-grow p-6 bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm resize-none placeholder:opacity-30"
          />
        </div>
        <div className="flex flex-col glass-panel rounded-[2rem] overflow-hidden border-white/10 relative">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70">{t('tools.base64Coder.outputLabel')}</label>
            <div className="flex gap-2">
                <button onClick={handleSwap} className="p-1.5 hover:bg-white/10 rounded-lg text-accent transition-colors" title={t('common.tooltips.swapInputOutput')}><RefreshIcon className="w-4 h-4 transform rotate-90"/></button>
                <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg text-accent transition-colors"><CopyIcon className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="flex-grow p-6 bg-black/5 dark:bg-black/20 overflow-auto">
             {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-mono">{error}</div>}
             {!error && output ? (
                <pre className="text-sm text-text-primary dark:text-d-text-primary whitespace-pre-wrap break-all font-mono leading-relaxed">{output}</pre>
             ) : !error && (
                <div className="text-text-secondary dark:text-d-text-secondary/30 italic text-sm">{t('tools.base64Coder.outputPlaceholder')}</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64Coder;
