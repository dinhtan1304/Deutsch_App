/**
 * Confirm Delete Modal Component
 * Modal dialog for confirming profile deletion
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../../shared/utils/cn';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  profileName: string;
}

const CONFIRMATION_TEXT = 'DELETE';

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  profileName
}: ConfirmDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText.toUpperCase() === CONFIRMATION_TEXT;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onClose]);

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl bg-white shadow-2xl',
          'animate-scale-in'
        )}
      >
        {/* Warning Icon */}
        <div className="flex justify-center pt-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <h2
            id="delete-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            Delete Profile?
          </h2>

          <p
            id="delete-modal-description"
            className="mt-3 text-gray-600"
          >
            Are you sure you want to delete <strong>{profileName}</strong>'s profile? 
            This action cannot be undone and all your data will be permanently lost.
          </p>

          {/* Warning Box */}
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-left">
            <h3 className="text-sm font-medium text-red-800">
              This will permanently delete:
            </h3>
            <ul className="mt-2 list-inside list-disc text-sm text-red-700">
              <li>Your profile information</li>
              <li>All learning progress</li>
              <li>Saved words and favorites</li>
              <li>Settings and preferences</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="mt-6">
            <label className="block text-left text-sm font-medium text-gray-700">
              Type <span className="font-mono font-bold text-red-600">{CONFIRMATION_TEXT}</span> to confirm
            </label>
            <Input
              className="mt-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${CONFIRMATION_TEXT} here`}
              disabled={isDeleting}
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
              isLoading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}