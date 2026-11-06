import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ResultCard } from '../components/ResultCard';
import * as speechModule from '../speech';
import { Detection } from '../types';

describe('ResultCard Component', () => {
  const mockDetection: Detection = {
    vocab_id: 25,
    en: 'Bottle',
    hanzi: '瓶子',
    pinyin: 'píngzi',
    measure: '个 (gè)',
    score: 0.94,
    box: [50, 50, 150, 200],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders speaker button with correct aria-label and lang="zh-Hans"', () => {
    render(
      <ResultCard
        detection={mockDetection}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    const button = screen.getByRole('button', {
      name: `Play pronunciation of ${mockDetection.en}`,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Listen');

    const hanziSpan = screen.getByText('瓶子');
    expect(hanziSpan).toBeInTheDocument();
    expect(hanziSpan).toHaveAttribute('lang', 'zh-Hans');
  });

  it('clicking the speaker button calls playHanzi once with hanzi text without triggering card onSelect', async () => {
    const playSpy = vi.spyOn(speechModule, 'playHanzi').mockResolvedValue(undefined);
    const onSelectMock = vi.fn();

    render(
      <ResultCard
        detection={mockDetection}
        isSelected={false}
        onSelect={onSelectMock}
      />
    );

    const speakButton = screen.getByRole('button', {
      name: `Play pronunciation of ${mockDetection.en}`,
    });

    await act(async () => {
      fireEvent.click(speakButton);
    });

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledWith('瓶子');
    expect(onSelectMock).not.toHaveBeenCalled();
  });

  it('shows loading spinner and disables button during playback', async () => {
    let resolvePlay: () => void = () => {};
    const deferredPromise = new Promise<void>((resolve) => {
      resolvePlay = resolve;
    });

    vi.spyOn(speechModule, 'playHanzi').mockReturnValue(deferredPromise);

    render(
      <ResultCard
        detection={mockDetection}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    const speakButton = screen.getByRole('button', {
      name: `Play pronunciation of ${mockDetection.en}`,
    });

    fireEvent.click(speakButton);

    expect(speakButton).toBeDisabled();
    expect(speakButton).toHaveAttribute('aria-busy', 'true');

    // Finish playback
    resolvePlay();

    await waitFor(() => {
      expect(speakButton).not.toBeDisabled();
      expect(speakButton).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('shows error toast callback if playHanzi fails', async () => {
    vi.spyOn(speechModule, 'playHanzi').mockRejectedValueOnce(
      new Error('Synthesis failed')
    );
    const onErrorMock = vi.fn();

    render(
      <ResultCard
        detection={mockDetection}
        isSelected={false}
        onSelect={() => {}}
        onError={onErrorMock}
      />
    );

    const speakButton = screen.getByRole('button', {
      name: `Play pronunciation of ${mockDetection.en}`,
    });

    fireEvent.click(speakButton);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Could not play pronunciation. Try again.');
    });
  });

  it('stops speech when component unmounts', () => {
    const stopSpy = vi.spyOn(speechModule, 'stopSpeech');

    const { unmount } = render(
      <ResultCard
        detection={mockDetection}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    unmount();

    expect(stopSpy).toHaveBeenCalled();
  });
});
