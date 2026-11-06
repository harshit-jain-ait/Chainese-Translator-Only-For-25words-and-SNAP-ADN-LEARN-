import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';

describe('App Layout and Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
    localStorage.clear();

    // Mock fetch for /api/health and /api/vocab
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', model_loaded: true }),
        } as Response);
      }
      if (url.includes('/api/vocab')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 1,
              en: 'Book',
              hanzi: '书',
              pinyin: 'shū',
              measure: '本 (běn)',
              query: 'book',
            },
          ],
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the controls bar and the results column together', async () => {
    render(<App />);

    // 1. Controls bar is rendered with its role and buttons
    const controlsBar = screen.getByRole('toolbar', {
      name: /Camera and detection controls/i,
    });
    expect(controlsBar).toBeInTheDocument();

    const startCameraBtn = screen.getByRole('button', { name: /Start camera/i });
    expect(startCameraBtn).toBeInTheDocument();

    const captureBtn = screen.getByRole('button', { name: /Capture & detect/i });
    expect(captureBtn).toBeInTheDocument();

    const uploadBtn = screen.getByRole('button', { name: /Upload photo/i });
    expect(uploadBtn).toBeInTheDocument();

    const liveDetectSwitch = screen.getByRole('switch', { name: /Live detect/i });
    expect(liveDetectSwitch).toBeInTheDocument();

    // 2. Results column is rendered with its heading
    const resultsHeading = screen.getByRole('heading', { name: /Results/i, level: 2 });
    expect(resultsHeading).toBeInTheDocument();

    // 3. Both are present in the document at the same time
    expect(controlsBar).toBeVisible();
    expect(resultsHeading).toBeVisible();

    // 4. Initial state text is visible inside the results section
    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });
  });
});
