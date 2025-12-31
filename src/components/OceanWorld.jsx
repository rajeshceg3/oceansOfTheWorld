import React, { Suspense, useState, useCallback } from 'react';
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
    }
  };

  const handleTransitionComplete = useCallback(() => {
    setCurrentOceanIndex(targetOceanIndex);
    setIsTransitioning(false);
  }, [targetOceanIndex]);

  // We pass targetOceanIndex to OceanScene so it can animate TO it.
  // Wait, the previous logic was: set target, transition starts, timeout, set current.
  // OceanScene receives `ocean` prop.
  // If we pass `OCEANS[targetOceanIndex]` to OceanScene immediately, it will render the new creatures immediately?
  // We want the environment (colors, fog) to transition, and maybe the creatures too?
  // If we switch `ocean` prop, the components inside `OceanScene` (like Creatures) will re-render with new types.
  // If we want a smooth transition, we might need to handle creature unmounting/mounting gracefully.
  // However, the current requirement is to fix the architectural flaw of using setTimeout.
  // If we pass the NEW ocean config to OceanScene, GSAP will animate the environment colors to it.
  // The creatures will switch immediately.
  // To fix this perfectly, we'd need two scenes or complex transition logic.
  // BUT, for this task, ensuring the state sync relies on the animation completion is the goal.
  // So we pass `OCEANS[targetOceanIndex]` to OceanScene. It animates colors.
  // When animation completes, `onTransitionComplete` fires.
  // `isTransitioning` is mostly for UI blocking.

  // Actually, if we update `currentOceanIndex` only after transition, then `OCEANS[currentOceanIndex]` is the OLD ocean until transition ends.
  // That means OceanScene receives OLD ocean until transition ends?
  // No, that would mean it doesn't animate until transition ends.
  // It must receive the NEW ocean to animate TO it.

  // So `OceanScene` should receive `OCEANS[targetOceanIndex]`.
  // And `currentOceanIndex` (used for UI text?) should probably update either immediately or after.
  // If UI updates immediately (which it does via `targetOceanIndex` in `UIOverlay`), that's fine.
  // `currentOceanIndex` in this component seems to be "the confirmed ocean".

  const activeOcean = OCEANS[targetOceanIndex];

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
        aria-label="3D Ocean View"
        role="img"
      >
        <Suspense fallback={<CustomLoader />}>
            <OceanScene
                ocean={activeOcean}
                onTransitionComplete={handleTransitionComplete}
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
