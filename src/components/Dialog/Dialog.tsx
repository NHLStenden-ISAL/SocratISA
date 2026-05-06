/**
 * Dialog: herbruikbare toegankelijke popup-component.
 * Bevat focus-trap, Escape-toets en overlay-klik om te sluiten.
 */

import { useEffect, useRef, useCallback } from 'react';

import './Dialog.css';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}

export const Dialog = ({ isOpen, onClose, title, titleId = 'dialog-title', children, actions }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(function manageDialogFocus() {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const firstButton = dialogRef.current?.querySelector('button');
      firstButton?.focus();
    }, 0);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog-box" ref={dialogRef}>
        <h3 id={titleId}>{title}</h3>
        {children}
        <div className="dialog-actions">
          {actions}
        </div>
      </div>
    </div>
  );
};
