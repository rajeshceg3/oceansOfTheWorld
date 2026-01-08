import React, { useState, useEffect, useRef } from 'react';
import { useOceanSound } from '../hooks/useOceanSound';

const UIOverlay = ({ oceans, currentOceanIndex, onOceanChange }) => {
  const [isIdle, setIsIdle] = useState(false);
  // Lazy init ref using a function to avoid Date.now() in render
  // Although useRef(initialValue) executes initialValue, we can pass null and init in effect or use lazy pattern if strict.
  // Actually, useRef(Date.now()) calls Date.now() during render.
  // The linter is correct.
  // Correct pattern: useRef(null) and init in effect or lazily in event handler.
  const lastActivityRef = useRef(null);
  const [isSoundOn, setIsSoundOn] = useState(false); // State for sound toggle

  useOceanSound(isSoundOn);

  useEffect(() => {
    // Init on mount if null
    if (lastActivityRef.current === null) {
      lastActivityRef.current = Date.now();
    }

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    // Optimization: we could throttle this, but React's state bail-out and ref update are fast enough.
    // The main fix is ensuring this effect runs only once.
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const interval = setInterval(() => {
      if (lastActivityRef.current && Date.now() - lastActivityRef.current > 8000) { // 8 seconds of inactivity
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
  }, []); // Empty dependency array = stable listeners

  return (
    <>
      {/* Gradient for contrast */}
      <div className={`absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none transition-opacity duration-[1500ms] ${isIdle ? 'opacity-0' : 'opacity-100'}`} />

      {/* Title / Description - Always fades when idle */}
      <div
        className={`absolute bottom-32 left-0 w-full text-center pointer-events-none transition-all duration-[1500ms] motion-reduce:transition-none ease-in-out ${isIdle ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}
        aria-hidden={isIdle}
      >
        <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.3em] text-white/95 uppercase drop-shadow-2xl font-display">
          {oceans[currentOceanIndex].name}
        </h1>
        <div className="w-16 h-[1px] bg-white/40 mx-auto my-4 shadow-sm"></div>
        <p className="text-sm md:text-base font-light text-white/90 tracking-widest font-sans max-w-md mx-auto drop-shadow-md">
          {oceans[currentOceanIndex].description}
        </p>
      </div>

      {/* Navigation - Fades when idle, reappears on interaction */}
      <div
        className={`absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-none transition-all duration-[1500ms] motion-reduce:transition-none ease-out ${isIdle ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}
        aria-hidden={isIdle}
      >
        <div className={`flex space-x-8 bg-black/10 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full pointer-events-auto transition-all duration-500 hover:bg-black/20 hover:border-white/20 shadow-2xl ${isIdle ? 'pointer-events-none' : ''}`}>
          {oceans.map((ocean, index) => (
            <button
              key={ocean.id}
              onClick={() => onOceanChange(index)}
              disabled={isIdle}
              className={`
                group relative flex flex-col items-center justify-center w-4 h-4 transition-all duration-500 outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full
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
              <span className="absolute -top-10 text-[10px] tracking-widest text-white/90 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0 uppercase whitespace-nowrap bg-black/20 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                {ocean.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subtle Corner Info */}
      <div className={`absolute top-8 right-8 text-right pointer-events-none transition-all duration-[2000ms] ${isIdle ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
         <p className="text-[10px] font-light text-white tracking-[0.3em] uppercase opacity-90">
            Interactive Experience
         </p>
      </div>

      {/* Sound Toggle */}
       <button
         onClick={() => setIsSoundOn(!isSoundOn)}
         disabled={isIdle}
         className={`absolute top-8 left-8 text-left pointer-events-auto cursor-pointer transition-all duration-[2000ms] outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1 ${isIdle ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-80 translate-y-0'}`}
         aria-label={isSoundOn ? "Mute sound" : "Enable sound"}
         aria-pressed={isSoundOn}
         title={isSoundOn ? "Mute" : "Unmute"}
         aria-hidden={isIdle}
       >
         <div className="flex items-center space-x-2" aria-hidden="true">
            {isSoundOn ? (
                 <>
                    <div className="w-1 h-4 bg-white animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-6 bg-white animate-[pulse_1.5s_ease-in-out_infinite] delay-75"></div>
                    <div className="w-1 h-3 bg-white animate-[pulse_0.8s_ease-in-out_infinite] delay-150"></div>
                 </>
            ) : (
                <>
                    <div className="w-1 h-4 bg-white/30"></div>
                    <div className="w-1 h-6 bg-white/30"></div>
                    <div className="w-1 h-3 bg-white/30"></div>
                    <div className="absolute w-full h-[1px] bg-white top-1/2 -rotate-45"></div>
                </>
            )}
         </div>
      </button>
    </>
  );
};

export default UIOverlay;
