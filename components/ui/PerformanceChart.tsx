import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChartDataPoint {
  x: number;
  y: number;
  isCorrect?: boolean;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  yAxisLabel: string;
  xAxisLabel: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, yAxisLabel, xAxisLabel }) => {
  const { t, i18n } = useTranslation();
  
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 bg-primary dark:bg-d-primary rounded-lg text-text-secondary dark:text-d-text-secondary">
        {t('common.chart.noData')}
      </div>
    );
  }

  const width = 500;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xMin = data.length > 1 ? Math.min(...data.map(d => d.x)) : 0;
  const xMax = data.length > 1 ? Math.max(...data.map(d => d.x)) : 1;
  const yMin = 0;
  const yMax = data.length > 0 ? Math.max(...data.map(d => d.y)) * 1.1 : 1;

  const getX = (x: number) => {
    if (xMax === xMin) return margin.left + chartWidth / 2;
    return margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  };
  const getY = (y: number) => {
    if (yMax === yMin) return margin.top + chartHeight / 2;
    return margin.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  };
  
  const segments: ChartDataPoint[][] = [];
  let currentSegment: ChartDataPoint[] = [];
  data.forEach((d) => {
    if (d.isCorrect !== false) {
      currentSegment.push(d);
    } else {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [];
    }
  });
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  const yAxisTicks = Array.from({ length: 5 }, (_, i) => {
      const value = yMin + (yMax - yMin) * (i / 4);
      return { value: Math.round(value), y: getY(value) };
  });

  const isChinese = i18n.language.startsWith('zh');
  const fontFamily = isChinese ? 'sans-serif' : "'Inter', sans-serif";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ fontFamily }}>
      {/* Y-axis grid lines and labels */}
      {yAxisTicks.map(tick => (
        <g key={tick.value} className="text-xs text-text-secondary dark:text-d-text-secondary fill-current">
          <line x1={margin.left} x2={width - margin.right} y1={tick.y} y2={tick.y} className="stroke-current opacity-20" strokeWidth="1"/>
          <text x={margin.left - 8} y={tick.y + 4} textAnchor="end">{tick.value}</text>
        </g>
      ))}

      {/* X-axis labels */}
      <g className="text-xs text-text-secondary dark:text-d-text-secondary fill-current">
          {data.map(d => (
              <text key={d.x} x={getX(d.x)} y={height - margin.bottom + 15} textAnchor="middle">{d.x}</text>
          ))}
      </g>
      
      {/* Axis labels */}
      <text transform={`translate(${margin.left / 3}, ${height / 2}) rotate(-90)`} textAnchor="middle" className="text-sm font-medium text-text-secondary dark:text-d-text-secondary fill-current">{yAxisLabel}</text>
      <text x={width / 2} y={height - 5} textAnchor="middle" className="text-sm font-medium text-text-secondary dark:text-d-text-secondary fill-current">{xAxisLabel}</text>
      
      {/* Lines */}
      {segments.map((segment, i) => (
        <polyline key={i} fill="none" strokeWidth="2" points={segment.map(d => `${getX(d.x)},${getY(d.y)}`).join(' ')} className="stroke-accent dark:stroke-d-accent"/>
      ))}
      
      {/* Data points */}
      {data.map((d, i) => (
        <g key={i}>
            <circle cx={getX(d.x)} cy={getY(d.y)} r="4" className={d.isCorrect !== false ? "fill-accent dark:fill-d-accent" : "fill-red-500"}>
                <title>
                  {d.isCorrect !== false
                    ? `${xAxisLabel} ${d.x}: ${Math.round(d.y)}ms`
                    : `${xAxisLabel} ${d.x}: ${Math.round(d.y)}ms (${t('tools.selectiveReactionTest.statistics.incorrect')})`}
                </title>
            </circle>
        </g>
      ))}
    </svg>
  );
};
