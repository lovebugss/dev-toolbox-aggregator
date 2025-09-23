import React, { useState } from 'react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-border-color dark:border-d-border-color first:border-t-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left font-semibold text-text-primary dark:text-d-text-primary hover:bg-primary dark:hover:bg-d-primary transition-colors"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="p-4 space-y-4 bg-primary dark:bg-d-primary">{children}</div>}
        </div>
    );
};