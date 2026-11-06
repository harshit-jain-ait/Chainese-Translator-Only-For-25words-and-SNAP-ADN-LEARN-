export interface StageLetterbox {
  scale: number;
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
}

export interface DisplayBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelPosition {
  x: number;
  y: number;
  isFlippedBelow: boolean;
}

/**
 * Calculates the exact rendered dimensions and letterbox padding
 * for an image/video displayed inside a container with `object-fit: contain`.
 */
export function calculateLetterbox(
  imageWidth: number,
  imageHeight: number,
  stageWidth: number,
  stageHeight: number
): StageLetterbox {
  if (imageWidth <= 0 || imageHeight <= 0 || stageWidth <= 0 || stageHeight <= 0) {
    return { scale: 1, renderedWidth: stageWidth, renderedHeight: stageHeight, offsetX: 0, offsetY: 0 };
  }

  const scale = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const offsetX = (stageWidth - renderedWidth) / 2;
  const offsetY = (stageHeight - renderedHeight) / 2;

  return {
    scale,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
  };
}

/**
 * Maps an image pixel bounding box [x1, y1, x2, y2] to the stage viewport
 * taking into account scale and letterbox offsets.
 */
export function mapBoxToStage(
  box: [number, number, number, number],
  letterbox: StageLetterbox
): DisplayBox {
  const [x1, y1, x2, y2] = box;
  const { scale, offsetX, offsetY } = letterbox;

  const displayX = offsetX + (x1 * scale);
  const displayY = offsetY + (y1 * scale);
  const displayWidth = Math.max(0, (x2 - x1) * scale);
  const displayHeight = Math.max(0, (y2 - y1) * scale);

  return {
    x: Math.round(displayX * 10) / 10,
    y: Math.round(displayY * 10) / 10,
    width: Math.round(displayWidth * 10) / 10,
    height: Math.round(displayHeight * 10) / 10,
  };
}

/**
 * Computes chip badge label position:
 * - Sits directly above the box by default
 * - Flips below the box if there is insufficient room at the top
 * - Clamps horizontally within stage bounds
 */
export function computeLabelPosition(
  box: DisplayBox,
  badgeWidth: number,
  badgeHeight: number,
  stageWidth: number,
  stageHeight: number,
  margin: number = 4
): LabelPosition {
  let isFlippedBelow = false;

  // Try placing above the box
  let y = box.y - badgeHeight - margin;

  // If there is no room above the box, flip below
  if (y < margin) {
    y = box.y + box.height + margin;
    isFlippedBelow = true;

    // If flipped below and exceeds stage bottom, clamp to bottom margin
    if (y + badgeHeight > stageHeight - margin) {
      y = Math.max(margin, stageHeight - badgeHeight - margin);
    }
  }

  // Horizontal positioning: align to left edge of box, clamped within stage
  let x = box.x;
  const minX = margin;
  const maxX = Math.max(margin, stageWidth - badgeWidth - margin);
  x = Math.max(minX, Math.min(x, maxX));

  return {
    x: Math.round(x),
    y: Math.round(y),
    isFlippedBelow,
  };
}

