import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { FullScreenContext, ThemeContext } from '../App';
import { LabeledControl } from '../components/ui/LabeledControl';
import { 
    VscFilesIcon, VscSearchIcon, VscSourceControlIcon, VscDebugAltIcon, 
    VscExtensionsIcon, VscSettingsGearIcon, VscRemoteIcon,
    VscSyncIcon, CodeIcon, VscFolderIcon,
    VscMarkdownIcon, VscFileIcon, VscMaximizeIcon, VscRestoreIcon,
    VscFullScreenIcon, VscNormalScreenIcon, VueIcon, JavaIcon, CppIcon
} from '../components/icons/Icons';

// --- Types and State ---
type FakeFileType = 'file' | 'folder';
type ProjectType = 'react' | 'vue' | 'java' | 'cpp';
interface SlackerState {
    formattedNovelLines: string[];
    typingProgress: { line: number; char: number };
    projectType: ProjectType;
    revealRatio: number;
    editorText: string;
}

interface FakeFile {
    name: string;
    type: FakeFileType;
    depth: number;
}

// --- Helper Functions & Data ---
const fakeProjects: Record<ProjectType, { files: FakeFile[], content: Record<string, string> }> = {
    react: {
        files: [
            { name: 'public', type: 'folder', depth: 0 },
            { name: 'index.html', type: 'file', depth: 1 },
            { name: 'src', type: 'folder', depth: 0 },
            { name: 'components', type: 'folder', depth: 1 },
            { name: 'Button.tsx', type: 'file', depth: 2 },
            { name: 'App.tsx', type: 'file', depth: 1 },
            { name: 'index.css', type: 'file', depth: 1 },
            { name: '.gitignore', type: 'file', depth: 0 },
            { name: 'package.json', type: 'file', depth: 0 },
            { name: 'README.md', type: 'file', depth: 0 },
            { name: 'tsconfig.json', type: 'file', depth: 0 },
        ],
        content: {
            'index.html': `<!DOCTYPE html>\n<html lang="en">\n<body>\n  <div id="root"></div>\n</body>\n</html>`,
            'App.tsx': `import React from 'react';\nimport Button from './components/Button';\n\nfunction App() {\n  return <Button label="Click Me" />;\n}\n\nexport default App;`,
            'Button.tsx': `import React from 'react';\n\nconst Button = ({ label }) => <button>{label}</button>;\nexport default Button;`,
            'index.css': `body { margin: 0; }`,
            'package.json': JSON.stringify({ name: "react-app", version: "0.1.0", dependencies: { react: "^18.2.0" } }, null, 2),
            '.gitignore': `node_modules\nbuild`,
            'tsconfig.json': JSON.stringify({ compilerOptions: { jsx: "react-jsx" } }, null, 2)
        }
    },
    vue: {
        files: [
            { name: 'public', type: 'folder', depth: 0 },
            { name: 'index.html', type: 'file', depth: 1 },
            { name: 'src', type: 'folder', depth: 0 },
            { name: 'components', type: 'folder', depth: 1 },
            { name: 'HelloWorld.vue', type: 'file', depth: 2 },
            { name: 'App.vue', type: 'file', depth: 1 },
            { name: 'main.js', type: 'file', depth: 1 },
            { name: '.gitignore', type: 'file', depth: 0 },
            { name: 'package.json', type: 'file', depth: 0 },
            { name: 'README.md', type: 'file', depth: 0 },
        ],
        content: {
            'App.vue': `<template>\n  <HelloWorld msg="Welcome to Your Vue.js App"/>\n</template>\n\n<script>\nimport HelloWorld from './components/HelloWorld.vue'\n\nexport default {\n  name: 'App',\n  components: {\n    HelloWorld\n  }\n}\n</script>`,
            'HelloWorld.vue': `<template>\n  <div class="hello">\n    <h1>{{ msg }}</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: 'HelloWorld',\n  props: {\n    msg: String\n  }\n}\n</script>`,
            'main.js': `import { createApp } from 'vue'\nimport App from './App.vue'\n\createApp(App).mount('#app')`,
            'package.json': JSON.stringify({ name: "vue-app", version: "0.1.0", dependencies: { vue: "^3.2.13" } }, null, 2),
        }
    },
    java: {
        files: [
            { name: 'src', type: 'folder', depth: 0 },
            { name: 'main', type: 'folder', depth: 1 },
            { name: 'java', type: 'folder', depth: 2 },
            { name: 'com/example/app', type: 'folder', depth: 3 },
            { name: 'App.java', type: 'file', depth: 4 },
            { name: 'pom.xml', type: 'file', depth: 0 },
            { name: 'README.md', type: 'file', depth: 0 },
        ],
        content: {
            'App.java': `package com.example.app;\n\npublic class App {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
            'pom.xml': `<project>\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example.app</groupId>\n  <artifactId>my-app</artifactId>\n  <version>1.0-SNAPSHOT</version>\n</project>`
        }
    },
    cpp: {
        files: [
            { name: 'src', type: 'folder', depth: 0 },
            { name: 'main.cpp', type: 'file', depth: 1 },
            { name: 'include', type: 'folder', depth: 0 },
            { name: 'helper.h', type: 'file', depth: 1 },
            { name: 'Makefile', type: 'file', depth: 0 },
            { name: 'README.md', type: 'file', depth: 0 },
        ],
        content: {
            'main.cpp': `#include <iostream>\n#include "helper.h"\n\nint main() {\n    say_hello();\n    return 0;\n}`,
            'helper.h': `#ifndef HELPER_H\n#define HELPER_H\n\nvoid say_hello();\n\n#endif`,
            'Makefile': `all:\n\tg++ src/main.cpp -o main`
        }
    }
};

