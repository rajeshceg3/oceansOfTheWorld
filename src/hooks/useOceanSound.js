import { useEffect, useRef, useCallback } from 'react';
import { OCEANS } from '../data/oceans';

// "Ultrathink" Audio Engine: High-fidelity procedural ocean synthesis
// Layers:
// 0. Sub Bass (Physical Presence) - Clean Sine for chest resonance
// 1. Deep (Rumble/Sub) - Stereo Brown Noise with slow panning
// 2. Surface (Swell/Waves) - Stereo Pink Noise with phase-offset LFOs
// 3. Texture (Sparkle/Ice/Bubbles) - High-passed White Noise + Random Envelope / Granular Simulation
// 4. Drone (Tonal Ambience) - Multi-Oscillator Cluster + Formant Filters (Vowel Tones) + Sub-Harmonic + Abyssal AM
// 5. Binaural (Brainwave Entrainment) - Left/Right Frequency Delta for Alpha/Theta waves
// 6. Bio (Life) - Procedural Marine Creatures (Whales, Clicks, Chirps, Schools, Rays, Jellyfish) - Complex FM Synthesis
// 7. Swell (Movement) - Very slow amplitude modulation (breathing)
// 8. Saturation (Warmth) - Analog tube simulation via WaveShaping
// 9. Melody (Thought) - Generative musical phrases based on ocean mood (Pentatonic/Modal scales)
// 10. Spectral Shimmer - High-frequency texture layer

const BINAURAL_FREQS = {
  delta: 2.5,  // 0.5-4Hz (Deep Sleep, Healing)
  theta: 6.0,  // 4-8Hz (Deep Relaxation, Creativity)
  alpha: 10.0, // 8-12Hz (Relaxed Focus, Flow)
  beta: 20.0,  // 12-30Hz (Alert, Active)
  gamma: 40.0  // 30-100Hz (Peak Focus, Insight)
};

const SCALES = {
  pacific: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C Major Pentatonic (Calm, Bright)
  atlantic: [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // D Dorian (Mysterious, flowing)
  indian: [349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25], // F Lydian (Dreamy, floating)
  southern: [440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99], // A Aeolian (Sad, cold)
  arctic: [329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33], // E Phrygian (Dark, tense)
  hirajoshi: [261.63, 293.66, 311.13, 392.00, 415.30, 523.25], // C Hirajoshi (Eastern, contemplative)
  wholetone: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16], // C Whole Tone (Dreamy, unresolved)
};

const AUDIO_PROFILES = {
  pacific: {
    baseFreq: 60,
    modRate: 0.1,
    textureMix: 0.15,
    droneFreq: 55, // A1
    harmonic: 1.5, // 5th
    subBassFreq: 40,
    verbDecay: 5,
    binauralDelta: BINAURAL_FREQS.alpha, // Relaxed Focus
    detune: 5, // Cents
    windFreq: 400,
    windGain: 0.08,
    currentsMix: 0.05, // Gentle flow
    currentsSpeed: 0.1,
    swellRate: 0.05, // Very slow breath (20s)
    swellDepth: 0.1, // Subtle
    bioTypes: ['whale', 'jellyfish', 'dolphin', 'bubble-stream', 'biolum', 'crustacean'],
    bioDensity: 0.15, // Occasional
    bioFreqBase: 150,
    grainDensity: 0.8,
    grainTypes: ['bubble', 'droplet', 'foam'],
    grainFreqBase: 400,
    grainMix: 0.3,
    saturationAmount: 20, // Subtle warmth
    formantMix: 0.2, // Mild vowel character
    shimmerFreq: 4000,
    shimmerMix: 0.1, // Enhanced sparkle
    sparkleDensity: 0.2,
    resonatorMix: 0.1, // Singing resonance
    breathMix: 0.1,
    melodyScale: 'hirajoshi', // Japanese Pentatonic (Calm)
    melodyRate: 0.2, // Sparse
    melodyMix: 0.15,
    droneSubMix: 0.2, // Added depth
  },
  atlantic: {
    baseFreq: 80,
    modRate: 0.25,
    textureMix: 0.35,
    droneFreq: 110, // A2
    harmonic: 1.25, // Major 3rd
    subBassFreq: 45,
    verbDecay: 3.5,
    binauralDelta: BINAURAL_FREQS.beta, // Active focus
    detune: 8,
    windFreq: 700,
    windGain: 0.15,
    currentsMix: 0.1,
    currentsSpeed: 0.2,
    swellRate: 0.1, // Faster (10s)
    swellDepth: 0.15, // More movement
    bioTypes: ['school', 'ray', 'dolphin', 'bubble-stream', 'biolum', 'crustacean'],
    bioDensity: 0.4, // Active
    bioFreqBase: 2000,
    grainDensity: 0.5,
    grainTypes: ['shimmer', 'droplet', 'sand'],
    grainFreqBase: 800,
    grainMix: 0.25,
    saturationAmount: 35, // Crisper
    formantMix: 0.1,
    shimmerFreq: 5000,
    shimmerMix: 0.08,
    sparkleDensity: 0.3,
    resonatorMix: 0.15,
    breathMix: 0.1,
    melodyScale: 'atlantic',
    melodyRate: 0.3,
    melodyMix: 0.2,
    droneSubMix: 0.3,
  },
  indian: {
    baseFreq: 70,
    modRate: 0.15,
    textureMix: 0.25,
    droneFreq: 146.83, // D3
    harmonic: 1.5,
    subBassFreq: 38,
    verbDecay: 4.5,
    binauralDelta: BINAURAL_FREQS.theta, // Deep relaxation
    detune: 6,
    windFreq: 500,
    windGain: 0.1,
    currentsMix: 0.08,
    currentsSpeed: 0.15,
    swellRate: 0.08,
    swellDepth: 0.12,
    bioTypes: ['jellyfish', 'school', 'growl', 'chorus', 'deep-call', 'crustacean'],
    bioDensity: 0.6,
    bioFreqBase: 600,
    grainDensity: 0.4,
    grainTypes: ['droplet', 'sparkle'],
    grainFreqBase: 600,
    grainMix: 0.25,
    saturationAmount: 50, // Rich/Hot
    formantMix: 0.4, // Strong vowel resonance (Om-like)
    shimmerFreq: 3000,
    shimmerMix: 0.15, // Boosted shimmer
    sparkleDensity: 0.4,
    resonatorMix: 0.25, // Very resonant/dreamy
    breathMix: 0.1,
    melodyScale: 'indian',
    melodyRate: 0.25,
    melodyMix: 0.25,
    droneSubMix: 0.4,
  },
  southern: {
    baseFreq: 90,
    modRate: 0.4,
    textureMix: 0.6,
    droneFreq: 220, // A3
    harmonic: 2.0, // Octave
    subBassFreq: 50,
    verbDecay: 6,
    binauralDelta: BINAURAL_FREQS.delta, // Deep sleep/dream
    detune: 12,
    windFreq: 1000,
    windGain: 0.25,
    currentsMix: 0.15, // Strong currents
    currentsSpeed: 0.25,
    swellRate: 0.15,
    swellDepth: 0.2, // Stormy
    bioTypes: ['whale', 'ray', 'growl', 'chorus', 'deep-call', 'biolum', 'leviathan'],
    bioDensity: 0.35,
    bioFreqBase: 100,
    grainDensity: 0.3,
    grainTypes: ['ice', 'shimmer'],
    grainFreqBase: 2000,
    grainMix: 0.4,
    saturationAmount: 15, // Cold/Clean
    formantMix: 0.15,
    shimmerFreq: 6000,
    shimmerMix: 0.1,
    sparkleDensity: 0.5,
    resonatorMix: 0.1,
    breathMix: 0.1,
    melodyScale: 'wholetone', // Dreamy/Unresolved
    melodyRate: 0.15,
    melodyMix: 0.1,
    droneSubMix: 0.5,
  },
  arctic: {
    baseFreq: 100,
    modRate: 0.05,
    textureMix: 0.8,
    droneFreq: 440, // A4
    harmonic: 2.0,
    subBassFreq: 35,
    verbDecay: 8,
    binauralDelta: BINAURAL_FREQS.gamma, // Insight/Clarity
    detune: 10,
    windFreq: 1500,
    windGain: 0.35,
    currentsMix: 0.12,
    currentsSpeed: 0.05,
    swellRate: 0.03, // Glacial pace
    swellDepth: 0.05,
    bioTypes: ['whale', 'ice-crack', 'school', 'biolum', 'leviathan', 'crustacean'],
    bioDensity: 0.5,
    bioFreqBase: 300,
    grainDensity: 0.6,
    grainTypes: ['ice', 'sparkle'],
    grainFreqBase: 3000,
    grainMix: 0.5,
    saturationAmount: 40, // Harsh/Biting
    formantMix: 0.05,
    shimmerFreq: 7000,
    shimmerMix: 0.3, // Icy Sparkle
    sparkleDensity: 0.6,
    resonatorMix: 0.2, // Singing ice
    breathMix: 0.1,
    melodyScale: 'arctic',
    melodyRate: 0.1, // Sparse
    melodyMix: 0.2,
    droneSubMix: 0.2,
  }
};

