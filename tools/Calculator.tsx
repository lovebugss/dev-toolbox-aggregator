import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

// FIX: Create the entire Calculator component, which was missing.
interface CalculatorState {
    display: string;
    previousValue: number | null;
    operator: string | null;
    waitingForOperand: boolean;
}

const Button: React.FC<{
    onClick: (value: string) => void;
    value: string;
    className?: string;
    children?: React.ReactNode;
}> = ({ onClick, value, className = '', children }) => {
    const baseClasses = "text-2xl font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-d-accent transition-colors duration-150";
    const colorClasses = className.includes('bg-') ? '' : 'bg-primary dark:bg-d-primary hover:bg-border-color dark:hover:bg-d-border-color';
    return (
        <button onClick={() => onClick(value)} className={`${baseClasses} ${colorClasses} ${className}`}>
            {children || value}
        </button>
    );
};

const Calculator: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<CalculatorState>('calculator', {
        display: '0',
        previousValue: null,
        operator: null,
        waitingForOperand: false,
    });
    const { display, previousValue, operator, waitingForOperand } = state;

    const performCalculation = {
        '/': (first: number, second: number) => first / second,
        '*': (first: number, second: number) => first * second,
        '+': (first: number, second: number) => first + second,
        '-': (first: number, second: number) => first - second,
        '=': (first: number, second: number) => second,
    };

    const handleButtonClick = (value: string) => {
        if (/\d/.test(value)) {
            if (waitingForOperand) {
                setState(s => ({ ...s, display: value, waitingForOperand: false }));
            } else {
                setState(s => ({ ...s, display: s.display === '0' ? value : s.display + value }));
            }
        } else if (value === '.') {
            if (!display.includes('.')) {
                setState(s => ({ ...s, display: s.display + '.' }));
            }
        } else if (value in performCalculation) {
            const inputValue = parseFloat(display);
            if (previousValue !== null && operator) {
                const result = performCalculation[operator as keyof typeof performCalculation](previousValue, inputValue);
                setState({
                    display: String(result),
                    previousValue: result,
                    operator: value,
                    waitingForOperand: true,
                });
            } else {
                setState({
                    ...state,
                    previousValue: inputValue,
                    operator: value,
                    waitingForOperand: true,
                });
            }
        } else if (value === 'AC') {
            setState({ display: '0', previousValue: null, operator: null, waitingForOperand: false });
        } else if (value === '+/-') {
            setState(s => ({ ...s, display: String(parseFloat(s.display) * -1) }));
        } else if (value === '%') {
            setState(s => ({ ...s, display: String(parseFloat(s.display) / 100) }));
        }
    };

    return (
        <div>
            <ToolHeader
                title={t('tools.calculator.pageTitle')}
                description={t('tools.calculator.pageDescription')}
            />
            <div className="max-w-xs mx-auto bg-secondary dark:bg-d-secondary p-4 rounded-2xl shadow-lg border border-border-color dark:border-d-border-color">
                <div className="bg-primary dark:bg-d-primary text-5xl font-mono text-right p-4 rounded-lg text-text-primary dark:text-d-text-primary mb-4 overflow-x-auto">
                    {display}
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <Button onClick={handleButtonClick} value="AC" className="bg-gray-300 dark:bg-gray-600">AC</Button>
                    <Button onClick={handleButtonClick} value="+/-" className="bg-gray-300 dark:bg-gray-600">+/-</Button>
                    <Button onClick={handleButtonClick} value="%" className="bg-gray-300 dark:bg-gray-600">%</Button>
                    <Button onClick={handleButtonClick} value="/" className="bg-accent dark:bg-d-accent text-white">/</Button>
                    
                    <Button onClick={handleButtonClick} value="7" />
                    <Button onClick={handleButtonClick} value="8" />
                    <Button onClick={handleButtonClick} value="9" />
                    <Button onClick={handleButtonClick} value="*" className="bg-accent dark:bg-d-accent text-white">x</Button>

                    <Button onClick={handleButtonClick} value="4" />
                    <Button onClick={handleButtonClick} value="5" />
                    <Button onClick={handleButtonClick} value="6" />
                    <Button onClick={handleButtonClick} value="-" className="bg-accent dark:bg-d-accent text-white">-</Button>

                    <Button onClick={handleButtonClick} value="1" />
                    <Button onClick={handleButtonClick} value="2" />
                    <Button onClick={handleButtonClick} value="3" />
                    <Button onClick={handleButtonClick} value="+" className="bg-accent dark:bg-d-accent text-white">+</Button>
                    
                    <Button onClick={handleButtonClick} value="0" className="col-span-2" />
                    <Button onClick={handleButtonClick} value="." />
                    <Button onClick={handleButtonClick} value="=" className="bg-accent dark:bg-d-accent text-white">=</Button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
