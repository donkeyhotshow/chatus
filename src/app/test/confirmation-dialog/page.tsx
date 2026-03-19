'use client';

import { useRef, useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

export default function ConfirmationDialogTestPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<'confirmed' | 'cancelled' | null>(null);
  // Use a ref so handleClose can read the latest value within the same event flush
  const didConfirmRef = useRef(false);

  const handleOpen = () => {
    didConfirmRef.current = false;
    setResult(null);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    didConfirmRef.current = true;
    setResult('confirmed');
  };

  const handleClose = () => {
    if (!didConfirmRef.current) {
      setResult('cancelled');
    }
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '40px', background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1>ConfirmationDialog Test Page</h1>

      {/* Background content to verify overlay blocks interaction */}
      <p data-testid="background-text">Background content</p>

      <button
        data-testid="open-dialog-btn"
        onClick={handleOpen}
        style={{
          padding: '12px 24px',
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '16px',
        }}
      >
        Open Dialog
      </button>

      {result !== null && (
        <p data-testid="result">{result}</p>
      )}

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete item"
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
