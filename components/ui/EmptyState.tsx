import React from 'react';

interface EmptyStateProps {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ Icon, message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary dark:text-d-text-secondary p-8">
        <Icon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">{message}</p>
    </div>
);
