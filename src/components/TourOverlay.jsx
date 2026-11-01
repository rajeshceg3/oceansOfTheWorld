import React, { useEffect, useRef } from 'react';
import { useTour } from '../contexts/TourContext';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

const TourOverlay = () => {
  const { isTourActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, endTour } = useTour();
  const cardTouch = useRef(null);

  // Arrow keys move between tour steps; Escape ends the tour.
  useEffect(() => {
    if (!isTourActive) return undefined;
    const handleKeys = (e) => {
      if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === 'ArrowRight') nextStep();
      else if (e.key === 'Escape') endTour();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isTourActive, nextStep, prevStep, endTour]);

  if (!isTourActive) return null;

  const handleTouchStart = (e) => {
    cardTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!cardTouch.current) return;
    const dx = e.changedTouches[0].clientX - cardTouch.current.x;
    const dy = e.changedTouches[0].clientY - cardTouch.current.y;
    cardTouch.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 40) return;
    if (dx < 0) nextStep();
    else prevStep();
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Backdrop with spotlight effect could go here, but for now just a blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-all duration-1000"></div>

      {/* Tour Card */}
      <div
        className="relative pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl max-w-sm md:max-w-md w-full mx-4 shadow-2xl transform transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-bottom-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-light tracking-[0.2em] text-white/50 uppercase block mb-2">
              Guided Tour • {currentStepIndex + 1}/{totalSteps}
            </span>
            <h2 className="text-xl md:text-3xl font-thin tracking-widest text-white font-display uppercase">
              {currentStep.title}
            </h2>
          </div>
          <button
            onClick={endTour}
            className="text-white/30 hover:text-white transition-colors p-1"
            aria-label="Close Tour"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm md:text-base font-light text-white/80 leading-relaxed mb-8 font-sans">
          {currentStep.description}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStepIndex ? 'bg-white scale-125' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-4 items-center">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className={`flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:bg-white/10 transition-all ${
                currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
              }`}
              aria-label="Previous Step"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>

            <button
              onClick={nextStep}
              className="flex items-center space-x-2 bg-white text-black px-5 py-2 rounded-full font-medium text-xs tracking-wider hover:bg-white/90 transition-all transform hover:scale-105"
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {!isLastStep && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
