import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toolCategories, ToolId, Tool } from '../types';

const gradients = [
  'from-grad-1-start to-grad-1-end', 
  'from-grad-2-start to-grad-2-end',
  'from-grad-3-start to-grad-3-end',
  'from-grad-4-start to-grad-4-end',
  'from-grad-5-start to-grad-5-end',
  'from-grad-6-start to-grad-6-end',
  'from-grad-7-start to-grad-7-end',
];

const ToolCard: React.FC<{ tool: Tool; onClick: () => void; gradient: string }> = ({ tool, onClick, gradient }) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = -((y - height / 2) / (height / 2)) * 10;
    const rotateY = ((x - width / 2) / (width / 2)) * 10;

    const bgPosX = (x / width) * 100;
    const bgPosY = (y / height) * 100;
    
    card.style.setProperty('--rotateX', `${rotateX}deg`);
    card.style.setProperty('--rotateY', `${rotateY}deg`);
    card.style.setProperty('--bg-pos-x', `${bgPosX}%`);
    card.style.setProperty('--bg-pos-y', `${bgPosY}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rotateX', '0deg');
    card.style.setProperty('--rotateY', '0deg');
  };

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="holographic-card group relative bg-secondary dark:bg-d-secondary rounded-2xl text-left overflow-hidden border border-border-color dark:border-d-border-color focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-accent dark:focus-visible:ring-d-accent w-full h-full"
    >
      <div className="holographic-content p-6 flex flex-col h-full">
        <div className={`w-16 h-16 mb-5 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} card-icon shadow-lg`}>
          <tool.icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary card-title">{t(tool.nameKey)}</h3>
        <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary flex-grow card-description">{t(tool.descriptionKey)}</p>
      </div>
      <div className="holographic-shine" />
    </button>
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
          .slice(0, 6);
  }, [recentTools, allTools]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent to-violet-500 dark:from-d-accent dark:to-violet-400 pb-2">{t('welcome.title')}</h1>
        <p className="mt-4 text-lg max-w-3xl mx-auto text-text-secondary dark:text-d-text-secondary">
          {t('welcome.subtitle')}
        </p>

        {/** <div className="mt-8 flex justify-center items-center gap-8">
            <div className="text-center">
                <p className="text-4xl font-bold text-text-primary dark:text-d-text-primary">{totalTools}</p>
                <p className="text-sm text-text-secondary dark:text-d-text-secondary">{t('welcome.totalTools')}</p>
            </div>
            <div className="w-px h-12 bg-border-color dark:bg-d-border-color"></div>
            <div className="text-center">
                <p className="text-4xl font-bold text-text-primary dark:text-d-text-primary">{usageCount.toLocaleString()}</p>
                <p className="text-sm text-text-secondary dark:text-d-text-secondary">{t('welcome.servedCount')}</p>
            </div>
        </div> **/}
      </div>

      <div className="space-y-16">
        {recentToolsData.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-text-primary dark:text-d-text-primary mb-8 border-b-2 border-border-color dark:border-d-border-color pb-4">{t('sidebar.categories.recent')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {recentToolsData.map(tool => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onClick={() => setActiveTool(tool.id)} 
                  gradient={gradients[4]} // Use a consistent gradient for recents
                />
              ))}
            </div>
          </section>
        )}

        {toolCategories.map((category, categoryIndex) => (
          <section key={category.nameKey}>
            <h2 className="text-3xl font-bold text-text-primary dark:text-d-text-primary mb-8 border-b-2 border-border-color dark:border-d-border-color pb-4">{t(category.nameKey)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }

  /* Holographic Card Styles */
  .holographic-card {
    transform-style: preserve-3d;
    will-change: transform;
    transform: perspective(1000px) rotateX(var(--rotateX, 0)) rotateY(var(--rotateY, 0));
    transition: transform 0.4s ease-out;
  }
  .holographic-card:hover {
    transition: transform 0.05s linear; /* Faster tracking when hovering */
  }

  .holographic-content {
    position: relative;
    z-index: 1;
    transform: translateZ(20px); /* Lift content off the card */
  }

  .holographic-shine {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 1rem; /* same as card */
    z-index: 0;
    
    background: radial-gradient(
      circle at var(--bg-pos-x, 50%) var(--bg-pos-y, 50%),
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0) 25%
    ),
    conic-gradient(
      from 0deg at var(--bg-pos-x, 50%) var(--bg-pos-y, 50%),
      hsl(0, 100%, 75%),
      hsl(60, 100%, 75%),
      hsl(120, 100%, 75%),
      hsl(180, 100%, 75%),
      hsl(240, 100%, 75%),
      hsl(300, 100%, 75%),
      hsl(0, 100%, 75%)
    );
    
    background-blend-mode: screen;
    opacity: 0;
    transition: opacity 0.3s ease-out;
    will-change: background, opacity;
  }

  .holographic-card:hover .holographic-shine {
    opacity: 0.1;
  }
  
  .dark .holographic-card:hover .holographic-shine {
    opacity: 0.2;
  }

  .holographic-card .card-icon {
    transform: translateZ(50px);
  }
  .holographic-card .card-title {
    transform: translateZ(40px);
  }
  .holographic-card .card-description {
    transform: translateZ(30px);
  }
`;
document.head.appendChild(style);