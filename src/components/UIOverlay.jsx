import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Compass } from 'lucide-react';
import { useTour } from '../contexts/TourContext';

const UIOverlay = ({ oceans, currentOceanIndex, onOceanChange, isLoading, isSoundOn, setIsSoundOn, playTourSound }) => {
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef(null);
  const { startTour, isTourActive, currentStep } = useTour();

  useEffect(() => {
    if (lastActivityRef.current === null) {
      lastActivityRef.current = Date.now();
    }

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const interval = setInterval(() => {
      if (lastActivityRef.current && Date.now() - lastActivityRef.current > 8000) {
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
  }, []);

  const shouldHide = (isIdle || isLoading) && !isTourActive;
  const isNavHighlighted = isTourActive && currentStep?.highlight === 'navigation';
  const isAudioHighlighted = isTourActive && currentStep?.highlight === 'audio';

  return (
    <>
      {/* Cinematic Gradient Overlay */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${shouldHide ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Main Title & Description */}
      <div
        className={`absolute bottom-24 md:bottom-32 left-0 w-full text-center pointer-events-none transition-all duration-[1500ms] motion-reduce:transition-none ease-in-out ${shouldHide ? 'opacity-0 translate-y-8 blur-md' : 'opacity-100 translate-y-0 blur-0'}`}
        aria-hidden={shouldHide}
      >
        <h1 className="text-4xl md:text-7xl font-thin tracking-[0.25em] text-white/95 uppercase drop-shadow-2xl font-display mb-4 md:mb-6">
          {oceans[currentOceanIndex].name}
        </h1>

        <div className="flex items-center justify-center space-x-4 mb-4 md:mb-6 opacity-60">
            <div className="w-8 md:w-12 h-[1px] bg-white"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-8 md:w-12 h-[1px] bg-white"></div>
        </div>

        <p className="text-xs md:text-sm font-light text-white/80 tracking-[0.15em] font-sans max-w-[280px] md:max-w-xl mx-auto drop-shadow-lg leading-relaxed">
          {oceans[currentOceanIndex].description}
        </p>
      </div>

      {/* Navigation Controls */}
      <div
        className={`absolute bottom-6 md:bottom-12 left-0 w-full flex justify-center z-10 pointer-events-none transition-all duration-[1500ms] ease-out ${shouldHide ? 'opacity-0 translate-y-12' : 'opacity-100 translate-y-0'}`}
        aria-hidden={shouldHide}
      >
        <div className={`
            flex items-center space-x-6 md:space-x-8
            bg-white/5 backdrop-blur-xl border border-white/10
            px-6 py-3 md:px-10 md:py-4 rounded-full
            pointer-events-auto transition-all duration-500
            hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
            shadow-2xl ${shouldHide ? 'pointer-events-none' : ''}
            ${isNavHighlighted ? 'ring-2 ring-white shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-white/20 scale-105' : ''}
        `}>
          {oceans.map((ocean, index) => (
            <button
              key={ocean.id}
              onClick={() => onOceanChange(index)}
              disabled={shouldHide}
              className={`
                group relative flex flex-col items-center justify-center w-8 h-8 md:w-6 md:h-6
                transition-all duration-500 outline-none rounded-full
                focus-visible:ring-2 focus-visible:ring-white/50
              `}
              aria-label={`Switch to ${ocean.name}`}
            >
              {/* Active Indicator & Hover Glow */}
              <div
                className={`
                  absolute w-2 h-2 rounded-full transition-all duration-700 ease-out
                  ${index === currentOceanIndex
                    ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,1)] w-3 h-3 md:w-2.5 md:h-2.5 opacity-100'
                    : 'bg-white/40 group-hover:bg-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-60'
                  }
                `}
              />

              {/* Tooltip - Only visible on hover */}
              <span className={`
                absolute -top-12 md:-top-14
                text-[10px] md:text-xs font-light tracking-[0.2em] uppercase
                text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/5
                transition-all duration-300 transform origin-bottom
                opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
                whitespace-nowrap pointer-events-none shadow-xl
              `}>
                {ocean.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Right Info & Tour Button */}
      <div className={`absolute top-6 right-6 md:top-10 md:right-10 flex flex-col items-end space-y-4 pointer-events-none transition-all duration-[2000ms] ${shouldHide ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
         <p className="text-[9px] md:text-[10px] font-thin text-white/70 tracking-[0.3em] uppercase">
            Immersion Mode
         </p>

         <button
            onClick={startTour}
            disabled={isTourActive || shouldHide}
            className={`
              flex items-center space-x-2 pointer-events-auto
              text-[10px] md:text-xs font-light tracking-[0.2em] uppercase text-white/80 hover:text-white
              bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2
              transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/50
              ${isTourActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          >
            <Compass size={14} />
            <span>Guided Tour</span>
          </button>
      </div>

      {/* Sound Control */}
       <button
         onClick={() => setIsSoundOn(!isSoundOn)}
         disabled={shouldHide}
         className={`
            absolute top-6 left-6 md:top-10 md:left-10
            text-white/80 hover:text-white
            pointer-events-auto cursor-pointer
            transition-all duration-[2000ms]
            outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full p-2
            hover:bg-white/5 backdrop-blur-sm
            ${shouldHide ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
            ${isAudioHighlighted ? 'ring-2 ring-white shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-white/20 scale-110' : ''}
         `}
         aria-label={isSoundOn ? "Mute sound" : "Enable sound"}
         aria-pressed={isSoundOn}
         title={isSoundOn ? "Mute" : "Unmute"}
         aria-hidden={shouldHide}
       >
         {isSoundOn ? (
            <Volume2 size={24} strokeWidth={1} className="drop-shadow-md" />
         ) : (
            <VolumeX size={24} strokeWidth={1} className="opacity-70 drop-shadow-md" />
         )}
      </button>
    </>
  );
};

export default UIOverlay;
