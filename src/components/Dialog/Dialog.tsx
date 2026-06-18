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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(function manageDialog() {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;

    dialog?.showModal?.();
    if (dialog && !dialog.open) dialog.setAttribute('open', '');
    dialog?.querySelector('button')?.focus();

    return () => {
      dialog?.close?.();
      dialog?.removeAttribute('open');
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="dialog-box"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-content">
        <h3 id={titleId}>{title}</h3>
        {children}
        <div className="dialog-actions">
          {actions}
        </div>
      </div>
    </dialog>
  );
};
