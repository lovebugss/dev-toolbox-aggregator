import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ZapIcon, RefreshIcon } from '../components/icons/Icons';
import { ToolHeader } from '../components/ui/ToolHeader';
import { PerformanceChart } from '../components/ui/PerformanceChart';

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'tooSoon' | 'finished';
const TOTAL_ROUNDS = 5;

// --- Helper Components ---

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-primary dark:bg-d-primary rounded-lg text-center">
        <p className="text-sm text-text-secondary dark:text-d-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-accent dark:text-d-accent">{value}</p>
    </div>
);

const ResultsDisplay: React.FC<{ times: number[]; onRestart: () => void }> = ({ times, onRestart }) => {
    const { t } = useTranslation();
    const averageTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
    const bestTime = Math.min(...times).toFixed(0);
    const worstTime = Math.max(...times).toFixed(0);

    const chartData = times.map((time, index) => ({ x: index + 1, y: time }));

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">{t('tools.reactionTimeTest.statistics.finalStats')}</h3>
            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color">
                <h4 className="font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.reactionTimeTest.statistics.summary')}</h4>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label={t('tools.reactionTimeTest.statistics.averageTime')} value={`${averageTime} ms`} />
                    <StatCard label={t('tools.reactionTimeTest.statistics.bestTime')} value={`${bestTime} ms`} />
                    <StatCard label={t('tools.reactionTimeTest.statistics.worstTime')} value={`${worstTime} ms`} />
                </div>
                
                <h4 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.reactionTimeTest.statistics.roundDetails')}</h4>
                <div className="bg-primary dark:bg-d-primary rounded-lg p-2">
                    <PerformanceChart 
                        data={chartData}
                        xAxisLabel={t('tools.reactionTimeTest.statistics.round')}
                        yAxisLabel={`${t('tools.reactionTimeTest.statistics.time')} (ms)`}
                    />
                </div>
            </div>
            <button onClick={onRestart} className="flex items-center justify-center w-full mt-6 px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                <RefreshIcon className="mr-3 h-6 w-6"/>
                {t('tools.reactionTimeTest.playAgain')}
            </button>
        </div>
    );
};


// --- Main Component ---
const ReactionTimeTest: React.FC = () => {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [round, setRound] = useState(0);
    const [times, setTimes] = useState<number[]>([]);
    const [lastTime, setLastTime] = useState<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetGame = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setGameState('idle');
        setRound(0);
        setTimes([]);
        setLastTime(null);
    }, []);

    const setupNextRound = useCallback(() => {
        setGameState('waiting');
        const delay = Math.random() * 3000 + 1000; // 1-4 seconds delay
        timeoutRef.current = setTimeout(() => {
            startTimeRef.current = performance.now();
            setGameState('ready');
        }, delay);
    }, []);

    const handleStart = useCallback(() => {
        setRound(1);
        setTimes([]);
        setLastTime(null);
        setupNextRound();
    }, [setupNextRound]);
    
    const handleClickArea = () => {
        switch (gameState) {
            case 'idle':
                handleStart();
                break;
            case 'waiting':
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setGameState('tooSoon');
                break;
            case 'ready':
                const endTime = performance.now();
                const reactionTime = endTime - startTimeRef.current;
                setLastTime(reactionTime);
                setTimes(prev => [...prev, reactionTime]);
                setGameState('clicked');
                break;
            case 'tooSoon':
                setupNextRound(); // Retry the same round
                break;
            case 'clicked':
                if (round < TOTAL_ROUNDS) {
                    setRound(prev => prev + 1);
                    setupNextRound();
                } else {
                    setGameState('finished');
                }
                break;
            default:
                break;
        }
    };
    
    const stateConfig = {
        idle: { bg: 'bg-secondary dark:bg-d-secondary', textColor: 'text-text-primary dark:text-d-text-primary' },
        waiting: { bg: 'bg-blue-500', textColor: 'text-white' },
        ready: { bg: 'bg-green-500', textColor: 'text-white' },
        tooSoon: { bg: 'bg-red-500', textColor: 'text-white' },
        clicked: { bg: 'bg-secondary dark:bg-d-secondary', textColor: 'text-text-primary dark:text-d-text-primary' },
        finished: { bg: 'bg-secondary dark:bg-d-secondary', textColor: 'text-text-primary dark:text-d-text-primary' },
    };

    return (
        <div>
            <ToolHeader 
              title={t('tools.reactionTimeTest.pageTitle')}
              description={t('tools.reactionTimeTest.pageDescription')}
            />
            <div 
                onClick={handleClickArea} 
                className={`max-w-2xl mx-auto min-h-[450px] rounded-2xl border border-border-color dark:border-d-border-color flex flex-col items-center justify-center p-4 relative transition-colors duration-200 cursor-pointer select-none ${stateConfig[gameState].bg}`}
            >
                {gameState !== 'idle' && gameState !== 'finished' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                        {t('tools.reactionTimeTest.roundOf', { current: round, total: TOTAL_ROUNDS })}
                    </div>
                )}

                {gameState === 'idle' && (
                    <div className="text-center">
                        <ZapIcon size={64} className="mx-auto text-accent dark:text-d-accent mb-6" />
                        <h2 className="text-3xl font-bold mb-6">{t('tools.reactionTimeTest.startTest')}</h2>
                        <p className="text-text-secondary dark:text-d-text-secondary">{t('tools.reactionTimeTest.pageDescription')}</p>
                    </div>
                )}
                
                {gameState === 'waiting' && <h3 className="text-4xl font-bold text-white">{t('tools.reactionTimeTest.waitForGreen')}</h3>}
                {gameState === 'ready' && <h3 className="text-4xl font-bold text-white">{t('tools.reactionTimeTest.clickNow')}</h3>}
                {gameState === 'tooSoon' && <h3 className="text-4xl font-bold text-white">{t('tools.reactionTimeTest.tooSoon')}</h3>}
                
                {gameState === 'clicked' && (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold">{t('tools.reactionTimeTest.yourTime')}</h3>
                        <p className="text-6xl font-bold my-2">{lastTime?.toFixed(0)} ms</p>
                        <p className="text-text-secondary dark:text-d-text-secondary">{t('tools.reactionTimeTest.clickToContinue')}</p>
                    </div>
                )}

                {gameState === 'finished' && <ResultsDisplay times={times} onRestart={resetGame} />}
            </div>
        </div>
    );
};

export default ReactionTimeTest;