import React from 'react';
import { Detection } from '../types';
import {
  calculateLetterbox,
  mapBoxToStage,
  computeLabelPosition,
} from '../utils/coordinateMapping';

interface OverlayLayerProps {
  detections: Detection[];
  imageDimensions: { width: number; height: number };
  stageDimensions: { width: number; height: number };
  selectedVocabId: number | null;
  onSelectDetection: (id: number | null) => void;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  detections,
  imageDimensions,
  stageDimensions,
  selectedVocabId,
  onSelectDetection,
}) => {
  if (detections.length === 0 || stageDimensions.width === 0 || stageDimensions.height === 0) {
    return null;
  }

  const letterbox = calculateLetterbox(
    imageDimensions.width,
    imageDimensions.height,
    stageDimensions.width,
    stageDimensions.height
  );

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
      width={stageDimensions.width}
      height={stageDimensions.height}
      viewBox={`0 0 ${stageDimensions.width} ${stageDimensions.height}`}
    >
      <defs>
        <filter id="box-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#E5674F" floodOpacity="0.45" />
        </filter>
        <filter id="chip-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {detections.map((det, idx) => {
        const displayBox = mapBoxToStage(det.box, letterbox);
        const isSelected = selectedVocabId === det.vocab_id;

        // Chip size based on text length
        const labelText = `${det.hanzi} ${det.pinyin} · ${det.en}`;
        const fontSize = 12;
        const charWidth = 7.5;
        const chipWidth = Math.min(
          stageDimensions.width - 16,
          Math.max(120, labelText.length * charWidth + 24)
        );
        const chipHeight = 26;

        const labelPos = computeLabelPosition(
          displayBox,
          chipWidth,
          chipHeight,
          stageDimensions.width,
          stageDimensions.height
        );

        return (
          <g
            key={`${det.vocab_id}-${idx}`}
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDetection(isSelected ? null : det.vocab_id);
            }}
          >
            {/* Bounding Box Outline */}
            <rect
              x={displayBox.x}
              y={displayBox.y}
              width={displayBox.width}
              height={displayBox.height}
              rx={6}
              ry={6}
              fill={isSelected ? 'rgba(229, 103, 79, 0.20)' : 'rgba(229, 103, 79, 0.08)'}
              stroke={isSelected ? '#FF876E' : '#E5674F'}
              strokeWidth={isSelected ? 3 : 2}
              filter="url(#box-glow)"
            />

            {/* Corner Bracket Accents for Sharp Visual Alignment */}
            <path
              d={`M ${displayBox.x} ${displayBox.y + 10} L ${displayBox.x} ${displayBox.y} L ${displayBox.x + 10} ${displayBox.y}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d={`M ${displayBox.x + displayBox.width - 10} ${displayBox.y + displayBox.height} L ${displayBox.x + displayBox.width} ${displayBox.y + displayBox.height} L ${displayBox.x + displayBox.width} ${displayBox.y + displayBox.height - 10}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Label Chip */}
            <g filter="url(#chip-shadow)">
              <rect
                x={labelPos.x}
                y={labelPos.y}
                width={chipWidth}
                height={chipHeight}
                rx={13}
                ry={13}
                fill={isSelected ? '#A93226' : '#C0392B'}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1}
              />
              <text
                x={labelPos.x + chipWidth / 2}
                y={labelPos.y + chipHeight / 2 + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="'Noto Sans SC', system-ui, sans-serif"
                fontWeight="700"
                fontSize={`${fontSize}px`}
                letterSpacing="0.02em"
              >
                {labelText}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

