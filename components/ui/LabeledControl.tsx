import React from 'react';

interface LabeledControlProps {
    label: string;
    htmlFor?: string;
    valueDisplay?: string;
    children: React.ReactNode;
}

export const LabeledControl: React.FC<LabeledControlProps> = ({ label, htmlFor, valueDisplay, children }) => (
    <div>
        <label htmlFor={htmlFor} className="flex justify-between text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1.5">
            <span>{label}</span>
            {valueDisplay && <span className="font-sans text-text-primary dark:text-d-text-primary">{valueDisplay}</span>}
        </label>
        {children}
    </div>
);
