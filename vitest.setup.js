import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill HTMLCanvasElement functions mostly for Three.js
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => []),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
    };
};

// Mock AudioContext
window.AudioContext = class AudioContext {
    constructor() {
        this.state = 'suspended';
        this.currentTime = 0;
        this.destination = {};
        this.sampleRate = 44100; // Required for buffer creation
        this.createGain = () => ({
            gain: { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.createOscillator = () => ({
            frequency: { value: 0, setTargetAtTime: vi.fn() },
            type: 'sine',
            start: vi.fn(),
            stop: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.createBiquadFilter = () => ({
            frequency: { value: 0, setTargetAtTime: vi.fn() },
            Q: { value: 0 },
            type: 'lowpass',
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.createBufferSource = () => ({
            buffer: null,
            loop: false,
            start: vi.fn(),
            stop: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.createConvolver = () => ({
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.createBuffer = () => ({
            getChannelData: () => new Float32Array(1024),
        });
        this.createStereoPanner = () => ({
            pan: { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
        });
        this.resume = vi.fn().mockResolvedValue();
        this.close = vi.fn().mockResolvedValue();
    }
};
window.webkitAudioContext = window.AudioContext;
