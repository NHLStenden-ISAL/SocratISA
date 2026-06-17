/**
 * Dialog: popup dat een gegeven titel, inhoud en keuze tekst weergeeft.
 */
import { useEffect, useRef } from 'react';

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

  useEffect(function manageDialogFocus() {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;

    const firstButton = dialogRef.current?.querySelector('button');
    firstButton?.focus();

    // Geeft keyboard shortcuts voor de popup navigeren met focus trap
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Popup
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
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
