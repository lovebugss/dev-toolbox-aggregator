import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolHeader } from '../components/ui/ToolHeader';
import { HandIcon, RefreshIcon } from '../components/icons/Icons';
import { PerformanceChart } from '../components/ui/PerformanceChart';

type GameState = 'idle' | 'fixation' | 'playing' | 'feedback' | 'finished';
type TrialType = 'go' | 'no-go';
type ResultType = 'hit' | 'miss' | 'correct-rejection' | 'false-alarm';
type TrialResult = { trial: number; type: TrialType; result: ResultType; time: number | null };

const TOTAL_TRIALS = 10;
const NO_GO_PROBABILITY = 0.25; // 25% of trials are no-go
const STIMULUS_DURATION = 1000; // ms
const FIXATION_DURATION = 500; // ms
const FEEDBACK_DURATION = 800; // ms

// --- Helper Components ---
const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-primary dark:bg-d-primary rounded-lg text-center">
        <p className="text-sm text-text-secondary dark:text-d-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-accent dark:text-d-accent">{value}</p>
    </div>
);

const ResultsDisplay: React.FC<{ results: TrialResult[]; onRestart: () => void }> = ({ results, onRestart }) => {
    const { t } = useTranslation();
    const goTrials = results.filter(r => r.type === 'go');
    const noGoTrials = results.filter(r => r.type === 'no-go');
    const hits = results.filter(r => r.result === 'hit');
    const commissionErrors = results.filter(r => r.result === 'false-alarm');
    const omissionErrors = results.filter(r => r.result === 'miss');

    const avgGoTime = hits.length ? (hits.reduce((acc, r) => acc + (r.time || 0), 0) / hits.length).toFixed(0) : 'N/A';

    const chartData = results
        .filter(r => r.result === 'hit' || r.result === 'false-alarm')
        .map(r => ({
            x: r.trial,
            y: r.time || 0,
            isCorrect: r.result === 'hit',
        }));

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">{t('tools.inhibitoryControlTest.statistics.finalStats')}</h3>
            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color">
                <h4 className="font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.inhibitoryControlTest.statistics.summary')}</h4>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label={t('tools.inhibitoryControlTest.statistics.avgGoTime')} value={avgGoTime === 'N/A' ? avgGoTime : `${avgGoTime} ms`} />
                    <StatCard label={t('tools.inhibitoryControlTest.statistics.commissionErrors')} value={`${commissionErrors.length}/${noGoTrials.length}`} />
                    <StatCard label={t('tools.inhibitoryControlTest.statistics.omissionErrors')} value={`${omissionErrors.length}/${goTrials.length}`} />
                </div>

                <h4 className="font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.inhibitoryControlTest.statistics.trialDetails')}</h4>
                <div className="bg-primary dark:bg-d-primary rounded-lg p-2">
                    <PerformanceChart
                        data={chartData}
                        xAxisLabel={t('tools.inhibitoryControlTest.statistics.trial')}
                        yAxisLabel={`${t('tools.inhibitoryControlTest.statistics.reactionTime')} (ms)`}
                    />
                </div>
            </div>
            <button onClick={onRestart} className="flex items-center justify-center w-full mt-6 px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                <RefreshIcon className="mr-3 h-6 w-6" />
                {t('tools.inhibitoryControlTest.playAgain')}
            </button>
        </div>
    );
};


