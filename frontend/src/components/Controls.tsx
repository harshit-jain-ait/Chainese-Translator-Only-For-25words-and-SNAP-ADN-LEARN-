import React, { useRef } from 'react';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input value so choosing the exact same file again still fires onChange
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
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

      {/* Main Controls Action Bar */}
      <div className="w-full bg-white dark:bg-[#1A1C20] p-2 sm:p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-2 transition-colors">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Start/Stop Camera */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E5674F] ${
              isCameraActive
                ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                : 'bg-[#E5674F] hover:bg-[#D3533B] text-white shadow-sm shadow-[#E5674F]/25'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4 text-red-500" />
                <span>Stop camera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start camera</span>
              </>
            )}
          </button>

          {/* Flip camera (active only when camera is running) */}
          {isCameraActive && (
            <button
              type="button"
              onClick={onFlipCamera}
              title="Flip between front and rear cameras"
              aria-label="Flip camera"
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#E5674F]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Capture & Detect */}
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
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E5674F] ${
              !hasMedia || isDetecting || !isModelReady
                ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-800'
                : 'bg-[#E5674F] hover:bg-[#D3533B] text-white shadow-sm shadow-[#E5674F]/25'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>Capture & detect</span>
          </button>

          {/* Upload photo */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!isModelReady}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E5674F] ${
              !isModelReady
                ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-[#E5674F] hover:bg-[#D3533B] text-white shadow-[#E5674F]/25'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload photo</span>
          </button>
        </div>

        {/* Right Toggle: Live Detect Switch */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          <label
            htmlFor="live-detect-switch"
            className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
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
              !isModelReady
                ? 'Model unavailable'
                : !isCameraActive
                ? 'Start the camera first to enable live detection'
                : isLiveActive
                ? 'Pause live detection'
                : 'Start continuous live detection (~1.5s)'
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E5674F] ${
              !isCameraActive || !isModelReady
                ? 'bg-gray-200 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                : isLiveActive
                ? 'bg-[#E5674F]'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span
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
