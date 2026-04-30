import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