// --- Main Component ---
const InhibitoryControlTest: React.FC = () => {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [trial, setTrial] = useState(0);
    const [trials, setTrials] = useState<TrialType[]>([]);
    const [results, setResults] = useState<TrialResult[]>([]);
    const [lastResult, setLastResult] = useState<{ result: ResultType, time: number | null } | null>(null);

    const startTimeRef = useRef<number>(0);
    const respondedRef = useRef<boolean>(false);
    // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
    const gameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const generateTrials = () => {
        const newTrials = Array.from({ length: TOTAL_TRIALS }, () =>
            Math.random() > NO_GO_PROBABILITY ? 'go' : 'no-go'
        );
        setTrials(newTrials);
    };

    const startGame = useCallback(() => {
        generateTrials();
        setTrial(0);
        setResults([]);
        setLastResult(null);
        setGameState('fixation');
    }, []);

    const advanceTrial = useCallback(() => {
        if (trial + 1 < TOTAL_TRIALS) {
            setTrial(prev => prev + 1);
            setGameState('fixation');
        } else {
            setGameState('finished');
        }
    }, [trial]);
    
    const showFeedback = useCallback((result: ResultType, time: number | null) => {
        setLastResult({ result, time });
        setResults(prev => [...prev, { trial: trial + 1, type: trials[trial], result, time }]);
        setGameState('feedback');

        setTimeout(advanceTrial, FEEDBACK_DURATION);
    }, [trial, trials, advanceTrial]);


    // Effect for managing game state transitions and timeouts
    useEffect(() => {
        if (gameState === 'fixation') {
            respondedRef.current = false;
            const fixationTimeout = setTimeout(() => {
                setGameState('playing');
            }, FIXATION_DURATION);
            return () => clearTimeout(fixationTimeout);
        }

        if (gameState === 'playing') {
            // Record the exact time the stimulus is shown
            startTimeRef.current = performance.now();

            gameTimeoutRef.current = setTimeout(() => {
                // This runs if the user doesn't respond in time
                if (trials[trial] === 'go') {
                    showFeedback('miss', null);
                } else { // no-go
                    showFeedback('correct-rejection', null);
                }
            }, STIMULUS_DURATION);

            return () => {
                if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
            };
        }
    }, [gameState, trial, trials, showFeedback]);

    // This is the unified handler for click and touch events
    const handleInteraction = useCallback(() => {
        if (gameState !== 'playing' || respondedRef.current) return;

        respondedRef.current = true;
        if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);

        const reactionTime = performance.now() - startTimeRef.current;

        if (trials[trial] === 'go') {
            showFeedback('hit', reactionTime);
        } else { // no-go
            showFeedback('false-alarm', reactionTime);
        }
    }, [gameState, trial, trials, showFeedback]);


    const renderGameArea = () => {
        switch (gameState) {
            case 'idle':
                return (
                    <div className="text-center p-8 flex flex-col items-center justify-center">
                        <HandIcon size={64} className="mx-auto text-accent dark:text-d-accent mb-4" />
                        <p className="mb-6 max-w-xs">{t('tools.inhibitoryControlTest.pageDescription')}</p>
                        <button onClick={startGame} className="px-8 py-4 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold text-xl rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                            {t('tools.inhibitoryControlTest.startGame')}
                        </button>
                    </div>
                );

            case 'finished':
                return <ResultsDisplay results={results} onRestart={startGame} />;

            case 'fixation':
                return <div className="text-6xl font-bold text-text-secondary dark:text-d-text-secondary"></div>;

            case 'playing':
                const currentTrialType = trials[trial];
                const stimulus = currentTrialType === 'go'
                    ? <div className="w-32 h-32 bg-green-500 rounded-full" />
                    : <div className="w-32 h-32 bg-red-500 rounded-md" />;

                return (
                    <div
                        className="flex flex-col items-center justify-center h-full w-full cursor-pointer"
                        onClick={handleInteraction}
                        onTouchStart={(e) => {
                            e.preventDefault(); // Prevents emulated mouse events
                            handleInteraction();
                        }}
                    >
                        {stimulus}
                    </div>
                );

            case 'feedback':
                if (!lastResult) return null; // Should not happen
                let message = '';
                let color = 'text-text-primary dark:text-d-text-primary';
                if (lastResult.result === 'hit') {
                    message = `${t('tools.inhibitoryControlTest.correct')} ${lastResult.time?.toFixed(0)} ms`;
                    color = 'text-green-500';
                }
                if (lastResult.result === 'false-alarm') {
                    message = t('tools.inhibitoryControlTest.dontPress');
                    color = 'text-red-500';
                }
                if (lastResult.result === 'miss') {
                    message = t('tools.inhibitoryControlTest.tooSlow');
                    color = 'text-yellow-500';
                }
                if (lastResult.result === 'correct-rejection') {
                    message = t('tools.inhibitoryControlTest.correct');
                    color = 'text-green-500';
                }
                return <div className={`text-3xl font-bold ${color}`}>{message}</div>;

            default:
                return null;
        }
    };

    return (
        <div>
            <ToolHeader
                title={t('tools.inhibitoryControlTest.pageTitle')}
                description={t('tools.inhibitoryControlTest.pageDescription')}
            />
            <div className="max-w-2xl mx-auto min-h-[450px] bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex flex-col items-center justify-center p-4 relative">
                {(gameState === 'playing' || gameState === 'feedback' || gameState === 'fixation') && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                        {t('tools.inhibitoryControlTest.round')} {trial + 1} {t('tools.inhibitoryControlTest.of')} {TOTAL_TRIALS}
                    </div>
                )}
                {renderGameArea()}
            </div>
        </div>
    );
};

export default InhibitoryControlTest;