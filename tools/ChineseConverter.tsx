
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Converter } from 'opencc-js';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { RefreshIcon, CopyIcon, TrashIcon } from '../components/icons/Icons';

type ConversionVariant = 's2t' | 't2s' | 's2tw' | 'tw2s' | 's2hk' | 'hk2s' | 's2twp' | 't2tw';

interface ChineseConverterState {
  input: string;
  output: string;
  variant: ConversionVariant;
  isAutoConvert: boolean;
}

const ChineseConverter: React.FC = () => {
  const { t } = useTranslation();
  const addToast = useToasts();
  
  const { state, setState } = useToolState<ChineseConverterState>('chinese-converter', {
    input: '',
    output: '',
    variant: 's2t',
    isAutoConvert: true,
  });

  const { input, output, variant, isAutoConvert } = state;

  const variants: { value: ConversionVariant; label: string }[] = [
    { value: 's2t', label: t('tools.chineseConverter.variants.s2t') },
    { value: 't2s', label: t('tools.chineseConverter.variants.t2s') },
    { value: 's2tw', label: t('tools.chineseConverter.variants.s2tw') },
    { value: 'tw2s', label: t('tools.chineseConverter.variants.tw2s') },
    { value: 's2hk', label: t('tools.chineseConverter.variants.s2hk') },
    { value: 'hk2s', label: t('tools.chineseConverter.variants.hk2s') },
    { value: 's2twp', label: t('tools.chineseConverter.variants.s2twp') },
    { value: 't2tw', label: t('tools.chineseConverter.variants.t2tw') },
  ];

  const handleConvert = useCallback((text: string, v: ConversionVariant) => {
    if (!text || !text.trim()) {
      setState(s => ({ ...s, output: '' }));
      return;
    }

    try {
      const localeMap: Record<string, any> = {
        's': 'cn',
        't': 't',
        'tw': 'tw',
        'twp': 'twp',
        'hk': 'hk'
      };

      const parts = v.split('2');
      const from = localeMap[parts[0]] || 'cn';
      const to = localeMap[parts[1]] || 't';

      const converter = Converter({ from, to });
      const converted = converter(text);
      setState(s => ({ ...s, output: converted }));
    } catch (e) {
      console.error('Conversion failed', e);
    }
  }, [setState]);

  useEffect(() => {
    if (isAutoConvert) {
      handleConvert(input, variant);
    }
  }, [input, variant, isAutoConvert, handleConvert]);

  const handleManualConvert = () => {
    handleConvert(input, variant);
  };

  const handleSwap = () => {
    const swapMap: Partial<Record<ConversionVariant, ConversionVariant>> = {
      's2t': 't2s', 't2s': 's2t',
      's2tw': 'tw2s', 'tw2s': 's2tw',
      's2hk': 'hk2s', 'hk2s': 's2hk',
    };
    const nextVariant = swapMap[variant] || variant;
    setState(s => ({ ...s, input: s.output, output: s.input, variant: nextVariant }));
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      addToast(t('common.toast.copiedSuccess'), 'success');
    });
  };

  const handleClear = () => {
    setState(s => ({ ...s, input: '', output: '' }));
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <ToolHeader 
        title={t('tools.chineseConverter.pageTitle')} 
        description={t('tools.chineseConverter.pageDescription')} 
      />

      <div className="space-y-8">
        {/* Controls Bar */}
        <div className="glass-panel p-4 rounded-[2rem] border-white/20 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow flex flex-wrap gap-2 justify-center md:justify-start">
            {variants.map(v => (
              <button
                key={v.value}
                onClick={() => setState(s => ({ ...s, variant: v.value }))}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                  variant === v.value 
                  ? 'bg-accent text-white shadow-lg scale-105' 
                  : 'bg-primary/50 dark:bg-slate-800 text-text-secondary hover:bg-accent/10'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0 px-2 border-l border-black/5 dark:border-white/5">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAutoConvert} 
                onChange={e => setState(s => ({ ...s, isAutoConvert: e.target.checked }))}
                className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent"
              />
              {t('tools.chineseConverter.autoConvert')}
            </label>
            {!isAutoConvert && (
              <button 
                onClick={handleManualConvert}
                className="px-6 py-2 bg-accent text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 shadow-md active:scale-95 transition-all"
              >
                Convert
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative group/grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
            {/* Input Box */}
            <div className="flex flex-col glass-panel rounded-[2.5rem] overflow-hidden border-white/20 shadow-xl group">
              <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">{t('tools.chineseConverter.inputLabel')}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleClear} 
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all" 
                    title={t('tools.chineseConverter.clear') as string}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={e => setState(s => ({ ...s, input: e.target.value }))}
                placeholder={t('tools.chineseConverter.placeholder') as string}
                className="flex-grow p-8 bg-transparent text-text-primary dark:text-d-text-primary font-sans text-lg leading-relaxed focus:outline-none resize-none custom-scrollbar placeholder:opacity-30"
                spellCheck="false"
              />
            </div>

            {/* Result Box */}
            <div className="flex flex-col glass-panel rounded-[2.5rem] overflow-hidden border-white/20 shadow-xl group relative">
              <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">{t('tools.chineseConverter.outputLabel')}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(output)} 
                    className="p-2 hover:bg-accent/10 text-accent rounded-xl transition-all"
                    title={t('common.copy') as string}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={output}
                className="flex-grow p-8 bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary font-sans text-lg leading-relaxed focus:outline-none resize-none custom-scrollbar"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Centered Swap Button for Desktop */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden lg:block">
            <button 
              onClick={handleSwap}
              className="w-12 h-12 bg-accent text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)] border-4 border-primary dark:border-d-primary hover:scale-110 active:scale-95 transition-all flex items-center justify-center group/btn"
              title={t('tools.chineseConverter.swap') as string}
            >
              <RefreshIcon className="w-6 h-6 transform rotate-90 group-hover/btn:rotate-[-90deg] transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Action Button for mobile swap */}
        <div className="flex justify-center lg:hidden">
          <button 
            onClick={handleSwap}
            className="px-8 py-4 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-3"
          >
            <RefreshIcon className="w-4 h-4 transform rotate-90" />
            {t('tools.chineseConverter.swap')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChineseConverter;
