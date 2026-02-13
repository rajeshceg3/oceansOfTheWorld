import React, { Suspense, useState, useCallback, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress, useContextBridge } from '@react-three/drei';
import UIOverlay from './UIOverlay';
import CustomLoader from './CustomLoader';
import { OCEANS } from '../data/oceans';
import { useOceanSound } from '../hooks/useOceanSound';
import { TourProvider, TourContext } from '../contexts/TourContext';
import TourOverlay from './TourOverlay';

const OceanScene = lazy(() => import('./OceanScene'));

const LoadingListener = ({ onLoadingChange }) => {
  const { active } = useProgress();
  useEffect(() => {
    onLoadingChange(active);
  }, [active, onLoadingChange]);
  return null;
};

const OceanWorldContent = ({
  activeOcean,
  targetOceanIndex,
  handleTransitionComplete,
  handleOceanChange,
  isLoading,
  setIsLoading,
  isSoundOn,
  setIsSoundOn,
  playTourSound
}) => {
  const ContextBridge = useContextBridge(TourContext);

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]} // Optimize for mobile
        gl={{
            antialias: false,
            toneMappingExposure: 0.9,
            powerPreference: "high-performance"
        }}
        aria-label="3D Ocean View"
        role="img"
      >
        <ContextBridge>
            <Suspense fallback={<CustomLoader />}>
                <OceanScene
                    ocean={activeOcean}
                    onTransitionComplete={handleTransitionComplete}
                />
                <LoadingListener onLoadingChange={setIsLoading} />
            </Suspense>
        </ContextBridge>
      </Canvas>
      <UIOverlay
        oceans={OCEANS}
        currentOceanIndex={targetOceanIndex} // Update UI immediately for responsiveness
        onOceanChange={handleOceanChange}
        isLoading={isLoading}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
        playTourSound={playTourSound}
      />
      <TourOverlay />
    </>
  );
};

const OceanWorld = () => {
  const [currentOceanIndex, setCurrentOceanIndex] = useState(0);
  const [targetOceanIndex, setTargetOceanIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(false);

  const { playTourSound } = useOceanSound(isSoundOn, targetOceanIndex);

  const handleOceanChange = (index) => {
    if (index !== currentOceanIndex && !isTransitioning) {
        setTargetOceanIndex(index);
        setIsTransitioning(true);

        // Safety fallback: ensure we don't get stuck in transition state
        // if the GSAP callback fails to fire for some reason.
        // Animation is 1.5s, so 2500ms gives plenty of buffer.
        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentOceanIndex(index);
        }, 2500);
    }
  };

  const handleTransitionComplete = useCallback(() => {
    setCurrentOceanIndex(targetOceanIndex);
    setIsTransitioning(false);
  }, [targetOceanIndex]);

  const activeOcean = OCEANS[targetOceanIndex];

  return (
    <TourProvider playTourSound={playTourSound}>
      <OceanWorldContent
        activeOcean={activeOcean}
        targetOceanIndex={targetOceanIndex}
        handleTransitionComplete={handleTransitionComplete}
        handleOceanChange={handleOceanChange}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
        playTourSound={playTourSound}
      />
    </TourProvider>
  );
};

export default OceanWorld;
