import React, { useState, useEffect } from 'react';

const UIOverlay = ({ oceans, currentOceanIndex, onOceanChange }) => {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now()); // Lazy init for purity

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsIdle(false);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 4000) { // 4 seconds of inactivity
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  return (
    <>
      {/* Title / Description - Always fades when idle */}
      <div
        className={`absolute bottom-32 left-0 w-full text-center pointer-events-none transition-all duration-[1500ms] ease-in-out ${isIdle ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}
      >
        <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.3em] text-white/90 uppercase drop-shadow-2xl font-display">
          {oceans[currentOceanIndex].name}
        </h1>
        <div className="w-16 h-[1px] bg-white/30 mx-auto my-4"></div>
        <p className="text-sm md:text-base font-light text-white/80 tracking-widest font-sans max-w-md mx-auto">
          {oceans[currentOceanIndex].description}
        </p>
      </div>

      {/* Navigation - Fades when idle, reappears on interaction */}
      <div
        className={`absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-none transition-all duration-[1500ms] ease-out ${isIdle ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}
      >
        <div className="flex space-x-8 bg-black/10 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full pointer-events-auto transition-all duration-500 hover:bg-black/20 hover:border-white/20 shadow-2xl">
          {oceans.map((ocean, index) => (
            <button
              key={ocean.id}
              onClick={() => onOceanChange(index)}
              className={`
                group relative flex flex-col items-center justify-center w-4 h-4 transition-all duration-500 outline-none
                ${index === currentOceanIndex ? 'scale-125 opacity-100' : 'opacity-40 hover:opacity-100'}
              `}
              aria-label={`Switch to ${ocean.name}`}
            >
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-500
                  ${index === currentOceanIndex ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,1)] w-3 h-3' : 'bg-white/60 group-hover:bg-white'}
                `}
              />
              {/* Tooltip on hover */}
              <span className="absolute -top-10 text-[10px] tracking-widest text-white/90 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0 uppercase whitespace-nowrap bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                {ocean.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subtle Corner Info */}
      <div className={`absolute top-8 right-8 text-right pointer-events-none transition-all duration-[2000ms] ${isIdle ? 'opacity-0 -translate-y-4' : 'opacity-50 translate-y-0'}`}>
         <p className="text-[10px] font-light text-white tracking-[0.3em] uppercase opacity-70">
            Interactive Experience
         </p>
      </div>

      {/* Sound Toggle (Placeholder) */}
       <div className={`absolute top-8 left-8 text-left pointer-events-none transition-all duration-[2000ms] ${isIdle ? 'opacity-0 -translate-y-4' : 'opacity-30 translate-y-0'}`}>
         <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-white animate-pulse"></div>
            <div className="w-1 h-6 bg-white animate-pulse delay-75"></div>
            <div className="w-1 h-3 bg-white animate-pulse delay-150"></div>
         </div>
      </div>
    </>
  );
};

export default UIOverlay;
