import React, { useState, useEffect } from 'react';

const UIOverlay = ({ oceans, currentOceanIndex, onOceanChange }) => {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsIdle(false);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 3000) { // 3 seconds of inactivity
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  return (
    <>
      {/* Title / Description - Always fades when idle */}
      <div
        className={`absolute bottom-32 left-0 w-full text-center pointer-events-none transition-opacity duration-1000 ${isIdle ? 'opacity-0' : 'opacity-100'}`}
      >
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-white/90 uppercase drop-shadow-lg">
          {oceans[currentOceanIndex].name}
        </h1>
        <p className="text-sm font-light text-white/70 mt-2 tracking-wide font-sans">
          {oceans[currentOceanIndex].description}
        </p>
      </div>

      {/* Navigation - Fades when idle, reappears on interaction */}
      <div
        className={`absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-none transition-all duration-1000 ${isIdle ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <div className="flex space-x-6 bg-black/10 backdrop-blur-sm border border-white/5 p-4 rounded-full pointer-events-auto transition-all duration-500 hover:bg-black/30">
          {oceans.map((ocean, index) => (
            <button
              key={ocean.id}
              onClick={() => onOceanChange(index)}
              className={`
                group relative flex flex-col items-center justify-center w-8 h-8 rounded-full transition-all duration-500
                ${index === currentOceanIndex ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-80'}
              `}
              aria-label={`Switch to ${ocean.name}`}
            >
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-500
                  ${index === currentOceanIndex ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/60 group-hover:bg-white'}
                `}
              />
              {/* Tooltip on hover */}
              <span className="absolute -top-8 text-[10px] tracking-widest text-white/0 group-hover:text-white/80 transition-all duration-300 uppercase whitespace-nowrap">
                {ocean.id}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className={`absolute top-10 right-10 text-right pointer-events-none transition-opacity duration-1000 ${isIdle ? 'opacity-0' : 'opacity-40'}`}>
         <p className="text-xs font-light text-white tracking-widest uppercase">
            Drift &bull; Explore
         </p>
      </div>
    </>
  );
};

export default UIOverlay;
