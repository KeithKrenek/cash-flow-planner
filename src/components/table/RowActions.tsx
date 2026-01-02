import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
  isDeleting?: boolean;
  className?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showConfigure?: boolean;
}

export function RowActions({
  onEdit,
  onDelete,
  onConfigure,
  isDeleting = false,
  className,
  showEdit = false,
  showDelete = true,
  showConfigure = false,
}: RowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete?.();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleBlur = () => {
    // Reset confirm state after a short delay
    setTimeout(() => setShowConfirm(false), 150);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-1 text-text-muted hover:text-text-primary transition-colors rounded hover:bg-surface-hover"
          title="Edit"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {showConfigure && onConfigure && (
        <button
          onClick={onConfigure}
          className="p-1 text-text-muted hover:text-text-primary transition-colors rounded hover:bg-surface-hover"
          title="Configure recurrence"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {showDelete && onDelete && (
        <button
          onClick={handleDeleteClick}
          onBlur={handleBlur}
          disabled={isDeleting}
          className={cn(
            'p-1 transition-colors rounded',
            showConfirm
              ? 'text-danger bg-danger/10 hover:bg-danger/20'
              : 'text-text-muted hover:text-danger hover:bg-surface-hover',
            isDeleting && 'opacity-50 cursor-not-allowed'
          )}
          title={showConfirm ? 'Click again to confirm' : 'Delete'}
        >
          {isDeleting ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
