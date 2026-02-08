import { useEffect, useRef, useCallback } from 'react';
import { OCEANS } from '../data/oceans';

// "Ultrathink" Audio Engine: High-fidelity procedural ocean synthesis
// Layers:
// 1. Deep (Rumble/Sub) - Brown Noise
// 2. Surface (Swell/Waves) - Pink Noise
// 3. Texture (Sparkle/Ice/Bubbles) - High-passed White Noise + Random Envelope
// 4. Drone (Tonal Ambience) - Dual Oscillators

const AUDIO_PROFILES = {
  pacific: {
    baseFreq: 60, // Deep
    modRate: 0.1, // Slow
    textureMix: 0.1, // Low texture
    droneFreq: 55, // A1
    harmonic: 1.5, // 5th
    verbDecay: 4, // Large space
  },
  atlantic: {
    baseFreq: 80, // Mid-low
    modRate: 0.25, // Active
    textureMix: 0.3, // Medium texture
    droneFreq: 110, // A2
    harmonic: 1.25, // Major 3rd
    verbDecay: 2.5, // Medium space
  },
  indian: {
    baseFreq: 70, // Warm
    modRate: 0.15, // Gentle
    textureMix: 0.2,
    droneFreq: 146.83, // D3 (Warmth)
    harmonic: 1.5,
    verbDecay: 3.5,
  },
  southern: {
    baseFreq: 90, // Cold/Windy
    modRate: 0.4, // Choppy
    textureMix: 0.5, // Icy texture
    droneFreq: 220, // A3
    harmonic: 2.0, // Octave (Hollow)
    verbDecay: 5, // Vast/Echoey
  },
  arctic: {
    baseFreq: 100, // Thin/Crisp
    modRate: 0.05, // Still
    textureMix: 0.7, // Lots of ice crackle
    droneFreq: 440, // A4
    harmonic: 2.0, // Octave
    verbDecay: 6, // Frozen vastness
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
    // Exponential decay
    const amp = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * amp;
    right[i] = (Math.random() * 2 - 1) * amp;
  }
  return impulse;
};

const createNoiseBuffer = (ctx) => {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink Noise Approximation
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
    data[i] *= 0.11; // Compensate gain
    b6 = white * 0.115926;
  }
  return buffer;
};

