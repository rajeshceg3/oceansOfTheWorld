import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOceanSound } from '../useOceanSound';

describe('useOceanSound', () => {
  let AudioContextMock;
  let audioContextInstance;
  let gainNodeMock;
  let oscillatorMock;
  let bufferSourceMock;
  let biquadFilterMock;
  let convolverMock;
  let dynamicsCompressorMock;
  let waveShaperMock;

  beforeEach(() => {
    // Mock AudioContext and related nodes
    const createAudioParamMock = (initialValue = 0) => ({
      value: initialValue,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    });

    gainNodeMock = {
      gain: createAudioParamMock(0),
      connect: vi.fn(),
    };

    oscillatorMock = {
        type: 'sine',
        frequency: createAudioParamMock(0),
        detune: createAudioParamMock(0),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    };

    bufferSourceMock = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    };

    biquadFilterMock = {
        type: '',
        frequency: createAudioParamMock(0),
        Q: createAudioParamMock(0),
        gain: createAudioParamMock(0),
        connect: vi.fn(),
    };

    convolverMock = {
        buffer: null,
        connect: vi.fn(),
    };

    const stereoPannerMock = {
        pan: createAudioParamMock(0),
        connect: vi.fn(),
    };

    const delayNodeMock = {
        delayTime: createAudioParamMock(0),
        connect: vi.fn(),
    };

    dynamicsCompressorMock = {
        threshold: createAudioParamMock(0),
        knee: createAudioParamMock(0),
        ratio: createAudioParamMock(0),
        attack: createAudioParamMock(0),
        release: createAudioParamMock(0),
        connect: vi.fn(),
    };

    waveShaperMock = {
        curve: null,
        oversample: 'none',
        connect: vi.fn(),
    };

    // We define the mock class globally so we can extend it or use it
    window.AudioContext = class MockAudioContext {
        constructor() {
            this.createGain = vi.fn(() => gainNodeMock);
            this.createOscillator = vi.fn(() => oscillatorMock);
            this.createBufferSource = vi.fn(() => bufferSourceMock);
            this.createBiquadFilter = vi.fn(() => biquadFilterMock);
            this.createDelay = vi.fn(() => delayNodeMock);
            this.createDynamicsCompressor = vi.fn(() => dynamicsCompressorMock);
            this.createConvolver = vi.fn(() => convolverMock);
            this.createStereoPanner = vi.fn(() => stereoPannerMock);
            this.createWaveShaper = vi.fn(() => waveShaperMock);
            this.createBuffer = vi.fn(() => ({
                getChannelData: vi.fn(() => new Float32Array(4000))
            }));
            this.sampleRate = 1000;
            this.currentTime = 0;
            this.state = 'running';
            this.resume = vi.fn();
            this.close = vi.fn();
            this.destination = {};

            // Capture the instance
            audioContextInstance = this;
        }
    }
    window.webkitAudioContext = window.AudioContext;

    // We spy on the constructor to check calls
    AudioContextMock = vi.spyOn(window, 'AudioContext');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    audioContextInstance = null;
  });

  it('should initialize AudioContext when sound is on', () => {
    renderHook(() => useOceanSound(true));
    expect(AudioContextMock).toHaveBeenCalled();
  });

  it('should not initialize AudioContext when sound is off initially', () => {
    renderHook(() => useOceanSound(false));
    expect(AudioContextMock).not.toHaveBeenCalled();
  });

  it('should resume audio context if suspended', () => {
     // Override for this specific test
     window.AudioContext = class SuspendedContext {
        constructor() {
            this.createGain = vi.fn(() => gainNodeMock);
            this.createOscillator = vi.fn(() => oscillatorMock);
            this.createBufferSource = vi.fn(() => bufferSourceMock);
            this.createBiquadFilter = vi.fn(() => biquadFilterMock);
            this.createDynamicsCompressor = vi.fn(() => dynamicsCompressorMock);
            this.createConvolver = vi.fn(() => convolverMock);
            this.createStereoPanner = vi.fn(() => ({
                pan: { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
                connect: vi.fn(),
            }));
            this.createWaveShaper = vi.fn(() => waveShaperMock);
            this.createBuffer = vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(4000)) }));
            this.sampleRate = 1000;
            this.currentTime = 0;
            this.state = 'suspended'; // Key difference
            this.resume = vi.fn();
            this.close = vi.fn();
            this.destination = {};
            audioContextInstance = this;
        }
    };

    renderHook(() => useOceanSound(true));
    // Check if resume was called
    expect(audioContextInstance.resume).toHaveBeenCalled();
  });

  it('should fade in when sound is turned on', () => {
      renderHook(() => useOceanSound(true));

      // We need to wait or ensure effect ran.
      // renderHook runs effects.
      // Check arguments.
      expect(gainNodeMock.gain.setTargetAtTime).toHaveBeenCalledWith(1, 0, 2);
  });

  it('should fade out when sound is turned off', () => {
    const { rerender } = renderHook(({ isSoundOn }) => useOceanSound(isSoundOn), {
        initialProps: { isSoundOn: true }
    });

    gainNodeMock.gain.setTargetAtTime.mockClear();

    rerender({ isSoundOn: false });

    expect(gainNodeMock.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, 0.5);
  });
});
