import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toolCategories, ToolId, Tool } from '../types';

const gradients = [
  'from-indigo-500 to-blue-500', 
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-red-500 to-rose-500',
];

const ToolCard: React.FC<{ tool: Tool; onClick: () => void; gradient: string }> = ({ tool, onClick, gradient }) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card) return;
    
    // 使用 getBoundingClientRect 获取精确位置
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 批量更新自定义属性
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    // 离开时将效果移出视野
    card.style.setProperty('--mx', `-100%`);
    card.style.setProperty('--my', `-100%`);
  };
  
  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card group relative p-6 text-left rounded-[2.5rem] overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-accent"
    >
      {/* 装饰性背景光 - 移除冗余过渡层，改为更轻量的渐变装饰 */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] pointer-events-none transition-opacity duration-700 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className={`w-14 h-14 mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          <tool.icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary group-hover:text-accent dark:group-hover:text-indigo-300 transition-colors text-readable">
            {t(tool.nameKey)}
        </h3>
        <p className="mt-2 text-sm text-text-secondary dark:text-slate-400 line-clamp-2 font-medium">
            {t(tool.descriptionKey)}
        </p>
      </div>
      
      {/* 静态装饰光环 */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-blue-400/5 dark:bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-blue-400/10 dark:group-hover:bg-indigo-500/20 transition-all duration-500"></div>
    </button>
  );
};

const AdvantageCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => {
    return (
        <div className="glass-panel p-8 rounded-3xl text-center hover:scale-105 transition-all duration-300 border border-white/10">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-text-primary dark:text-d-text-primary mb-3 text-readable">{title}</h3>
            <p className="text-sm text-text-secondary dark:text-d-text-secondary leading-relaxed font-medium">{description}</p>
        </div>
    );
};

interface WelcomeProps {
    setActiveTool: (tool: ToolId) => void;
    recentTools: ToolId[];
    totalTools: number;
    usageCount: number;
}

const Welcome: React.FC<WelcomeProps> = ({ setActiveTool, recentTools, totalTools, usageCount }) => {
  const { t } = useTranslation();
  const allTools = useMemo(() => toolCategories.flatMap(c => c.tools), []);

  const recentToolsData = useMemo(() => {
      return recentTools
          .map(toolId => allTools.find(tool => tool.id === toolId))
          .filter((tool): tool is Tool => !!tool)
          .slice(0, 3);
  }, [recentTools, allTools]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-screen-xl mx-auto px-4">
      <div className="text-center mb-24 relative">
        <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-text-primary dark:text-d-text-primary drop-shadow-xl text-readable">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400 dark:from-indigo-400 dark:to-purple-300">Dev Toolbox.</span>
        </h1>
        <p className="mt-6 text-xl max-w-2xl mx-auto text-text-secondary dark:text-slate-400 font-semibold leading-relaxed">
          {t('welcome.subtitle')}
        </p>
      </div>

      <div className="space-y-24 pb-20">
        {recentToolsData.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-grow bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700"></div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-text-secondary dark:text-slate-500">{t('sidebar.categories.recent')}</h2>
                <div className="h-px flex-grow bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentToolsData.map(tool => (
                <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} gradient={gradients[4]} />
              ))}
            </div>
          </section>
        )}

        {toolCategories.map((category, categoryIndex) => (
          <section key={category.nameKey}>
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-text-primary dark:text-d-text-primary flex items-center gap-3 text-readable">
                    <span className="w-2 h-8 bg-accent dark:bg-indigo-500 rounded-full shadow-lg shadow-accent/20"></span>
                    {t(category.nameKey)}
                </h2>
                <span className="text-xs font-bold text-accent dark:text-indigo-400 bg-accent/10 dark:bg-indigo-400/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-accent/20 dark:border-indigo-400/20">{category.tools.length} Tools</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => setActiveTool(tool.id)}
                  gradient={gradients[categoryIndex % gradients.length]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Welcome;