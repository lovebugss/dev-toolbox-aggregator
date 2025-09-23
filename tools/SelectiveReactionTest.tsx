import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolHeader } from '../components/ui/ToolHeader';
import { RefreshIcon, CheckCircleIcon, TargetIcon } from '../components/icons/Icons';
import { PerformanceChart } from '../components/ui/PerformanceChart';

type GameState = 'idle' | 'playing' | 'result' | 'finished';
const TOTAL_ROUNDS = 10;

// --- Types ---
type RoundResult = { time: number; correct: boolean };
interface ColorOption {
    id: string; // "Red"
    bgColor: string; // "#ef4444"
    text: string;
    isCorrect: boolean;
}
interface Challenge {
    promptText: string;
    promptColor: string;
    options: ColorOption[];
}
const COLORS = [
    { name: '红色', hex: '#ef4444' }, { name: '绿色', hex: '#22c55e' },
    { name: '蓝色', hex: '#3b82f6' }, { name: '黄色', hex: '#facc15' },
    { name: '紫色', hex: '#a855f7' }, { name: '橙色', hex: '#f97316' },
];

// --- Helper Functions & Components ---
const shuffle = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-primary dark:bg-d-primary rounded-lg text-center">
        <p className="text-sm text-text-secondary dark:text-d-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-accent dark:text-d-accent">{value}</p>
    </div>
);

const ResultsDisplay: React.FC<{ results: RoundResult[]; onRestart: () => void }> = ({ results, onRestart }) => {
    const { t } = useTranslation();
    const correctAttempts = results.filter(r => r.correct);
    const correctTimes = correctAttempts.map(r => r.time);
    const averageTime = correctTimes.length ? (correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length).toFixed(0) : 0;
    const bestTime = correctTimes.length ? Math.min(...correctTimes).toFixed(0) : 0;
    const worstTime = correctTimes.length ? Math.max(...correctTimes).toFixed(0) : 0;
    const accuracy = (correctAttempts.length / results.length) * 100;

    const chartData = results.map((result, index) => ({
        x: index + 1,
        y: result.time,
        isCorrect: result.correct,
    }));

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">{t('tools.selectiveReactionTest.statistics.finalStats')}</h3>
            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color">
                <h4 className="font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.selectiveReactionTest.statistics.summary')}</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard label={t('tools.selectiveReactionTest.statistics.accuracy')} value={`${accuracy.toFixed(0)}%`} />
                    <StatCard label={t('tools.selectiveReactionTest.statistics.averageCorrectTime')} value={`${averageTime} ms`} />
                    <StatCard label={t('tools.selectiveReactionTest.statistics.bestTime')} value={`${bestTime} ms`} />
                    <StatCard label={t('tools.selectiveReactionTest.statistics.worstTime')} value={`${worstTime} ms`} />
                </div>
                
                <h4 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.selectiveReactionTest.statistics.roundDetails')}</h4>
                 <div className="bg-primary dark:bg-d-primary rounded-lg p-2">
                    <PerformanceChart 
                        data={chartData}
                        xAxisLabel={t('tools.selectiveReactionTest.statistics.round')}
                        yAxisLabel={`${t('tools.selectiveReactionTest.statistics.time')} (ms)`}
                    />
                </div>
            </div>
            <button onClick={onRestart} className="flex items-center justify-center w-full mt-6 px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                <RefreshIcon className="mr-3 h-6 w-6"/>
                {t('tools.selectiveReactionTest.playAgain')}
            </button>
        </div>
    );
};

