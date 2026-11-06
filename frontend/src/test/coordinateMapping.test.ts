import { describe, it, expect } from 'vitest';
import {
  calculateLetterbox,
  mapBoxToStage,
  computeLabelPosition,
} from '../utils/coordinateMapping';

describe('Coordinate Mapping & Letterboxing', () => {
  it('correctly calculates pillarboxing when image is taller than stage', () => {
    // Image 1000x2000 (aspect 0.5), Stage 1000x1000 (aspect 1.0)
    // Scale is limited by height: scale = 1000/2000 = 0.5
    // Rendered width = 500, offsetX = (1000 - 500) / 2 = 250
    const letterbox = calculateLetterbox(1000, 2000, 1000, 1000);

    expect(letterbox.scale).toBe(0.5);
    expect(letterbox.renderedWidth).toBe(500);
    expect(letterbox.renderedHeight).toBe(1000);
    expect(letterbox.offsetX).toBe(250);
    expect(letterbox.offsetY).toBe(0);
  });

  it('correctly calculates letterboxing when image is wider than stage', () => {
    // Image 2000x1000 (aspect 2.0), Stage 1000x1000 (aspect 1.0)
    // Scale is limited by width: scale = 1000/2000 = 0.5
    // Rendered height = 500, offsetY = (1000 - 500) / 2 = 250
    const letterbox = calculateLetterbox(2000, 1000, 1000, 1000);

    expect(letterbox.scale).toBe(0.5);
    expect(letterbox.renderedWidth).toBe(1000);
    expect(letterbox.renderedHeight).toBe(500);
    expect(letterbox.offsetX).toBe(0);
    expect(letterbox.offsetY).toBe(250);
  });

  it('maps image pixel box to stage display coordinates taking into account offset and scale', () => {
    // 800x600 image inside 800x600 stage (1:1 scale, 0 offset)
    const letterbox1 = calculateLetterbox(800, 600, 800, 600);
    const box1 = mapBoxToStage([100, 150, 300, 450], letterbox1);
    expect(box1).toEqual({ x: 100, y: 150, width: 200, height: 300 });

    // With 0.5 scale and 100px X offset
    const letterbox2 = {
      scale: 0.5,
      renderedWidth: 400,
      renderedHeight: 300,
      offsetX: 100,
      offsetY: 50,
    };
    const box2 = mapBoxToStage([100, 200, 300, 400], letterbox2);
    // x = 100 + (100 * 0.5) = 150
    // y = 50 + (200 * 0.5) = 150
    // width = (300 - 100) * 0.5 = 100
    // height = (400 - 200) * 0.5 = 100
    expect(box2).toEqual({ x: 150, y: 150, width: 100, height: 100 });
  });

  it('positions label above the box when there is sufficient room', () => {
    const box = { x: 100, y: 100, width: 200, height: 150 };
    const labelPos = computeLabelPosition(box, 120, 26, 800, 600);

    // Default: sits above box (y = 100 - 26 - 4 = 70)
    expect(labelPos.isFlippedBelow).toBe(false);
    expect(labelPos.y).toBe(70);
    expect(labelPos.x).toBe(100);
  });

  it('flips label below the box when box is near the top edge', () => {
    // Box touches the top (y = 10)
    const box = { x: 100, y: 10, width: 200, height: 150 };
    const labelPos = computeLabelPosition(box, 120, 26, 800, 600);

    // Flips below box: y = 10 + 150 + 4 = 164
    expect(labelPos.isFlippedBelow).toBe(true);
    expect(labelPos.y).toBe(164);
  });

  it('clamps label horizontally within stage margins', () => {
    // Box starts right at stage right boundary
    const box = { x: 750, y: 200, width: 100, height: 150 };
    const labelPos = computeLabelPosition(box, 120, 26, 800, 600);

    // Clamped: x + badgeWidth + 4 <= 800 -> maxX = 800 - 120 - 4 = 676
    expect(labelPos.x).toBe(676);
  });
});

