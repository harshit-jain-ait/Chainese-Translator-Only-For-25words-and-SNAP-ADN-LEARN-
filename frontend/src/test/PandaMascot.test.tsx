import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PandaMascot } from '../components/PandaMascot';

describe('PandaMascot Component', () => {
  it('renders decorative SVG with aria-hidden="true" and role="presentation"', () => {
    const { container } = render(<PandaMascot />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('role', 'presentation');
  });

  it('renders wrapper with pointer-events: none and button with pointer-events: auto', () => {
    render(<PandaMascot />);

    const wrapper = screen.getByRole('complementary', { name: /Interactive panda mascot/i });
    expect(wrapper).toHaveClass('pointer-events-none');

    const button = screen.getByRole('button', { name: /Panda mascot, click to wave/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('pointer-events-auto');
  });

  it('handles click event and triggers wave animation', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const { container } = render(<PandaMascot onClick={onClick} />);

    const button = screen.getByRole('button', { name: /Panda mascot, click to wave/i });
    const rightArm = container.querySelector('#panda-right-arm');
    expect(rightArm).not.toHaveClass('panda-waving');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(rightArm).toHaveClass('panda-waving');

    // Advance timer by 900ms to end wave animation
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(rightArm).not.toHaveClass('panda-waving');
    vi.useRealTimers();
  });
});
