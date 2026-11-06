import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHealth, getVocab, detectObjects, DetectorApiError } from '../api/client';

describe('API Client & Error Mapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps HTTP 503 to MODEL_UNAVAILABLE with friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: { code: 'MODEL_UNAVAILABLE', message: 'OWLv2 model failed to load at startup' },
        }),
      } as Response)
    );

    await expect(getHealth()).rejects.toThrow(DetectorApiError);
    try {
      await getHealth();
    } catch (err: any) {
      expect(err.code).toBe('MODEL_UNAVAILABLE');
      expect(err.status).toBe(503);
      expect(err.message).toBe('OWLv2 model failed to load at startup');
    }
  });

  it('maps HTTP 413 to FILE_TOO_LARGE with 10MB message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({ detail: 'File size exceeds maximum allowed limit of 10 MB.' }),
      } as Response)
    );

    const dummyBlob = new Blob(['test'], { type: 'image/jpeg' });
    try {
      await detectObjects(dummyBlob);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('FILE_TOO_LARGE');
      expect(err.status).toBe(413);
      expect(err.message).toContain('10 MB');
    }
  });

  it('maps HTTP 400 to INVALID_IMAGE error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Corrupted or invalid image data' }),
      } as Response)
    );

    const dummyBlob = new Blob(['bad data'], { type: 'image/jpeg' });
    try {
      await detectObjects(dummyBlob);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_IMAGE');
      expect(err.status).toBe(400);
      expect(err.message).toBe('Corrupted or invalid image data');
    }
  });

  it('maps HTTP 422 to VALIDATION_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: [{ msg: 'Threshold must be between 0 and 1' }] }),
      } as Response)
    );

    const dummyBlob = new Blob(['data'], { type: 'image/jpeg' });
    try {
      await detectObjects(dummyBlob);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.status).toBe(422);
      expect(err.message).toContain('Threshold must be between 0 and 1');
    }
  });

  it('maps network disconnect or connection refused to NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    try {
      await getVocab();
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.message).toContain('Failed to load vocabulary');
    }
  });

  it('successfully parses valid health and vocabulary responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          model_loaded: true,
          device: 'mps',
          vocab_count: 25,
        }),
      } as Response)
    );

    const health = await getHealth();
    expect(health.status).toBe('ok');
    expect(health.model_loaded).toBe(true);
    expect(health.vocab_count).toBe(25);
  });
});
