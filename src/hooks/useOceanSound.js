import { useEffect, useRef, useCallback } from 'react';
import { OCEANS } from '../data/oceans';

// "Ultrathink" Audio Engine: High-fidelity procedural ocean synthesis
// Layers:
// 1. Deep (Rumble/Sub) - Stereo Brown Noise with slow panning
// 2. Surface (Swell/Waves) - Stereo Pink Noise with phase-offset LFOs
// 3. Texture (Sparkle/Ice/Bubbles) - High-passed White Noise + Random Envelope / Granular Simulation
// 4. Drone (Tonal Ambience) - Multi-Oscillator Cluster (Base, Detune, Harmonic)
// 5. Binaural (Brainwave Entrainment) - Left/Right Frequency Delta for Alpha/Theta waves

const AUDIO_PROFILES = {
  pacific: {
    baseFreq: 60,
    modRate: 0.1,
    textureMix: 0.15,
    droneFreq: 55, // A1
    harmonic: 1.5, // 5th
    verbDecay: 4,
    binauralDelta: 7.83, // Schumann Resonance (Relaxed Alertness)
    detune: 5, // Cents
  },
  atlantic: {
    baseFreq: 80,
    modRate: 0.25,
    textureMix: 0.35,
    droneFreq: 110, // A2
    harmonic: 1.25, // Major 3rd
    verbDecay: 2.5,
    binauralDelta: 10, // Alpha (Calm focus)
    detune: 8,
  },
  indian: {
    baseFreq: 70,
    modRate: 0.15,
    textureMix: 0.25,
    droneFreq: 146.83, // D3
    harmonic: 1.5,
    verbDecay: 3.5,
    binauralDelta: 6, // Theta (Deep relaxation)
    detune: 6,
  },
  southern: {
    baseFreq: 90,
    modRate: 0.4,
    textureMix: 0.6,
    droneFreq: 220, // A3
    harmonic: 2.0, // Octave
    verbDecay: 5,
    binauralDelta: 4, // Low Theta (Dreamy)
    detune: 12,
  },
  arctic: {
    baseFreq: 100,
    modRate: 0.05,
    textureMix: 0.8,
    droneFreq: 440, // A4
    harmonic: 2.0,
    verbDecay: 6,
    binauralDelta: 14, // Beta (Focus/Alert) - or maybe Low Alpha for calm
    detune: 10,
  }
};

const createImpulseResponse = (ctx, duration, decay) => {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    const amp = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * amp;
    right[i] = (Math.random() * 2 - 1) * amp;
  }
  return impulse;
};

const createNoiseBuffer = (ctx) => {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate); // Stereo buffer
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Pink Noise Approximation for both channels independently for width
  [left, right].forEach(data => {
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168981;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  });
  return buffer;
};

