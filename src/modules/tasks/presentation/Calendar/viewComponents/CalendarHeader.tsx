import { useState, type ReactNode } from 'react';
import { MONTH_LABELS } from '../calendarDateUtils';

interface Props {
    title: string;
    onPrev?: () => void;
    onNext?: () => void;
    onToday?: () => void;
    leading?: ReactNode;
    actions?: ReactNode;
    variant?: 'default' | 'centered';
    monthYear?: { month: number; year: number };
    onMonthChange?: (month: number, year: number) => void;
}

const navChevronClass =
    'w-8 h-8 shrink-0 rounded-lg inline-flex items-center justify-center text-lg leading-none text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer';

function MonthPicker({
    year,
    month,
    onSelect,
    onClose,
}: {
    year: number;
    month: number;
    onSelect: (month: number, year: number) => void;
    onClose: () => void;
}) {
    const [viewYear, setViewYear] = useState(year);

    return (
        <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 z-40 w-72 rounded-2xl border border-gray-100 dark:border-gray-800 bg-surface shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setViewYear((v) => v - 1)} aria-label="Año anterior" className={navChevronClass}>
                    ‹
                </button>
                <span className="text-sm font-black text-text-primary tabular-nums">{viewYear}</span>
                <button onClick={() => setViewYear((v) => v + 1)} aria-label="Año siguiente" className={navChevronClass}>
                    ›
                </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
                {MONTH_LABELS.map((label, index) => {
                    const selected = index === month && viewYear === year;
                    return (
                        <button
                            key={label}
                            onClick={() => {
                                onSelect(index, viewYear);
                                onClose();
                            }}
                            className={`px-1.5 py-1.5 rounded-lg text-xs font-bold truncate transition-colors cursor-pointer ${
                                selected ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-primary/10'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function CalendarHeader({
    title,
    onPrev,
    onNext,
    onToday,
    leading,
    actions,
    variant = 'default',
    monthYear,
    onMonthChange,
}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const now = monthYear ?? { month: new Date().getMonth(), year: new Date().getFullYear() };

    const titleButton = (
        <button
            onClick={() => setPickerOpen((v) => !v)}
            title="Cambiar mes y año"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
        >
            <h2 className="text-sm lg:text-base font-black text-text-primary leading-none">{title}</h2>
            <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );

    const picker = pickerOpen ? (
        <>
            <div className="fixed inset-0 z-30 cursor-default" onClick={() => setPickerOpen(false)} />
            <MonthPicker
                year={now.year}
                month={now.month}
                onSelect={(month, year) => onMonthChange?.(month, year)}
                onClose={() => setPickerOpen(false)}
            />
        </>
    ) : null;

    if (variant === 'centered') {
        return (
            <div className="relative flex items-center justify-between">
                {leading}
                <div className="absolute left-1/2 -translate-x-1/2">{titleButton}</div>
                <div className="flex items-center gap-2 ml-auto">
                    {onToday && (
                        <button
                            onClick={onToday}
                            title="Ir a hoy"
                            aria-label="Ir a hoy"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </button>
                    )}
                    {actions}
                </div>
                {picker}
            </div>
        );
    }

    return (
        <div className="relative flex items-center gap-1 lg:gap-2 flex-wrap">
            {onPrev && (
                <button onClick={onPrev} aria-label="Anterior" className={navChevronClass}>
                    ‹
                </button>
            )}
            {titleButton}
            {onNext && (
                <button onClick={onNext} aria-label="Siguiente" className={navChevronClass}>
                    ›
                </button>
            )}
            {onToday && (
                <button
                    onClick={onToday}
                    className="ml-1 px-3 h-8 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                    Hoy
                </button>
            )}
            {actions}
            {picker}
        </div>
    );
}