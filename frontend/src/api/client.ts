import { ApiError, DetectResponse, HealthResponse, VocabItem } from '../types';

export class DetectorApiError extends Error implements ApiError {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'DetectorApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Resolves an API path against import.meta.env.VITE_API_BASE.
 * Strips trailing slashes from the base and falls back to relative paths when unset.
 */
export function getApiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

async function parseErrorResponse(response: Response): Promise<DetectorApiError> {
  const status = response.status;
  let code = 'HTTP_ERROR';
  let message = `Server error (${status})`;

  try {
    const data = await response.json();
    if (data && typeof data === 'object') {
      if (data.error && typeof data.error === 'object') {
        code = data.error.code || code;
        message = data.error.message || message;
      } else if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
    }
  } catch {
    // Non-JSON response body
  }

  // Map known status codes to clear, friendly user messages if default message was not specific
  switch (status) {
    case 503:
      code = 'MODEL_UNAVAILABLE';
      if (!message || message.startsWith('Server error')) {
        message = 'Model is currently initializing or unavailable. Please wait a moment and try again.';
      }
      break;
    case 413:
      code = 'FILE_TOO_LARGE';
      message = 'Image file is too large. Maximum allowed size is 10 MB.';
      break;
    case 400:
      code = 'INVALID_IMAGE';
      if (!message || message.startsWith('Server error')) {
        message = 'Unsupported or corrupted image file. Please use JPEG, PNG, or WebP.';
      }
      break;
    case 422:
      code = 'VALIDATION_ERROR';
      if (!message || message.startsWith('Server error')) {
        message = 'Invalid request parameters.';
      }
      break;
  }

  return new DetectorApiError(message, code, status);
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  try {
    const res = await fetch(getApiUrl('/api/health'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return (await res.json()) as HealthResponse;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof DetectorApiError) {
      throw err;
    }
    throw new DetectorApiError(
      'Cannot connect to backend server. Please verify the service is running.',
      'NETWORK_ERROR'
    );
  }
}

export async function getVocab(signal?: AbortSignal): Promise<VocabItem[]> {
  try {
    const res = await fetch(getApiUrl('/api/vocab'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return (await res.json()) as VocabItem[];
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof DetectorApiError) {
      throw err;
    }
    throw new DetectorApiError(
      'Failed to load vocabulary list from server.',
      'NETWORK_ERROR'
    );
  }
}

export async function detectObjects(
  file: Blob,
  threshold: number = 0.50,
  signal?: AbortSignal
): Promise<DetectResponse> {
  const formData = new FormData();
  formData.append('file', file, 'target.jpg');
  formData.append('threshold', threshold.toString());

  try {
    const res = await fetch(getApiUrl('/api/detect'), {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return (await res.json()) as DetectResponse;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof DetectorApiError) {
      throw err;
    }
    throw new DetectorApiError(
      'Network connection failed during detection request.',
      'NETWORK_ERROR'
    );
  }
}

