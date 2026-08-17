import { useState, useRef, useEffect } from 'react';

interface InlineConfirmProps {
  trigger: React.ReactNode;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
}

export function InlineConfirm({
  trigger,
  title = '¿Eliminar?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  onConfirm,
  placement = 'right',
}: InlineConfirmProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const placementClasses = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <div className="relative inline-flex" ref={wrapperRef}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{trigger}</div>

      {open && (
        <div
          className={`absolute z-50 w-52 bg-surface border border-gray-200/10 dark:border-gray-700/50 rounded-xl shadow-xl shadow-black/20 p-3 animate-in fade-in zoom-in-95 duration-150 ${placementClasses[placement]}`}
        >
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{message}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleConfirm}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                confirmVariant === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-gray-200/20 dark:border-gray-700/50 text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
