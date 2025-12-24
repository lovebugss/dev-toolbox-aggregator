import React, { useState, useEffect, useMemo, useCallback, createContext, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TopNav from './components/Sidebar';
import Footer from './components/Footer';
import Welcome from './tools/Welcome';
import { ToolId, toolCategories, Tool } from './types';
import { ToolStateProvider } from './contexts/ToolStateContext';
import { ToastProvider } from './contexts/ToastContext';

// Import all tool components
import JsonFormatter from './tools/JsonFormatter';
import ColorConverter from './tools/ColorConverter';
import TextCounter from './tools/TextCounter';
import ImageToBase64 from './tools/ImageToBase64';
import QrCodeGenerator from './tools/QrCodeGenerator';
import GifSplitter from './tools/GifSplitter';
import TextDiff from './tools/TextDiff';
import Base64Coder from './tools/Base64Coder';
import RegexEditor from './tools/RegexEditor';
import CrontabGenerator from './tools/CrontabGenerator';
import UuidGenerator from './tools/UuidGenerator';
import DataConverter from './tools/DataConverter';
import TimestampConverter from './tools/TimestampConverter';
import Calculator from './tools/Calculator';
import VideoToGif from './tools/VideoToGif';
import { ImageGridSplitter } from './tools/ImageGridSplitter';
import PhoneLookup from './tools/PhoneLookup';
import PostalCodeLookup from './tools/PostalCodeLookup';
import IpLookup from './tools/IpLookup';
import MemeGenerator from './tools/MemeGenerator';
import ReactionTimeTest from './tools/ReactionTimeTest';
import DiffChecker from './tools/DiffChecker';
import JwtDecoder from './tools/JwtDecoder';
import CharacterFrequencyCounter from './tools/CharacterFrequencyCounter';
import ImageEditor from './tools/ImageEditor';
import { UrlParser } from './tools/UrlParser';
import NumberBaseConverter from './tools/NumberBaseConverter';
import HashingTool from './tools/HashingTool';
import Md5Hasher from './tools/Md5Hasher';
import SelectiveReactionTest from './tools/SelectiveReactionTest';
import ColorDiscriminationTest from './tools/ColorDiscriminationTest';
import MemoryTest from './tools/MemoryTest';
import InhibitoryControlTest from './tools/InhibitoryControlTest';
import LedScroller from './tools/LedScroller';
import ImageCollage from './tools/ImageCollage';
import CodingSlacker from './tools/CodingSlacker';
import SetCalculator from './tools/SetCalculator';
import AsciiArtGenerator from './tools/AsciiArtGenerator';
import MorseCodeTranslator from './tools/MorseCodeTranslator';
import UserAgentViewer from './tools/UserAgentViewer';
import AlgorithmVisualizer from './tools/AlgorithmVisualizer';
import WebSocketClient from './tools/WebSocketClient';
import SvgShapeGenerator from './tools/SvgShapeGenerator';
import JsonToJavaBean from './tools/JsonToJavaBean';
import StreamBroadcaster from './tools/StreamBroadcaster';
import CommitMessageGenerator from './tools/CommitMessageGenerator';
import ExcelToJson from './tools/ExcelToJson';
import DicomViewer from './tools/DicomViewer';
import PdfToPng from './tools/PdfToPng';
import LongImageStitcher from './tools/LongImageStitcher';
import PdfSplitter from './tools/PdfSplitter';
import PdfMerger from './tools/PdfMerger';
import PdfWatermark from './tools/PdfWatermark';
import PdfCompressor from './tools/PdfCompressor';

export const FullScreenContext = createContext<{
    isFullScreen: boolean;
    setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    isFullScreen: false,
    setIsFullScreen: () => {},
});

export const ThemeContext = createContext<{
    theme: string;
    setTheme: (theme: string) => void;
}>({
    theme: 'dark',
    setTheme: () => {},
});

const toolComponentMap: Record<ToolId, React.ComponentType> = {
  'json-formatter': JsonFormatter,
  'color-converter': ColorConverter,
  'text-counter': TextCounter,
  'image-to-base64': ImageToBase64,
  'qr-code-generator': QrCodeGenerator,
  'gif-splitter': GifSplitter,
  'text-diff': TextDiff,
  'base64-coder': Base64Coder,
  'regex-editor': RegexEditor,
  'crontab-generator': CrontabGenerator,
  'uuid-generator': UuidGenerator,
  'diff-checker': DiffChecker,
  'data-converter': DataConverter,
  'dicom-viewer': DicomViewer,
  'timestamp-converter': TimestampConverter,
  'calculator': Calculator,
  'video-to-gif': VideoToGif,
  'image-grid-splitter': ImageGridSplitter,
  'phone-lookup': PhoneLookup,
  'postal-code-lookup': PostalCodeLookup,
  'ip-lookup': IpLookup,
  'meme-generator': MemeGenerator,
  'reaction-time-test': ReactionTimeTest,
  'selective-reaction-test': SelectiveReactionTest,
  'color-discrimination-test': ColorDiscriminationTest,
  'memory-test': MemoryTest,
  'inhibitory-control-test': InhibitoryControlTest,
  'jwt-decoder': JwtDecoder,
  'character-frequency-counter': CharacterFrequencyCounter,
  'image-editor': ImageEditor,
  'image-collage': ImageCollage,
  'url-parser': UrlParser,
  'number-base-converter': NumberBaseConverter,
  'hashing-tool': HashingTool,
  'md5-hasher': Md5Hasher,
  'led-scroller': LedScroller,
  'coding-slacker': CodingSlacker,
  'set-calculator': SetCalculator,
  'ascii-art-generator': AsciiArtGenerator,
  'morse-code-translator': MorseCodeTranslator,
  'user-agent-viewer': UserAgentViewer,
  'algorithm-visualizer': AlgorithmVisualizer,
  'websocket-client': WebSocketClient,
  'svg-shape-generator': SvgShapeGenerator,
  'json-to-java-bean': JsonToJavaBean,
  'stream-broadcaster': StreamBroadcaster,
  'commit-message-generator': CommitMessageGenerator,
  'excel-to-json': ExcelToJson,
  'pdf-to-png': PdfToPng,
  'long-image-stitcher': LongImageStitcher,
  'pdf-splitter': PdfSplitter,
  'pdf-merger': PdfMerger,
  'pdf-watermark': PdfWatermark,
  'pdf-compressor': PdfCompressor,
};

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

