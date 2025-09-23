import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface CrontabState {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  command: string;
}

const CronPartSelector: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-md text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const CrontabGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { state, setState } = useToolState<CrontabState>('crontab-generator', {
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    command: '/usr/bin/example',
  });
  const { minute, hour, dayOfMonth, month, dayOfWeek, command } = state;
  const addToast = useToasts();

  const cronExpression = useMemo(() => {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const fullCronJob = `${cronExpression} ${command}`;

  const generateOptions = (max: number, offset = 0, labelMap?: Record<string, string>) => [
    { value: '*', label: t('tools.crontabGenerator.every') },
    ...Array.from({ length: max }, (_, i) => {
      const val = i + offset;
      const label = labelMap ? labelMap[val] : String(val).padStart(2, '0');
      return { value: String(val), label: String(label) };
    }),
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCronJob).then(() => {
      addToast(t('common.toast.copiedSuccess'), 'success');
    }, () => {
      addToast(t('common.toast.copiedFailed'), 'error');
    });
  };

  const monthLabels = {
    1: t('tools.crontabGenerator.jan'), 2: t('tools.crontabGenerator.feb'), 3: t('tools.crontabGenerator.mar'),
    4: t('tools.crontabGenerator.apr'), 5: t('tools.crontabGenerator.may'), 6: t('tools.crontabGenerator.jun'),
    7: t('tools.crontabGenerator.jul'), 8: t('tools.crontabGenerator.aug'), 9: t('tools.crontabGenerator.sep'),
    10: t('tools.crontabGenerator.oct'), 11: t('tools.crontabGenerator.nov'), 12: t('tools.crontabGenerator.dec'),
  };
  
  const dayOfWeekLabels = {
    0: t('tools.crontabGenerator.sun'), 1: t('tools.crontabGenerator.mon'), 2: t('tools.crontabGenerator.tue'),
    3: t('tools.crontabGenerator.wed'), 4: t('tools.crontabGenerator.thu'), 5: t('tools.crontabGenerator.fri'),
    6: t('tools.crontabGenerator.sat'),
  };
  
  const createSetter = (field: keyof CrontabState) => (value: string) => setState(s => ({ ...s, [field]: value }));

  return (
    <div>
      <ToolHeader 
        title={t('tools.crontabGenerator.pageTitle')}
        description={t('tools.crontabGenerator.pageDescription')}
      />

      <div className="p-6 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <CronPartSelector label={t('tools.crontabGenerator.minute')} options={generateOptions(60)} value={minute} onChange={createSetter('minute')} />
          <CronPartSelector label={t('tools.crontabGenerator.hour')} options={generateOptions(24)} value={hour} onChange={createSetter('hour')} />
          <CronPartSelector label={t('tools.crontabGenerator.dayOfMonth')} options={generateOptions(31, 1)} value={dayOfMonth} onChange={createSetter('dayOfMonth')} />
          <CronPartSelector label={t('tools.crontabGenerator.month')} options={generateOptions(12, 1, monthLabels)} value={month} onChange={createSetter('month')} />
          <CronPartSelector label={t('tools.crontabGenerator.dayOfWeek')} options={generateOptions(7, 0, dayOfWeekLabels)} value={dayOfWeek} onChange={createSetter('dayOfWeek')} />
        </div>
        <div className="mt-6">
            <label htmlFor="command" className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-2">{t('tools.crontabGenerator.command')}</label>
            <input 
                id="command"
                type="text"
                value={command}
                onChange={e => createSetter('command')(e.target.value)}
                className="w-full p-2 font-mono bg-primary dark:bg-d-primary border border-border-color dark:border-d-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
            />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.crontabGenerator.result')}</h3>
        <div className="relative p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-lg text-accent dark:text-d-accent">
          {fullCronJob}
          <button
            onClick={handleCopy}
            className="absolute top-1/2 right-3 -translate-y-1/2 px-3 py-1 bg-accent text-white dark:bg-d-accent dark:text-d-primary font-semibold text-sm rounded-md hover:opacity-90 transition-colors"
            aria-label={t('common.tooltips.copyCrontab')}
          >
            {t('common.copy')}
          </button>
        </div>
      </div>

       <div className="mt-8 p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-sm text-text-secondary dark:text-d-text-secondary">
          <h4 className="font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.crontabGenerator.explanationTitle')}</h4>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-color dark:border-d-border-color">
                <th className="p-2">Field</th>
                <th className="p-2">Allowed Values</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Minute</td><td className="p-2 font-mono">0-59</td><td className="p-2">Minute of the hour</td></tr>
              <tr><td className="p-2">Hour</td><td className="p-2 font-mono">0-23</td><td className="p-2">Hour of the day</td></tr>
              <tr><td className="p-2">Day of Month</td><td className="p-2 font-mono">1-31</td><td className="p-2">Day of the month</td></tr>
              <tr><td className="p-2">Month</td><td className="p-2 font-mono">1-12</td><td className="p-2">Month of the year</td></tr>
              <tr><td className="p-2">Day of Week</td><td className="p-2 font-mono">0-7</td><td className="p-2">Day of the week (0 and 7 are Sunday)</td></tr>
            </tbody>
          </table>
          <p className="mt-4">{t('tools.crontabGenerator.specialChars')}: <strong>*</strong> (any), <strong>,</strong> (list separator), <strong>-</strong> (range), <strong>/</strong> (step)</p>
        </div>

    </div>
  );
};

export default CrontabGenerator;