const createSaturationCurve = (amount) => {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    // Sigmoid curve for soft clipping
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
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

const createImpulseResponse = (ctx, duration, decay, brightness = 1.0) => {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    // Ultra-smooth tail curve (Exponential decay)
    const amp = Math.pow(1 - n, decay);

    // Decorrelated Stereo Noise
    let whiteL = Math.random() * 2 - 1;
    let whiteR = Math.random() * 2 - 1;

    // Brightness Control (Low-pass filter approximation via moving average)
    if (i > 0 && brightness < 1.0) {
        whiteL = (whiteL + left[i-1] * (1 - brightness)) / (2 - brightness);
        whiteR = (whiteR + right[i-1] * (1 - brightness)) / (2 - brightness);
    }

    left[i] = whiteL * amp;
    right[i] = whiteR * amp;

    // Early Reflections (Dense cluster, simulating cave/canyon walls)
    if (i < 4000) {
       const reflectionAmp = ((4000 - i) / 4000) * 0.8;
       left[i] += (Math.random() * 2 - 1) * reflectionAmp;
       right[i] += (Math.random() * 2 - 1) * reflectionAmp;
    }

    // "Shimmer" Tail - High frequency sparkles in the reverb
    // Enhanced for Ultrathink: More density in the tail
    if (i > 10000 && Math.random() > (0.95 - (brightness * 0.02))) {
       const shimmerAmp = amp * 0.4 * brightness;
       // Add a high-frequency burst
       left[i] += (Math.random() * 2 - 1) * shimmerAmp;
       right[i] += (Math.random() * 2 - 1) * shimmerAmp;
    }
  }
  return impulse;
};

