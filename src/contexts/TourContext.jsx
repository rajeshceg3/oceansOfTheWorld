import React, { createContext, useContext, useState, useMemo } from 'react';

export const TourContext = createContext();

export const TOUR_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Ocean World',
    description: 'A procedural underwater experience generated in real-time.',
    cameraPosition: [0, 0, 15],
    cameraTarget: [0, 0, 0],
    highlight: null
  },
  {
    id: 'environment',
    title: 'The Environment',
    description: 'Each ocean features unique colors, fog density, and lighting conditions.',
    cameraPosition: [0, 5, 20],
    cameraTarget: [0, 0, 0],
    highlight: null
  },
  {
    id: 'creatures',
    title: 'Procedural Life',
    description: 'Observe the marine inhabitants. Their behavior and appearance adapt to the ecosystem.',
    cameraPosition: [0, -2, 8],
    cameraTarget: [0, 0, 0],
    highlight: null
  },
  {
    id: 'navigation',
    title: 'Explore Worlds',
    description: 'Travel between different oceans using the navigation bar below.',
    cameraPosition: [0, 2, 25],
    cameraTarget: [0, -5, 0],
    highlight: 'navigation'
  },
  {
    id: 'audio',
    title: 'Ultrathink Audio',
    description: 'Immerse yourself in the generative soundscape. Toggle audio for the full experience.',
    cameraPosition: [-5, 5, 15],
    cameraTarget: [-5, 5, 0],
    highlight: 'audio'
  }
];

export const TourProvider = ({ children, playTourSound }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStepIndex(0);
    if (playTourSound) playTourSound();
  };

  const endTour = () => {
    setIsTourActive(false);
    setCurrentStepIndex(0);
    if (playTourSound) playTourSound();
  };

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      if (playTourSound) playTourSound();
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      if (playTourSound) playTourSound();
    }
  };

  const currentStep = TOUR_STEPS[currentStepIndex];

  const value = useMemo(() => ({
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    startTour,
    endTour,
    nextStep,
    prevStep
  }), [isTourActive, currentStepIndex, currentStep]);

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
