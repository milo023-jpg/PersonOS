import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  label: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, label, placement = 'bottom' }: TooltipProps) {
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group/tooltip inline-flex">
      {children}
      <span
        className={`absolute ${placementClasses[placement]} pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-75 z-[100] whitespace-nowrap`}
      >
        <span className="block px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11px] font-medium rounded-md shadow-lg">
          {label}
        </span>
      </span>
    </div>
  );
}
