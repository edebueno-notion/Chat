import React from 'react';

interface VisualizerProps {
  volume: number; // 0 to 1
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  const bars = 5;
  
  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {Array.from({ length: bars }).map((_, i) => {
        // Create a wave effect, center bars taller
        const baseHeight = 20 + (i % 2) * 10; 
        const activeHeight = Math.min(48, baseHeight + (volume * 40 * (Math.random() + 0.5)));
        const height = isActive ? activeHeight : 4;
        
        return (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-75 ease-in-out ${isActive ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-600'}`}
            style={{
              height: `${height}px`,
            }}
          />
        );
      })}
    </div>
  );
};

export default Visualizer;