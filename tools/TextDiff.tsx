import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { diffLines, diffWords, Change } from 'diff';
import { CodeIcon } from '../components/icons/Icons';
import { useToolState } from '../contexts/ToolStateContext';

// State shape for the shared diff-checker tool state
interface DiffCheckerState {
    activeTab: 'json' | 'text';
    jsonA: string;
    jsonB: string;
    textA: string;
    textB: string;
}

type ViewMode = 'split' | 'unified';

const ToggleSwitch: React.FC<{
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}> = ({ mode, setMode }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center bg-secondary dark:bg-d-secondary p-1 rounded-lg border border-border-color dark:border-d-border-color">
      <button
        onClick={() => setMode('split')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          mode === 'split'
            ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow'
            : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'
        }`}
        title={t('common.tooltips.viewSplit')}
      >
        {t('tools.textDiff.viewSplit')}
      </button>
      <button
        onClick={() => setMode('unified')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          mode === 'unified'
            ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow'
            : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'
        }`}
        title={t('common.tooltips.viewUnified')}
      >
        {t('tools.textDiff.viewUnified')}
      </button>
    </div>
  );
};

interface WordDiffProps {
  oldText: string;
  newText: string;
}

const WordDiff: React.FC<WordDiffProps> = ({ oldText, newText }) => {
  const wordsDiff = diffWords(oldText, newText);
  return (
    <>
      <div className="flex-1 pr-2 bg-red-500/10">
        {wordsDiff.map((part, index) =>
          !part.added && (
            <span key={index} className={part.removed ? 'bg-red-500/20 rounded' : ''}>
              {part.value}
            </span>
          )
        )}
      </div>
      <div className="flex-1 pl-2 bg-green-500/10">
        {wordsDiff.map((part, index) =>
          !part.removed && (
            <span key={index} className={part.added ? 'bg-green-500/20 rounded' : ''}>
              {part.value}
            </span>
          )
        )}
      </div>
    </>
  );
};

const TextDiff: React.FC = () => {
  const { t } = useTranslation();
  const { state, setState } = useToolState<DiffCheckerState>('diff-checker', {
    activeTab: 'text',
    jsonA: '',
    jsonB: '',
    textA: 'This is the original text.\nIt has multiple lines.\nThis line is unique.',
    textB: 'This is the changed text.\nIt has multiple lines.\nA new line has been added.',
  });
  const { textA, textB } = state;
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const setTextA = (value: string) => setState(s => ({ ...s, textA: value }));
  const setTextB = (value: string) => setState(s => ({ ...s, textB: value }));

  const diffData = useMemo(() => diffLines(textA, textB), [textA, textB]);
  const hasDifferences = diffData.length > 1 || (diffData.length === 1 && (diffData[0].added || diffData[0].removed));
  
  const getLines = (text: string) => {
    const lines = text.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.textDiff.pageTitle')}</h2>
      <p className="text-text-secondary dark:text-d-text-secondary mb-6">{t('tools.textDiff.pageDescription')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
        <div className="flex flex-col">
          <label htmlFor="text-a-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.textDiff.originalText')}</label>
          <textarea
            id="text-a-input"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="text-b-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.textDiff.changedText')}</label>
          <textarea
            id="text-b-input"
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
          />
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary">{t('tools.textDiff.diffOutput')}</h3>
          <ToggleSwitch mode={viewMode} setMode={setViewMode} />
        </div>
        <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words">
          {!hasDifferences ? (
            <div className="flex flex-col items-center justify-center p-8 text-text-secondary dark:text-d-text-secondary">
              <CodeIcon className="w-12 h-12 mb-4" />
              <p className="text-lg font-semibold">{t('tools.textDiff.noDifferences')}</p>
            </div>
          ) : viewMode === 'unified' ? (
            <pre>
              {diffData.map((part, index) => {
                const style = part.added
                  ? 'bg-green-900/50 text-green-300'
                  : part.removed
                  ? 'bg-red-900/50 text-red-300'
                  : 'text-text-secondary dark:text-d-text-secondary';
                const prefix = part.added ? '+' : part.removed ? '-' : ' ';
                return (
                  <div key={index} className={`${style} flex`}>
                    <span className="w-6 text-center select-none">{prefix}</span>
                    <span className="flex-1">{part.value}</span>
                  </div>
                );
              })}
            </pre>
          ) : (
            <div>
              {(() => {
                const rows: React.ReactNode[] = [];
                let leftLine = 1;
                let rightLine = 1;
                for (let i = 0; i < diffData.length; i++) {
                  const part = diffData[i];
                  const nextPart = diffData[i + 1];

                  if (part.removed && nextPart?.added) {
                     const removedLines = getLines(part.value);
                     const addedLines = getLines(nextPart.value);
                     const maxLen = Math.max(removedLines.length, addedLines.length);

                     for(let j=0; j<maxLen; j++) {
                        const oldText = removedLines[j];
                        const newText = addedLines[j];
                        rows.push(
                           <div key={`c-${i}-${j}`} className="flex">
                                <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{oldText !== undefined ? leftLine++ : ''}</span>
                                <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{newText !== undefined ? rightLine++ : ''}</span>
                                <WordDiff oldText={oldText || ''} newText={newText || ''} />
                            </div>
                        )
                     }
                     i++; 
                  } else if (part.removed) {
                    getLines(part.value).forEach((line, lineIndex) => {
                      rows.push(
                        <div key={`r-${i}-${lineIndex}`} className="flex bg-red-500/10">
                          <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{leftLine++}</span>
                          <span className="w-8 select-none"></span>
                          <div className="flex-1 pr-2">{line}</div>
                          <div className="flex-1 pl-2"></div>
                        </div>
                      );
                    });
                  } else if (part.added) {
                    getLines(part.value).forEach((line, lineIndex) => {
                      rows.push(
                        <div key={`a-${i}-${lineIndex}`} className="flex bg-green-500/10">
                           <span className="w-8 select-none"></span>
                           <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{rightLine++}</span>
                           <div className="flex-1 pr-2"></div>
                           <div className="flex-1 pl-2">{line}</div>
                        </div>
                      );
                    });
                  } else {
                    getLines(part.value).forEach((line, lineIndex) => {
                      rows.push(
                        <div key={`u-${i}-${lineIndex}`} className="flex hover:bg-black/10 dark:hover:bg-white/5">
                           <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{leftLine++}</span>
                           <span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{rightLine++}</span>
                           <div className="flex-1 pr-2 text-text-secondary dark:text-d-text-secondary">{line}</div>
                           <div className="flex-1 pl-2 text-text-secondary dark:text-d-text-secondary border-l border-border-color dark:border-d-border-color">{line}</div>
                        </div>
                      );
                    });
                  }
                }
                return rows;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextDiff;