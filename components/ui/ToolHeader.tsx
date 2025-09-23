import React from 'react';

interface ToolHeaderProps {
    title: string;
    description: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description }) => (
    <div className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-d-text-primary">
            {title}
        </h2>
        <p className="mt-4 text-lg text-text-secondary dark:text-d-text-secondary max-w-3xl">
            {description}
        </p>
    </div>
);