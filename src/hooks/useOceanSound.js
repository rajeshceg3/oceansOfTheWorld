import { useEffect, useRef, useCallback } from 'react';

export const useOceanSound = (isSoundOn) => {
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const lfoNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const isInitializedRef = useRef(false);

  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        // Create Noise Source (White Noise Buffer Loop)
        const bufferSize = 4 * ctx.sampleRate; // 4 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Brown-ish noise integration
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        sourceNodeRef.current = source;

        // Lowpass Filter (Simulate underwater/distance)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Base frequency
        filter.Q.value = 1;
        filterNodeRef.current = filter;

        // Gain (Volume)
        const gain = ctx.createGain();
        gain.gain.value = 0; // Start silent
        gainNodeRef.current = gain;

        // LFO for Waves (Modulate Filter Frequency)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // Wave frequency (slow)
        lfoNodeRef.current = lfo;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 300; // Modulation depth

        // Connect graph
        // LFO -> LFO Gain -> Filter Frequency
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        // Source -> Filter -> Gain -> Destination
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        // Start sources
        source.start();
        lfo.start();

        isInitializedRef.current = true;
    } catch (e) {
        console.error("Audio init failed", e);
    }
  }, []);

  useEffect(() => {
    if (isSoundOn) {
        if (!isInitializedRef.current) {
            initAudio();
        }
        // Resume context if suspended
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Fade In
        if (gainNodeRef.current) {
            // Cancel scheduled values to avoid conflict
            gainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            gainNodeRef.current.gain.setTargetAtTime(0.3, audioContextRef.current.currentTime, 2); // Fade to 0.3 over ~2s
        }
    } else {
        // Fade Out
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.5); // Fast fade out
        }
    }

    // Cleanup on unmount?
    // Usually we keep the audio context alive but muted to avoid overhead of recreation.
    // But if the component unmounts fully, we should close.
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
