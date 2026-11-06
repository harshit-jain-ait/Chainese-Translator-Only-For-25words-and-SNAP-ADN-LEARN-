import React from 'react';
import { Navbar } from './Navbar';

interface HeaderProps {
  onOpenVocabModal?: () => void;
  isLiveActive?: boolean;
  theme?: 'light' | 'dark';
  toggleTheme?: (e?: React.MouseEvent) => void;
  backendConnected?: boolean;
}

/**
 * Header component (backwards-compatible wrapper around Navbar).
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenVocabModal,
  theme,
  toggleTheme,
}) => {
  return (
    <Navbar
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenVocabModal={onOpenVocabModal}
    />
  );
};

export default Header;
