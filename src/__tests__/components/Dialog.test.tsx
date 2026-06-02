import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dialog } from '../../components/Dialog/Dialog';
import { MockI18nProvider } from '../helpers/mockI18n';

describe('Dialog', () => {
  it('renders niet wanneer isOpen false is', () => {
    render(
      <MockI18nProvider>
        <Dialog isOpen={false} onClose={vi.fn()} title="Test" actions={<button>Actie</button>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rendert titel en inhoud wanneer isOpen true is', () => {
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={vi.fn()} title="Test Titel" actions={<button>Actie</button>}>
          <p>Dialog inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Titel')).toBeInTheDocument();
    expect(screen.getByText('Dialog inhoud')).toBeInTheDocument();
  });

  it('roept onClose aan bij klik op overlay', () => {
    const onClose = vi.fn();
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={onClose} title="Test" actions={<button>Actie</button>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    const overlay = document.querySelector('.dialog-overlay');
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalled();
  });

  it('roept onClose aan bij Escape toets', () => {
    const onClose = vi.fn();
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={onClose} title="Test" actions={<button>Actie</button>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('rendert actieknoppen', () => {
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={vi.fn()} title="Test" actions={<><button>Annuleer</button><button>Bevestig</button></>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    expect(screen.getByText('Annuleer')).toBeInTheDocument();
    expect(screen.getByText('Bevestig')).toBeInTheDocument();
  });

  it('verplaatst focus naar de eerste knop bij openen en herstelt focus bij sluiten', async () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <div>
        <button data-testid="trigger">Open dialog</button>
        <Dialog isOpen={false} onClose={onClose} title="Test" actions={<button>Sluit</button>}>
          <p>Inhoud</p>
        </Dialog>
      </div>,
    );

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(
      <div>
        <button data-testid="trigger">Open dialog</button>
        <Dialog isOpen={true} onClose={onClose} title="Test" actions={<button>Sluit</button>}>
          <p>Inhoud</p>
        </Dialog>
      </div>,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText('Sluit'));
    });

    rerender(
      <div>
        <button data-testid="trigger">Open dialog</button>
        <Dialog isOpen={false} onClose={onClose} title="Test" actions={<button>Sluit</button>}>
          <p>Inhoud</p>
        </Dialog>
      </div>,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('sluit niet bij klik binnen de dialog box', () => {
    const onClose = vi.fn();
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={onClose} title="Test" actions={<button>Actie</button>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    fireEvent.click(screen.getByText('Inhoud'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('houdt focus binnen de dialog bij Tab en Shift Tab', async () => {
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={vi.fn()} title="Test" actions={<><button>Eerste</button><button>Tweede</button></>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    const first = screen.getByText('Eerste');
    const last = screen.getByText('Tweede');

    await waitFor(() => {
      expect(document.activeElement).toBe(first);
    });

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('negeert andere toetsen en Tab zonder focusbare elementen', () => {
    const onClose = vi.fn();
    render(
      <MockI18nProvider>
        <Dialog isOpen={true} onClose={onClose} title="Test" actions={<span>Geen actie</span>}>
          <p>Inhoud</p>
        </Dialog>
      </MockI18nProvider>,
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