const getFileIcon = (name: string) => {
    if (name.endsWith('.md')) return <VscMarkdownIcon className="text-blue-500" />;
    if (name.endsWith('.tsx')) return <CodeIcon className="w-5 h-5 text-cyan-500" />;
    if (name.endsWith('.vue')) return <VueIcon className="text-green-500" />;
    if (name.endsWith('.java')) return <JavaIcon className="text-orange-500" />;
    if (name.endsWith('.cpp') || name.endsWith('.h')) return <CppIcon className="text-blue-500" />;
    if (name.endsWith('.html')) return <CodeIcon className="w-5 h-5 text-orange-600" />;
    if (name.endsWith('.css') || name.endsWith('.js')) return <CodeIcon className="w-5 h-5 text-yellow-500" />;
    if (name.endsWith('.json') || name === 'Makefile' || name === 'pom.xml') return <VscFileIcon className="text-yellow-500" />;
    return <VscFileIcon className="text-gray-500" />;
};

const formatNovelAsMarkdown = (lines: string[]): string[] => {
    const newLines: string[] = [];
    let listCounter = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') {
            listCounter = 0;
            newLines.push(line);
            continue;
        }
        if (i > 0 && i % 25 === 0) newLines.push('', `## Chapter ${Math.floor(i / 25) + 1}`, '');
        if ((listCounter > 0 || (Math.random() < 0.1 && listCounter === 0)) && line.length < 80) {
            newLines.push(`- ${line}`);
            listCounter = (listCounter + 1) % 6;
            continue;
        }
        if (Math.random() < 0.05) {
            newLines.push('```');
            for (let j = 0; j < 3 && i + j < lines.length; j++) newLines.push(lines[i + j]);
            newLines.push('```');
            i += 2;
            continue;
        }
        newLines.push(line);
    }
    return newLines;
};

const getInitialState = (): SlackerState => {
    const defaultState: SlackerState = {
        formattedNovelLines: [],
        typingProgress: { line: 0, char: 0 },
        projectType: 'react',
        revealRatio: 3,
        editorText: '',
    };
    try {
        const savedStateJSON = localStorage.getItem('coding-slacker-state');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState.formattedNovelLines && savedState.typingProgress) {
                return { ...defaultState, ...savedState };
            }
        }
    } catch (error) {
        console.error("Failed to load Coding Slacker state from localStorage", error);
        localStorage.removeItem('coding-slacker-state');
    }
    return defaultState;
};

