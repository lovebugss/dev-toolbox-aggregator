import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ToolId, toolCategories, Tool, ToolCategory } from '../types';
import { ToolboxIcon, SunIcon, MoonIcon, SearchIcon, MenuIcon, VscChevronDownIcon, CloseIcon } from './icons/Icons';

interface TopNavProps {
  activeTool: ToolId | null;
  activeToolMeta: Tool | null;
  theme: string;
  setTheme: (theme: string) => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  favorites: ToolId[];
  toggleFavorite: (toolId: ToolId) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const fuzzyMatch = (query: string, target: string): boolean => {
  query = query.toLowerCase().replace(/\s/g, '');
  target = target.toLowerCase();
  let queryIndex = 0;
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) queryIndex++;
  }
  return queryIndex === query.length;
};

const ThemeSwitcher: React.FC<{ theme: string; setTheme: (theme: string) => void; }> = ({ theme, setTheme }) => {
    return (
        <div className="flex items-center glass-panel p-1 rounded-full border border-white/20 dark:border-white/10">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow-lg scale-110' : 'opacity-60 hover:opacity-100'}`}
                title="Light Mode"
            >
                <SunIcon className="w-4 h-4 text-amber-500" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-800 shadow-lg scale-110' : 'opacity-60 hover:opacity-100'}`}
                title="Dark Mode"
            >
                <MoonIcon className="w-4 h-4 text-indigo-400" />
            </button>
        </div>
    );
};

