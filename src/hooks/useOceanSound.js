import { useEffect, useRef, useCallback } from 'react';
import { OCEANS } from '../data/oceans';

// "Ultrathink" Audio Engine: High-fidelity procedural ocean synthesis
// Layers:
// 1. Deep (Rumble/Sub) - Stereo Brown Noise with slow panning
// 2. Surface (Swell/Waves) - Stereo Pink Noise with phase-offset LFOs
// 3. Texture (Sparkle/Ice/Bubbles) - High-passed White Noise + Random Envelope / Granular Simulation
// 4. Drone (Tonal Ambience) - Multi-Oscillator Cluster (Base, Detune, Harmonic)
// 5. Binaural (Brainwave Entrainment) - Left/Right Frequency Delta for Alpha/Theta waves
// 6. Bio (Life) - Procedural Marine Creatures (Whales, Clicks, Chirps)
// 7. Swell (Movement) - Very slow amplitude modulation (breathing)

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
    windFreq: 400,
    windGain: 0.08,
    swellRate: 0.05, // Very slow breath (20s)
    swellDepth: 0.1, // Subtle
    bioType: 'whale',
    bioDensity: 0.15, // Occasional
    bioFreqBase: 150,
    grainDensity: 0.8,
    grainType: 'bubble',
    grainFreqBase: 400,
    grainMix: 0.3
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
    windFreq: 700,
    windGain: 0.15,
    swellRate: 0.1, // Faster (10s)
    swellDepth: 0.15, // More movement
    bioType: 'click',
    bioDensity: 0.4, // Active
    bioFreqBase: 2000,
    grainDensity: 0.5,
    grainType: 'shimmer',
    grainFreqBase: 800,
    grainMix: 0.25
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
    windFreq: 500,
    windGain: 0.1,
    swellRate: 0.08,
    swellDepth: 0.12,
    bioType: 'chirp',
    bioDensity: 0.25,
    bioFreqBase: 800,
    grainDensity: 0.4,
    grainType: 'droplet',
    grainFreqBase: 600,
    grainMix: 0.25
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
    windFreq: 1000,
    windGain: 0.25,
    swellRate: 0.15,
    swellDepth: 0.2, // Stormy
    bioType: 'whale',
    bioDensity: 0.3,
    bioFreqBase: 100,
    grainDensity: 0.3,
    grainType: 'ice',
    grainFreqBase: 2000,
    grainMix: 0.4
  },
  arctic: {
    baseFreq: 100,
    modRate: 0.05,
    textureMix: 0.8,
    droneFreq: 440, // A4
    harmonic: 2.0,
    verbDecay: 6,
    binauralDelta: 14, // Beta (Focus/Alert)
    detune: 10,
    windFreq: 1500,
    windGain: 0.35,
    swellRate: 0.03, // Glacial pace
    swellDepth: 0.05,
    bioType: 'ice-crack',
    bioDensity: 0.5,
    bioFreqBase: 300,
    grainDensity: 0.6,
    grainType: 'ice',
    grainFreqBase: 3000,
    grainMix: 0.5
  }
};

const createBrownNoiseBuffer = (ctx) => {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  [left, right].forEach(data => {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }
  });
  return buffer;
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
    // Decorrelate channels for wider stereo
    left[i] = (Math.random() * 2 - 1) * amp;
    right[i] = (Math.random() * 2 - 1) * amp * 0.8; // Slightly quieter right for imbalance/width

    // Add some early reflections logic (very simple delay simulation)
    if (i > 1000 && i < 2000) {
        left[i] += (Math.random() * 2 - 1) * 0.5 * amp;
    }
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

const triggerGrain = (ctx, destination, params, time) => {
    const { type, freqBase, mix } = params;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    // Randomize
    const freq = freqBase * (0.9 + Math.random() * 0.2);
    const pan = Math.random() * 1.5 - 0.75; // Spread
    const duration = 0.05 + Math.random() * 0.15;

    panner.pan.value = pan;

    if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (type === 'ice') {
        osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * 1.5, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.8, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);
    } else if (type === 'droplet') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 2, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration * 0.5);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.4);
    } else { // shimmer or default
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.2, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.5, time + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(destination);

    osc.start(time);
    osc.stop(time + duration + 0.2);
};

