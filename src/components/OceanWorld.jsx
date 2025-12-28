import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader, Html } from '@react-three/drei';
import OceanScene from './OceanScene';
import UIOverlay from './UIOverlay';
import { OCEANS } from '../data/oceans';

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
        }, 1000);
    }
  };

  const currentOcean = OCEANS[currentOceanIndex];

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]} // Optimize for mobile
      >
        <Suspense fallback={<Html center>Loading...</Html>}>
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
