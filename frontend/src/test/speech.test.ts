import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildSpeakUrl,
  playHanzi,
  stopSpeech,
  resetSpeechStateForTesting,
  setAudio,
} from '../speech';

describe('Speech Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSpeechStateForTesting();
  });

  afterEach(() => {
    resetSpeechStateForTesting();
    vi.restoreAllMocks();
  });

  describe('buildSpeakUrl', () => {
    it('returns a relative path with properly UTF-8 percent-encoded text', () => {
      const url = buildSpeakUrl('瓶子');
      expect(url).toBe('/api/speak?text=%E7%93%B6%E5%AD%90');
      expect(url.startsWith('/api/speak?text=')).toBe(true);
      expect(url.startsWith('http')).toBe(false);
    });

    it('handles multi-character Chinese phrases with spaces or punctuation', () => {
      const url = buildSpeakUrl('杯子 / 水杯');
      expect(url).toBe('/api/speak?text=%E6%9D%AF%E5%AD%90%20%2F%20%E6%B0%B4%E6%9D%AF');
    });
  });

  describe('playHanzi with backend neural TTS', () => {
    it('uses backend URL on 200 response and plays audio', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockAudio = {
        src: '',
        play: mockPlay,
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as HTMLAudioElement;

      setAudio(mockAudio);

      const fakeBlob = new Blob(['fake-mp3-data'], { type: 'audio/mpeg' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValueOnce(fakeBlob),
      } as unknown as Response);

      await playHanzi('瓶子');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const calledUrl = fetchSpy.mock.calls[0][0];
      expect(calledUrl).toBe('/api/speak?text=%E7%93%B6%E5%AD%90');
      expect(mockAudio.src).toBeTruthy();
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('playHanzi fallback to Web Speech API', () => {
    it('falls back to speechSynthesis when backend returns 503', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as unknown as Response);

      const speakSpy = vi.fn();
      const cancelSpy = vi.fn();
      window.speechSynthesis.speak = speakSpy;
      window.speechSynthesis.cancel = cancelSpy;

      await playHanzi('瓶子');

      expect(speakSpy).toHaveBeenCalledTimes(1);
      const utterance = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
      expect(utterance).toBeDefined();
      expect(utterance.text).toBe('瓶子');
      expect(utterance.lang).toBe('zh-CN');
    });

    it('falls back to speechSynthesis when fetch encounters a network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new TypeError('Failed to fetch (network error)')
      );

      const speakSpy = vi.fn();
      window.speechSynthesis.speak = speakSpy;

      await playHanzi('书');

      expect(speakSpy).toHaveBeenCalledTimes(1);
      const utterance = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
      expect(utterance.text).toBe('书');
      expect(utterance.lang).toBe('zh-CN');
    });

    it('falls back to speechSynthesis when audio.play() rejects (e.g. autoplay policy)', async () => {
      const mockPlay = vi.fn().mockRejectedValueOnce(new Error('NotAllowedError: Autoplay blocked'));
      const mockAudio = {
        src: '',
        play: mockPlay,
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as HTMLAudioElement;

      setAudio(mockAudio);

      const fakeBlob = new Blob(['fake-audio'], { type: 'audio/mpeg' });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValueOnce(fakeBlob),
      } as unknown as Response);

      const speakSpy = vi.fn();
      window.speechSynthesis.speak = speakSpy;

      await playHanzi('杯子');

      expect(speakSpy).toHaveBeenCalledTimes(1);
      const utterance = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
      expect(utterance.text).toBe('杯子');
      expect(utterance.lang).toBe('zh-CN');
    });
  });

  describe('stopSpeech', () => {
    it('aborts pending fetch request and pauses audio and cancels speech synthesis', async () => {
      let abortedSignal: boolean = false;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_url, init) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener('abort', () => {
            abortedSignal = true;
          });
        }
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            const err = new DOMException('The user aborted a request.', 'AbortError');
            reject(err);
          }, 50);
        });
      });

      const mockPause = vi.fn();
      const mockAudio = {
        src: '',
        play: vi.fn(),
        pause: mockPause,
        currentTime: 0,
      } as unknown as HTMLAudioElement;

      setAudio(mockAudio);

      const cancelSpy = vi.fn();
      window.speechSynthesis.cancel = cancelSpy;

      // Start playing
      const playPromise = playHanzi('电脑');

      // Immediately stop
      stopSpeech();

      await playPromise;

      expect(abortedSignal).toBe(true);
      expect(mockPause).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});

