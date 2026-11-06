import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Crosshair,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface ControlsProps {
  isCameraActive: boolean;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onCaptureAndDetect: () => void;
  onFileUpload: (file: File) => void;
  isLiveActive: boolean;
  onToggleLive: () => void;
  isDetecting: boolean;
  detectionCount?: number;
  statusMessage?: string;
  threshold?: number;
  onThresholdChange?: (val: number) => void;
  hasMedia: boolean;
  isModelReady: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  isCameraActive,
  onToggleCamera,
  onFlipCamera,
  onCaptureAndDetect,
  onFileUpload,
  isLiveActive,
  onToggleLive,
  isDetecting,
  hasMedia,
  isModelReady,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // Detect whether device has multiple cameras (e.g. front/back)
  useEffect(() => {
    let isMounted = true;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (!isMounted) return;
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          if (isMounted) setHasMultipleCameras(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isCameraActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="w-full bg-white/85 dark:bg-[#1C1B19]/85 backdrop-blur-[12px] rounded-[20px] p-3 border border-white/60 dark:border-[#3A3934]/80 shadow-md transition-colors"
      role="toolbar"
      aria-label="Camera and detection controls"
    >
      {/* Hidden File Input with Accessible Label */}
      <label htmlFor="photo-file-input" className="sr-only">
        Upload photo for Chinese vocabulary detection
      </label>
      <input
        id="photo-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      {/* Responsive layout: 2-column grid on < 640px, flex-wrap on sm and up */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
        {/* 1. Stop / Start Camera Button (Outlined pill) */}
        <button
          type="button"
          onClick={onToggleCamera}
          className="col-span-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-gray-100/90 hover:bg-gray-200/90 dark:bg-[#2A2926] dark:hover:bg-[#34322E] text-[#1D1D1B] dark:text-[#F2F1EC] border border-[#E5E7EB] dark:border-[#3A3934] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F]"
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4 text-[#C0392B] shrink-0" aria-hidden="true" />
              <span>Stop camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-[#1D1D1B] dark:text-[#F2F1EC] shrink-0" aria-hidden="true" />
              <span>Start camera</span>
            </>
          )}
        </button>

        {/* 2. Switch Camera Button (Icon-only circular, 44px, shown only when multiple cameras exist) */}
        {hasMultipleCameras && isCameraActive && (
          <button
            type="button"
            onClick={onFlipCamera}
            aria-label="Switch camera"
            title="Switch camera"
            className="w-11 h-11 shrink-0 rounded-full bg-gray-100/90 hover:bg-gray-200/90 dark:bg-[#2A2926] dark:hover:bg-[#34322E] text-[#1D1D1B] dark:text-[#F2F1EC] border border-[#E5E7EB] dark:border-[#3A3934] inline-flex items-center justify-center transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* 3. Capture & Detect Button (Solid Red Pill) */}
        <button
          type="button"
          onClick={onCaptureAndDetect}
          disabled={!hasMedia || isDetecting || !isModelReady}
          title={
            !isModelReady
              ? 'Model unavailable'
              : !hasMedia
              ? 'Start camera or upload photo first'
              : 'Capture frame and detect objects'
          }
          className={`col-span-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] ${
            !hasMedia || isDetecting || !isModelReady
              ? 'bg-gray-200/80 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-transparent'
              : 'bg-gradient-to-r from-[#E5674F] to-[#C0392B] text-white shadow-sm shadow-[#E5674F]/25 hover:brightness-105'
          }`}
        >
          <Crosshair
            className={`w-4 h-4 shrink-0 ${isDetecting ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>Capture & detect</span>
        </button>

        {/* 4. Upload Photo Button (Solid Red Pill) */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={!isModelReady}
          title={!isModelReady ? 'Model unavailable' : 'Upload photo from device'}
          className={`col-span-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] ${
            !isModelReady
              ? 'bg-gray-200/80 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-transparent'
              : 'bg-gradient-to-r from-[#E5674F] to-[#C0392B] text-white shadow-sm shadow-[#E5674F]/25 hover:brightness-105'
          }`}
        >
          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Upload photo</span>
        </button>

        {/* 5. Live Detect Switch (Pushed to right with margin-left: auto) */}
        <div className="col-span-2 sm:col-span-auto sm:ml-auto flex items-center justify-between sm:justify-end gap-2.5 min-h-[44px] pl-2 pr-1">
          <label
            htmlFor="live-detect-switch"
            className="text-xs sm:text-sm font-medium text-[#1D1D1B] dark:text-[#F2F1EC] cursor-pointer select-none"
          >
            Live detect
          </label>
          <button
            id="live-detect-switch"
            type="button"
            role="switch"
            aria-checked={isLiveActive}
            disabled={!isCameraActive || !isModelReady}
            onClick={onToggleLive}
            title={
              !isCameraActive
                ? 'Start camera to enable live detection'
                : !isModelReady
                ? 'Model unavailable'
                : 'Toggle real-time live detection'
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] ${
              !isCameraActive || !isModelReady
                ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-60'
                : isLiveActive
                ? 'bg-[#E5674F]'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span className="sr-only">Toggle live detection</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isLiveActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
