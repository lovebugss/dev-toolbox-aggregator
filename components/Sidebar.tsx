import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ToolId, toolCategories, Tool, ToolCategory } from '../types';
import { ToolboxIcon, GlobeIcon, SunIcon, MoonIcon, SearchIcon, StarIcon, MenuIcon, VscChevronDownIcon } from './icons/Icons';

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
    if (target[i] === query[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === query.length;
};

const ThemeSwitcher: React.FC<{ theme: string; setTheme: (theme: string) => void; }> = ({ theme, setTheme }) => {
    const { t } = useTranslation();
    return (
        <div role="group" aria-label={t('sidebar.theme')} className="flex items-center bg-primary dark:bg-d-primary p-1 rounded-full border border-border-color dark:border-d-border-color">
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
    );
};

const LanguageSwitcher: React.FC<{}> = () => {
    const { i18n, t } = useTranslation();
    const languages = [ { code: 'en-US', key: 'english' }, { code: 'zh-CN', key: 'chinese' } ];
    const currentLang = languages.find(l => i18n.language.startsWith(l.code.slice(0, 2))) || languages[0];

    return (
        <div role="group" aria-label={t('sidebar.language')} className="flex items-center bg-primary dark:bg-d-primary p-1 rounded-full border border-border-color dark:border-d-border-color">
            {languages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${currentLang.code === lang.code ? 'bg-secondary dark:bg-d-secondary shadow' : 'hover:bg-secondary/50 dark:hover:bg-d-secondary/50'}`}
                    aria-pressed={currentLang.code === lang.code}
                >
                    {t(`sidebar.languages.${lang.key}`)}
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
    <div className="relative nav-dropdown">
      <button className="flex items-center gap-1 text-sm font-semibold py-2 px-3 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <span>{categoryName}</span>
        <VscChevronDownIcon className="w-4 h-4 transition-transform" />
      </button>
      <div className="nav-dropdown-content bg-secondary dark:bg-d-secondary rounded-lg shadow-lg border border-border-color dark:border-d-border-color mt-1">
        <ul className="p-2 space-y-1">
          {tools.map(tool => (
            <li key={tool.id}>
              <Link to={`/${tool.id}`} onClick={onLinkClick} className={`block w-full text-left px-3 py-2 text-sm rounded-md ${activeTool === tool.id ? 'bg-accent/10 dark:bg-d-accent/10 text-accent dark:text-d-accent font-semibold' : 'hover:bg-primary dark:hover:bg-d-primary'}`}>
                {t(tool.nameKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const TopNav: React.FC<TopNavProps> = ({ 
    activeTool, activeToolMeta, theme, setTheme, isMobile,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    favorites, toggleFavorite, searchInputRef
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const isMac = useMemo(() => typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform), []);

  const allTools = useMemo(() => toolCategories.flatMap(c => c.tools), []);
  
  const favoriteTools = useMemo(() => {
    return allTools.filter(tool => favorites.includes(tool.id));
  }, [favorites, allTools]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return toolCategories;
    const query = searchQuery.trim();
    return toolCategories
      .map(category => ({
        ...category,
        tools: category.tools.filter(tool =>
          fuzzyMatch(query, t(tool.nameKey)) || fuzzyMatch(query, t(tool.descriptionKey))
        )
      }))
      .filter(category => category.tools.length > 0);
  }, [searchQuery, t, i18n.language]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim();
    return allTools.filter(tool =>
      fuzzyMatch(query, t(tool.nameKey)) || fuzzyMatch(query, t(tool.descriptionKey))
    );
  }, [searchQuery, t, allTools, i18n.language]);
  
  const groupedFilteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const toolToCategoryMap = new Map<ToolId, ToolCategory>();
    toolCategories.forEach(category => {
        category.tools.forEach(tool => {
            toolToCategoryMap.set(tool.id, category);
        });
    });

    const grouped = new Map<string, { category: ToolCategory; tools: Tool[] }>();

    filteredTools.forEach(tool => {
        const category = toolToCategoryMap.get(tool.id);
        if (category) {
            if (!grouped.has(category.nameKey)) {
                grouped.set(category.nameKey, { category, tools: [] });
            }
            grouped.get(category.nameKey)!.tools.push(tool);
        }
    });

    const orderedGrouped: { category: ToolCategory; tools: Tool[] }[] = [];
    toolCategories.forEach(category => {
        if (grouped.has(category.nameKey)) {
            orderedGrouped.push(grouped.get(category.nameKey)!);
        }
    });

    return orderedGrouped;
  }, [filteredTools, searchQuery]);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const mobileMenuContent = (
      <div className={`bg-secondary dark:bg-d-secondary flex flex-col h-full border-r border-border-color dark:border-d-border-color w-[var(--sidebar-width-open)]`}>
          <Link to="/" onClick={handleLinkClick} className="flex items-center shrink-0 h-24 justify-center px-6">
            <ToolboxIcon />
            <h1 className="text-xl font-bold ml-4 text-text-primary dark:text-d-text-primary whitespace-nowrap">{t('sidebar.title')}</h1>
          </Link>
          
          <div className="px-4 pb-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="w-5 h-5 text-text-secondary dark:text-d-text-secondary" />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('sidebar.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary dark:bg-d-primary border-none ring-1 ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                  aria-label={t('sidebar.searchPlaceholder')}
                />
              </div>
            </div>

          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {favoriteTools.length > 0 && !searchQuery.trim() && (
              <div>
                <h2 className="px-4 mb-2 text-xs font-semibold text-text-secondary dark:text-d-text-secondary uppercase tracking-wider">{t('sidebar.favorites')}</h2>
                <ul>
                    {favoriteTools.map(tool => (
                        <li key={tool.id}><Link to={`/${tool.id}`} onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-2.5 rounded-lg">{t(tool.nameKey)}</Link></li>
                    ))}
                </ul>
                <hr className="my-4 border-t border-border-color dark:border-d-border-color" />
              </div>
            )}
            {filteredCategories.map(category => (
                <div key={category.nameKey}>
                  <h2 className="px-4 mb-2 text-xs font-semibold text-text-secondary dark:text-d-text-secondary uppercase tracking-wider">{t(category.nameKey)}</h2>
                  <ul>{category.tools.map(tool => (
                    <li key={tool.id}><Link to={`/${tool.id}`} onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-2.5 rounded-lg">{t(tool.nameKey)}</Link></li>
                  ))}</ul>
                </div>
              ))}
          </nav>
      </div>
  );

  if (isMobile) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 bg-secondary/80 dark:bg-d-secondary/80 backdrop-blur-sm border-b border-border-color dark:border-d-border-color">
            <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-full text-text-secondary dark:text-d-text-secondary"
                aria-label="Open menu"
            >
                <MenuIcon className="h-6 w-6" />
            </button>
            {activeToolMeta && (
                 <h1 className="text-lg font-semibold text-text-primary dark:text-d-text-primary">
                    {t(activeToolMeta.nameKey)}
                </h1>
            )}
            <div className="w-10"></div>
            <aside id="mobile-sidebar" className={`fixed top-0 left-0 z-40 h-full transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {mobileMenuContent}
            </aside>
            {isMobileSidebarOpen && (
                <div 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30"
                    aria-hidden="true"
                ></div>
            )}
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 h-20 bg-secondary/80 dark:bg-d-secondary/80 backdrop-blur-sm border-b border-border-color dark:border-d-border-color">
        <div className="flex items-center justify-between h-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
                <ToolboxIcon />
                <h1 className="text-xl font-bold text-text-primary dark:text-d-text-primary whitespace-nowrap hidden sm:block">{t('sidebar.title')}</h1>
            </Link>

            <nav className="flex items-center gap-1">
                {favoriteTools.length > 0 && <NavDropdown categoryName={t('sidebar.favorites')} tools={favoriteTools} activeTool={activeTool} onLinkClick={handleLinkClick} />}
                {toolCategories.map(category => (
                    <NavDropdown key={category.nameKey} categoryName={t(category.nameKey)} tools={category.tools} activeTool={activeTool} onLinkClick={handleLinkClick} />
                ))}
            </nav>
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-5 h-5 text-text-secondary dark:text-d-text-secondary" />
                    </span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('sidebar.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="w-full max-w-xs pl-10 pr-4 py-2 bg-primary dark:bg-d-primary border-none ring-1 ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                        aria-label={t('sidebar.searchPlaceholder')}
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex">
                        {isMac ? '⌘' : 'Ctrl'} K
                    </kbd>
                    {isSearchFocused && searchQuery && (
                        <div className="absolute top-full mt-2 w-[350px] max-h-96 overflow-y-auto bg-secondary dark:bg-d-secondary rounded-lg shadow-lg border border-border-color dark:border-d-border-color z-50 right-0">
                            {groupedFilteredTools.length > 0 ? (
                                <div className="p-2">
                                    {groupedFilteredTools.map(({ category, tools }) => (
                                        <div key={category.nameKey} className="mb-2 last:mb-0">
                                            <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-text-secondary dark:text-d-text-secondary uppercase tracking-wider">{t(category.nameKey)}</h3>
                                            <ul className="space-y-1">
                                                {tools.map(tool => (
                                                    <li key={tool.id}>
                                                        <Link
                                                            to={`/${tool.id}`}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={handleLinkClick}
                                                            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary dark:hover:bg-d-primary flex items-center gap-3"
                                                        >
                                                            <tool.icon className="w-5 h-5 text-accent dark:text-d-accent flex-shrink-0" />
                                                            <div>
                                                                <div className="font-semibold text-text-primary dark:text-d-text-primary">{t(tool.nameKey)}</div>
                                                                <div className="text-xs text-text-secondary dark:text-d-text-secondary truncate">{t(tool.descriptionKey)}</div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-text-secondary dark:text-d-text-secondary">
                                    {t('sidebar.noResults')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <LanguageSwitcher />
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </div>
        </div>
    </header>
  );
};

export default TopNav;