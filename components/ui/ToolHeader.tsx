import React from 'react';

interface ToolHeaderProps {
    title: string;
    description: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description }) => (
    <div className="mb-12 text-center sm:text-left">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary dark:text-d-text-primary drop-shadow-md text-readable">
            {title}
        </h2>
        <p className="mt-4 text-lg text-text-secondary dark:text-d-text-secondary max-w-3xl leading-relaxed font-medium">
            {description}
        </p>
        <div className="mt-8 h-1 w-20 bg-accent rounded-full mx-auto sm:mx-0 shadow-lg shadow-accent/40"></div>
    </div>
);