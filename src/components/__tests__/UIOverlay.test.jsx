import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UIOverlay from '../UIOverlay';
import { OCEANS } from '../../data/oceans';

// Mock useOceanSound to avoid AudioContext issues
vi.mock('../hooks/useOceanSound', () => ({
  useOceanSound: vi.fn(),
}));

describe('UIOverlay', () => {
    const defaultProps = {
        oceans: OCEANS,
        currentOceanIndex: 0,
        onOceanChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders current ocean name and description', () => {
        render(<UIOverlay {...defaultProps} />);
        // Use heading role for the main title to avoid collision with tooltips
        expect(screen.getByRole('heading', { name: OCEANS[0].name })).toBeInTheDocument();
        expect(screen.getByText(OCEANS[0].description)).toBeInTheDocument();
    });

    it('renders navigation buttons for all oceans', () => {
        render(<UIOverlay {...defaultProps} />);
        const buttons = screen.getAllByRole('button', { name: /Switch to/i });
        expect(buttons).toHaveLength(OCEANS.length);
    });

    it('calls onOceanChange when an ocean button is clicked', () => {
        render(<UIOverlay {...defaultProps} />);
        const buttons = screen.getAllByRole('button', { name: /Switch to/i });
        fireEvent.click(buttons[1]); // Click the second ocean
        expect(defaultProps.onOceanChange).toHaveBeenCalledWith(1);
    });

    it('renders sound toggle button', () => {
        render(<UIOverlay {...defaultProps} />);
        // Initially sound is off
        expect(screen.getByRole('button', { name: /Enable sound/i })).toBeInTheDocument();
    });

    it('toggles sound state on click', () => {
        render(<UIOverlay {...defaultProps} />);
        const soundButton = screen.getByRole('button', { name: /Enable sound/i });

        fireEvent.click(soundButton);
        expect(screen.getByRole('button', { name: /Mute sound/i })).toBeInTheDocument();

        fireEvent.click(soundButton);
        expect(screen.getByRole('button', { name: /Enable sound/i })).toBeInTheDocument();
    });

    it('hides UI when idle', async () => {
        vi.useFakeTimers();
        render(<UIOverlay {...defaultProps} />);

        // Use heading to target the container
        const title = screen.getByRole('heading', { name: OCEANS[0].name }).closest('div');

        // Advance time by > 8 seconds
        act(() => {
            vi.advanceTimersByTime(9000);
        });

        expect(title).toHaveAttribute('aria-hidden', 'true');
        expect(title).toHaveClass('opacity-0');

        vi.useRealTimers();
    });

    it('shows UI on interaction', () => {
        vi.useFakeTimers();
        render(<UIOverlay {...defaultProps} />);

        const title = screen.getByRole('heading', { name: OCEANS[0].name }).closest('div');

        // Go idle
        act(() => {
            vi.advanceTimersByTime(9000);
        });
        expect(title).toHaveAttribute('aria-hidden', 'true');

        // Simulate interaction
        act(() => {
            fireEvent.mouseMove(window);
        });

        expect(title).not.toHaveAttribute('aria-hidden', 'true');

        vi.useRealTimers();
    });
});
