import { getApiUrl } from './api/client';

export class SpeechUnavailableError extends Error {
  constructor(message = 'Speech synthesis is not available on this device.') {
    super(message);
    this.name = 'SpeechUnavailableError';
  }
}

export function buildSpeakUrl(text: string): string {
  return getApiUrl('/api/speak?text=' + encodeURIComponent(text));
}

let sharedAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;
let currentBlobUrl: string | null = null;

export function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    if (typeof Audio !== 'undefined') {
      sharedAudio = new Audio();
    } else {
      sharedAudio = {
        play: () => Promise.resolve(),
        pause: () => {},
        src: '',
        currentTime: 0,
      } as unknown as HTMLAudioElement;
    }
  }
  return sharedAudio;
}

export function setAudio(audio: HTMLAudioElement | null): void {
  sharedAudio = audio;
}

export function resetSpeechStateForTesting(): void {
  stopSpeech();
  sharedAudio = null;
}

export function stopSpeech(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
    } catch {
      // Ignore if element is not in playing state
    }
  }

  if (currentBlobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {
      // Ignore
    }
    currentBlobUrl = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

function fallbackWebSpeech(text: string): void {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    throw new SpeechUnavailableError('Speech synthesis is not supported in this browser.');
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;

    try {
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    } catch {
      // Ignore getVoices errors
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (err instanceof SpeechUnavailableError) {
      throw err;
    }
    throw new SpeechUnavailableError(
      err instanceof Error ? err.message : 'Speech synthesis failed'
    );
  }
}

export async function playHanzi(text: string): Promise<void> {
  // Stop any currently playing audio and cancel any previous pending request
  stopSpeech();

  const controller = new AbortController();
  currentAbortController = controller;

  const url = buildSpeakUrl(text);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`TTS server responded with status ${response.status}`);
    }

    const blob = await response.blob();

    if (controller.signal.aborted) {
      return;
    }

    if (currentBlobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(currentBlobUrl);
      } catch {
        // Ignore
      }
      currentBlobUrl = null;
    }

    const blobUrl =
      typeof URL !== 'undefined' && URL.createObjectURL
        ? URL.createObjectURL(blob)
        : url;
    currentBlobUrl = blobUrl;

    const audio = getAudio();
    audio.src = blobUrl;
    await audio.play();
  } catch (err: unknown) {
    // If request was aborted by another call or stopSpeech, do not fallback
    if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      return;
    }

    // Fall back to Web Speech API
    fallbackWebSpeech(text);
  }
}

export const speakHanzi = playHanzi;

