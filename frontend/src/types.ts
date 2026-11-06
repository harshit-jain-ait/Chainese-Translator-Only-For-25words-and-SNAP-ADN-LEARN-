export interface VocabItem {
  id: number;
  en: string;
  hanzi: string;
  pinyin: string;
  measure: string;
  detect_as: string;
  category?: string;
}

export interface Detection {
  vocab_id: number;
  en: string;
  hanzi: string;
  pinyin: string;
  measure: string;
  score: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2] in image pixel coordinates
}

export interface DetectResponse {
  image_width: number;
  image_height: number;
  detections: Detection[];
}

export interface HealthResponse {
  status: 'ok' | 'unavailable' | string;
  model_loaded: boolean;
  device: string;
  vocab_count: number;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export type AppStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty';

export interface RenderedDetection extends Detection {
  displayBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  labelPosition: {
    x: number;
    y: number;
    isFlippedBelow: boolean;
  };
}
