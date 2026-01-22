import React from 'react';
import { Html, useProgress } from '@react-three/drei';

const CustomLoader = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700 ease-out w-[300px]">
        {/* Minimal Progress Bar Container */}
        <div className="w-full h-[1px] bg-white/10 mb-6 relative overflow-hidden rounded-full">
            {/* Animated Bar */}
            <div
                className="absolute top-0 left-0 h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center space-y-2">
            <h2 className="text-xs font-light tracking-[0.4em] text-white/80 uppercase font-display animate-pulse">
                Loading Experience
            </h2>
            <p className="text-[10px] font-thin tracking-[0.2em] text-white/40 font-sans tabular-nums">
                {Math.round(progress)}%
            </p>
        </div>
      </div>
    </Html>
  );
};

export default CustomLoader;
