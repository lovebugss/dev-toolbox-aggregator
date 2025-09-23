import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tool } from '../types';

interface HeaderProps {
    isMobile: boolean;
    onMenuClick: () => void;
    tool: Tool | null;
    isMobileSidebarOpen: boolean;
}

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ isMobile, onMenuClick, tool, isMobileSidebarOpen }) => {
    const { t } = useTranslation();

    return (
        <header className="sticky top-0 z-10 flex items-center h-20 px-4 sm:px-6 md:px-8 bg-primary/80 dark:bg-d-primary/80 backdrop-blur-sm border-b border-border-color dark:border-d-border-color">
            {isMobile && (
                <button
                    onClick={onMenuClick}
                    className="mr-4 p-2 rounded-full text-text-secondary dark:text-d-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Open menu"
                    aria-controls="mobile-sidebar"
                    aria-expanded={isMobileSidebarOpen}
                >
                    <MenuIcon className="h-6 w-6" />
                </button>
            )}
            {tool && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color">
                       <tool.icon className="w-5 h-5 text-accent dark:text-d-accent" />
                    </div>
                    <h1 className="text-xl font-semibold text-text-primary dark:text-d-text-primary">
                        {t(tool.nameKey)}
                    </h1>
                </div>
            )}
        </header>
    );
};

export default Header;