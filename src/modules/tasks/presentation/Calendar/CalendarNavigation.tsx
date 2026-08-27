interface Props {
    title: string;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    prevLabel?: string;
    nextLabel?: string;
}

const chevronClass = 'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-lg leading-none text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer';
const sideLabelClass = 'hidden sm:inline-flex items-center px-2 h-8 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer';

export default function CalendarNavigation({ title, onPrev, onNext, onToday, prevLabel, nextLabel }: Props) {
    return (
        <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
            <button onClick={onPrev} aria-label="Anterior" className={chevronClass}>‹</button>
            {prevLabel && (
                <button onClick={onPrev} className={sideLabelClass}>{prevLabel}</button>
            )}
            <h2 className="text-sm lg:text-base font-black text-text-primary px-2 lg:min-w-[9rem] text-center">
                {title}
            </h2>
            {nextLabel && (
                <button onClick={onNext} className={sideLabelClass}>{nextLabel}</button>
            )}
            <button onClick={onNext} aria-label="Siguiente" className={chevronClass}>›</button>
            <button
                onClick={onToday}
                className="ml-1 px-3 h-8 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
                Hoy
            </button>
        </div>
    );
}