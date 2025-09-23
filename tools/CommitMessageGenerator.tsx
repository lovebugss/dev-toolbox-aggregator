import React from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon } from '../components/icons/Icons';

interface CommitMessageState {
    userInput: string;
    generatedMessage: string;
    isLoading: boolean;
    error: string | null;
}

const CommitMessageGenerator: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<CommitMessageState>('commit-message-generator', {
        userInput: '',
        generatedMessage: '',
        isLoading: false,
        error: null,
    });
    const { userInput, generatedMessage, isLoading, error } = state;

    const handleGenerate = async () => {
        if (!userInput.trim()) return;

        setState(s => ({ ...s, isLoading: true, error: null, generatedMessage: '' }));

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `You are an expert programmer who writes concise and conventional commit messages. Based on the following description of code changes, generate a commit message. The message must follow the Conventional Commits specification. The subject line should be 50 characters or less.
            
Changes:
${userInput}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setState(s => ({ ...s, generatedMessage: response.text.trim(), isLoading: false }));

        } catch (err) {
            console.error(err);
            setState(s => ({ ...s, error: (err as Error).message, isLoading: false }));
        }
    };

    const handleCopy = () => {
        if (!generatedMessage) return;
        navigator.clipboard.writeText(generatedMessage).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.tost.copiedFailed'), 'error');
        });
    };

    return (
        <div>
            <ToolHeader
                title={t('tools.commitMessageGenerator.pageTitle')}
                description={t('tools.commitMessageGenerator.pageDescription')}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-350px)]">
                <div className="flex flex-col">
                    <label htmlFor="user-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">
                        {t('tools.commitMessageGenerator.inputLabel')}
                    </label>
                    <textarea
                        id="user-input"
                        value={userInput}
                        onChange={(e) => setState(s => ({ ...s, userInput: e.target.value }))}
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
                        placeholder="e.g., Fixed bug where user could not log out"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !userInput.trim()}
                        className="mt-4 px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t('tools.commitMessageGenerator.generating') : t('tools.commitMessageGenerator.generateButton')}
                    </button>
                </div>
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="output" className="font-semibold text-text-secondary dark:text-d-text-secondary">
                            {t('tools.commitMessageGenerator.outputLabel')}
                        </label>
                        {generatedMessage && (
                            <button onClick={handleCopy} title={t('common.copy') as string}>
                                <CopyIcon className="w-5 h-5 text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary" />
                            </button>
                        )}
                    </div>
                    <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg overflow-auto relative">
                        {isLoading && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent dark:border-d-accent"></div>
                            </div>
                        )}
                        {error && <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md whitespace-pre-wrap font-mono text-xs">{error}</div>}
                        {!isLoading && !error && generatedMessage && (
                            <pre className="text-sm text-text-primary dark:text-d-text-primary whitespace-pre-wrap">
                                <code className="font-mono">{generatedMessage}</code>
                            </pre>
                        )}
                        {!isLoading && !error && !generatedMessage && <div className="text-text-secondary dark:text-d-text-secondary">{t('tools.commitMessageGenerator.outputPlaceholder')}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitMessageGenerator;