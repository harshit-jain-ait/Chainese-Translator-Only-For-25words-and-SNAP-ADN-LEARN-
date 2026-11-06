import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VocabModal } from '../components/VocabModal';
import { getObjectIcon } from '../components/icons/ObjectIcons';
import * as speechModule from '../speech';
import { VocabItem } from '../types';

describe('VocabModal Component', () => {
  const mockVocab: VocabItem[] = [
    {
      id: 1,
      en: 'Book',
      hanzi: '书',
      pinyin: 'shū',
      measure: '本 (běn)',
      detect_as: 'book',
    },
    {
      id: 2,
      en: 'Pen / Pencil',
      hanzi: '笔',
      pinyin: 'bǐ',
      measure: '支 (zhī)',
      detect_as: 'pen',
    },
    {
      id: 6,
      en: 'Mobile Phone',
      hanzi: '手机',
      pinyin: 'shǒujī',
      measure: '部 / 个 (bù / gè)',
      detect_as: 'mobile phone',
    },
    {
      id: 20,
      en: 'Cup / Mug',
      hanzi: '杯子',
      pinyin: 'bēizi',
      measure: '个 (gè)',
      detect_as: 'cup',
    },
  ];

  // 25 items array
  const full25Vocab: VocabItem[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    en: `Item ${i + 1}`,
    hanzi: `词${i + 1}`,
    pinyin: `cí${i + 1}`,
    measure: '个 (gè)',
    detect_as: `item_${i + 1}`,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <VocabModal open={false} onClose={vi.fn()} vocab={mockVocab} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog with the title and "Total Items: 25" when open with 25 items', () => {
    render(<VocabModal open={true} onClose={vi.fn()} vocab={full25Vocab} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('All 25 Vocabulary Words')).toBeInTheDocument();
    expect(screen.getByText('Total Items: 25')).toBeInTheDocument();
  });

  it('search "cup" shows only the matching card, search "手机" shows Mobile Phone, and no match shows empty state', () => {
    render(<VocabModal open={true} onClose={vi.fn()} vocab={mockVocab} />);

    const searchInput = screen.getByPlaceholderText(
      /Search by English, Hanzi, or Pinyin/i
    );

    // Search "cup"
    fireEvent.change(searchInput, { target: { value: 'cup' } });
    expect(screen.getByText('Cup / Mug')).toBeInTheDocument();
    expect(screen.queryByText('Pen / Pencil')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobile Phone')).not.toBeInTheDocument();

    // Search "手机"
    fireEvent.change(searchInput, { target: { value: '手机' } });
    expect(screen.getByText('Mobile Phone')).toBeInTheDocument();
    expect(screen.queryByText('Cup / Mug')).not.toBeInTheDocument();

    // Search non-existent query
    fireEvent.change(searchInput, { target: { value: 'nonexistent123xyz' } });
    expect(screen.getByText('No words match your search.')).toBeInTheDocument();
  });

  it('Escape calls onClose, clicking backdrop calls onClose, and clicking Close button calls onClose', () => {
    const onClose = vi.fn();
    render(
      <VocabModal open={true} onClose={onClose} vocab={mockVocab} />
    );

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(2);
    }

    // Click Close button in footer
    const footerCloseBtn = screen.getByRole('button', { name: /^Close$/i });
    fireEvent.click(footerCloseBtn);
    expect(onClose).toHaveBeenCalledTimes(3);

    // Click top-right header X button
    const headerCloseBtn = screen.getByRole('button', { name: /Close vocabulary/i });
    fireEvent.click(headerCloseBtn);
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it('the active card has aria-current="true" and the speaker button on it is styled as active', () => {
    render(<VocabModal open={true} onClose={vi.fn()} vocab={mockVocab} activeId={6} />);

    const phoneCard = screen.getByRole('article', { current: true });
    expect(phoneCard).toBeInTheDocument();
    expect(phoneCard).toHaveTextContent('Mobile Phone');

    const speakerBtn = screen.getByRole('button', {
      name: 'Play pronunciation of Mobile Phone',
    });
    // Active speaker button has red styling bg-[#DC2626]
    expect(speakerBtn.className).toContain('bg-[#DC2626]');
  });

  it("clicking a card's speaker button calls the speech function once with that card's hanzi, and does not call onClose", async () => {
    const playHanziSpy = vi.spyOn(speechModule, 'playHanzi').mockResolvedValue();
    const onClose = vi.fn();

    render(<VocabModal open={true} onClose={onClose} vocab={mockVocab} />);

    const bookSpeakerBtn = screen.getByRole('button', {
      name: 'Play pronunciation of Book',
    });

    await waitFor(() => {
      fireEvent.click(bookSpeakerBtn);
    });

    expect(playHanziSpy).toHaveBeenCalledWith('书');
    expect(playHanziSpy).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('getObjectIcon returns a non-empty element for every id from 1 to 25 and a fallback for unknown ids', () => {
    for (let id = 1; id <= 25; id++) {
      const icon = getObjectIcon(id);
      expect(icon).toBeTruthy();
    }

    // Unknown ID returns fallback
    const unknownIcon = getObjectIcon(999);
    expect(unknownIcon).toBeTruthy();
  });
});