const triggerSparkle = (ctx, destination, time, mix) => {
    // Ultrathink Bioluminescence: High-frequency sine clusters
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.random() * 2 - 1;
    panner.connect(destination);

    const count = 3 + Math.floor(Math.random() * 4);
    for(let i=0; i<count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Very high, crystalline frequencies
        osc.frequency.value = 3000 + Math.random() * 4000;

        const t = time + Math.random() * 0.2;
        const dur = 0.05 + Math.random() * 0.1;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(mix * 0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(panner);
        osc.start(t);
        osc.stop(t + dur + 0.1);
    }
};

const createNoiseBuffer = (ctx) => {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Pink Noise Approximation
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
    const { grainTypes, freqBase, mix } = params;

    // Pick a random grain type if array is provided
    const type = (grainTypes && grainTypes.length > 0)
        ? grainTypes[Math.floor(Math.random() * grainTypes.length)]
        : params.type || 'bubble';

    const duration = 0.05 + Math.random() * 0.15;

    const panner = ctx.createStereoPanner();
    const pan = Math.random() * 1.5 - 0.75;
    // Subtle movement for grains
    panner.pan.setValueAtTime(pan, time);
    panner.pan.linearRampToValueAtTime(pan + (Math.random() * 0.2 - 0.1), time + duration);
    panner.connect(destination);

    if (type === 'foam') {
        // Soft, frothy low-pass noise
        const bufferSrc = ctx.createBufferSource();
        bufferSrc.buffer = createNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400 + Math.random() * 200, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.8, time + duration * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        bufferSrc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        bufferSrc.start(time);
        bufferSrc.stop(time + duration + 0.1);
        return;
    } else if (type === 'sand') {
        // Gritty high-pass texture
        const bufferSrc = ctx.createBufferSource();
        bufferSrc.buffer = createNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000 + Math.random() * 1000, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.6, time + 0.01); // Sharp attack
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5); // Fast decay

        bufferSrc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        bufferSrc.start(time);
        bufferSrc.stop(time + duration + 0.1);
        return;
    } else if (type === 'shimmer') {
        // High-Fidelity Shimmer: 5-voice detuned cluster
        const baseFreq = freqBase * (1 + Math.random() * 0.5);
        // Pentatonic-ish spread or just cluster
        const detunes = [-0.03, -0.015, 0, 0.015, 0.03];

        detunes.forEach((detune, i) => {
             const osc = ctx.createOscillator();
             osc.type = i % 2 === 0 ? 'sine' : 'triangle'; // Mix waveforms
             osc.frequency.value = baseFreq * (1 + detune);

             const gain = ctx.createGain();
             gain.gain.setValueAtTime(0, time);
             gain.gain.linearRampToValueAtTime(mix * 0.15, time + duration * 0.5);
             gain.gain.linearRampToValueAtTime(0, time + duration);

             // Slight spread for each voice
             const voicePanner = ctx.createStereoPanner();
             voicePanner.pan.value = (Math.random() * 0.4 - 0.2);

             osc.connect(gain);
             gain.connect(voicePanner);
             voicePanner.connect(panner); // Connect to main grain panner (or destination)

             osc.start(time);
             osc.stop(time + duration + 0.1);
        });
        return;
    } else if (type === 'sparkle') {
        // Magical high-frequency cluster (Bell-like)
        const baseFreq = freqBase * (2 + Math.random()); // Higher pitch
        const count = 3;
        for(let i=0; i<count; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            // Harmonic series
            osc.frequency.value = baseFreq * (i + 1) + (Math.random() * 20);

            const gain = ctx.createGain();
            const dur = 0.1 + Math.random() * 0.1;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(mix * 0.2, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

            osc.connect(gain);
            gain.connect(panner);
            osc.start(time);
            osc.stop(time + dur + 0.1);
        }
        return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = freqBase * (0.9 + Math.random() * 0.2);

    if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (type === 'ice') {
        // Metallic Ring
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.5, time);

        // High Q Filter for ringing
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 15;
        filter.frequency.value = freq * 2;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.6, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        osc.start(time);
        osc.stop(time + duration + 0.2);
        return;
    } else if (type === 'droplet') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 2, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration * 0.5);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.4);
    } else {
        // Default / Fallback
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.2, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.5, time + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);
    }

    if (type !== 'ice') {
        osc.connect(gain);
        gain.connect(panner);
        osc.start(time);
        osc.stop(time + duration + 0.2);
    } else if (bioType === 'biolum') {
        // High-pitched, pure sine clusters with rapid envelopes (Sparkling light sound)
        const count = 5 + Math.floor(Math.random() * 5);
        const clusterDur = 1.0;

        // Random position for the cluster
        const clusterPan = Math.random() * 1.6 - 0.8;
        panner.pan.setValueAtTime(clusterPan, time);

        for (let i = 0; i < count; i++) {
             const t = time + Math.random() * clusterDur;
             const dur = 0.05 + Math.random() * 0.1;

             const osc = ctx.createOscillator();
             const gain = ctx.createGain();

             osc.type = 'sine';
             // Very high pitch
             const freq = 2000 + Math.random() * 3000;
             osc.frequency.setValueAtTime(freq, t);
             // Slight downward chirp
             osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + dur);

             gain.gain.setValueAtTime(0, t);
             gain.gain.linearRampToValueAtTime(mix * 0.4, t + 0.01);
             gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

             // Micro-panning within cluster
             const microPanner = ctx.createStereoPanner();
             microPanner.pan.value = (Math.random() * 0.2 - 0.1);

             osc.connect(gain);
             gain.connect(microPanner);
             microPanner.connect(panner);

             osc.start(t);
             osc.stop(t + dur + 0.05);
        }

    } else if (bioType === 'leviathan' || bioType === 'deep-call') {
        // Ultrathink Leviathan: Complex FM Sub-Bass Growl
        const duration = 8 + Math.random() * 4;

        // Carrier: Deep Rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // FM Modulator for growl texture
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();

        mod.type = 'sawtooth';
        mod.frequency.value = 15 + Math.random() * 5; // Fast flutter
        modGain.gain.setValueAtTime(20, time);
        modGain.gain.linearRampToValueAtTime(50, time + duration * 0.5); // Growl intensity increases
        modGain.gain.linearRampToValueAtTime(0, time + duration);

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        osc.type = 'sine'; // Pure sub bass base
        osc.frequency.setValueAtTime(35, time);
        osc.frequency.linearRampToValueAtTime(45, time + duration * 0.8); // Pitch swell

        // Resonant Filter Sweep
        filter.type = 'lowpass';
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(80, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + duration * 0.4);
        filter.frequency.exponentialRampToValueAtTime(60, time + duration);

        // Massive slow envelope
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 1.5, time + duration * 0.4); // Very loud peak
        gain.gain.linearRampToValueAtTime(0, time + duration);

        // Slow, menacing pan across the deep
        panner.pan.setValueAtTime(-0.6, time);
        panner.pan.linearRampToValueAtTime(0.6, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        osc.start(time);
        mod.start(time);
        osc.stop(time + duration + 0.5);
        mod.stop(time + duration + 0.5);

    } else if (bioType === 'crustacean') {
        // Ultrathink Crustacean: Rapid, randomized Geiger-counter clicks
        const count = 10 + Math.floor(Math.random() * 15);
        const burstDur = 1.0 + Math.random();

        // Random starting position
        const startPan = Math.random() * 1.6 - 0.8;
        panner.pan.setValueAtTime(startPan, time);

        for(let i=0; i<count; i++) {
             // Non-linear timing (scuttling)
             const t = time + (i / count) * burstDur + (Math.random() * 0.05);

             const clickOsc = ctx.createOscillator();
             const clickGain = ctx.createGain();
             const clickFilter = ctx.createBiquadFilter();

             // High pitch short bursts
             clickOsc.type = 'square';
             clickOsc.frequency.value = 200 + Math.random() * 100;

             // Highpass to remove body, keep click
             clickFilter.type = 'highpass';
             clickFilter.frequency.value = 2000 + Math.random() * 1000;
             clickFilter.Q.value = 5; // Resonant click

             clickGain.gain.setValueAtTime(0, t);
             clickGain.gain.linearRampToValueAtTime(mix * 0.8, t + 0.002);
             clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015); // Very short

             clickOsc.connect(clickFilter);
             clickFilter.connect(clickGain);

             // Micro-panning
             const microPanner = ctx.createStereoPanner();
             microPanner.pan.value = (Math.random() * 0.1 - 0.05);

             clickGain.connect(microPanner);
             microPanner.connect(panner);

             clickOsc.start(t);
             clickOsc.stop(t + 0.05);
        }
    }
};

const triggerMotif = (ctx, destination, params, time) => {
    const { melodyScale, melodyMix } = params;
    if (!melodyScale || !SCALES[melodyScale]) return 0;

    const scale = SCALES[melodyScale];
    // Ultrathink Melody: Markov Chain Generation
    // Defines transition probabilities for more musical phrasing
    const noteCount = 4 + Math.floor(Math.random() * 5); // 4 to 8 notes
    let currentOffset = 0;

    // Markov State: Index in scale
    // Bias towards center for start
    let lastNoteIndex = Math.floor(scale.length / 2);

    for (let i = 0; i < noteCount; i++) {
        const noteTime = time + currentOffset;

        // Markov Transition Logic
        const r = Math.random();
        let step = 0;

        // 40% Step (smooth motion)
        // 30% Thirds (musical skips)
        // 10% Repeat
        // 20% Large Leap (octave or 5th)
        if (r < 0.4) {
            step = Math.random() > 0.5 ? 1 : -1;
        } else if (r < 0.7) {
            step = Math.random() > 0.5 ? 2 : -2;
        } else if (r < 0.8) {
            step = 0;
        } else {
            step = Math.random() > 0.5 ? 4 : -4; // 5thish leap
        }

        let noteIndex = lastNoteIndex + step;

        // Reflect boundaries
        if (noteIndex < 0) noteIndex = -noteIndex;
        if (noteIndex >= scale.length) noteIndex = scale.length - 1 - (noteIndex - scale.length);

        // Clamp final safety
        noteIndex = Math.max(0, Math.min(scale.length - 1, noteIndex));
        lastNoteIndex = noteIndex;

        const baseFreq = scale[noteIndex];
        // Octave handling: Lower bias
        const octave = Math.random() > 0.85 ? 2 : (Math.random() > 0.3 ? 1 : 0.5);

        // Ultrathink Detuning: Drift for organic feel
        const drift = Math.random() * 2 - 1; // +/- 1Hz

        const freqs = [(baseFreq * octave) + drift];

        // Ultrathink Harmony: 50% chance of counterpoint
        if (Math.random() > 0.5) {
            // Add a perfect 5th or 4th below/above
            const interval = Math.random() > 0.5 ? 1.5 : 1.333;
            freqs.push(freqs[0] * interval);
        }

        freqs.forEach((freq, idx) => {
             // FM Synthesis
             const carrier = ctx.createOscillator();
             const modulator = ctx.createOscillator();
             const modGain = ctx.createGain();
             const gain = ctx.createGain();
             const panner = ctx.createStereoPanner();

             // Glassy/Metallic Ratios
             const ratio = 2 + (Math.random() * 0.05); // Imperfect integer ratio

             carrier.type = 'sine';
             carrier.frequency.setValueAtTime(freq, noteTime);

             modulator.type = 'sine';
             modulator.frequency.value = freq * ratio;

             const index = 400 + Math.random() * 200;
             modGain.gain.setValueAtTime(index, noteTime);
             modGain.gain.exponentialRampToValueAtTime(1, noteTime + 2.0);

             modulator.connect(modGain);
             modGain.connect(carrier.frequency);

             // Envelope
             const attack = 0.02 + Math.random() * 0.05;
             const release = 2.0 + Math.random();
             const dur = attack + release;

             gain.gain.setValueAtTime(0, noteTime);
             gain.gain.linearRampToValueAtTime(melodyMix * (idx > 0 ? 0.6 : 1), noteTime + attack);
             gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

             // Spatial
             const pan = (Math.random() * 2 - 1) * 0.7;
             panner.pan.setValueAtTime(pan, noteTime);

             carrier.connect(gain);
             gain.connect(panner);
             panner.connect(destination);

             carrier.start(noteTime);
             modulator.start(noteTime);
             carrier.stop(noteTime + dur + 0.1);
             modulator.stop(noteTime + dur + 0.1);
        });

        // Rhythmic Spacing (Humanized)
        // Shorter notes for steps, longer for leaps
        const baseDuration = (Math.abs(step) > 2) ? 0.8 : 0.4;
        currentOffset += baseDuration * (0.8 + Math.random() * 0.4);
    }

    return currentOffset + 2; // Return total duration + pause
};

