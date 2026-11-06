import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock speech synthesis and speech synthesis utterance in jsdom
if (typeof window !== 'undefined') {
  if (!('speechSynthesis' in window)) {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn(() => []),
      },
      writable: true,
    });
  }

  if (typeof window.SpeechSynthesisUtterance === 'undefined') {
    class MockSpeechSynthesisUtterance {
      text: string;
      lang: string = '';
      rate: number = 1;
      voice: unknown = null;
      constructor(text = '') {
        this.text = text;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  }

  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-audio-url');
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }

  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
}
