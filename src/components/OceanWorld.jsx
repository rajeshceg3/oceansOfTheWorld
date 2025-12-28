import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, Html, useProgress } from '@react-three/drei';
import OceanScene from './OceanScene';
import UIOverlay from './UIOverlay';
import { OCEANS } from '../data/oceans';

const CustomLoader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500">
        <div className="w-24 h-[1px] bg-white/20 mb-4 relative overflow-hidden">
            <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
        <div className="text-xs font-light tracking-[0.3em] text-white/60 uppercase">
          Loading {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
};

const OceanWorld = () => {
  const [currentOceanIndex, setCurrentOceanIndex] = useState(0);
  const [targetOceanIndex, setTargetOceanIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOceanChange = (index) => {
    if (index !== currentOceanIndex && !isTransitioning) {
        setTargetOceanIndex(index);
        setIsTransitioning(true);
        // Simple delay for now to simulate transition completion
        setTimeout(() => {
            setCurrentOceanIndex(index);
            setIsTransitioning(false);
        }, 1500); // Increased transition time for smoothness
    }
  };

  const currentOcean = OCEANS[currentOceanIndex];

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]} // Optimize for mobile
        gl={{
            antialias: false, // Post-processing often handles AA better or makes it unnecessary, saving perf
            toneMappingExposure: 1.5,
            powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={<CustomLoader />}>
            <OceanScene
                ocean={currentOcean}
                isTransitioning={isTransitioning}
            />
        </Suspense>
      </Canvas>
      <UIOverlay
        oceans={OCEANS}
        currentOceanIndex={targetOceanIndex} // Update UI immediately for responsiveness
        onOceanChange={handleOceanChange}
      />
      <Loader />
    </>
  );
};

export default OceanWorld;