const triggerBioSound = (ctx, destination, params, time) => {
    const { bioType, bioFreqBase, bioDensity } = params;
    // Density acts as probability check caller side, but here we can use it for intensity
    const mix = 0.2; // Base volume for bio sounds

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const pan = Math.random() * 1.8 - 0.9; // Wide spread

    panner.pan.value = pan;

    if (bioType === 'whale') {
        const duration = 2 + Math.random() * 3;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bioFreqBase, time);
        // Slow sweep up or down
        const endFreq = bioFreqBase * (0.8 + Math.random() * 0.4);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 1.5, time + duration * 0.2);
        gain.gain.linearRampToValueAtTime(mix, time + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.5);

    } else if (bioType === 'click') {
        // Clicks are often short bursts of noise or high freq sine
        const duration = 0.01;
        const clicks = Math.floor(Math.random() * 5) + 3; // Burst of 3-8 clicks

        for(let i=0; i<clicks; i++) {
             const t = time + i * (0.05 + Math.random() * 0.05);
             const oscClick = ctx.createOscillator();
             const gainClick = ctx.createGain();
             oscClick.frequency.value = bioFreqBase + Math.random() * 1000;
             oscClick.type = 'sine';

             gainClick.gain.setValueAtTime(mix, t);
             gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.01);

             oscClick.connect(gainClick);
             gainClick.connect(panner); // Shared panner
             oscClick.start(t);
             oscClick.stop(t + 0.05);
        }
        // No main osc
        return;

    } else if (bioType === 'chirp') {
        const duration = 0.1 + Math.random() * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bioFreqBase, time);
        osc.frequency.linearRampToValueAtTime(bioFreqBase * 2, time + duration);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.1);

    } else if (bioType === 'ice-crack') {
        // High passed noise burst
        const duration = 0.3 + Math.random() * 0.4;
        const bufferSrc = ctx.createBufferSource();
        bufferSrc.buffer = createNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        gain.gain.setValueAtTime(mix * 1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        bufferSrc.connect(filter);
        filter.connect(gain);
        // gain connected to panner below

        bufferSrc.start(time);
        bufferSrc.stop(time + duration + 0.1);

        // Skip osc connect
        gain.connect(panner);
        panner.connect(destination);
        return;
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
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

    // --- Wind Layer ---
    nodes.windFilter.frequency.setTargetAtTime(profile.windFreq, now, rampTime);
    nodes.windGain.gain.setTargetAtTime(profile.windGain, now, rampTime);

    // --- Drone Cluster ---
    nodes.droneBase.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.droneDetune1.frequency.setTargetAtTime(profile.droneFreq + (profile.detune/100), now, rampTime);
    nodes.droneDetune2.frequency.setTargetAtTime(profile.droneFreq - (profile.detune/100), now, rampTime);
    nodes.droneHarmonic.frequency.setTargetAtTime(profile.droneFreq * profile.harmonic, now, rampTime);

    // --- Binaural Layer ---
    nodes.binauralLeft.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.binauralRight.frequency.setTargetAtTime(profile.droneFreq + profile.binauralDelta, now, rampTime);

    // --- Swell (Breathing) ---
    if (nodes.swellLFO && nodes.swellGain) {
        nodes.swellLFO.frequency.setTargetAtTime(profile.swellRate, now, rampTime);
        nodes.swellGain.gain.setTargetAtTime(profile.swellDepth, now, rampTime);
    }

    // --- Granular & Bio Engine Params ---
    if (nodes.granularParams) {
        nodes.granularParams.density = profile.grainDensity;
        nodes.granularParams.type = profile.grainType;
        nodes.granularParams.freqBase = profile.grainFreqBase;
        nodes.granularParams.mix = profile.grainMix;

        nodes.granularParams.bioType = profile.bioType;
        nodes.granularParams.bioDensity = profile.bioDensity;
        nodes.granularParams.bioFreqBase = profile.bioFreqBase;
    }

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

        // Dynamics Compressor (The Glue)
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressor.connect(masterGain);

        // Reverb (Convolution) - Stereo
        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, 4, 2.5);
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.4;
        convolver.connect(reverbGain);
        reverbGain.connect(compressor);

        // Dry Bus
        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.7;
        dryGain.connect(compressor);

        // -------------------------
        // LAYER 1: Deep (Rumble) - Stereo
        // -------------------------
        const deepNoise = ctx.createBufferSource();
        deepNoise.buffer = createBrownNoiseBuffer(ctx);
        deepNoise.loop = true;

        const deepFilter = ctx.createBiquadFilter();
        deepFilter.type = 'lowpass';
        deepFilter.frequency.value = 80;
        deepFilter.Q.value = 1;

        const deepGain = ctx.createGain();
        deepGain.gain.value = 0.8;

        const deepPanner = ctx.createStereoPanner();
        deepPanner.pan.value = 0;

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
        deepPanLFO.frequency.value = 0.02;
        const deepPanGain = ctx.createGain();
        deepPanGain.gain.value = 0.3;
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

        // Surface Pan LFO
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

        // Random Bubble LFO
        const bubbleLFO1 = ctx.createOscillator();
        bubbleLFO1.frequency.value = 0.5;
        const bubbleLFO2 = ctx.createOscillator();
        bubbleLFO2.frequency.value = 0.33;
        const bubbleLFOGain = ctx.createGain();
        bubbleLFOGain.gain.value = 0.8;

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
        // LAYER 3.5: Wind (High-passed Noise)
        // -------------------------
        const windNoise = ctx.createBufferSource();
        windNoise.buffer = createNoiseBuffer(ctx);
        windNoise.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'highpass';
        windFilter.frequency.value = 800;

        const windGain = ctx.createGain();
        windGain.gain.value = 0.1;

        const windPanner = ctx.createStereoPanner();

        // Wind Gust LFO
        const windLFO = ctx.createOscillator();
        windLFO.frequency.value = 0.1;
        const windLFOGain = ctx.createGain();
        windLFOGain.gain.value = 0.05;

        windLFO.connect(windLFOGain);
        windLFOGain.connect(windGain.gain);

        // Wind Pan LFO
        const windPanLFO = ctx.createOscillator();
        windPanLFO.frequency.value = 0.2;
        const windPanGain = ctx.createGain();
        windPanGain.gain.value = 0.6;

        windPanLFO.connect(windPanGain);
        windPanGain.connect(windPanner.pan);

        windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(windPanner);
        windPanner.connect(dryGain);
        windPanner.connect(convolver);

        windNoise.start();
        windLFO.start();
        windPanLFO.start();

        // -------------------------
        // LAYER 4: Drone Cluster (The Mind)
        // -------------------------
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.15;

        // Breathing LFO
        const droneLFO = ctx.createOscillator();
        droneLFO.type = 'sine';
        droneLFO.frequency.value = 0.08;
        const droneLFOGain = ctx.createGain();
        droneLFOGain.gain.value = 0.03;

        droneLFO.connect(droneLFOGain);
        droneLFOGain.connect(droneGain.gain);
        droneLFO.start();

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 400;

        // Base
        const droneBase = ctx.createOscillator();
        droneBase.type = 'sine';
        droneBase.frequency.value = 55;

        // Detune 1
        const droneDetune1 = ctx.createOscillator();
        droneDetune1.type = 'triangle';
        droneDetune1.frequency.value = 55.05;
        const pannerD1 = ctx.createStereoPanner();
        pannerD1.pan.value = -0.5;

        // Detune 2
        const droneDetune2 = ctx.createOscillator();
        droneDetune2.type = 'triangle';
        droneDetune2.frequency.value = 54.95;
        const pannerD2 = ctx.createStereoPanner();
        pannerD2.pan.value = 0.5;

        // Harmonic
        const droneHarmonic = ctx.createOscillator();
        droneHarmonic.type = 'sine';
        droneHarmonic.frequency.value = 110;

        droneBase.connect(droneGain);

        droneDetune1.connect(pannerD1);
        pannerD1.connect(droneGain);

        droneDetune2.connect(pannerD2);
        pannerD2.connect(droneGain);

        droneHarmonic.connect(droneGain);

        droneGain.connect(droneFilter);
        droneFilter.connect(convolver);
        droneFilter.connect(dryGain);

        droneBase.start();
        droneDetune1.start();
        droneDetune2.start();
        droneHarmonic.start();

        // -------------------------
        // LAYER 5: Binaural (The Soul)
        // -------------------------
        const binauralGain = ctx.createGain();
        binauralGain.gain.value = 0.08;

        const binauralLeft = ctx.createOscillator();
        binauralLeft.type = 'sine';
        binauralLeft.frequency.value = 200;
        const pannerLeft = ctx.createStereoPanner();
        pannerLeft.pan.value = -1;

        const binauralRight = ctx.createOscillator();
        binauralRight.type = 'sine';
        binauralRight.frequency.value = 207;
        const pannerRight = ctx.createStereoPanner();
        pannerRight.pan.value = 1;

        binauralLeft.connect(pannerLeft);
        pannerLeft.connect(binauralGain);

        binauralRight.connect(pannerRight);
        pannerRight.connect(binauralGain);

        binauralGain.connect(masterGain);

        binauralLeft.start();
        binauralRight.start();

        // -------------------------
        // LAYER 7: Swell (Breathing)
        // -------------------------
        const swellLFO = ctx.createOscillator();
        swellLFO.type = 'sine';
        swellLFO.frequency.value = 0.05;

        const swellGain = ctx.createGain();
        swellGain.gain.value = 0.1;

        swellLFO.connect(swellGain);
        // Modulate volume of surface and wind
        swellGain.connect(surfaceGain.gain);
        swellGain.connect(windGain.gain);

        swellLFO.start();

        // -------------------------
        // Granular & Bio Engine
        // -------------------------
        const granularGain = ctx.createGain();
        granularGain.gain.value = 1;
        granularGain.connect(convolver);
        granularGain.connect(dryGain);

        const bioGain = ctx.createGain();
        bioGain.gain.value = 1;
        bioGain.connect(convolver);
        bioGain.connect(dryGain);

        const granularParams = {
            density: 0,
            type: 'bubble',
            freqBase: 400,
            mix: 0.1,
            bioType: 'whale',
            bioDensity: 0.1,
            bioFreqBase: 150
        };

        // Scheduler Loop
        const lookahead = 100; // ms
        const scheduleAheadTime = 0.2; // s
        let nextGrainTime = ctx.currentTime;
        let nextBioTime = ctx.currentTime + 2; // Start bio later

        const scheduler = () => {
            const currentTime = ctx.currentTime;

            // Fix time drift
            if (nextGrainTime < currentTime) {
                nextGrainTime = currentTime;
            }
            if (nextBioTime < currentTime) {
                nextBioTime = currentTime;
            }

            // Schedule grains
            while (nextGrainTime < currentTime + scheduleAheadTime) {
                const minInterval = 0.05;
                const maxInterval = 0.5;
                const interval = minInterval + (1 - granularParams.density) * (maxInterval - minInterval);
                const randomJitter = Math.random() * 0.1;

                triggerGrain(ctx, granularGain, granularParams, nextGrainTime);
                nextGrainTime += interval + randomJitter;
            }

            // Schedule Bio Sounds
            if (nextBioTime < currentTime + scheduleAheadTime) {
                // Bio density 0.1 (low) to 0.8 (high)
                // Interval: Low density -> 15-30s, High density -> 5-10s
                const minBioInterval = 5;
                const maxBioInterval = 30;
                const bioInterval = maxBioInterval - (granularParams.bioDensity * (maxBioInterval - minBioInterval));
                const jitter = Math.random() * 5;

                triggerBioSound(ctx, bioGain, granularParams, nextBioTime);
                nextBioTime += bioInterval + jitter;
            }
        };

        const granularInterval = setInterval(scheduler, lookahead);

        // Store nodes
        nodesRef.current = {
            deepFilter, deepLFO, deepLFOGain,
            surfaceFilter, surfaceLFO, surfaceLFOGain,
            textureFilter, textureGain,
            windFilter, windGain,
            droneBase, droneDetune1, droneDetune2, droneHarmonic,
            binauralLeft, binauralRight,
            swellLFO, swellGain,
            convolver,
            granularInterval, granularParams
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
          if (nodesRef.current && nodesRef.current.granularInterval) {
              clearInterval(nodesRef.current.granularInterval);
          }
          if (audioContextRef.current) {
              audioContextRef.current.close();
              isInitializedRef.current = false;
          }
      }
  }, []);
};
