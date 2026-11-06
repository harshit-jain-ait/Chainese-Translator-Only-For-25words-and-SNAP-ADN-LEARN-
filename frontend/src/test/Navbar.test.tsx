import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '../components/Navbar';

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
    localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title "Snap and learn" and the 词 character', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', model_loaded: true }),
    } as Response);

    render(<Navbar />);

    // Title text: "Snap and learn"
    expect(screen.getByText(/Snap and/i)).toBeInTheDocument();
    expect(screen.getByText(/learn/i)).toBeInTheDocument();

    // Chinese character '词'
    expect(screen.getByText('词')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });
  });

  it('status pill shows "Model Ready" when the mocked GET /api/health returns ready', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ready', model_loaded: true }),
    } as Response);

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });

    const statusPill = screen.getByRole('status');
    expect(statusPill).toHaveAttribute('aria-label', 'Model Ready');
  });

  it('status pill shows "Model unavailable" when the mocked GET /api/health returns unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'unavailable', model_loaded: false }),
    } as Response);

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('Model unavailable')).toBeInTheDocument();
    });

    const statusPill = screen.getByRole('status');
    expect(statusPill).toHaveAttribute('aria-label', 'Model unavailable');
  });

  it('status pill shows "Model unavailable" when the fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('Model unavailable')).toBeInTheDocument();
    });

    const statusPill = screen.getByRole('status');
    expect(statusPill).toHaveAttribute('aria-label', 'Model unavailable');
  });

  it('clicking the theme toggle changes aria-pressed from false to true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', model_loaded: true }),
    } as Response);

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });

    const themeToggle = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(themeToggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(themeToggle);

    expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('clicking "Show all 25 words" calls scrollIntoView on the vocabulary section', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', model_loaded: true }),
    } as Response);

    const mockScrollIntoView = vi.fn();
    const vocabSection = document.createElement('section');
    vocabSection.id = 'vocab-section';
    vocabSection.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(vocabSection);

    const onOpenVocabModal = vi.fn();

    render(<Navbar onOpenVocabModal={onOpenVocabModal} />);

    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });

    const actionButton = screen.getByRole('button', { name: /all 25 words/i });
    fireEvent.click(actionButton);

    expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
    expect(onOpenVocabModal).toHaveBeenCalledTimes(1);

    document.body.removeChild(vocabSection);
  });
});