const LanguageSwitcher: React.FC<{}> = () => {
    const { i18n, t } = useTranslation();
    const languages = [ { code: 'en-US', label: 'EN' }, { code: 'zh-CN', label: 'ZH' } ];
    const currentLang = languages.find(l => i18n.language.startsWith(l.code.slice(0, 2))) || languages[0];

    return (
        <div className="flex items-center glass-panel p-1 rounded-full">
            {languages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${currentLang.code === lang.code ? 'bg-accent text-white shadow-lg' : 'text-text-secondary dark:text-d-text-secondary hover:bg-white/10'}`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

const NavDropdown: React.FC<{
  categoryName: string;
  tools: Tool[];
  activeTool: ToolId | null;
  onLinkClick: () => void;
}> = ({ categoryName, tools, activeTool, onLinkClick }) => {
  const { t } = useTranslation();
  return (
    <div className="relative group/nav">
      <button className="flex items-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-all text-text-primary dark:text-d-text-primary whitespace-nowrap">
        <span className="text-readable">{categoryName}</span>
        <VscChevronDownIcon className="w-4 h-4 transition-transform group-hover/nav:rotate-180 opacity-70" />
      </button>
      {/* 核心修复：使用 dark:bg-d-primary 并确保背景几乎不透明，防止在黑色模式下显示白色背景 */}
      <div className="hidden group-hover/nav:block absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white/95 dark:bg-d-primary border border-black/5 dark:border-white/10 p-2 rounded-2xl shadow-2xl backdrop-blur-3xl">
            <ul className="space-y-1">
            {tools.map(tool => (
                <li key={tool.id}>
                <Link to={`/${tool.id}`} onClick={onLinkClick} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${activeTool === tool.id ? 'bg-accent text-white shadow-md' : 'hover:bg-accent/10 dark:hover:bg-white/5 text-text-primary dark:text-d-text-primary'}`}>
                    <tool.icon className={`w-4 h-4 ${activeTool === tool.id ? 'text-white' : 'text-accent'}`} />
                    <span className="font-medium">{t(tool.nameKey)}</span>
                </Link>
                </li>
            ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

const TopNav: React.FC<TopNavProps> = ({ 
    activeTool, theme, setTheme,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    favorites, searchInputRef
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const allTools = useMemo(() => toolCategories.flatMap(c => c.tools), []);
  const favoriteTools = useMemo(() => allTools.filter(tool => favorites.includes(tool.id)), [favorites, allTools]);

  const groupedFilteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim();
    return toolCategories
      .map(category => ({
        category,
        tools: category.tools.filter(tool =>
          fuzzyMatch(query, t(tool.nameKey)) || fuzzyMatch(query, t(tool.descriptionKey))
        )
      }))
      .filter(group => group.tools.length > 0);
  }, [searchQuery, t]);

  const handleLinkClick = () => {
    setIsMobileSidebarOpen(false);
    setSearchQuery('');
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <>
        <header className="sticky top-0 z-40 h-20 w-full px-4 sm:px-6 lg:px-8 flex-shrink-0 bg-transparent">
            <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between">
                <div className="flex items-center gap-4 lg:gap-8">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="p-2 glass-panel rounded-2xl group-hover:scale-110 transition-transform bg-accent shadow-indigo-500/30 shadow-lg">
                            <ToolboxIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-extrabold text-text-primary dark:text-d-text-primary hidden sm:block tracking-tight text-readable">DevToolbox</h1>
                    </Link>

                    <nav className="hidden lg:flex items-center glass-panel px-2 py-1 rounded-2xl border border-white/10">
                        {favoriteTools.length > 0 && <NavDropdown categoryName={t('sidebar.favorites')} tools={favoriteTools} activeTool={activeTool} onLinkClick={handleLinkClick} />}
                        {toolCategories.map(category => (
                            <NavDropdown key={category.nameKey} categoryName={t(category.nameKey)} tools={category.tools} activeTool={activeTool} onLinkClick={handleLinkClick} />
                        ))}
                    </nav>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <div className={`flex items-center glass-panel rounded-2xl px-4 py-2 transition-all duration-300 border border-white/10 ${isSearchFocused ? 'w-80 ring-2 ring-accent/50' : 'w-64'}`}>
                            <SearchIcon className="w-4 h-4 text-text-secondary dark:text-d-text-secondary mr-2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('sidebar.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="bg-transparent text-sm w-full outline-none text-text-primary dark:text-d-text-primary placeholder:text-text-secondary/50 dark:placeholder:text-d-text-secondary/50"
                            />
                        </div>
                        {isSearchFocused && searchQuery && (
                            <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-d-primary backdrop-blur-3xl p-2 rounded-2xl shadow-2xl z-50 border border-black/5 dark:border-white/10">
                                {groupedFilteredTools.length > 0 ? (
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {groupedFilteredTools.map(({ category, tools }) => (
                                            <div key={category.nameKey} className="mb-2 last:mb-0">
                                                <h3 className="px-3 pt-2 pb-1 text-[10px] font-bold text-accent dark:text-indigo-400 uppercase tracking-widest">{t(category.nameKey)}</h3>
                                                <ul className="space-y-1">
                                                    {tools.map(tool => (
                                                        <li key={tool.id}>
                                                            <Link to={`/${tool.id}`} onClick={handleLinkClick} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/10 dark:hover:bg-white/5 transition-colors">
                                                                <tool.icon className="w-4 h-4 text-accent dark:text-indigo-400" />
                                                                <span className="text-sm font-medium text-text-primary dark:text-d-text-primary">{t(tool.nameKey)}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-text-secondary dark:text-d-text-secondary">{t('sidebar.noResults')}</div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <ThemeSwitcher theme={theme} setTheme={setTheme} />
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-3 glass-panel rounded-2xl ml-2 border border-white/10 active:scale-95 transition-transform">
                            <MenuIcon className="w-5 h-5 text-text-primary dark:text-d-text-primary" />
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <div 
            className={`fixed inset-0 z-[100] transition-all duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto block' : 'opacity-0 pointer-events-none hidden'}`}
        >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
            <div className={`absolute top-0 right-0 h-full w-[80%] max-w-sm bg-white dark:bg-d-primary shadow-2xl transition-transform duration-300 transform ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold text-readable">Menu</h2>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
                    {toolCategories.map(category => (
                        <div key={category.nameKey} className="mb-6">
                            <h3 className="px-4 mb-2 text-xs font-bold text-accent dark:text-indigo-400 uppercase tracking-widest opacity-70">{t(category.nameKey)}</h3>
                            <div className="space-y-1">
                                {category.tools.map(tool => (
                                    <Link 
                                        key={tool.id} 
                                        to={`/${tool.id}`} 
                                        onClick={handleLinkClick}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTool === tool.id ? 'bg-accent text-white shadow-lg' : 'text-text-primary dark:text-d-text-primary hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                    >
                                        <tool.icon className="w-5 h-5" />
                                        <span>{t(tool.nameKey)}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </>
  );
};

export default TopNav;