const triggerBioSound = (ctx, destination, params, time) => {
    const { bioTypes, bioFreqBase } = params;

    // Pick a random bio type if array is provided
    const bioType = (bioTypes && bioTypes.length > 0)
        ? bioTypes[Math.floor(Math.random() * bioTypes.length)]
        : params.bioType || 'whale';

    const mix = 0.25; // Slightly boosted

    const panner = ctx.createStereoPanner();

    // Dynamic Spatialization base logic
    const startPan = Math.random() * 1.8 - 0.9;
    panner.pan.setValueAtTime(startPan, time);
    // Note: Long sounds will override this with a ramp

    panner.connect(destination);

    if (bioType === 'whale') {
        // High-Fidelity FM Whale Call (Dual Modulator)
        const duration = 3 + Math.random() * 4;

        // Dynamic Movement
        panner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, startPan + (Math.random() > 0.5 ? 0.8 : -0.8))), time + duration);

        const breathMix = params.breathMix || 0.1;

        // Breath/Water Noise (Procedural Texture)
        if (Math.random() > 0.2) {
             const breath = ctx.createBufferSource();
             breath.buffer = createNoiseBuffer(ctx);
             const bFilter = ctx.createBiquadFilter();
             bFilter.type = 'bandpass';
             bFilter.frequency.value = 800 + Math.random() * 400;
             bFilter.Q.value = 1;
             const bGain = ctx.createGain();

             bGain.gain.setValueAtTime(0, time);
             bGain.gain.linearRampToValueAtTime(breathMix, time + 0.1);
             bGain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

             breath.connect(bFilter);
             bFilter.connect(bGain);
             bGain.connect(panner);
             breath.start(time);
             breath.stop(time + 2);
        }

        const carrier = ctx.createOscillator();
        const modulator1 = ctx.createOscillator();
        const modulator2 = ctx.createOscillator();

        const modGain1 = ctx.createGain();
        const modGain2 = ctx.createGain();
        const mainGain = ctx.createGain();

        carrier.type = 'triangle';
        modulator1.type = 'sine';
        modulator2.type = 'sine';

        // Carrier Sweep
        carrier.frequency.setValueAtTime(bioFreqBase, time);
        carrier.frequency.exponentialRampToValueAtTime(bioFreqBase * 0.7, time + duration);

        // Modulator 1 (Harmonic)
        modulator1.frequency.value = bioFreqBase * 1.5;
        modGain1.gain.setValueAtTime(50, time);
        modGain1.gain.linearRampToValueAtTime(20, time + duration);

        // Modulator 2 (Sub-harmonic rumble)
        modulator2.frequency.value = bioFreqBase * 0.5;
        modGain2.gain.setValueAtTime(10, time);
        modGain2.gain.linearRampToValueAtTime(0, time + duration * 0.5);

        modulator1.connect(modGain1);
        modGain1.connect(carrier.frequency);

        modulator2.connect(modGain2);
        modGain2.connect(carrier.frequency);

        // Main Envelope (ADSR-ish)
        mainGain.gain.setValueAtTime(0, time);
        mainGain.gain.linearRampToValueAtTime(mix, time + duration * 0.1);
        mainGain.gain.setValueAtTime(mix, time + duration * 0.6); // Sustain
        mainGain.gain.linearRampToValueAtTime(0, time + duration); // Release

        // Formant Filter for Vowel movement (Ooh -> Aah -> Ooh)
        const formant = ctx.createBiquadFilter();
        formant.type = 'lowpass';
        formant.Q.value = 3;
        formant.frequency.setValueAtTime(300, time);
        formant.frequency.exponentialRampToValueAtTime(800, time + duration * 0.4);
        formant.frequency.exponentialRampToValueAtTime(300, time + duration);

        carrier.connect(formant);
        formant.connect(mainGain);
        mainGain.connect(panner);

        carrier.start(time);
        modulator1.start(time);
        modulator2.start(time);
        carrier.stop(time + duration + 0.5);
        modulator1.stop(time + duration + 0.5);
        modulator2.stop(time + duration + 0.5);

    } else if (bioType === 'bubble-stream') {
        // Ascending stream of bubbles
        const count = 15 + Math.floor(Math.random() * 15);
        const streamDur = 1.5 + Math.random();

        for (let i = 0; i < count; i++) {
            const t = time + (i / count) * streamDur + (Math.random() * 0.05);
            const bOsc = ctx.createOscillator();
            const bGain = ctx.createGain();

            bOsc.type = 'sine';
            const startFreq = 400 + Math.random() * 400;
            // Upward glissando for rising bubbles
            bOsc.frequency.setValueAtTime(startFreq, t);
            bOsc.frequency.exponentialRampToValueAtTime(startFreq * 2, t + 0.1);

            bGain.gain.setValueAtTime(0, t);
            bGain.gain.linearRampToValueAtTime(mix * 0.6, t + 0.01);
            bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            bOsc.connect(bGain);
            bGain.connect(panner);
            bOsc.start(t);
            bOsc.stop(t + 0.15);
        }
    } else if (bioType === 'dolphin') {
        // Clicks + Whistles
        const isClick = Math.random() > 0.5;

        if (isClick) {
            // Echolocation clicks
            const count = 5 + Math.floor(Math.random() * 10);
            for(let i=0; i<count; i++) {
                const t = time + i * (0.01 + Math.random() * 0.02);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2000 + Math.random() * 5000, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.005);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(mix, t + 0.001);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);
                osc.connect(gain);
                gain.connect(panner);
                osc.start(t);
                osc.stop(t + 0.01);
            }
        } else {
            // Whistle sweep
            const dur = 0.5 + Math.random() * 0.5;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const startFreq = 4000 + Math.random() * 2000;
            const endFreq = startFreq + (Math.random() * 2000 - 1000);

            osc.frequency.setValueAtTime(startFreq, time);
            osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(mix, time + 0.1);
            gain.gain.linearRampToValueAtTime(0, time + dur);

            osc.connect(gain);
            gain.connect(panner);
            osc.start(time);
            osc.stop(time + dur + 0.1);
        }

    } else if (bioType === 'growl') {
        // Deep Monster Growl (FM)
        const dur = 2 + Math.random() * 2;
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50 + Math.random() * 30, time);
        osc.frequency.linearRampToValueAtTime(30, time + dur);

        mod.type = 'sine';
        mod.frequency.value = 15 + Math.random() * 10;

        modGain.gain.setValueAtTime(100, time);
        modGain.gain.linearRampToValueAtTime(0, time + dur);

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        // Lowpass filter to muffle it
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.8, time + dur * 0.3);
        gain.gain.linearRampToValueAtTime(0, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        osc.start(time);
        mod.start(time);
        osc.stop(time + dur + 0.1);
        mod.stop(time + dur + 0.1);

    } else if (bioType === 'jellyfish') {
        // Resonant "Bloop" / Pulse
        const duration = 0.5 + Math.random() * 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine'; // Can be 'triangle' for more harmonics
        // Rapid pitch drop
        const startFreq = bioFreqBase * (1 + Math.random());
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.2, time + duration * 0.3);

        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(startFreq * 1.5, time);
        filter.frequency.exponentialRampToValueAtTime(startFreq * 0.3, time + duration);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 1.2, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        osc.start(time);
        osc.stop(time + duration + 0.1);

    } else if (bioType === 'ray') {
        // Majestic Sweep (Doppler-ish Noise + Sub Swell)
        const duration = 4 + Math.random() * 2;

        // Dynamic Movement (Wide sweep)
        panner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, -startPan)), time + duration);

        // 1. Noise Sweep
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(ctx);
        const nFilter = ctx.createBiquadFilter();
        const nGain = ctx.createGain();

        nFilter.type = 'bandpass';
        nFilter.Q.value = 2;
        nFilter.frequency.setValueAtTime(300, time);
        // Sweep up then down (Widened range for drama)
        nFilter.frequency.exponentialRampToValueAtTime(1000, time + duration * 0.5);
        nFilter.frequency.exponentialRampToValueAtTime(100, time + duration);

        nGain.gain.setValueAtTime(0, time);
        nGain.gain.linearRampToValueAtTime(mix * 0.4, time + duration * 0.4);
        nGain.gain.linearRampToValueAtTime(0, time + duration);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(panner);

        // 2. Sub Swell
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        const sGain = ctx.createGain();
        sub.frequency.value = 50 + Math.random() * 20;

        sGain.gain.setValueAtTime(0, time);
        sGain.gain.linearRampToValueAtTime(mix * 0.5, time + duration * 0.5);
        sGain.gain.linearRampToValueAtTime(0, time + duration);

        sub.connect(sGain);
        sGain.connect(panner);

        noise.start(time);
        noise.stop(time + duration + 0.2);
        sub.start(time);
        sub.stop(time + duration + 0.2);

    } else if (bioType === 'click') {
        // Organic Clicks (Filtered Noise + Sine)
        const clicks = Math.floor(Math.random() * 5) + 3;

        for(let i=0; i<clicks; i++) {
             const t = time + i * (0.05 + Math.random() * 0.05);

             // Sine burst
             const oscClick = ctx.createOscillator();
             const gainClick = ctx.createGain();
             oscClick.frequency.value = bioFreqBase + Math.random() * 1500;
             oscClick.type = 'sine';
             gainClick.gain.setValueAtTime(mix, t);
             gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
             oscClick.connect(gainClick);
             gainClick.connect(panner);
             oscClick.start(t);
             oscClick.stop(t + 0.05);

             // Noise burst (for texture)
             const noise = ctx.createBufferSource();
             noise.buffer = createNoiseBuffer(ctx);
             const noiseGain = ctx.createGain();
             const noiseFilter = ctx.createBiquadFilter();
             noiseFilter.type = 'bandpass';
             noiseFilter.frequency.value = 3000 + Math.random() * 2000;

             noiseGain.gain.setValueAtTime(mix * 0.5, t);
             noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

             noise.connect(noiseFilter);
             noiseFilter.connect(noiseGain);
             noiseGain.connect(panner);
             noise.start(t);
             noise.stop(t + 0.05);
        }

    } else if (bioType === 'chirp') {
        const duration = 0.15 + Math.random() * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bioFreqBase, time);
        osc.frequency.linearRampToValueAtTime(bioFreqBase * 2.5, time + duration);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix, time + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(panner);
        osc.start(time);
        osc.stop(time + duration + 0.1);

    } else if (bioType === 'ice-crack') {
        const duration = 0.3 + Math.random() * 0.4;
        const bufferSrc = ctx.createBufferSource();
        bufferSrc.buffer = createNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(mix * 1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        bufferSrc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        bufferSrc.start(time);
        bufferSrc.stop(time + duration + 0.1);

    } else if (bioType === 'school') {
        // Granular Swarm
        const count = 25;
        const swarmDuration = 2;

        // Swarm moves as a group
        panner.pan.linearRampToValueAtTime(startPan + (Math.random() * 0.4 - 0.2), time + swarmDuration);

        for(let i=0; i<count; i++) {
            const t = time + Math.random() * swarmDuration;
            const grainDur = 0.1 + Math.random() * 0.1;

            const osc = ctx.createOscillator();
            const gGain = ctx.createGain();
            const gPanner = ctx.createStereoPanner();

            osc.frequency.value = bioFreqBase * (0.8 + Math.random() * 0.4);
            osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';

            gPanner.pan.value = (Math.random() * 2 - 1) * 0.5; // Narrower spread relative to group

            gGain.gain.setValueAtTime(0, t);
            gGain.gain.linearRampToValueAtTime(mix * 0.3, t + grainDur * 0.5);
            gGain.gain.linearRampToValueAtTime(0, t + grainDur);

            osc.connect(gGain);
            gGain.connect(gPanner);
            gPanner.connect(destination); // Route to main bio bus (which is panned)

            osc.start(t);
            osc.stop(t + grainDur + 0.1);
        }
    } else if (bioType === 'chorus') {
        // Ethereal Vocal Cluster (New Ultrathink Layer)
        const duration = 4 + Math.random() * 2;
        const baseFreq = bioFreqBase || 200;

        // Source: Filtered Sawtooth (Choir-ish)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, time);

        // Dynamic Movement
        panner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, startPan + (Math.random() * 1.0 - 0.5))), time + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.5, time);
        filter.Q.value = 1;

        // Chorus Effect via Delay Modulation
        if (ctx.createDelay) {
             const delay = ctx.createDelay();
             delay.delayTime.value = 0.03; // 30ms

             const delayLFO = ctx.createOscillator();
             delayLFO.frequency.value = 0.5 + Math.random();
             const delayLFOGain = ctx.createGain();
             delayLFOGain.gain.value = 0.002; // +/- 2ms depth

             delayLFO.connect(delayLFOGain);
             delayLFOGain.connect(delay.delayTime);
             delayLFO.start(time);
             delayLFO.stop(time + duration);

             osc.connect(filter);
             filter.connect(delay);
             delay.connect(gain);
        } else {
             osc.connect(filter);
             filter.connect(gain);
        }

        gain.connect(panner);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(mix * 0.6, time + 1.5); // Slow, ghostly attack
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.2);
    }
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

    // --- Sub Bass Layer ---
    if (nodes.subOsc) {
        nodes.subOsc.frequency.setTargetAtTime(profile.subBassFreq, now, rampTime);
    }

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

    // --- Currents Layer (Ultrathink) ---
    if (nodes.currentsFilter) {
        // Bandpass sweep range
        nodes.currentsFilter.frequency.setTargetAtTime(profile.baseFreq * 2.5, now, rampTime);
        nodes.currentsGain.gain.setTargetAtTime(profile.currentsMix || 0, now, rampTime);
        nodes.currentsLFO.frequency.setTargetAtTime(profile.currentsSpeed || 0.1, now, rampTime);
    }

    // --- Resonator Layer (Ultrathink) ---
    if (nodes.resFilter1 && profile.melodyScale) {
        const scale = SCALES[profile.melodyScale] || SCALES.pacific;
        const root = scale[0] || 200;

        // Tune filters to harmonic series of the scale's root
        nodes.resFilter1.frequency.setTargetAtTime(root, now, rampTime);
        nodes.resFilter2.frequency.setTargetAtTime(root * 1.5, now, rampTime); // Perfect 5th
        nodes.resFilter3.frequency.setTargetAtTime(root * 2.0, now, rampTime); // Octave

        nodes.resonatorGain.gain.setTargetAtTime(profile.resonatorMix || 0, now, rampTime);
    }

    // --- Drone Cluster ---
    nodes.droneBase.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.droneDetune1.frequency.setTargetAtTime(profile.droneFreq + (profile.detune/100), now, rampTime);
    nodes.droneDetune2.frequency.setTargetAtTime(profile.droneFreq - (profile.detune/100), now, rampTime);
    nodes.droneHarmonic.frequency.setTargetAtTime(profile.droneFreq * profile.harmonic, now, rampTime);

    // Sub-harmonic drone (New Abyssal Layer)
    if (nodes.droneSub) {
        nodes.droneSub.frequency.setTargetAtTime(profile.droneFreq * 0.5, now, rampTime);
        if (nodes.droneSubGain) {
            nodes.droneSubGain.gain.setTargetAtTime(profile.droneSubMix || 0.1, now, rampTime);
        }
    }

    // --- Formant Filter Mix ---
    if (nodes.formantGain) {
        nodes.formantGain.gain.setTargetAtTime(profile.formantMix, now, rampTime);
    }

    // --- Binaural Layer ---
    nodes.binauralLeft.frequency.setTargetAtTime(profile.droneFreq, now, rampTime);
    nodes.binauralRight.frequency.setTargetAtTime(profile.droneFreq + profile.binauralDelta, now, rampTime);

    // --- Ethereal Shimmer Layer ---
    if (nodes.shimmerGain) {
        // Subtle fade in/out
        nodes.shimmerGain.gain.setTargetAtTime(profile.shimmerMix || 0, now, rampTime);
    }
    if (nodes.shimmerOsc1 && nodes.shimmerOsc2) {
        const freq = profile.shimmerFreq || 4000;
        nodes.shimmerOsc1.frequency.setTargetAtTime(freq, now, rampTime);
        nodes.shimmerOsc2.frequency.setTargetAtTime(freq + 50, now, rampTime);
    }

    // --- Swell (Breathing) ---
    if (nodes.swellLFO && nodes.swellGain) {
        nodes.swellLFO.frequency.setTargetAtTime(profile.swellRate, now, rampTime);
        nodes.swellGain.gain.setTargetAtTime(profile.swellDepth, now, rampTime);
    }

    // --- Saturation (Warmth) ---
    if (nodes.saturator) {
        nodes.saturator.curve = createSaturationCurve(profile.saturationAmount);
    }

    // --- Reverb (Space) ---
    if (nodes.convolver) {
        nodes.convolver.buffer = createImpulseResponse(ctx, profile.verbDecay || 4, 3);
    }

    // --- Granular & Bio Engine Params ---
    if (nodes.granularParams) {
        nodes.granularParams.density = profile.grainDensity;
        nodes.granularParams.grainTypes = profile.grainTypes; // Pass array
        nodes.granularParams.type = profile.grainType; // Keep fallback
        nodes.granularParams.freqBase = profile.grainFreqBase;
        nodes.granularParams.mix = profile.grainMix;

        nodes.granularParams.bioTypes = profile.bioTypes; // Pass array
        nodes.granularParams.bioType = profile.bioType; // Keep fallback
        nodes.granularParams.bioDensity = profile.bioDensity;
        nodes.granularParams.bioFreqBase = profile.bioFreqBase;
        nodes.granularParams.breathMix = profile.breathMix;

        nodes.granularParams.melodyScale = profile.melodyScale;
        nodes.granularParams.melodyRate = profile.melodyRate;
        nodes.granularParams.melodyMix = profile.melodyMix;

        nodes.granularParams.sparkleDensity = profile.sparkleDensity || 0;
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

        // Saturation (Warmth)
        const saturator = ctx.createWaveShaper();
        saturator.curve = createSaturationCurve(40); // Default amount
        saturator.oversample = '4x';
        saturator.connect(compressor);

        // Reverb (Convolution)
        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, 4, 4);
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.4;
        convolver.connect(reverbGain);
        reverbGain.connect(saturator); // Send wet to saturator

        // Dry Bus
        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.7;
        dryGain.connect(saturator); // Send dry to saturator

        // -------------------------
        // LAYER 0: Sub Bass
        // -------------------------
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = 40;

        // Add subtle LFO for organic pulse
        const subLFO = ctx.createOscillator();
        subLFO.frequency.value = 0.05; // 20s cycle
        const subLFOGain = ctx.createGain();
        subLFOGain.gain.value = 2; // +/- 2Hz
        subLFO.connect(subLFOGain);
        subLFOGain.connect(subOsc.frequency);
        subLFO.start();

        const subGain = ctx.createGain();
        subGain.gain.value = 0.25;
        subOsc.connect(subGain);
        subGain.connect(saturator);
        subOsc.start();

        // -------------------------
        // LAYER 1: Deep
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

        const deepLFO = ctx.createOscillator();
        deepLFO.type = 'sine';
        deepLFO.frequency.value = 0.05;
        const deepLFOGain = ctx.createGain();
        deepLFOGain.gain.value = 40;
        deepLFO.connect(deepLFOGain);
        deepLFOGain.connect(deepFilter.frequency);
        deepLFO.start();

        const deepPanLFO = ctx.createOscillator();
        deepPanLFO.type = 'sine';
        deepPanLFO.frequency.value = 0.02;
        const deepPanGain = ctx.createGain();
        deepPanGain.gain.value = 0.3;
        deepPanLFO.connect(deepPanGain);
        deepPanGain.connect(deepPanner.pan);
        deepPanLFO.start();

        deepNoise.start();

        // -------------------------
        // LAYER 2: Surface
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

        const surfaceLFO = ctx.createOscillator();
        surfaceLFO.type = 'sine';
        surfaceLFO.frequency.value = 0.15;
        const surfaceLFOGain = ctx.createGain();
        surfaceLFOGain.gain.value = 150;
        surfaceLFO.connect(surfaceLFOGain);
        surfaceLFOGain.connect(surfaceFilter.frequency);
        surfaceLFO.start();

        const surfacePanLFO = ctx.createOscillator();
        surfacePanLFO.type = 'sine';
        surfacePanLFO.frequency.value = 0.1;
        const surfacePanGain = ctx.createGain();
        surfacePanGain.gain.value = 0.5;
        surfacePanLFO.connect(surfacePanGain);
        surfacePanGain.connect(surfacePanner.pan);
        surfacePanLFO.start();

        surfaceNoise.start();

        // -------------------------
        // LAYER 3: Texture
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
        // LAYER 3.5: Wind
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

        const windLFO = ctx.createOscillator();
        windLFO.frequency.value = 0.1;
        const windLFOGain = ctx.createGain();
        windLFOGain.gain.value = 0.05;

        windLFO.connect(windLFOGain);
        windLFOGain.connect(windGain.gain);
        windLFO.start();

        const windPanLFO = ctx.createOscillator();
        windPanLFO.frequency.value = 0.2;
        const windPanGain = ctx.createGain();
        windPanGain.gain.value = 0.6;
        windPanLFO.connect(windPanGain);
        windPanGain.connect(windPanner.pan);
        windPanLFO.start();

        windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(windPanner);
        windPanner.connect(dryGain);
        windPanner.connect(convolver);

        windNoise.start();

        // -------------------------
        // LAYER 3.8: Deep Currents (Ultrathink)
        // -------------------------
        const currentsNoise = ctx.createBufferSource();
        // Use Pink Noise for a balanced spectrum
        currentsNoise.buffer = createNoiseBuffer(ctx);
        currentsNoise.loop = true;

        const currentsFilter = ctx.createBiquadFilter();
        currentsFilter.type = 'bandpass';
        currentsFilter.frequency.value = 200;
        currentsFilter.Q.value = 1.5; // Resonant flow

        const currentsGain = ctx.createGain();
        currentsGain.gain.value = 0.05;

        const currentsPanner = ctx.createStereoPanner();

        // LFO for filter sweep (The "flow" sensation)
        const currentsLFO = ctx.createOscillator();
        currentsLFO.type = 'sine';
        currentsLFO.frequency.value = 0.1;
        const currentsLFOGain = ctx.createGain();
        currentsLFOGain.gain.value = 150; // Sweep +/- 150Hz

        // LFO for Panning (Wide stereo movement)
        const currentsPanLFO = ctx.createOscillator();
        currentsPanLFO.type = 'sine';
        currentsPanLFO.frequency.value = 0.05; // Very slow
        const currentsPanGain = ctx.createGain();
        currentsPanGain.gain.value = 0.8; // Wide pan

        currentsLFO.connect(currentsLFOGain);
        currentsLFOGain.connect(currentsFilter.frequency);

        currentsPanLFO.connect(currentsPanGain);
        currentsPanGain.connect(currentsPanner.pan);

        currentsNoise.connect(currentsFilter);
        currentsFilter.connect(currentsGain);
        currentsGain.connect(currentsPanner);
        currentsPanner.connect(dryGain);
        currentsPanner.connect(convolver); // Heavy reverb on currents

        currentsNoise.start();
        currentsLFO.start();
        currentsPanLFO.start();

        // -------------------------
        // LAYER 3.9: Resonator (Ultrathink)
        // -------------------------
        const resonatorGain = ctx.createGain();
        resonatorGain.gain.value = 0;
        resonatorGain.connect(convolver);
        resonatorGain.connect(dryGain);

        const resonatorInput = ctx.createGain();
        resonatorInput.gain.value = 0.5; // Input attenuation

        const resFilter1 = ctx.createBiquadFilter();
        resFilter1.type = 'bandpass';
        resFilter1.Q.value = 20; // High resonance

        const resFilter2 = ctx.createBiquadFilter();
        resFilter2.type = 'bandpass';
        resFilter2.Q.value = 20;

        const resFilter3 = ctx.createBiquadFilter();
        resFilter3.type = 'bandpass';
        resFilter3.Q.value = 20;

        // Feed texture and currents into resonator
        currentsFilter.connect(resonatorInput);
        textureFilter.connect(resonatorInput);

        resonatorInput.connect(resFilter1);
        resonatorInput.connect(resFilter2);
        resonatorInput.connect(resFilter3);

        resFilter1.connect(resonatorGain);
        resFilter2.connect(resonatorGain);
        resFilter3.connect(resonatorGain);

        // -------------------------
        // LAYER 4: Drone Cluster + Formants
        // -------------------------
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.15;

        // LFO 1: Amplitude Modulation
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

        // LFO 2: Slow Filter Sweep (Timbral Evolution)
        const droneFilterLFO = ctx.createOscillator();
        droneFilterLFO.type = 'sine';
        droneFilterLFO.frequency.value = 0.02; // 50s cycle
        const droneFilterLFOGain = ctx.createGain();
        droneFilterLFOGain.gain.value = 100; // +/- 100Hz

        droneFilterLFO.connect(droneFilterLFOGain);
        droneFilterLFOGain.connect(droneFilter.frequency);
        droneFilterLFO.start();

        // Phaser Effect (Evolving Texture) - Ultrathink Upgrade
        const phaserFilter = ctx.createBiquadFilter();
        phaserFilter.type = 'allpass';
        phaserFilter.frequency.value = 1000;
        phaserFilter.Q.value = 1;

        const phaserLFO = ctx.createOscillator();
        phaserLFO.frequency.value = 0.05; // Slow sweep
        const phaserLFOGain = ctx.createGain();
        phaserLFOGain.gain.value = 500; // +/- 500Hz

        phaserLFO.connect(phaserLFOGain);
        phaserLFOGain.connect(phaserFilter.frequency);
        phaserLFO.start();

        // Base Oscillators
        const droneBase = ctx.createOscillator();
        droneBase.type = 'sine';
        droneBase.frequency.value = 55;

        const droneDetune1 = ctx.createOscillator();
        droneDetune1.type = 'triangle';
        droneDetune1.frequency.value = 55.05;
        const pannerD1 = ctx.createStereoPanner();
        pannerD1.pan.value = -0.5;

        const droneDetune2 = ctx.createOscillator();
        droneDetune2.type = 'triangle';
        droneDetune2.frequency.value = 54.95;
        const pannerD2 = ctx.createStereoPanner();
        pannerD2.pan.value = 0.5;

        const droneHarmonic = ctx.createOscillator();
        droneHarmonic.type = 'sine';
        droneHarmonic.frequency.value = 110;

        // New Sub-Harmonic Oscillator (Abyssal Layer)
        const droneSub = ctx.createOscillator();
        droneSub.type = 'square';
        droneSub.frequency.value = 27.5;
        const droneSubFilter = ctx.createBiquadFilter();
        droneSubFilter.type = 'lowpass';
        droneSubFilter.frequency.value = 100;
        const droneSubGain = ctx.createGain();
        droneSubGain.gain.value = 0.1;

        // Abyssal AM Modulation
        const droneSubLFO = ctx.createOscillator();
        droneSubLFO.type = 'sine';
        droneSubLFO.frequency.value = 0.1; // Slow throb
        const droneSubAM = ctx.createGain();
        droneSubAM.gain.value = 0.05;

        droneSubLFO.connect(droneSubAM);
        droneSubAM.connect(droneSubGain.gain);
        droneSubLFO.start();

        droneSub.connect(droneSubFilter);
        droneSubFilter.connect(droneSubGain);
        droneSubGain.connect(droneGain);

        droneBase.connect(droneGain);
        droneDetune1.connect(pannerD1);
        pannerD1.connect(droneGain);
        droneDetune2.connect(pannerD2);
        pannerD2.connect(droneGain);
        droneHarmonic.connect(droneGain);

        // Formant Filter Bank (Parallel)
        // A / O / U approximation
        const formantGain = ctx.createGain();
        formantGain.gain.value = 0; // Controlled by updateAudioParams

        const f1 = ctx.createBiquadFilter(); // Low formant
        f1.type = 'bandpass';
        f1.frequency.value = 300;
        f1.Q.value = 5;

        const f2 = ctx.createBiquadFilter(); // High formant
        f2.type = 'bandpass';
        f2.frequency.value = 800;
        f2.Q.value = 5;

        droneGain.connect(droneFilter);

        // Direct path (via Phaser)
        droneFilter.connect(phaserFilter);
        phaserFilter.connect(convolver);
        phaserFilter.connect(dryGain);

        // Formant path (added to direct)
        droneFilter.connect(f1);
        droneFilter.connect(f2);

        f1.connect(formantGain);
        f2.connect(formantGain);

        formantGain.connect(convolver);
        formantGain.connect(dryGain);

        droneBase.start();
        droneDetune1.start();
        droneDetune2.start();
        droneHarmonic.start();
        droneSub.start();

        // -------------------------
        // LAYER 5: Binaural
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

        binauralGain.connect(masterGain); // Direct

        binauralLeft.start();
        binauralRight.start();

        // -------------------------
        // LAYER 9: Ethereal Shimmer (Ultrathink Addition)
        // -------------------------
        const shimmerGain = ctx.createGain();
        shimmerGain.gain.value = 0; // Controlled via updateAudioParams
        shimmerGain.connect(convolver);
        shimmerGain.connect(dryGain);

        // Voice 1 (Left - Triangle)
        const shimmerOsc1 = ctx.createOscillator();
        shimmerOsc1.type = 'triangle';
        shimmerOsc1.frequency.value = 4000;
        const shimmerLFO1 = ctx.createOscillator();
        shimmerLFO1.frequency.value = 6; // Fast flutter
        const shimmerAM1 = ctx.createGain();
        shimmerAM1.gain.value = 0.5; // AM depth base

        const shimmerPan1 = ctx.createStereoPanner();
        shimmerPan1.pan.value = -0.8;

        const amDepth1 = ctx.createGain();
        amDepth1.gain.value = 0.5;
        shimmerLFO1.connect(amDepth1);
        amDepth1.connect(shimmerAM1.gain);

        shimmerOsc1.connect(shimmerAM1);
        shimmerAM1.connect(shimmerPan1);
        shimmerPan1.connect(shimmerGain);

        // Voice 2 (Right - Sine)
        const shimmerOsc2 = ctx.createOscillator();
        shimmerOsc2.type = 'sine';
        shimmerOsc2.frequency.value = 4050;
        const shimmerLFO2 = ctx.createOscillator();
        shimmerLFO2.frequency.value = 4.5;
        const shimmerAM2 = ctx.createGain();
        shimmerAM2.gain.value = 0.5;

        const shimmerPan2 = ctx.createStereoPanner();
        shimmerPan2.pan.value = 0.8;

        const amDepth2 = ctx.createGain();
        amDepth2.gain.value = 0.5;
        shimmerLFO2.connect(amDepth2);
        amDepth2.connect(shimmerAM2.gain);

        shimmerOsc2.connect(shimmerAM2);
        shimmerAM2.connect(shimmerPan2);
        shimmerPan2.connect(shimmerGain);

        shimmerOsc1.start();
        shimmerLFO1.start();
        shimmerOsc2.start();
        shimmerLFO2.start();

        // -------------------------
        // LAYER 7: Swell
        // -------------------------
        const swellLFO = ctx.createOscillator();
        swellLFO.type = 'sine';
        swellLFO.frequency.value = 0.05;

        const swellGain = ctx.createGain();
        swellGain.gain.value = 0.1;

        swellLFO.connect(swellGain);
        swellGain.connect(surfaceGain.gain);
        swellGain.connect(windGain.gain);

        swellLFO.start();

        // -------------------------
        // Granular, Bio & Melody Engine
        // -------------------------
        const granularGain = ctx.createGain();
        granularGain.gain.value = 1;
        granularGain.connect(convolver);
        granularGain.connect(dryGain);

        const bioGain = ctx.createGain();
        bioGain.gain.value = 1;
        bioGain.connect(convolver);
        bioGain.connect(dryGain);

        const melodyGain = ctx.createGain();
        melodyGain.gain.value = 1;
        melodyGain.connect(convolver);
        melodyGain.connect(dryGain);

        const granularParams = {
            density: 0,
            grainTypes: ['bubble'],
            freqBase: 400,
            mix: 0.1,
            bioTypes: ['whale'],
            bioDensity: 0.1,
            bioFreqBase: 150,
            melodyScale: 'pacific',
            melodyRate: 0.2,
            melodyMix: 0.1,
            sparkleDensity: 0
        };

        // Scheduler
        const lookahead = 100;
        const scheduleAheadTime = 0.2;
        let nextGrainTime = ctx.currentTime;
        let nextBioTime = ctx.currentTime + 2;
        let nextMelodyTime = ctx.currentTime + 1;
        let nextSparkleTime = ctx.currentTime + 1.5;

        const scheduler = () => {
            const currentTime = ctx.currentTime;

            if (nextGrainTime < currentTime) nextGrainTime = currentTime;
            if (nextBioTime < currentTime) nextBioTime = currentTime;
            if (nextMelodyTime < currentTime) nextMelodyTime = currentTime;
            if (nextSparkleTime < currentTime) nextSparkleTime = currentTime;

            while (nextGrainTime < currentTime + scheduleAheadTime) {
                const minInterval = 0.05;
                const maxInterval = 0.5;
                const interval = minInterval + (1 - granularParams.density) * (maxInterval - minInterval);
                const randomJitter = Math.random() * 0.1;

                triggerGrain(ctx, granularGain, granularParams, nextGrainTime);
                nextGrainTime += interval + randomJitter;
            }

            // Sparkle Logic
            if (nextSparkleTime < currentTime + scheduleAheadTime) {
                if (granularParams.sparkleDensity > 0) {
                     triggerSparkle(ctx, granularGain, nextSparkleTime, granularParams.mix * 0.5);
                     // Random interval based on density
                     const density = Math.max(0.01, granularParams.sparkleDensity);
                     const interval = (1 / density) * (0.5 + Math.random());
                     nextSparkleTime += interval;
                } else {
                     nextSparkleTime = currentTime + 1;
                }
            }

            if (nextBioTime < currentTime + scheduleAheadTime) {
                const minBioInterval = 5;
                const maxBioInterval = 30;
                const bioInterval = maxBioInterval - (granularParams.bioDensity * (maxBioInterval - minBioInterval));
                const jitter = Math.random() * 5;

                triggerBioSound(ctx, bioGain, granularParams, nextBioTime);
                nextBioTime += bioInterval + jitter;
            }

            if (nextMelodyTime < currentTime + scheduleAheadTime) {
                // Trigger a full melodic phrase (motif)
                const motifDur = triggerMotif(ctx, melodyGain, granularParams, nextMelodyTime);

                // Pause based on rate
                const rate = Math.max(0.05, Math.min(2.0, granularParams.melodyRate || 0.1));
                const basePause = (1 / rate) * 4; // Longer pause between phrases
                const pause = basePause * (0.5 + Math.random());

                nextMelodyTime += motifDur + pause;
            }
        };

        const granularInterval = setInterval(scheduler, lookahead);

        nodesRef.current = {
            subOsc, subGain, subLFO, subLFOGain,
            melodyGain,
            deepFilter, deepLFO, deepLFOGain,
            surfaceFilter, surfaceLFO, surfaceLFOGain,
            textureFilter, textureGain,
            windFilter, windGain,
            currentsFilter, currentsGain, currentsLFO, currentsLFOGain, currentsPanLFO, // Currents
            resonatorGain, resFilter1, resFilter2, resFilter3, // Resonator
            droneBase, droneDetune1, droneDetune2, droneHarmonic, droneSub, droneSubGain, // Added droneSubGain to ref
            formantGain, // Stored for updates
            binauralLeft, binauralRight,
            // New Shimmer Layer
            shimmerGain, shimmerOsc1, shimmerOsc2,
            shimmerLFO1, shimmerLFO2, shimmerAM1, shimmerAM2,
            swellLFO, swellGain,
            phaserLFO, // Track for cleanup
            saturator,
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

  const playTourSound = useCallback(() => {
    if (!audioContextRef.current || !isSoundOn || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, [isSoundOn]);

  return { playTourSound };
};
