import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsGrid } from '../components/ResultsGrid';
import { deduplicateAndSortDetections } from '../hooks/useDetector';
import { Detection } from '../types';

describe('ResultsGrid Component', () => {
  it('renders idle state when app has not performed detection', () => {
    render(
      <ResultsGrid
        detections={[]}
        selectedVocabId={null}
        onSelectDetection={() => {}}
        status="idle"
        threshold={0.50}
      />
    );

    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Start your device camera or upload a photo/i)).toBeInTheDocument();
  });

  it('renders empty state when detection finished but found 0 objects', () => {
    render(
      <ResultsGrid
        detections={[]}
        selectedVocabId={null}
        onSelectDetection={() => {}}
        status="empty"
        threshold={0.50}
      />
    );

    expect(screen.getByText(/No objects detected/i)).toBeInTheDocument();
    expect(screen.getByText(/No objects matched above the current 50% confidence threshold/i)).toBeInTheDocument();
  });

  it('renders detected object cards with correct details and lang="zh-Hans"', () => {
    const mockDetections: Detection[] = [
      {
        vocab_id: 25,
        en: 'Bottle',
        hanzi: '瓶子',
        pinyin: 'píngzi',
        measure: '个 (gè)',
        score: 0.912,
        box: [100, 100, 200, 300],
      },
      {
        vocab_id: 20,
        en: 'Cup / Mug',
        hanzi: '杯子',
        pinyin: 'bēizi',
        measure: '个 (gè)',
        score: 0.884,
        box: [250, 150, 350, 280],
      },
    ];

    const onSelectMock = vi.fn();

    render(
      <ResultsGrid
        detections={mockDetections}
        selectedVocabId={null}
        onSelectDetection={onSelectMock}
        status="ready"
        threshold={0.50}
      />
    );

    // Verify Hanzi characters
    const hanziBottle = screen.getByText('瓶子');
    expect(hanziBottle).toBeInTheDocument();
    expect(hanziBottle.getAttribute('lang')).toBe('zh-Hans');

    expect(screen.getByText('píngzi')).toBeInTheDocument();
    expect(screen.getByText('Bottle')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();

    // Verify measure word labels
    const measureWordLabels = screen.getAllByText(/量词 \(measure word\):/i);
    expect(measureWordLabels.length).toBe(2);

    // Test selection trigger
    fireEvent.click(hanziBottle);
    expect(onSelectMock).toHaveBeenCalledWith(25);
  });

  it('deduplicates by vocab_id keeping highest score, and sorts descending by score', () => {
    const rawDetections: Detection[] = [
      {
        vocab_id: 1,
        en: 'Book',
        hanzi: '书',
        pinyin: 'shū',
        measure: '本 (běn)',
        score: 0.65,
        box: [10, 10, 50, 50],
      },
      {
        vocab_id: 7,
        en: 'Computer',
        hanzi: '电脑',
        pinyin: 'diànnǎo',
        measure: '台 (tái)',
        score: 0.92,
        box: [100, 100, 400, 400],
      },
      {
        vocab_id: 1,
        en: 'Book',
        hanzi: '书',
        pinyin: 'shū',
        measure: '本 (běn)',
        score: 0.96, // Higher duplicate
        box: [15, 15, 55, 55],
      },
    ];

    const sorted = deduplicateAndSortDetections(rawDetections);

    expect(sorted.length).toBe(2);
    // Highest score first (0.96 Book, then 0.92 Computer)
    expect(sorted[0].vocab_id).toBe(1);
    expect(sorted[0].score).toBe(0.96);
    expect(sorted[1].vocab_id).toBe(7);
    expect(sorted[1].score).toBe(0.92);
  });
});

