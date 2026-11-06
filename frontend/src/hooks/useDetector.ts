import { useState, useRef, useEffect, useCallback } from 'react';
import { Detection, DetectResponse, AppStatus } from '../types';
import { detectObjects } from '../api/client';

export interface UseDetectorReturn {
  // Media State
  isCameraActive: boolean;
  facingMode: 'environment' | 'user';
  imageSrc: string | null;
  imageDimensions: { width: number; height: number };
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraError: string | null;

  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  flipCamera: () => Promise<void>;
  handleFileUpload: (file: File) => void;
  captureAndDetect: () => Promise<void>;
  clearAll: () => void;

  // Detection & Live State
  status: AppStatus;
  isDetecting: boolean;
  detections: Detection[];
  uniqueDetections: Detection[];
  selectedVocabId: number | null;
  setSelectedVocabId: (id: number | null) => void;
  threshold: number;
  setThreshold: (val: number) => void;
  isLiveActive: boolean;
  toggleLive: () => void;
  statusMessage: string;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function deduplicateAndSortDetections(rawDetections: Detection[]): Detection[] {
  const map = new Map<number, Detection>();
  for (const det of rawDetections) {
    const existing = map.get(det.vocab_id);
    if (!existing || det.score > existing.score) {
      map.set(det.vocab_id, det);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

export function useDetector(
  onShowToast: (type: 'error' | 'success' | 'info', message: string, title?: string) => void
): UseDetectorReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeBlobRef = useRef<Blob | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveIntervalRef = useRef<any>(null);

  // Media state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Detection state
  const [status, setStatus] = useState<AppStatus>('idle');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedVocabId, setSelectedVocabId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(0.50);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready · Point camera or upload a photo');

  // Safely cleanup Object URLs to prevent memory leaks
  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Stop camera tracks and release camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLiveActive(false);
  }, []);

  // Clear previous overlay & results when switching media modes
  const clearResults = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    inFlightRef.current = false;
    setDetections([]);
    setSelectedVocabId(null);
    setStatus('idle');
  }, []);

  const clearAll = useCallback(() => {
    stopCamera();
    cleanupObjectUrl();
    setImageSrc(null);
    activeBlobRef.current = null;
    clearResults();
    setStatusMessage('Ready · Point camera or upload a photo');
  }, [stopCamera, cleanupObjectUrl, clearResults]);

  // Run detection against provided image blob
  const runDetection = useCallback(
    async (blob: Blob): Promise<DetectResponse | null> => {
      if (inFlightRef.current) {
        return null;
      }

      // Abort any previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      inFlightRef.current = true;
      setIsDetecting(true);
      setStatus('loading');

      try {
        const result = await detectObjects(blob, threshold, controller.signal);
        setDetections(result.detections || []);
        setImageDimensions({
          width: result.image_width,
          height: result.image_height,
        });

        const count = (result.detections || []).length;
        if (count > 0) {
          setStatus('ready');
          setStatusMessage(`Ready · ${count} object${count > 1 ? 's' : ''} found`);
        } else {
          setStatus('empty');
          setStatusMessage('No matching objects detected (threshold ≥ 50%)');
        }

        return result;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return null; // Cancelled by newer request
        }
        setStatus('error');
        const message = err.message || 'Detection failed';
        setStatusMessage(`Error: ${message}`);
        onShowToast('error', message, 'Detection Error');
        return null;
      } finally {
        inFlightRef.current = false;
        setIsDetecting(false);
      }
    },
    [threshold, onShowToast]
  );

  // Capture frame from active camera video feed to canvas
  const grabVideoBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !isCameraActive || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Invert horizontally to match the mirrored camera display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.88
      );
    });
  }, [isCameraActive]);

  // Start device camera
  const startCamera = useCallback(
    async (targetFacingMode: 'environment' | 'user' = facingMode) => {
      setCameraError(null);
      stopCamera();
      cleanupObjectUrl();
      setImageSrc(null);
      activeBlobRef.current = null;
      clearResults();

      // Check secure context requirement (HTTPS or localhost)
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        const errorMsg = 'Camera access requires a secure context (HTTPS or localhost).';
        setCameraError(errorMsg);
        onShowToast('error', errorMsg, 'Insecure Context');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera API (getUserMedia) is not supported in this browser.';
        setCameraError(errorMsg);
        onShowToast('error', errorMsg, 'Not Supported');
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: targetFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          const trackSettings = stream.getVideoTracks()[0]?.getSettings();
          const vWidth = trackSettings?.width || videoRef.current.videoWidth || 1280;
          const vHeight = trackSettings?.height || videoRef.current.videoHeight || 720;
          setImageDimensions({ width: vWidth, height: vHeight });
        }

        setIsCameraActive(true);
        setStatusMessage('Camera active · Tap "Capture & detect" or enable "Live detect"');
      } catch (err: any) {
        let msg = 'Could not access device camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission was denied. Please allow camera permissions in browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found on this system. Please upload a photo instead.';
        } else if (err.name === 'NotReadableError') {
          msg = 'Camera is currently in use by another application or process.';
        }
        setCameraError(msg);
        onShowToast('error', msg, 'Camera Access Issue');
        setIsCameraActive(false);
      }
    },
    [facingMode, stopCamera, cleanupObjectUrl, clearResults, onShowToast]
  );

  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Handle client-side file upload
  const handleFileUpload = useCallback(
    (file: File) => {
      // 1. Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        onShowToast(
          'error',
          'Unsupported file type. Please upload a JPEG, PNG, or WebP image.',
          'Invalid File'
        );
        return;
      }

      // 2. Validate file size (max 10 MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        onShowToast(
          'error',
          'File size exceeds 10 MB limit. Please select a smaller photo.',
          'File Too Large'
        );
        return;
      }

      // Clear previous media and results
      stopCamera();
      cleanupObjectUrl();
      clearResults();

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImageSrc(url);
      activeBlobRef.current = file;

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        runDetection(file);
      };
      img.onerror = () => {
        onShowToast('error', 'Could not decode image file.', 'Corrupted Image');
      };
      img.src = url;
    },
    [stopCamera, cleanupObjectUrl, clearResults, runDetection, onShowToast]
  );

  // Capture current video frame and detect
  const captureAndDetect = useCallback(async () => {
    if (isCameraActive) {
      const blob = await grabVideoBlob();
      if (!blob) {
        // Camera may not be fully initialized yet; skip without error
        return;
      }
      activeBlobRef.current = blob;
      await runDetection(blob);
    } else if (activeBlobRef.current) {
      await runDetection(activeBlobRef.current);
    }
  }, [isCameraActive, grabVideoBlob, runDetection]);

  // Toggle Live Detect
  const toggleLive = useCallback(() => {
    if (!isCameraActive) {
      onShowToast('info', 'Please start the camera before enabling live detection.', 'Live Mode');
      return;
    }
    setIsLiveActive((prev) => !prev);
  }, [isCameraActive, onShowToast]);

  // Live detection loop (~1.5s interval with inFlight guard)
  useEffect(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }

    if (isLiveActive && isCameraActive) {
      setStatusMessage('Live · Scanning camera feed (~1.5s)...');

      // Immediate initial frame scan
      (async () => {
        const blob = await grabVideoBlob();
        if (blob) await runDetection(blob);
      })();

      liveIntervalRef.current = setInterval(async () => {
        if (!inFlightRef.current && isCameraActive) {
          const blob = await grabVideoBlob();
          if (blob) {
            await runDetection(blob);
          }
        }
      }, 1500);
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveActive, isCameraActive, grabVideoBlob, runDetection]);

  // Pause live detection when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isLiveActive) {
        setIsLiveActive(false);
        setStatusMessage('Live detect paused (tab inactive)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLiveActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      cleanupObjectUrl();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, [stopCamera, cleanupObjectUrl]);

  const uniqueDetections = deduplicateAndSortDetections(detections);

  return {
    isCameraActive,
    facingMode,
    imageSrc,
    imageDimensions,
    videoRef,
    cameraError,
    startCamera,
    stopCamera,
    flipCamera,
    handleFileUpload,
    captureAndDetect,
    clearAll,
    status,
    isDetecting,
    detections,
    uniqueDetections,
    selectedVocabId,
    setSelectedVocabId,
    threshold,
    setThreshold,
    isLiveActive,
    toggleLive,
    statusMessage,
  };
}
