import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
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
      className="relative w-full aspect-[4/3] bg-[#1C1B19] rounded-[16px] overflow-hidden shadow-lg border border-black/20 flex items-center justify-center select-none"
    >
      {/* Corner Viewfinder Brackets */}
      <div
        className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/40 rounded-tl-sm pointer-events-none z-20"
        aria-hidden="true"
      />
      <div
        className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/40 rounded-tr-sm pointer-events-none z-20"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/40 rounded-bl-sm pointer-events-none z-20"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/40 rounded-br-sm pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* 1. Camera Video Feed (mirrored horizontally) */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        style={{ transform: 'scaleX(-1)' }}
        className={`absolute inset-0 w-full h-full object-contain ${
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
          <div className="w-14 h-14 mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 shadow-sm">
            <Camera className="w-7 h-7 stroke-[1.75]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1 tracking-tight">
            Camera Feed
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 font-normal">
            Point your camera at Chinese objects
          </p>
        </div>
      )}

      {/* 4. Camera Error State */}
      {cameraError && !hasMedia && (
        <div className="flex flex-col items-center justify-center p-6 text-center z-10 max-w-sm">
          <div className="w-12 h-12 mb-3 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Camera Unavailable
          </h3>
          <p className="text-xs text-gray-400 mb-4">{cameraError}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onStartCamera}
              className="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5674F]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onUploadClick}
              className="px-3.5 py-1.5 rounded-lg bg-[#E5674F] hover:bg-[#C0392B] text-white text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5674F]"
            >
              Upload Photo
            </button>
          </div>
        </div>
      )}

      {/* 5. SVG Overlay for Bounding Boxes & Hanzi Labels */}
      {hasMedia && stageDimensions.width > 0 && stageDimensions.height > 0 && (
        <OverlayLayer
          detections={detections}
          imageDimensions={imageDimensions}
          stageDimensions={stageDimensions}
          selectedVocabId={selectedVocabId}
          onSelectDetection={onSelectDetection}
        />
      )}

      {/* 6. Processing Indicator */}
      {isDetecting && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20 shadow-md">
          <div className="w-2 h-2 rounded-full bg-[#E5674F] animate-ping" />
          <span>Detecting...</span>
        </div>
      )}
    </div>
  );
};
