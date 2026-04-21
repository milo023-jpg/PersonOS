import { forwardRef, type HTMLAttributes } from 'react';

type ScrollDirection = 'y' | 'x' | 'both';

interface SystemScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
    direction?: ScrollDirection;
}

function getOverflowClasses(direction: ScrollDirection) {
    if (direction === 'x') return 'overflow-x-auto overflow-y-hidden';
    if (direction === 'both') return 'overflow-auto';
    return 'overflow-y-auto overflow-x-hidden';
}

export const SystemScrollArea = forwardRef<HTMLDivElement, SystemScrollAreaProps>(
    ({ className = '', direction = 'y', ...props }, ref) => {
        const classes = `${getOverflowClasses(direction)} system-scroll ${className}`.trim();
        return <div ref={ref} className={classes} {...props} />;
    }
);

SystemScrollArea.displayName = 'SystemScrollArea';
