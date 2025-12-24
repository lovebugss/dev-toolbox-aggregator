import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ToolId, toolCategories, Tool, ToolCategory } from '../types';
import { ToolboxIcon, SunIcon, MoonIcon, SearchIcon, MenuIcon, VscChevronDownIcon } from './icons/Icons';

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
      <button className="flex items-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-all text-text-primary dark:text-d-text-primary">
        <span className="text-readable">{categoryName}</span>
        <VscChevronDownIcon className="w-4 h-4 transition-transform group-hover/nav:rotate-180 opacity-70" />
      </button>
      <div className="invisible group-hover/nav:visible opacity-0 group-hover/nav:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[220px] transition-all duration-300 translate-y-2 group-hover/nav:translate-y-0 z-50">
        <div className="glass-panel p-2 rounded-2xl overflow-hidden backdrop-blur-3xl shadow-2xl">
            <ul className="space-y-1">
            {tools.map(tool => (
                <li key={tool.id}>
                <Link to={`/${tool.id}`} onClick={onLinkClick} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${activeTool === tool.id ? 'bg-accent text-white shadow-md' : 'hover:bg-accent/10 dark:hover:bg-indigo-500/20 text-text-primary dark:text-d-text-primary'}`}>
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
    activeTool, theme, setTheme, isMobile,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    favorites, searchInputRef
}) => {
  const { t, i18n } = useTranslation();
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
    if (isMobile) setIsMobileSidebarOpen(false);
    setSearchQuery('');
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <header className="sticky top-0 z-40 h-20 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="p-2 glass-panel rounded-2xl group-hover:scale-110 transition-transform bg-accent shadow-indigo-500/30 shadow-lg">
                        <ToolboxIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-extrabold text-text-primary dark:text-d-text-primary hidden sm:block tracking-tight text-readable">DevToolbox</h1>
                </Link>

                {!isMobile && (
                    <nav className="flex items-center glass-panel px-2 py-1 rounded-2xl border border-white/10">
                        {favoriteTools.length > 0 && <NavDropdown categoryName={t('sidebar.favorites')} tools={favoriteTools} activeTool={activeTool} onLinkClick={handleLinkClick} />}
                        {toolCategories.map(category => (
                            <NavDropdown key={category.nameKey} categoryName={t(category.nameKey)} tools={category.tools} activeTool={activeTool} onLinkClick={handleLinkClick} />
                        ))}
                    </nav>
                )}
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
                        <div className="absolute top-full mt-2 w-full glass-panel p-2 rounded-2xl shadow-2xl z-50 border border-white/20">
                            {groupedFilteredTools.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {groupedFilteredTools.map(({ category, tools }) => (
                                        <div key={category.nameKey} className="mb-2 last:mb-0">
                                            <h3 className="px-3 pt-2 pb-1 text-[10px] font-bold text-accent dark:text-indigo-400 uppercase tracking-widest">{t(category.nameKey)}</h3>
                                            <ul className="space-y-1">
                                                {tools.map(tool => (
                                                    <li key={tool.id}>
                                                        <Link to={`/${tool.id}`} onClick={handleLinkClick} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/10 dark:hover:bg-indigo-400/10 transition-colors">
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
                    {isMobile && (
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-3 glass-panel rounded-2xl ml-2 border border-white/10">
                            <MenuIcon className="w-5 h-5 text-text-primary dark:text-d-text-primary" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
};

export default TopNav;