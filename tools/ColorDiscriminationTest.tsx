import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EyeIcon, RefreshIcon } from '../components/icons/Icons';
import { PerformanceChart } from '../components/ui/PerformanceChart';

type GameState = 'idle' | 'playing' | 'finished';
const GAME_DURATION = 60; // seconds

type LevelTime = { level: number; time: number };

// --- Helper Components ---

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-primary dark:bg-d-primary rounded-lg text-center">
        <p className="text-sm text-text-secondary dark:text-d-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-accent dark:text-d-accent">{value}</p>
    </div>
);

const ResultsDisplay: React.FC<{ score: number; levelTimes: LevelTime[]; onRestart: () => void }> = ({ score, levelTimes, onRestart }) => {
    const { t } = useTranslation();
    const averageTime = levelTimes.length ? (levelTimes.reduce((a, b) => a + b.time, 0) / levelTimes.length).toFixed(0) : 0;
    const bestTime = levelTimes.length ? Math.min(...levelTimes.map(lt => lt.time)).toFixed(0) : 0;
    const worstTime = levelTimes.length ? Math.max(...levelTimes.map(lt => lt.time)).toFixed(0) : 0;

    const chartData = levelTimes.map(lt => ({ x: lt.level + 1, y: lt.time }));

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">{t('tools.colorDiscriminationTest.statistics.finalStats')}</h3>
            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color">
                <h4 className="font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.colorDiscriminationTest.statistics.summary')}</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard label={t('tools.colorDiscriminationTest.statistics.finalScore')} value={String(score)} />
                    <StatCard label={t('tools.colorDiscriminationTest.statistics.averageTime')} value={`${averageTime} ms`} />
                    <StatCard label={t('tools.colorDiscriminationTest.statistics.bestTime')} value={`${bestTime} ms`} />
                    <StatCard label={t('tools.colorDiscriminationTest.statistics.worstTime')} value={`${worstTime} ms`} />
                </div>
                
                <h4 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.colorDiscriminationTest.statistics.levelDetails')}</h4>
                 <div className="bg-primary dark:bg-d-primary rounded-lg p-2">
                    <PerformanceChart
                        data={chartData}
                        xAxisLabel={t('tools.colorDiscriminationTest.statistics.level')}
                        yAxisLabel={`${t('tools.colorDiscriminationTest.statistics.reactionTime')} (ms)`}
                    />
                </div>
            </div>
            <button onClick={onRestart} className="flex items-center justify-center w-full mt-6 px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                <RefreshIcon className="mr-3 h-6 w-6"/>
                {t('tools.colorDiscriminationTest.playAgain')}
            </button>
        </div>
    );
};

const GameStatDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="text-center w-24">
        <div className="text-sm font-medium text-text-secondary dark:text-d-text-secondary">{label}</div>
        <div className="text-3xl font-bold text-text-primary dark:text-d-text-primary">{value}</div>
    </div>
);


// --- Main Component ---
const ColorDiscriminationTest: React.FC = () => {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [gridSize, setGridSize] = useState(2);
    const [colors, setColors] = useState<{ base: string; odd: string }>({ base: '', odd: '' });
    const [oddColorPosition, setOddColorPosition] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
    const [levelTimes, setLevelTimes] = useState<LevelTime[]>([]);
    const levelStartTimeRef = useRef<number>(0);

    const generatePuzzle = useCallback((level: number) => {
        const h = Math.random() * 360;
        const s = 50 + Math.random() * 50;
        const l = 40 + Math.random() * 20;

        const difference = 80 / (level + 5);
        const oddL = l > 50 ? l - difference : l + difference;

        setColors({ base: `hsl(${h}, ${s}%, ${l}%)`, odd: `hsl(${h}, ${s}%, ${oddL}%)` });

        const newGridSize = Math.min(10, Math.floor(level / 3) + 2);
        setGridSize(newGridSize);

        setOddColorPosition({
            row: Math.floor(Math.random() * newGridSize),
            col: Math.floor(Math.random() * newGridSize),
        });
        levelStartTimeRef.current = performance.now();
    }, []);

    const startGame = () => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGridSize(2);
        setLevelTimes([]);
        generatePuzzle(0);
        setGameState('playing');
    };

    const nextLevel = () => {
        const reactionTime = performance.now() - levelStartTimeRef.current;
        const newScore = score + 1;
        setScore(newScore);
        setLevelTimes(prev => [...prev, { level: score, time: reactionTime }]);
        generatePuzzle(newScore);
    };

    const endGame = useCallback(() => {
        setGameState('finished');
    }, []);

    const handleBlockClick = (isCorrect: boolean) => {
        if (gameState !== 'playing') return;
        if (isCorrect) {
            nextLevel();
        } else {
            endGame();
        }
    };

    useEffect(() => {
        if (gameState !== 'playing' || timeLeft <= 0) {
            if (gameState === 'playing' && timeLeft <= 0) {
                endGame();
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, timeLeft, endGame]);

    const renderGrid = () => (
        <div className="w-full max-w-md mx-auto p-2">
            <div
                className="grid gap-1.5 aspect-square"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
                {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                    const r = Math.floor(i / gridSize);
                    const c = i % gridSize;
                    const isOdd = r === oddColorPosition.row && c === oddColorPosition.col;
                    return (
                        <div
                            key={`${r}-${c}`}
                            className="rounded-md transition-transform duration-100 ease-in-out hover:scale-105 active:scale-95 cursor-pointer"
                            style={{ backgroundColor: isOdd ? colors.odd : colors.base }}
                            onClick={() => handleBlockClick(isOdd)}
                            aria-label={`Color block ${r+1}-${c+1}`}
                        />
                    );
                })}
            </div>
        </div>
    );
    
    return (
        <div>
            <ToolHeader
                title={t('tools.colorDiscriminationTest.pageTitle')}
                description={t('tools.colorDiscriminationTest.pageDescription')}
            />
            <div className="max-w-2xl mx-auto min-h-[450px] bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex flex-col items-center justify-center p-4 relative">
                {gameState === 'idle' && (
                    <div className="text-center p-8 flex flex-col items-center justify-center">
                        <EyeIcon size={64} className="mx-auto text-accent dark:text-d-accent mb-6" />
                        <button onClick={startGame} className="px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                            {t('tools.colorDiscriminationTest.startGame')}
                        </button>
                    </div>
                )}
                {gameState === 'playing' && (
                    <div className="w-full h-full flex flex-col pt-20">
                         <div className="absolute top-0 left-0 right-0 p-4 flex justify-around items-center bg-primary/50 dark:bg-d-primary/50 rounded-t-2xl backdrop-blur-sm">
                            <GameStatDisplay label={t('tools.colorDiscriminationTest.score')} value={score} />
                            <GameStatDisplay label={t('tools.colorDiscriminationTest.time')} value={timeLeft} />
                        </div>
                        {renderGrid()}
                    </div>
                )}
                {gameState === 'finished' && <ResultsDisplay score={score} levelTimes={levelTimes} onRestart={startGame} />}
            </div>
        </div>
    );
};

export default ColorDiscriminationTest;