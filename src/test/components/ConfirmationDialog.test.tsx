import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { MotionGlobalConfig } from 'framer-motion';
import {
  ConfirmationDialog,
  ConfirmationProvider,
  useConfirmation,
} from '@/components/ui/ConfirmationDialog';

// ---------------------------------------------------------------------------
// Test environment setup – minimal stubs, real implementations
// ---------------------------------------------------------------------------

// Stub animation TIMING only: the real framer-motion code runs but every
// animation has duration 0, so AnimatePresence exits are synchronous.
// This is NOT a full mock – module code is unchanged.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;

  // FocusTrap filters focusable elements by `el.offsetParent !== null`.
  // jsdom has no layout engine, so offsetParent is always null, which makes
  // FocusTrap find zero focusable elements and skip all focus management.
  // Stub it so FocusTrap operates the same way it does in a real browser.
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get() {
      return document.body;
    },
    configurable: true,
  });
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

// ---------------------------------------------------------------------------
// Stateful wrapper – simulates real usage (trigger button + controlled dialog)
// ---------------------------------------------------------------------------

function StatefulDialog({
  onConfirm,
  title = 'Test title',
  message = 'Test message',
}: {
  onConfirm?: () => void;
  title?: string;
  message?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button data-testid="trigger" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirm ?? (() => {})}
        title={title}
        message={message}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared props for static-rendering tests
// ---------------------------------------------------------------------------

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Delete item',
  message: 'Are you sure you want to delete this item?',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// ConfirmationDialog – DOM rendering
// ---------------------------------------------------------------------------

describe('ConfirmationDialog', () => {
  describe('DOM rendering', () => {
    it('renders title and message when isOpen=true', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText('Delete item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('has role="alertdialog" and aria-modal="true"', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('aria-labelledby and aria-describedby are present', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('aria-labelledby target contains the title text', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const labelEl = document.getElementById('dialog-title');
      expect(labelEl).toBeInTheDocument();
      expect(labelEl).toHaveTextContent('Delete item');
    });

    it('aria-describedby target contains the message text', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const descEl = document.getElementById('dialog-description');
      expect(descEl).toBeInTheDocument();
      expect(descEl).toHaveTextContent('Are you sure you want to delete this item?');
    });

    it('renders default confirm and cancel button text', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText('Подтвердить')).toBeInTheDocument();
      expect(screen.getByText('Отмена')).toBeInTheDocument();
    });

    it('renders custom confirm and cancel button text', () => {
      render(
        <ConfirmationDialog {...defaultProps} confirmText="Yes, delete" cancelText="No, keep" />
      );
      expect(screen.getByText('Yes, delete')).toBeInTheDocument();
      expect(screen.getByText('No, keep')).toBeInTheDocument();
    });

    it('FocusTrap renders its container with data-focus-trap="active"', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(document.querySelector('[data-focus-trap="active"]')).toBeInTheDocument();
    });

    it('overlay has aria-hidden="true" to hide it from screen readers', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional rendering
  // ---------------------------------------------------------------------------

  describe('conditional rendering', () => {
    it('does not render dialog content when isOpen=false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.queryByText('Delete item')).toBeNull();
    });

    it('dialog appears when isOpen changes from false → true', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).toBeNull();

      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('dialog is removed from DOM when isOpen changes from true → false', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // No duplication
  // ---------------------------------------------------------------------------

  describe('no duplication', () => {
    it('renders exactly one alertdialog', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    });

    it('renders exactly one title element', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getAllByText('Delete item')).toHaveLength(1);
    });

    it('rapid open/close/open leaves exactly one dialog in DOM', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Flow 1: open → confirm
  // ---------------------------------------------------------------------------

  describe('Flow 1 – open → confirm', () => {
    it('dialog is visible after trigger click', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('clicking confirm calls onConfirm once', async () => {
      const onConfirm = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Подтвердить'));
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('clicking confirm calls onClose', async () => {
      const onClose = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Подтвердить'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dialog is removed from DOM after confirm (stateful)', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('Подтвердить'));
      });
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });

    it('focus returns to trigger element after confirm', async () => {
      render(<StatefulDialog />);
      const trigger = screen.getByTestId('trigger');
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      await act(async () => {
        fireEvent.click(trigger);
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('Подтвердить'));
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Flow 2: open → cancel
  // ---------------------------------------------------------------------------

  describe('Flow 2 – open → cancel', () => {
    it('clicking cancel does NOT call onConfirm', async () => {
      const onConfirm = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Отмена'));
      });
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('clicking cancel calls onClose', async () => {
      const onClose = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Отмена'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dialog is removed from DOM after cancel (stateful)', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('Отмена'));
      });
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });

    it('focus returns to trigger element after cancel', async () => {
      render(<StatefulDialog />);
      const trigger = screen.getByTestId('trigger');
      trigger.focus();

      await act(async () => {
        fireEvent.click(trigger);
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('Отмена'));
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });

    it('clicking close (X) button calls onClose and not onConfirm', async () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);
      await act(async () => {
        fireEvent.click(screen.getByLabelText('Закрыть'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Flow 3: open → Escape key
  // ---------------------------------------------------------------------------

  describe('Flow 3 – open → Escape key', () => {
    it('pressing Escape calls onClose', async () => {
      const onClose = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const dialog = screen.getByRole('alertdialog');
      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Escape' });
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dialog is removed from DOM after Escape (stateful)', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const dialog = screen.getByRole('alertdialog');
      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Escape' });
      });
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });

    it('other keys do NOT call onClose', () => {
      const onClose = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const dialog = screen.getByRole('alertdialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: ' ' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Flow 4: open → overlay click
  // ---------------------------------------------------------------------------

  describe('Flow 4 – open → overlay click', () => {
    it('clicking overlay calls onClose', async () => {
      const onClose = vi.fn();
      const { container } = render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const overlay = container.querySelector('[aria-hidden="true"]');
      expect(overlay).not.toBeNull();
      await act(async () => {
        fireEvent.click(overlay!);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dialog is removed from DOM after overlay click (stateful)', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const overlay = document.querySelector('[aria-hidden="true"]');
      await act(async () => {
        fireEvent.click(overlay!);
      });
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Focus behavior (real FocusTrap with offsetParent stub)
  // ---------------------------------------------------------------------------

  describe('focus behavior', () => {
    it('first focusable element receives focus when dialog opens', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      // FocusTrap focuses the first focusable element (X close button in DOM order)
      await waitFor(() => {
        const firstFocusable = document.querySelector<HTMLElement>(
          '[data-focus-trap="active"] button'
        );
        expect(document.activeElement).toBe(firstFocusable);
      });
    });

    it('FocusTrap container is in the DOM with active state while dialog is open', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() => {
        expect(document.querySelector('[data-focus-trap="active"]')).toBeInTheDocument();
      });
    });

    it('FocusTrap container is removed when dialog closes', async () => {
      render(<StatefulDialog />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger'));
      });
      await waitFor(() =>
        expect(document.querySelector('[data-focus-trap="active"]')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Отмена'));
      });
      await waitFor(() => {
        expect(document.querySelector('[data-focus-trap="active"]')).toBeNull();
      });
    });

    it('Tab key cycles focus back to first button when on the last button', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0]; // X close button
      const lastButton = buttons[buttons.length - 1]; // Confirm button

      // Focus the last button to set document.activeElement
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // FocusTrap listens on document; Tab from last element should wrap to first
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(firstButton);
    });
  });

  // ---------------------------------------------------------------------------
  // Animation edge cases
  // ---------------------------------------------------------------------------

  describe('animation edge cases', () => {
    it('rapid open/close leaves no ghost dialogs in DOM', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      for (let i = 0; i < 5; i++) {
        rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
        rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      }
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });

    it('multiple consecutive opens leave exactly one dialog visible', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      await waitFor(() => {
        expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // DOM correctness
  // ---------------------------------------------------------------------------

  describe('DOM correctness', () => {
    it('no orphan alertdialog nodes remain after close', async () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      await waitFor(() => {
        expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(0);
      });
    });

    it('dialog renders inside the component tree (no React portal to document.body)', () => {
      // ConfirmationDialog uses CSS fixed positioning, NOT a React portal.
      // The element should be a descendant of the render container, not appended
      // directly to document.body.
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      expect(container.querySelector('[role="alertdialog"]')).toBeInTheDocument();
    });

    it('no duplicate dialogs after re-renders with the same isOpen=true', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} />);
      rerender(<ConfirmationDialog {...defaultProps} />);
      rerender(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Dialog types
  // ---------------------------------------------------------------------------

  describe('dialog types', () => {
    it('renders without error for type="danger"', () => {
      render(<ConfirmationDialog {...defaultProps} type="danger" />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders without error for type="warning" (default)', () => {
      render(<ConfirmationDialog {...defaultProps} type="warning" />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders without error for type="info"', () => {
      render(<ConfirmationDialog {...defaultProps} type="info" />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ConfirmationProvider + useConfirmation hook
// ---------------------------------------------------------------------------

describe('ConfirmationProvider', () => {
  it('renders children without crashing', () => {
    render(
      <ConfirmationProvider>
        <span data-testid="child">Hello</span>
      </ConfirmationProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render a dialog before confirm() is called', () => {
    render(
      <ConfirmationProvider>
        <span>child</span>
      </ConfirmationProvider>
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('opens dialog when confirm() is called', async () => {
    function Trigger() {
      const { confirm } = useConfirmation();
      return (
        <button onClick={() => confirm({ title: 'Open?', message: 'Really?' })}>Open</button>
      );
    }

    render(
      <ConfirmationProvider>
        <Trigger />
      </ConfirmationProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Open?')).toBeInTheDocument();
      expect(screen.getByText('Really?')).toBeInTheDocument();
    });
  });

  it('confirm() resolves with true when confirm button is clicked', async () => {
    let result: boolean | undefined;

    function Trigger() {
      const { confirm } = useConfirmation();
      return (
        <button
          onClick={async () => {
            result = await confirm({ title: 'Sure?', message: 'Are you sure?' });
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ConfirmationProvider>
        <Trigger />
      </ConfirmationProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Подтвердить'));
    });

    expect(result).toBe(true);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('confirm() resolves with false when cancel button is clicked', async () => {
    let result: boolean | undefined;

    function Trigger() {
      const { confirm } = useConfirmation();
      return (
        <button
          onClick={async () => {
            result = await confirm({ title: 'Sure?', message: 'Are you sure?' });
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ConfirmationProvider>
        <Trigger />
      </ConfirmationProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Отмена'));
    });

    expect(result).toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('confirm() resolves with false when close (X) button is clicked', async () => {
    let result: boolean | undefined;

    function Trigger() {
      const { confirm } = useConfirmation();
      return (
        <button
          onClick={async () => {
            result = await confirm({ title: 'Sure?', message: 'Are you sure?' });
          }}
        >
          Open
        </button>
      );
    }

    render(
      <ConfirmationProvider>
        <Trigger />
      </ConfirmationProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Закрыть'));
    });

    expect(result).toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('renders only one dialog even when provider wraps multiple children', async () => {
    function Trigger() {
      const { confirm } = useConfirmation();
      return <button onClick={() => confirm({ title: 'Q', message: 'M' })}>Open</button>;
    }

    render(
      <ConfirmationProvider>
        <Trigger />
        <span>other child</span>
      </ConfirmationProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });
    await waitFor(() => {
      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    });
  });

  it('throws when useConfirmation is used outside ConfirmationProvider', () => {
    const originalError = console.error;
    console.error = vi.fn();

    function Bad() {
      useConfirmation();
      return null;
    }

    expect(() => render(<Bad />)).toThrow(
      'useConfirmation must be used within ConfirmationProvider'
    );

    console.error = originalError;
  });
});
