import { getWeekdayLabel, toDateKey } from '../calendarDateUtils';

interface Props {
    weekDays: Date[];
    selectedDate: Date;
    onSelect: (date: Date) => void;
    compact?: boolean;
}

export default function DateSelector({ weekDays, selectedDate, onSelect, compact = false }: Props) {
    const selectedKey = toDateKey(selectedDate);
    const todayKey = toDateKey(new Date());

    return (
        <div className={compact ? "grid grid-cols-7 gap-1 w-full" : "flex items-center gap-2 overflow-x-auto system-scroll pb-1"}>
            {weekDays.map((day) => {
                const key = toDateKey(day);
                const selected = key === selectedKey;
                const isToday = key === todayKey;

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(day)}
                        aria-pressed={selected}
                        title={day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        className={`shrink-0 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            compact ? 'w-full gap-0.5 px-1 py-1.5 rounded-xl' : 'w-14 gap-1 py-2.5'
                        } ${
                            selected
                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/25'
                                : 'bg-surface border-gray-100 dark:border-gray-800 text-text-primary hover:border-primary/40'
                        }`}
                    >
                        <span className={`font-black uppercase tracking-wider ${compact ? 'text-[8px]' : 'text-[10px]'} ${selected ? 'text-white/85' : 'text-text-secondary'}`}>
                            {getWeekdayLabel(day)}
                        </span>
                        <span className={`font-black leading-none ${compact ? 'text-sm' : 'text-lg'}`}>{day.getDate()}</span>
                        <span className={`font-black leading-none ${compact ? 'h-2 text-[8px]' : 'h-2.5 text-[9px]'} ${selected ? 'text-white/85' : isToday ? 'text-primary' : 'text-transparent'}`}>
                            {isToday ? 'Hoy' : '·'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}