// --- Main Component ---
const SelectiveReactionTest: React.FC = () => {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const startTimeRef = useRef<number>(0);
    const roundResultRef = useRef<RoundResult | null>(null);
    
    const generateChallenge = useCallback(() => {
        const optionsToShow = shuffle(COLORS).slice(0, 4);
        const correctColor = optionsToShow[Math.floor(Math.random() * optionsToShow.length)];
        const promptColor = shuffle(COLORS).find(c => c.name !== correctColor.name) || COLORS[0];

        const challengeOptions = optionsToShow.map(opt => ({
            id: opt.name,
            bgColor: opt.hex,
            text: (shuffle(optionsToShow).find(c => c.name !== opt.name) || COLORS[1]).name,
            isCorrect: opt.name === correctColor.name,
        }));

        setChallenge({
            promptText: correctColor.name,
            promptColor: promptColor.hex,
            options: shuffle(challengeOptions),
        });
        startTimeRef.current = performance.now();
    }, []);

    const startTest = () => {
        setCurrentRound(1);
        setResults([]);
        setGameState('playing');
    };

    useEffect(() => {
        if (gameState === 'playing' && currentRound > 0) {
            generateChallenge();
        }
    }, [gameState, currentRound, generateChallenge]);

    const handleOptionClick = (isCorrect: boolean) => {
        if (gameState !== 'playing') return;
        
        const reactionTime = performance.now() - startTimeRef.current;
        if (!roundResultRef.current) {
             roundResultRef.current = { time: reactionTime, correct: isCorrect };
        }
        setResults(prev => [...prev, roundResultRef.current!]);
        setGameState('result');
    };

    const nextRound = () => {
        roundResultRef.current = null;
        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(prev => prev + 1);
            setGameState('playing');
        } else {
            setGameState('finished');
        }
    };

    const renderGameArea = () => {
        switch (gameState) {
            case 'idle':
                return (
                    <div className="text-center p-8 flex flex-col items-center justify-center">
                        <TargetIcon size={64} className="mx-auto text-accent dark:text-d-accent mb-6" />
                         <button onClick={startTest} className="px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                            {t('tools.selectiveReactionTest.startTest')}
                        </button>
                    </div>
                );
            case 'playing':
                if (!challenge) return null;
                return (
                    <div className="p-4 sm:p-8 w-full">
                        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">
                            {t('tools.selectiveReactionTest.prompt.color')}{' '}
                            <span style={{ color: challenge.promptColor }}>{challenge.promptText.toUpperCase()}</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {challenge.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionClick(opt.isCorrect)}
                                    style={{ backgroundColor: opt.bgColor }}
                                    className="h-24 sm:h-32 rounded-lg text-xl sm:text-2xl font-bold text-white text-shadow-dark transform hover:scale-105 transition-transform"
                                >
                                    {/* {opt.text} */}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'result':
                const lastResult = results[results.length - 1];
                return (
                     <div className="text-center cursor-pointer p-8 flex flex-col justify-center items-center" onClick={nextRound}>
                         {lastResult.correct ? (
                            <CheckCircleIcon size={64} className="text-green-500 mb-4" />
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         )}
                        <h3 className="text-2xl font-bold">{lastResult.correct ? t('tools.selectiveReactionTest.resultCorrect') : t('tools.selectiveReactionTest.resultIncorrect')}</h3>
                        {lastResult.correct && <p className="text-lg">{lastResult.time.toFixed(0)} ms</p>}
                        <p className="mt-4 text-text-secondary dark:text-d-text-secondary">{t('tools.selectiveReactionTest.clickToContinue')}</p>
                    </div>
                );
            case 'finished':
                return <ResultsDisplay results={results} onRestart={startTest} />;
        }
    };
    
    return (
        <div>
            <ToolHeader 
              title={t('tools.selectiveReactionTest.pageTitle')}
              description={t('tools.selectiveReactionTest.pageDescription')}
            />
            <div className="max-w-2xl mx-auto min-h-[450px] bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex items-center justify-center p-4 relative">
                 {gameState === 'playing' && (
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                        {t('tools.selectiveReactionTest.roundOf', { current: currentRound, total: TOTAL_ROUNDS })}
                    </div>
                )}
                {renderGameArea()}
            </div>
        </div>
    );
};

export default SelectiveReactionTest;