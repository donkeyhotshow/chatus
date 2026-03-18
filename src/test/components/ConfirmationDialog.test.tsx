import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  ConfirmationDialog,
  ConfirmationProvider,
  useConfirmation,
} from '@/components/ui/ConfirmationDialog';


// Framer-motion renders animated elements with opacity:0 initially and
// transitions them, which is irrelevant in jsdom. Mock it so elements render
// synchronously and with no animation side-effects.
vi.mock('framer-motion', () => {
  const React = require('react');
  const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  AnimatePresence.displayName = 'AnimatePresence';

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown }) => {
          const filtered: Record<string, unknown> = {};
          for (const key of Object.keys(props)) {
            // Drop framer-specific props so they don't end up on DOM nodes
            if (!['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'whileFocus', 'layout', 'layoutId'].includes(key)) {
              filtered[key] = props[key as keyof typeof props];
            }
          }
          return React.createElement(tag, filtered, children);
        };
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  );

  return { AnimatePresence, motion };
});

// FocusTrap uses DOM measurements (offsetParent) that don't work in jsdom;
// replace it with a simple pass-through so it doesn't break rendering.
vi.mock('@/components/accessibility/FocusTrap', () => {
  const React = require('react');
  return {
    FocusTrap: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// ---------------------------------------------------------------------------
// Helpers
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
// ConfirmationDialog – direct usage
// ---------------------------------------------------------------------------

describe('ConfirmationDialog', () => {
  describe('DOM rendering', () => {
    it('renders title and message when open', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Delete item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('renders with role="alertdialog" and aria-modal="true"', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('dialog is labelled and described via aria attributes', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('renders default confirm and cancel button text', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Подтвердить')).toBeInTheDocument();
      expect(screen.getByText('Отмена')).toBeInTheDocument();
    });

    it('renders custom confirm and cancel button text', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmText="Yes, delete"
          cancelText="No, keep"
        />
      );

      expect(screen.getByText('Yes, delete')).toBeInTheDocument();
      expect(screen.getByText('No, keep')).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('does not render dialog content when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.queryByText('Delete item')).toBeNull();
    });

    it('renders dialog content when isOpen changes to true', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).toBeNull();

      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('no duplication', () => {
    it('renders exactly one dialog element', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialogs = screen.getAllByRole('alertdialog');
      expect(dialogs).toHaveLength(1);
    });

    it('renders exactly one title element', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const titles = screen.getAllByText('Delete item');
      expect(titles).toHaveLength(1);
    });
  });

  describe('user interactions – confirm', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Подтвердить'));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after confirm button is clicked', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Подтвердить'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('user interactions – cancel', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Отмена'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when cancel button is clicked', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Отмена'));
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('calls onClose when the X close button is clicked', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Закрыть'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the overlay backdrop is clicked', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);

      // The overlay is the element with aria-hidden="true"
      const overlay = container.querySelector('[aria-hidden="true"]');
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay!);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed on the dialog', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other key presses', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

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
        <button onClick={() => confirm({ title: 'Open?', message: 'Really?' })}>
          Open
        </button>
      );
    }

    render(
      <ConfirmationProvider>
        <Trigger />
      </ConfirmationProvider>
    );

    expect(screen.queryByRole('alertdialog')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('Open'));
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Open?')).toBeInTheDocument();
    expect(screen.getByText('Really?')).toBeInTheDocument();
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
    expect(screen.queryByRole('alertdialog')).toBeNull();
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
    expect(screen.queryByRole('alertdialog')).toBeNull();
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
    expect(screen.queryByRole('alertdialog')).toBeNull();
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

    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
  });

  it('throws when useConfirmation is used outside provider', () => {
    // Suppress the expected React error boundary output
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