const AppContent: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const [usageCount, setUsageCount] = useState<number>(() => {
        const saved = localStorage.getItem('usageCount');
        if (saved) {
            return parseInt(saved, 10);
        }
        // Initialize with a random larger number for effect
        const initialCount = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
        localStorage.setItem('usageCount', String(initialCount));
        return initialCount;
    });

    const [favorites, setFavorites] = useState<ToolId[]>(() => {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    });
    
    const [recentTools, setRecentTools] = useState<ToolId[]>(() => {
        const saved = localStorage.getItem('recentTools');
        return saved ? JSON.parse(saved) : [];
    });

    const isMobile = useMediaQuery('(max-width: 1024px)');
    const allTools = useMemo(() => toolCategories.flatMap(c => c.tools), []);
    const location = useLocation();
    const navigate = useNavigate();

    const activeTool = useMemo(() => {
      const path = location.pathname.slice(1);
      return allTools.some(t => t.id === path) ? path as ToolId : null;
    }, [location.pathname, allTools]);

    useEffect(() => {
      document.documentElement.className = theme;
      localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.body.className = theme === 'dark' ? 'bg-d-primary grid-bg' : 'bg-primary grid-bg';
    }, [theme]);

    useEffect(() => {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);
    
    useEffect(() => {
        localStorage.setItem('recentTools', JSON.stringify(recentTools));
    }, [recentTools]);
    
    useEffect(() => {
        if (activeTool) {
            setRecentTools(prev => {
                const updated = prev.filter(id => id !== activeTool);
                updated.unshift(activeTool);
                return updated.slice(0, 5); // Keep a history of the last 5 used tools
            });
            
            setUsageCount(prev => {
                const newCount = prev + 1;
                localStorage.setItem('usageCount', String(newCount));
                return newCount;
            });
        }
    }, [activeTool]);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    
    const handleWelcomeToolClick = useCallback((toolId: ToolId) => {
      navigate(`/${toolId}`);
      setIsMobileSidebarOpen(false);
    }, [navigate]);

    const toggleFavorite = (toolId: ToolId) => {
      setFavorites(prev => 
        prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
      );
    };
    
    const activeToolMeta = useMemo(() => {
      if (!activeTool) return null;
      return allTools.find(tool => tool.id === activeTool);
    }, [activeTool, allTools]);

    return (
        <FullScreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
          <ThemeContext.Provider value={{ theme, setTheme }}>
            {/* 这里的容器改为透明背景，以便透出 index.html 定义的复杂纹理背景 */}
            <div className={`relative min-h-screen bg-transparent font-sans flex flex-col ${isFullScreen ? 'fullscreen-active' : ''}`}>
              {!isFullScreen && (
                  <TopNav
                      activeTool={activeTool}
                      activeToolMeta={activeToolMeta}
                      theme={theme}
                      setTheme={setTheme}
                      isMobile={isMobile}
                      isMobileSidebarOpen={isMobileSidebarOpen}
                      setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      searchInputRef={searchInputRef}
                  />
              )}
              <main className="flex-1 flex flex-col overflow-hidden">
                  <div className={`flex-1 overflow-y-auto custom-scrollbar ${isFullScreen ? 'h-screen' : 'p-4 sm:p-6 md:p-8'}`}>
                     <Routes>
                      <Route path="/" element={<Welcome setActiveTool={handleWelcomeToolClick} recentTools={recentTools} totalTools={allTools.length} usageCount={usageCount} />} />
                      {allTools.map(tool => (
                        <Route
                          key={tool.id}
                          path={`/${tool.id}`}
                          element={React.createElement(toolComponentMap[tool.id])}
                        />
                      ))}
                    </Routes>
                  </div>
              </main>
              {!isFullScreen && <Footer />}
            </div>
          </ThemeContext.Provider>
        </FullScreenContext.Provider>
    );
}

const App: React.FC = () => {
  return (
    <ToolStateProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ToolStateProvider>
  );
};

export default App;