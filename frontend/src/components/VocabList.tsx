import React from 'react';
import { VocabItem } from '../types';
import { VocabModal } from './VocabModal';

interface VocabListProps {
  isOpen: boolean;
  onClose: () => void;
  cachedVocab: VocabItem[];
  onVocabLoaded?: (list: VocabItem[]) => void;
  activeId?: number | null;
  onError?: (message: string) => void;
}

/**
 * VocabList: Backwards-compatible wrapper around the new VocabModal dialog.
 */
export const VocabList: React.FC<VocabListProps> = ({
  isOpen,
  onClose,
  cachedVocab,
  activeId,
  onError,
}) => {
  return (
    <VocabModal
      open={isOpen}
      onClose={onClose}
      vocab={cachedVocab}
      activeId={activeId}
      onError={onError}
    />
  );
};

export default VocabList;