// --- Sub-components ---
const ActivityBar: React.FC<{ onSettingsClick: () => void; theme: string }> = ({ onSettingsClick, theme }) => (
    <div className={`w-12 p-2 flex flex-col items-center justify-between ${theme === 'dark' ? 'bg-[#333333] text-[#858585]' : 'bg-gray-200 text-gray-600'}`}>
        <div className="space-y-4">
            <VscFilesIcon className={theme === 'dark' ? 'text-white' : 'text-gray-800'} />
            <VscSearchIcon /> <VscSourceControlIcon /> <VscDebugAltIcon /> <VscExtensionsIcon />
        </div>
        <div> <button onClick={onSettingsClick} title="Settings"><VscSettingsGearIcon /></button> </div>
    </div>
);
const SideBar: React.FC<{ files: FakeFile[]; onImportClick: () => void; activeFile: string; onFileClick: (filename: string) => void; theme: string }> = ({ files, onImportClick, activeFile, onFileClick, theme }) => {
    const { t } = useTranslation();
    return (
        <div className={`w-64 p-2 text-sm flex-shrink-0 overflow-y-auto ${theme === 'dark' ? 'bg-[#252526] text-[#cccccc]' : 'bg-gray-100 text-gray-700'}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-2">{t('tools.codingSlacker.explorer')}</h2>
            <div className="space-y-0.5">
                {files.map(file => (
                    <button key={file.name + file.depth} onClick={() => onFileClick(file.name)}
                        className={`w-full text-left flex items-center p-1 rounded transition-colors ${activeFile === file.name ? (theme === 'dark' ? 'bg-white/10' : 'bg-blue-100 text-blue-800 font-semibold') : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-200')}`}
                        style={{ paddingLeft: `${file.depth * 1.25 + 0.25}rem` }}>
                        {file.type === 'folder' ? <VscFolderIcon className="w-5 h-5 mr-2 text-gray-500" /> : getFileIcon(file.name)}
                        <span>{file.name}</span>
                    </button>
                ))}
            </div>
            <button onClick={onImportClick} className="w-full mt-4 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-semibold">
                {t('tools.codingSlacker.importNovel')}
            </button>
        </div>
    );
};
const StatusBar: React.FC<{ line: number, col: number, language: string }> = ({ line, col, language }) => (
    <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-xs text-white flex-shrink-0">
        <div className="flex items-center gap-3"> <VscRemoteIcon /> <span className="flex items-center gap-1"><VscSyncIcon className="w-4 h-4" /> main</span> </div>
        <div className="flex items-center gap-3"> <span>Ln {line}, Col {col}</span> <span>{language}</span> </div>
    </div>
);
const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    state: Omit<SlackerState, 'theme'>;
    setState: (updater: SlackerState | ((prevState: SlackerState) => SlackerState)) => void;
    theme: string;
    setTheme: (theme: string) => void;
}> = ({ isOpen, onClose, state, setState, theme, setTheme }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const setProjectType = (type: ProjectType) => setState(s => ({ ...s, projectType: type }));
    const setRevealRatio = (ratio: number) => setState(s => ({ ...s, revealRatio: ratio }));

    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className={`rounded-lg p-6 w-96 shadow-2xl space-y-6 ${theme === 'dark' ? 'bg-[#252526] text-white' : 'bg-gray-100 text-gray-800'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold">{t('tools.codingSlacker.settingsTitle')}</h2>
                 <LabeledControl label={t('sidebar.theme')}>
                    <div className="flex items-center bg-primary dark:bg-d-primary p-1 rounded-full border border-border-color dark:border-d-border-color">
                        <button
                            onClick={() => setTheme('light')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${theme === 'light' ? 'bg-secondary dark:bg-d-secondary shadow' : 'hover:bg-secondary/50 dark:hover:bg-d-secondary/50'}`}
                            aria-pressed={theme === 'light'}
                        >
                            {t('sidebar.lightMode')}
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${theme === 'dark' ? 'bg-secondary dark:bg-d-secondary shadow' : 'hover:bg-secondary/50 dark:hover:bg-d-secondary/50'}`}
                            aria-pressed={theme === 'dark'}
                        >
                            {t('sidebar.darkMode')}
                        </button>
                    </div>
                </LabeledControl>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('tools.codingSlacker.projectType')}</label>
                    <select value={state.projectType} onChange={e => setProjectType(e.target.value as ProjectType)}
                        className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#007acc] ${theme === 'dark' ? 'bg-[#3c3c3c] border-[#3c3c3c] text-white' : 'bg-white border-gray-300 text-black'}`}>
                        {Object.keys(fakeProjects).map(type => (
                            <option key={type} value={type}>{t(`tools.codingSlacker.projectTypes.${type}`)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <LabeledControl label={t('tools.codingSlacker.revealRatio')} valueDisplay={`${state.revealRatio}x`}>
                         <input type="range" min="1" max="10" step="1" value={state.revealRatio} onChange={e => setRevealRatio(parseInt(e.target.value, 10))} className="w-full accent-[#007acc]" />
                    </LabeledControl>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const CodingSlacker: React.FC = () => {
    const { t } = useTranslation();
    const { isFullScreen } = useContext(FullScreenContext);
    const { theme, setTheme } = useContext(ThemeContext);
    const { state, setState } = useToolState<SlackerState>('coding-slacker', getInitialState());
    const { formattedNovelLines, typingProgress, projectType, revealRatio, editorText } = state;

    const [activeFile, setActiveFile] = useState<string>('README.md');
    const [isEditorMaximized, setIsEditorMaximized] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);

    const projectData = useMemo(() => fakeProjects[projectType], [projectType]);
    
    // Effect for saving state to localStorage whenever it changes
    useEffect(() => {
        try {
            // Only save if a novel is loaded to avoid overwriting a session with an empty state
            if (formattedNovelLines.length > 0) {
                const stateToSave = {
                    formattedNovelLines,
                    typingProgress,
                    projectType,
                    revealRatio,
                    editorText,
                };
                localStorage.setItem('coding-slacker-state', JSON.stringify(stateToSave));
            }
        } catch (error) {
            console.error("Failed to save Coding Slacker state to localStorage", error);
        }
    }, [formattedNovelLines, typingProgress, projectType, revealRatio, editorText]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setState(s => ({ ...s,
                    formattedNovelLines: formatNovelAsMarkdown(content.split(/\r?\n/)),
                    typingProgress: { line: 0, char: 0 },
                    editorText: '',
                }));
                setActiveFile('README.md');
            };
            reader.readAsText(file);
        }
    };

    const getNovelChunkAndUpdateProgress = (numToReveal: number): string => {
        let chunk = '';
        let revealedCount = 0;
        let { line, char } = typingProgress;
        
        while (revealedCount < numToReveal && line < formattedNovelLines.length) {
            const currentLine = formattedNovelLines[line];
            const charsLeftOnLine = currentLine.length - char;

            if (charsLeftOnLine > 0) {
                const charsToTake = Math.min(numToReveal - revealedCount, charsLeftOnLine);
                chunk += currentLine.substring(char, char + charsToTake);
                char += charsToTake;
                revealedCount += charsToTake;
            }
            
            if (char >= currentLine.length && line < formattedNovelLines.length - 1) {
                if (revealedCount < numToReveal) {
                    chunk += '\n';
                    revealedCount++;
                    line++;
                    char = 0;
                } else {
                    break;
                }
            } else if (char >= currentLine.length) {
                break;
            }
        }
        setState(s => ({ ...s, typingProgress: { line, char } }));
        return chunk;
    };

    const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (activeFile !== 'README.md' || formattedNovelLines.length === 0) return;
        
        if (isComposingRef.current) {
            setState(s => ({ ...s, editorText: newValue }));
            return;
        }

        const oldValue = editorText;
        if (newValue.length > oldValue.length) {
            const charsTypedCount = newValue.length - oldValue.length;
            const numToReveal = charsTypedCount * revealRatio;
            const novelChunk = getNovelChunkAndUpdateProgress(numToReveal);
            setState(s => ({ ...s, editorText: oldValue + novelChunk }));
        } else {
            setState(s => ({ ...s, editorText: newValue }));
        }
    };

    const handleCompositionStart = () => { isComposingRef.current = true; };
    const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        isComposingRef.current = false;
        const charsTypedCount = e.data.length;
        if (charsTypedCount > 0 && formattedNovelLines.length > 0) {
            const numToReveal = charsTypedCount * revealRatio;
            const novelChunk = getNovelChunkAndUpdateProgress(numToReveal);
            setState(s => ({ ...s, editorText: s.editorText.slice(0, -charsTypedCount) + novelChunk }));
        }
    };
    
    const editorDisplayContent = useMemo(() => {
        let text: string, language: string = 'Plain Text';
        if (activeFile === 'README.md') {
            text = editorText;
            language = 'Markdown';
        } else {
            text = projectData.content[activeFile] || `// Content for ${activeFile}`;
            if (activeFile.endsWith('.tsx') || activeFile.endsWith('.jsx')) language = 'TypeScript React';
            else if (activeFile.endsWith('.js')) language = 'JavaScript';
            else if (activeFile.endsWith('.vue')) language = 'Vue';
            else if (activeFile.endsWith('.java')) language = 'Java';
            else if (activeFile.endsWith('.cpp') || activeFile.endsWith('.h')) language = 'C++';
            else if (activeFile.endsWith('.json')) language = 'JSON';
        }
        return { text, language };
    }, [activeFile, editorText, projectData]);
    
    const lineNumbers = useMemo(() => {
        const count = editorDisplayContent.text.split('\n').length;
        return Array.from({ length: count }, (_, i) => i + 1).join('\n');
    }, [editorDisplayContent.text]);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const textarea = editorRef.current;
        const highlighter = highlighterRef.current;
        if (textarea && highlighter) {
            // Scroll the textarea to the bottom to follow the typing
            textarea.scrollTop = textarea.scrollHeight;
            // Sync the highlighter's scroll position to match the textarea exactly
            highlighter.scrollTop = textarea.scrollTop;
            highlighter.scrollLeft = textarea.scrollLeft;
        }
    }, [editorText]);
    
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (highlighterRef.current) {
            highlighterRef.current.scrollTop = e.currentTarget.scrollTop;
            highlighterRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };
    
    const editorStyles: React.CSSProperties = {
        fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
        color: 'transparent',
        caretColor: theme === 'dark' ? '#d4d4d4' : '#333333',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: 'transparent',
        resize: 'none',
        border: 'none',
        outline: 'none',
        overflow: 'auto'
    };
    
    const highlighterCustomStyle: React.CSSProperties = {
        margin: 0,
        padding: 0,
        backgroundColor: 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
        lineHeight: '1.5rem',
        fontSize: '0.875rem'
    };
    
    const codeTagProps = {
        style: {
            fontFamily: 'inherit',
            lineHeight: 'inherit',
            fontSize: 'inherit',
            padding: '0',
            margin: '0',
            backgroundColor: 'transparent',
        }
    };

    return (
        <div className={isFullScreen ? 'w-screen h-screen' : ''}>
            <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            {!isFullScreen && (
                 <ToolHeader title={t('tools.codingSlacker.pageTitle')} description={t('tools.codingSlacker.pageDescription')} />
            )}
            <div className={`flex font-mono rounded-lg overflow-hidden shadow-2xl ${isFullScreen ? 'h-full' : 'h-[calc(100vh-300px)]'} ${theme === 'dark' ? 'bg-[#1e1e1e] border border-[#303030]' : 'bg-white border border-gray-300'}`}>
                {!isEditorMaximized && <ActivityBar onSettingsClick={() => setIsSettingsOpen(true)} theme={theme} />}
                {!isEditorMaximized && <SideBar files={projectData.files} onImportClick={() => fileInputRef.current?.click()} activeFile={activeFile} onFileClick={setActiveFile} theme={theme} />}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className={`h-10 flex items-center justify-between px-2 border-b flex-shrink-0 ${theme === 'dark' ? 'bg-[#252526] border-[#303030]' : 'bg-gray-100 border-gray-300'}`}>
                       <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-t-md ${activeFile === 'README.md' ? (theme === 'dark' ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800') : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
                         {getFileIcon(activeFile)} <span>{activeFile}</span>
                       </div>
                       <div className="flex items-center">
                         <button onClick={() => setIsEditorMaximized(!isEditorMaximized)} title={t(isEditorMaximized ? 'tools.codingSlacker.restoreEditor' : 'tools.codingSlacker.maximizeEditor') as string}
                           className={`p-2 rounded ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-black/10'}`}>
                           {isEditorMaximized ? <VscRestoreIcon /> : <VscMaximizeIcon />}
                         </button>
                         <button onClick={toggleFullScreen} title={t(isFullScreen ? 'tools.codingSlacker.exitFullScreen' : 'tools.codingSlacker.fullScreen') as string}
                           className={`p-2 rounded ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-black/10'}`}>
                           {isFullScreen ? <VscNormalScreenIcon /> : <VscFullScreenIcon />}
                         </button>
                       </div>
                    </div>
                    <div className={`flex-1 p-2 text-sm leading-6 flex overflow-hidden ${theme === 'dark' ? 'text-[#d4d4d4]' : 'text-gray-800'}`}>
                        <pre className={`w-12 text-right pr-4 select-none pt-px ${theme === 'dark' ? 'text-[#858585]' : 'text-gray-400'}`}>{lineNumbers}</pre>
                        <div className="relative flex-grow h-full">
                            {activeFile === 'README.md' ? (
                                <>
                                    <div 
                                        ref={highlighterRef} 
                                        className="pointer-events-none no-scrollbar"
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'auto' }}
                                    >
                                        <SyntaxHighlighter
                                            language="markdown"
                                            style={theme === 'dark' ? vscDarkPlus : vs}
                                            customStyle={highlighterCustomStyle}
                                            codeTagProps={codeTagProps}
                                            PreTag="div"
                                            wrapLongLines={true}
                                        >
                                            {editorDisplayContent.text}
                                        </SyntaxHighlighter>
                                    </div>
                                    <textarea
                                        ref={editorRef}
                                        value={editorDisplayContent.text}
                                        onChange={handleEditorChange}
                                        onCompositionStart={handleCompositionStart}
                                        onCompositionEnd={handleCompositionEnd}
                                        onScroll={handleScroll}
                                        readOnly={activeFile !== 'README.md'}
                                        placeholder={formattedNovelLines.length === 0 ? t('tools.codingSlacker.editorPlaceholder') as string : ''}
                                        className={`bg-transparent outline-none resize-none ${theme === 'dark' ? 'placeholder:text-gray-500' : 'placeholder:text-gray-400'}`}
                                        style={editorStyles}
                                        spellCheck="false"
                                    />
                                </>
                            ) : (
                                <textarea
                                    value={editorDisplayContent.text}
                                    readOnly
                                    className="w-full h-full bg-transparent text-inherit outline-none resize-none"
                                    style={{
                                        fontFamily: editorStyles.fontFamily,
                                        fontSize: editorStyles.fontSize,
                                        lineHeight: editorStyles.lineHeight,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                    spellCheck="false"
                                />
                            )}
                        </div>
                    </div>
                    <StatusBar line={typingProgress.line + 1} col={typingProgress.char + 1} language={editorDisplayContent.language} />
                </div>
                <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                    state={state}
                    setState={setState} 
                    theme={theme}
                    setTheme={setTheme}
                />
            </div>
        </div>
    );
};

export default CodingSlacker;
