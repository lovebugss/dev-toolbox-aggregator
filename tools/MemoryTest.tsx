import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolHeader } from '../components/ui/ToolHeader';
import { BrainIcon, RefreshIcon } from '../components/icons/Icons';
import { PerformanceChart } from '../components/ui/PerformanceChart';

type GameState = 'idle' | 'showing' | 'repeating' | 'finished';
const GRID_SIZE = 9; // 3x3 grid

type LevelTime = { level: number; time: number };

// --- Helper Components ---
const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-primary dark:bg-d-primary rounded-lg text-center">
        <p className="text-sm text-text-secondary dark:text-d-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-accent dark:text-d-accent">{value}</p>
    </div>
);

const ResultsDisplay: React.FC<{ level: number; levelTimes: LevelTime[]; onRestart: () => void }> = ({ level, levelTimes, onRestart }) => {
    const { t } = useTranslation();
    const averageTime = levelTimes.length ? (levelTimes.reduce((a, b) => a + b.time, 0) / levelTimes.length).toFixed(0) : 0;
    const bestTime = levelTimes.length ? Math.min(...levelTimes.map(lt => lt.time)).toFixed(0) : 0;
    const worstTime = levelTimes.length ? Math.max(...levelTimes.map(lt => lt.time)).toFixed(0) : 0;

    const chartData = levelTimes.map(lt => ({ x: lt.level, y: lt.time }));

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">{t('tools.memoryTest.statistics.finalStats')}</h3>
            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color">
                <h4 className="font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.memoryTest.statistics.summary')}</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard label={t('tools.memoryTest.statistics.levelReached')} value={String(level)} />
                    <StatCard label={t('tools.memoryTest.statistics.averageTime')} value={`${averageTime} ms`} />
                    <StatCard label={t('tools.memoryTest.statistics.fastestLevel')} value={`${bestTime} ms`} />
                    <StatCard label={t('tools.memoryTest.statistics.slowestLevel')} value={`${worstTime} ms`} />
                </div>
                
                <h4 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.memoryTest.statistics.levelDetails')}</h4>
                <div className="bg-primary dark:bg-d-primary rounded-lg p-2">
                     <PerformanceChart
                        data={chartData}
                        xAxisLabel={t('tools.memoryTest.statistics.level')}
                        yAxisLabel={`${t('tools.memoryTest.statistics.completionTime')} (ms)`}
                    />
                </div>
            </div>
            <button onClick={onRestart} className="flex items-center justify-center w-full mt-6 px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                <RefreshIcon className="mr-3 h-6 w-6"/>
                {t('tools.memoryTest.playAgain')}
            </button>
        </div>
    );
};

const GameHeader: React.FC<{ level: number; status: string }> = ({ level, status }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute top-0 left-0 right-0 p-4 text-center">
            <div className="text-sm font-medium text-text-secondary dark:text-d-text-secondary">{t('tools.memoryTest.level')}</div>
            <div className="text-3xl font-bold text-text-primary dark:text-d-text-primary">{level}</div>
            <p className="h-6 mt-2 text-text-secondary dark:text-d-text-secondary">{status}</p>
        </div>
    );
};


// --- Main Component ---
const MemoryTest: React.FC = () => {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [level, setLevel] = useState(1);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activeSquare, setActiveSquare] = useState<number | null>(null);
    const [levelTimes, setLevelTimes] = useState<LevelTime[]>([]);
    const levelStartTimeRef = useRef<number>(0);

    const generateNextInSequence = useCallback(() => {
        const nextSquare = Math.floor(Math.random() * GRID_SIZE);
        setSequence(prev => [...prev, nextSquare]);
    }, []);

    const startGame = () => {
        setGameState('showing');
        setLevel(1);
        setSequence([]);
        setUserSequence([]);
        setLevelTimes([]);
    };

    const nextLevel = () => {
        const completionTime = performance.now() - levelStartTimeRef.current;
        setLevelTimes(prev => [...prev, { level, time: completionTime }]);
        setGameState('showing');
        setLevel(prev => prev + 1);
        setUserSequence([]);
    };
    
    const endGame = () => {
        setGameState('finished');
    };

    useEffect(() => {
        if (gameState === 'showing') {
            generateNextInSequence();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, level]);

    useEffect(() => {
        if (gameState === 'showing' && sequence.length > 0) {
            let i = 0;
            const interval = setInterval(() => {
                setActiveSquare(sequence[i]);
                setTimeout(() => setActiveSquare(null), 350);
                i++;
                if (i >= sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setGameState('repeating');
                        levelStartTimeRef.current = performance.now();
                    }, 400);
                }
            }, 700);
            return () => clearInterval(interval);
        }
    }, [gameState, sequence]);
    
    const handleSquareClick = (index: number) => {
        if (gameState !== 'repeating') return;

        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
            endGame();
            return;
        }

        if (newUserSequence.length === sequence.length) {
            setTimeout(() => nextLevel(), 500);
        }
    };
    
    const renderGameArea = () => {
        if (gameState === 'idle') {
            return (
                 <div className="text-center p-8 flex flex-col items-center justify-center">
                    <BrainIcon size={64} className="mx-auto text-accent dark:text-d-accent mb-6" />
                    <button onClick={startGame} className="px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                        {t('tools.memoryTest.startGame')}
                    </button>
                </div>
            )
        }
        if (gameState === 'finished') {
             return <ResultsDisplay level={level - 1} levelTimes={levelTimes} onRestart={startGame} />;
        }

        return (
            <div className="w-full max-w-xs aspect-square p-2">
                <div className="grid grid-cols-3 gap-2 h-full">
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <button
                            key={i}
                            disabled={gameState !== 'repeating'}
                            onClick={() => handleSquareClick(i)}
                            className={`rounded-lg transition-all duration-200 ease-in-out transform disabled:cursor-not-allowed
                                ${activeSquare === i ? 'bg-accent dark:bg-d-accent scale-105' : 'bg-primary dark:bg-d-primary'}
                                ${gameState === 'repeating' ? 'cursor-pointer hover:bg-border-color dark:hover:bg-d-border-color active:scale-95' : ''}
                            `}
                            aria-label={`Square ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const getStatusText = () => {
        if (gameState === 'showing') return t('tools.memoryTest.status.watching');
        if (gameState === 'repeating') return t('tools.memoryTest.status.repeating');
        return '';
    };
    
    return (
        <div>
             <ToolHeader
                title={t('tools.memoryTest.pageTitle')}
                description={t('tools.memoryTest.pageDescription')}
            />
            <div className="max-w-2xl mx-auto min-h-[450px] bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex flex-col items-center justify-center p-4 relative">
                {gameState !== 'idle' && gameState !== 'finished' && (
                    <GameHeader level={level} status={getStatusText()} />
                )}
                <div className="flex-grow flex items-center justify-center w-full pt-16">
                    {renderGameArea()}
                </div>
            </div>
        </div>
    );
};

export default MemoryTest;