export const useOceanSound = (isSoundOn, currentOceanIndex = 0) => {
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef({});
  const isInitializedRef = useRef(false);

  // Helper to update parameters based on current ocean
  const updateAudioParams = useCallback((oceanIndex, rampTime = 2) => {
    if (!nodesRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const oceanId = OCEANS[oceanIndex]?.id || 'pacific';
    const profile = AUDIO_PROFILES[oceanId] || AUDIO_PROFILES.pacific;
    const nodes = nodesRef.current;

    // Deep Layer
    nodes.deepFilter.frequency.setTargetAtTime(profile.baseFreq, now, rampTime);
    nodes.deepLFO.frequency.setTargetAtTime(profile.modRate * 0.5, now, rampTime);
    nodes.deepLFOGain.gain.setTargetAtTime(profile.baseFreq * 0.5, now, rampTime);

    // Surface Layer
    nodes.surfaceFilter.frequency.setTargetAtTime(profile.baseFreq * 4, now, rampTime);
    nodes.surfaceLFO.frequency.setTargetAtTime(profile.modRate, now, rampTime);
    nodes.surfaceLFOGain.gain.setTargetAtTime(profile.baseFreq * 1.5, now, rampTime);

    // Texture Layer
    nodes.textureGain.gain.setTargetAtTime(profile.textureMix * 0.3, now, rampTime);
    // Adjust highpass cutoff based on ocean 'temperature'
    const textureCutoff = oceanId === 'arctic' || oceanId === 'southern' ? 4000 : 2000;
    nodes.textureFilter.frequency.setTargetAtTime(textureCutoff, now, rampTime);

    // Drone Layer
    nodes.drone1.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.drone2.frequency.setTargetAtTime(profile.droneFreq * profile.harmonic, now, rampTime);
  }, []);

  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Reverb (Convolution)
        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, 4, 2.5); // Default decay
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.4; // Wet mix
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);

        // Dry Bus
        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.7;
        dryGain.connect(masterGain);

        // -------------------------
        // LAYER 1: Deep (Rumble)
        // -------------------------
        const deepNoise = ctx.createBufferSource();
        deepNoise.buffer = createNoiseBuffer(ctx); // Reuse pink noise but filter it heavily
        deepNoise.loop = true;

        const deepFilter = ctx.createBiquadFilter();
        deepFilter.type = 'lowpass';
        deepFilter.frequency.value = 80;
        deepFilter.Q.value = 1;

        const deepGain = ctx.createGain();
        deepGain.gain.value = 0.8;

        deepNoise.connect(deepFilter);
        deepFilter.connect(deepGain);
        deepGain.connect(dryGain);
        deepGain.connect(convolver); // Send to reverb

        // Deep Modulation (LFO)
        const deepLFO = ctx.createOscillator();
        deepLFO.type = 'sine';
        deepLFO.frequency.value = 0.05;
        const deepLFOGain = ctx.createGain();
        deepLFOGain.gain.value = 40; // +/- 40Hz
        deepLFO.connect(deepLFOGain);
        deepLFOGain.connect(deepFilter.frequency);

        deepNoise.start();
        deepLFO.start();

        // -------------------------
        // LAYER 2: Surface (Swell)
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

        surfaceNoise.connect(surfaceFilter);
        surfaceFilter.connect(surfaceGain);
        surfaceGain.connect(dryGain);
        surfaceGain.connect(convolver);

        // Surface Modulation
        const surfaceLFO = ctx.createOscillator();
        surfaceLFO.type = 'sine';
        surfaceLFO.frequency.value = 0.15;
        const surfaceLFOGain = ctx.createGain();
        surfaceLFOGain.gain.value = 150;
        surfaceLFO.connect(surfaceLFOGain);
        surfaceLFOGain.connect(surfaceFilter.frequency);

        surfaceNoise.start();
        surfaceLFO.start();

        // -------------------------
        // LAYER 3: Texture (Sparkle)
        // -------------------------
        const textureNoise = ctx.createBufferSource();
        textureNoise.buffer = createNoiseBuffer(ctx); // Actually white noise is better for sparkle but pink is okay high-passed
        textureNoise.loop = true;

        const textureFilter = ctx.createBiquadFilter();
        textureFilter.type = 'highpass';
        textureFilter.frequency.value = 3000;

        const textureGain = ctx.createGain();
        textureGain.gain.value = 0.1;

        textureNoise.connect(textureFilter);
        textureFilter.connect(textureGain);
        textureGain.connect(dryGain); // Mostly dry for clarity
        textureGain.connect(convolver);

        textureNoise.start();

        // -------------------------
        // LAYER 4: Drone (Tonal)
        // -------------------------
        const drone1 = ctx.createOscillator();
        drone1.type = 'sine';
        drone1.frequency.value = 55;

        const drone2 = ctx.createOscillator();
        drone2.type = 'triangle';
        drone2.frequency.value = 55 * 1.5;

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 400;

        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.15; // Subtle

        drone1.connect(droneGain);
        drone2.connect(droneGain);
        droneGain.connect(droneFilter);
        droneFilter.connect(convolver); // 100% wet (mostly)
        droneFilter.connect(dryGain);

        drone1.start();
        drone2.start();

        // Store nodes
        nodesRef.current = {
            deepFilter, deepLFO, deepLFOGain,
            surfaceFilter, surfaceLFO, surfaceLFOGain,
            textureFilter, textureGain,
            drone1, drone2, droneGain,
            convolver
        };

        isInitializedRef.current = true;

        // Apply initial params immediately
        updateAudioParams(currentOceanIndex, 0.1); // Fast ramp for init

    } catch (e) {
        console.error("Audio init failed", e);
    }
  }, [updateAudioParams, currentOceanIndex]);

  // Handle Updates
  useEffect(() => {
    if (isInitializedRef.current && audioContextRef.current) {
        updateAudioParams(currentOceanIndex, 3); // 3s slow transition
    }
  }, [currentOceanIndex, updateAudioParams]);


  // Handle On/Off
  useEffect(() => {
    if (isSoundOn) {
        if (!isInitializedRef.current) {
            initAudio();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Fade In
        if (masterGainRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            masterGainRef.current.gain.setTargetAtTime(1, audioContextRef.current.currentTime, 2);
        }
    } else {
        // Fade Out
        if (masterGainRef.current && audioContextRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            masterGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.5);
        }
    }
  }, [isSoundOn, initAudio]);

  // Cleanup
  useEffect(() => {
      return () => {
          if (audioContextRef.current) {
              audioContextRef.current.close();
              isInitializedRef.current = false;
          }
      }
  }, []);
};
