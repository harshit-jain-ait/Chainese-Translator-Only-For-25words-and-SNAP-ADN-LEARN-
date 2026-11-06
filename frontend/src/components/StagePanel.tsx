import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Detection } from '../types';
import { OverlayLayer } from './OverlayLayer';

interface StagePanelProps {
  imageSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  isDetecting: boolean;
  detections: Detection[];
  imageDimensions: { width: number; height: number };
  selectedVocabId: number | null;
  onSelectDetection: (id: number | null) => void;
  onStartCamera: () => void;
  onUploadClick: () => void;
  cameraError: string | null;
}

export const StagePanel: React.FC<StagePanelProps> = ({
  imageSrc,
  videoRef,
  isCameraActive,
  isDetecting,
  detections,
  imageDimensions,
  selectedVocabId,
  onSelectDetection,
  onStartCamera,
  onUploadClick,
  cameraError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setStageDimensions({
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasMedia = isCameraActive || !!imageSrc;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-h-[520px] bg-gray-950 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center select-none"
    >
      {/* 1. Camera Video Feed (mirrored horizontally) */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        style={{ transform: 'scaleX(-1)' }}
        className={`absolute inset-0 w-full h-full object-contain -scale-x-100 ${
          isCameraActive ? 'block' : 'hidden'
        }`}
      />

      {/* 2. Uploaded / Frozen Photo Image */}
      {!isCameraActive && imageSrc && (
        <img
          src={imageSrc}
          alt="Target object for Chinese vocabulary detection"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* 3. Empty Initial State / Call to Action */}
      {!hasMedia && !cameraError && (
        <div className="flex flex-col items-center justify-center p-6 text-center z-10 max-w-sm">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-[#E5674F] shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5">
            Ready to Explore Vocabulary
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-6">
            Point your camera or upload a photo to identify objects and view their Chinese characters, pinyin, and measure words.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={onStartCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E5674F] hover:bg-[#D3533B] text-white text-xs sm:text-sm font-medium shadow-md shadow-[#E5674F]/25 focus:outline-none focus:ring-2 focus:ring-[#E5674F] active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Start camera</span>
            </button>
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-95 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload photo</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Camera Error State */}
      {cameraError && !hasMedia && (
        <div className="flex flex-col items-center justify-center p-6 text-center z-10 max-w-sm bg-red-950/50 border border-red-800/80 rounded-2xl m-4">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2.5" />
          <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Camera Issue</h3>
          <p className="text-xs text-red-200 mb-4">{cameraError}</p>
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium border border-gray-700"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload photo instead</span>
          </button>
        </div>
      )}

      {/* 5. Precise Scaled Bounding Box Overlay */}
      {hasMedia && (
        <OverlayLayer
          detections={detections}
          imageDimensions={imageDimensions}
          stageDimensions={stageDimensions}
          selectedVocabId={selectedVocabId}
          onSelectDetection={onSelectDetection}
        />
      )}

      {/* 6. In-Progress Detecting Overlay */}
      {isDetecting && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-20 pointer-events-none transition-all">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/75 border border-[#E5674F]/60 text-white text-xs sm:text-sm font-medium shadow-2xl">
            <Loader2 className="w-4 h-4 text-[#E5674F] animate-spin" />
            <span>Detecting vocabulary with OWLv2...</span>
          </div>
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#E5674F] to-transparent animate-pulse top-1/2 transform -translate-y-1/2" />
        </div>
      )}
    </div>
  );
};