export const useOceanSound = (isSoundOn, currentOceanIndex = 0) => {
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef({});
  const isInitializedRef = useRef(false);

  const updateAudioParams = useCallback((oceanIndex, rampTime = 2) => {
    if (!nodesRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const oceanId = OCEANS[oceanIndex]?.id || 'pacific';
    const profile = AUDIO_PROFILES[oceanId] || AUDIO_PROFILES.pacific;
    const nodes = nodesRef.current;

    // --- Deep Layer ---
    nodes.deepFilter.frequency.setTargetAtTime(profile.baseFreq, now, rampTime);
    nodes.deepLFO.frequency.setTargetAtTime(profile.modRate * 0.5, now, rampTime);
    nodes.deepLFOGain.gain.setTargetAtTime(profile.baseFreq * 0.5, now, rampTime);

    // --- Surface Layer ---
    nodes.surfaceFilter.frequency.setTargetAtTime(profile.baseFreq * 4, now, rampTime);
    nodes.surfaceLFO.frequency.setTargetAtTime(profile.modRate, now, rampTime);
    nodes.surfaceLFOGain.gain.setTargetAtTime(profile.baseFreq * 1.5, now, rampTime);

    // --- Texture Layer ---
    nodes.textureGain.gain.setTargetAtTime(profile.textureMix * 0.3, now, rampTime);
    const textureCutoff = oceanId === 'arctic' || oceanId === 'southern' ? 4000 : 2000;
    nodes.textureFilter.frequency.setTargetAtTime(textureCutoff, now, rampTime);

    // --- Drone Cluster ---
    nodes.droneBase.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.droneDetune1.frequency.setTargetAtTime(profile.droneFreq + (profile.detune/100), now, rampTime); // Slightly sharp
    nodes.droneDetune2.frequency.setTargetAtTime(profile.droneFreq - (profile.detune/100), now, rampTime); // Slightly flat
    nodes.droneHarmonic.frequency.setTargetAtTime(profile.droneFreq * profile.harmonic, now, rampTime);

    // --- Binaural Layer ---
    nodes.binauralLeft.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.binauralRight.frequency.setTargetAtTime(profile.droneFreq + profile.binauralDelta, now, rampTime);

  }, []);

  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        // Master Chain
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Reverb (Convolution) - Stereo
        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, 4, 2.5);
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.4;
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);

        // Dry Bus
        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.7;
        dryGain.connect(masterGain);

        // -------------------------
        // LAYER 1: Deep (Rumble) - Stereo
        // -------------------------
        const deepNoise = ctx.createBufferSource();
        deepNoise.buffer = createNoiseBuffer(ctx);
        deepNoise.loop = true;

        const deepFilter = ctx.createBiquadFilter();
        deepFilter.type = 'lowpass';
        deepFilter.frequency.value = 80;
        deepFilter.Q.value = 1;

        const deepGain = ctx.createGain();
        deepGain.gain.value = 0.8;

        const deepPanner = ctx.createStereoPanner();
        deepPanner.pan.value = 0; // Center but wide due to stereo buffer

        deepNoise.connect(deepFilter);
        deepFilter.connect(deepGain);
        deepGain.connect(deepPanner);
        deepPanner.connect(dryGain);
        deepPanner.connect(convolver);

        // Deep Modulation (LFO)
        const deepLFO = ctx.createOscillator();
        deepLFO.type = 'sine';
        deepLFO.frequency.value = 0.05;
        const deepLFOGain = ctx.createGain();
        deepLFOGain.gain.value = 40;
        deepLFO.connect(deepLFOGain);
        deepLFOGain.connect(deepFilter.frequency);

        // Slow Pan LFO for Deep
        const deepPanLFO = ctx.createOscillator();
        deepPanLFO.type = 'sine';
        deepPanLFO.frequency.value = 0.02; // Very slow drift
        const deepPanGain = ctx.createGain();
        deepPanGain.gain.value = 0.3; // Gentle movement
        deepPanLFO.connect(deepPanGain);
        deepPanGain.connect(deepPanner.pan);

        deepNoise.start();
        deepLFO.start();
        deepPanLFO.start();

        // -------------------------
        // LAYER 2: Surface (Swell) - Stereo
        // -------------------------
        const surfaceNoise = ctx.createBufferSource();
        surfaceNoise.buffer = createNoiseBuffer(ctx);
        surfaceNoise.loop = true;

        const surfaceFilter = ctx.createBiquadFilter();
        surfaceFilter.type = 'bandpass';
        surfaceFilter.frequency.value = 300;
        surfaceFilter.Q.value = 0.5;

        const surfaceGain = ctx.createGain();
        surfaceGain.gain.value = 0.4;

        const surfacePanner = ctx.createStereoPanner();
        surfacePanner.pan.value = 0;

        surfaceNoise.connect(surfaceFilter);
        surfaceFilter.connect(surfaceGain);
        surfaceGain.connect(surfacePanner);
        surfacePanner.connect(dryGain);
        surfacePanner.connect(convolver);

        // Surface Modulation
        const surfaceLFO = ctx.createOscillator();
        surfaceLFO.type = 'sine';
        surfaceLFO.frequency.value = 0.15;
        const surfaceLFOGain = ctx.createGain();
        surfaceLFOGain.gain.value = 150;
        surfaceLFO.connect(surfaceLFOGain);
        surfaceLFOGain.connect(surfaceFilter.frequency);

        // Surface Pan LFO (Faster than Deep)
        const surfacePanLFO = ctx.createOscillator();
        surfacePanLFO.type = 'sine';
        surfacePanLFO.frequency.value = 0.1;
        const surfacePanGain = ctx.createGain();
        surfacePanGain.gain.value = 0.5;
        surfacePanLFO.connect(surfacePanGain);
        surfacePanGain.connect(surfacePanner.pan);

        surfaceNoise.start();
        surfaceLFO.start();
        surfacePanLFO.start();

        // -------------------------
        // LAYER 3: Texture (Sparkle/Bubbles)
        // -------------------------
        const textureNoise = ctx.createBufferSource();
        textureNoise.buffer = createNoiseBuffer(ctx);
        textureNoise.loop = true;

        const textureFilter = ctx.createBiquadFilter();
        textureFilter.type = 'highpass';
        textureFilter.frequency.value = 3000;

        const textureGain = ctx.createGain();
        textureGain.gain.value = 0.1;

        const texturePanner = ctx.createStereoPanner();

        // Random Bubble LFO (simulated by summing two non-harmonic LFOs)
        const bubbleLFO1 = ctx.createOscillator();
        bubbleLFO1.frequency.value = 0.5;
        const bubbleLFO2 = ctx.createOscillator();
        bubbleLFO2.frequency.value = 0.33;
        const bubbleLFOGain = ctx.createGain();
        bubbleLFOGain.gain.value = 0.8; // Pan amount

        bubbleLFO1.connect(bubbleLFOGain);
        bubbleLFO2.connect(bubbleLFOGain);
        bubbleLFOGain.connect(texturePanner.pan);

        textureNoise.connect(textureFilter);
        textureFilter.connect(textureGain);
        textureGain.connect(texturePanner);
        texturePanner.connect(dryGain);
        texturePanner.connect(convolver);

        textureNoise.start();
        bubbleLFO1.start();
        bubbleLFO2.start();

        // -------------------------
        // LAYER 4: Drone Cluster (The Mind)
        // -------------------------
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.15;

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 400;

        // Base
        const droneBase = ctx.createOscillator();
        droneBase.type = 'sine';
        droneBase.frequency.value = 55;

        // Detune 1 (Left-ish)
        const droneDetune1 = ctx.createOscillator();
        droneDetune1.type = 'triangle';
        droneDetune1.frequency.value = 55.05;
        const pannerD1 = ctx.createStereoPanner();
        pannerD1.pan.value = -0.5;

        // Detune 2 (Right-ish)
        const droneDetune2 = ctx.createOscillator();
        droneDetune2.type = 'triangle';
        droneDetune2.frequency.value = 54.95;
        const pannerD2 = ctx.createStereoPanner();
        pannerD2.pan.value = 0.5;

        // Harmonic
        const droneHarmonic = ctx.createOscillator();
        droneHarmonic.type = 'sine';
        droneHarmonic.frequency.value = 110; // Octave

        droneBase.connect(droneGain);

        droneDetune1.connect(pannerD1);
        pannerD1.connect(droneGain);

        droneDetune2.connect(pannerD2);
        pannerD2.connect(droneGain);

        droneHarmonic.connect(droneGain);

        droneGain.connect(droneFilter);
        droneFilter.connect(convolver); // Mostly wet
        droneFilter.connect(dryGain);

        droneBase.start();
        droneDetune1.start();
        droneDetune2.start();
        droneHarmonic.start();

        // -------------------------
        // LAYER 5: Binaural (The Soul)
        // -------------------------
        const binauralGain = ctx.createGain();
        binauralGain.gain.value = 0.08; // Very subtle

        const binauralLeft = ctx.createOscillator();
        binauralLeft.type = 'sine';
        binauralLeft.frequency.value = 200;
        const pannerLeft = ctx.createStereoPanner();
        pannerLeft.pan.value = -1; // Hard Left

        const binauralRight = ctx.createOscillator();
        binauralRight.type = 'sine';
        binauralRight.frequency.value = 207; // 7Hz difference (Theta)
        const pannerRight = ctx.createStereoPanner();
        pannerRight.pan.value = 1; // Hard Right

        binauralLeft.connect(pannerLeft);
        pannerLeft.connect(binauralGain);

        binauralRight.connect(pannerRight);
        pannerRight.connect(binauralGain);

        binauralGain.connect(masterGain); // Direct to master, no reverb to keep phase clean

        binauralLeft.start();
        binauralRight.start();

        // Store nodes
        nodesRef.current = {
            deepFilter, deepLFO, deepLFOGain,
            surfaceFilter, surfaceLFO, surfaceLFOGain,
            textureFilter, textureGain,
            droneBase, droneDetune1, droneDetune2, droneHarmonic,
            binauralLeft, binauralRight,
            convolver
        };

        isInitializedRef.current = true;
        updateAudioParams(currentOceanIndex, 0.1);

    } catch (e) {
        console.error("Audio init failed", e);
    }
  }, [updateAudioParams, currentOceanIndex]);

  useEffect(() => {
    if (isInitializedRef.current && audioContextRef.current) {
        updateAudioParams(currentOceanIndex, 3);
    }
  }, [currentOceanIndex, updateAudioParams]);

  useEffect(() => {
    if (isSoundOn) {
        if (!isInitializedRef.current) {
            initAudio();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        if (masterGainRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            masterGainRef.current.gain.setTargetAtTime(1, audioContextRef.current.currentTime, 2);
        }
    } else {
        if (masterGainRef.current && audioContextRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            masterGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.5);
        }
    }
  }, [isSoundOn, initAudio]);

  useEffect(() => {
      return () => {
          if (audioContextRef.current) {
              audioContextRef.current.close();
              isInitializedRef.current = false;
          }
      }
  }, []);
};
