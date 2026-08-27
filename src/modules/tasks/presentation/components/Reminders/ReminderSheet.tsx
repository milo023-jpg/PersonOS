import { useMemo, useState } from 'react';

interface ReminderSheetProps {
    onClose: () => void;
    onSave: (at: number) => void;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function roundToFiveMinutes(date: Date): Date {
    const minutes = Math.ceil(date.getMinutes() / 5) * 5;
    const rounded = new Date(date);
    rounded.setHours(date.getHours(), minutes, 0, 0);
    return rounded;
}

function startOfDay(date: Date): number {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
}

export default function ReminderSheet({ onClose, onSave }: ReminderSheetProps) {
    const [selected, setSelected] = useState<Date>(() =>
        roundToFiveMinutes(new Date(Date.now() + 60 * 60 * 1000))
    );
    // Mes en navegación del calendario (independiente de la selección).
    const [view, setView] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    const todayStart = startOfDay(new Date());

    const monthLabel = useMemo(
        () =>
            new Date(view.year, view.month, 1).toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric',
            }),
        [view]
    );

    const monthCells = useMemo(() => {
        const firstDay = new Date(view.year, view.month, 1);
        const leadingBlanks = (firstDay.getDay() + 6) % 7; // Semana empieza en lunes.
        const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
        const cells: (number | null)[] = Array(leadingBlanks).fill(null);
        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push(day);
        }
        return cells;
    }, [view]);

    const selectedKey = startOfDay(selected);
    const isSelectedDay = (year: number, month: number, day: number) =>
        startOfDay(new Date(year, month, day)) === selectedKey;

    function changeView(delta: number) {
        const next = new Date(view.year, view.month + delta, 1);
        setView({ year: next.getFullYear(), month: next.getMonth() });
    }

    function pickDay(year: number, month: number, day: number) {
        const candidate = new Date(year, month, day, selected.getHours(), selected.getMinutes(), 0, 0);
        setSelected(candidate);
    }

    // Accesos rápidos: conservan la hora ya elegida.
    function quick(days: number) {
        const next = new Date(selected);
        next.setDate(next.getDate() + days);
        setSelected(next);
    }

    function shiftHours(delta: number) {
        const next = new Date(selected);
        next.setHours(next.getHours() + delta);
        setSelected(next);
    }

    function shiftMinutes(delta: number) {
        const next = new Date(selected);
        next.setMinutes(next.getMinutes() + delta);
        setSelected(next);
    }

    const formattedDate = selected.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const hour = String(selected.getHours()).padStart(2, '0');
    const minute = String(selected.getMinutes()).padStart(2, '0');

    const sections = [
        { label: 'Hoy', action: () => quick(0) },
        { label: 'Mañana', action: () => quick(1) },
        { label: 'En 1 semana', action: () => quick(7) },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-t-3xl bg-surface dark:bg-[#17171f] p-6 pb-8 max-h-[90vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-8 duration-200"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-text-secondary">🔔 Recordatorio</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        title="Cerrar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <p className="text-sm font-bold text-text-primary mb-4">¿Cuándo quieres recordarlo?</p>

                <div className="flex gap-2 mb-5">
                    {sections.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={item.action}
                            className="px-4 py-2 rounded-full text-sm font-bold bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 hover:text-primary transition-colors"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Tarjeta fecha */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => changeView(-1)}
                            className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="Mes anterior"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <span className="text-sm font-black capitalize text-text-primary">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={() => changeView(1)}
                            className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="Mes siguiente"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                        {WEEKDAYS.map((weekday) => (
                            <span key={weekday} className="text-[10px] font-black uppercase text-text-secondary py-1">
                                {weekday}
                            </span>
                        ))}
                        {monthCells.map((day, index) => {
                            if (day === null) return <span key={`blank-${index}`} />;
                            const dayStart = startOfDay(new Date(view.year, view.month, day));
                            const isPast = dayStart < todayStart;
                            const isSelected = isSelectedDay(view.year, view.month, day);
                            return (
                                <button
                                    key={`${view.year}-${view.month}-${day}`}
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => pickDay(view.year, view.month, day)}
                                    className={`aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : isPast
                                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                              : 'text-text-primary hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tarjeta hora */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">🕐 {hour}:{minute}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => shiftHours(-1)}
                                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 text-text-primary font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                title="Hora -1"
                            >
                                −
                            </button>
                            <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-text-primary">{hour}</span>
                            <button
                                type="button"
                                onClick={() => shiftHours(1)}
                                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 text-text-primary font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                title="Hora +1"
                            >
                                +
                            </button>
                            <span className="text-text-secondary font-bold mx-1">:</span>
                            <button
                                type="button"
                                onClick={() => shiftMinutes(-5)}
                                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 text-text-primary font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                title="Minutos -5"
                            >
                                −
                            </button>
                            <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-text-primary">{minute}</span>
                            <button
                                type="button"
                                onClick={() => shiftMinutes(5)}
                                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 text-text-primary font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                title="Minutos +5"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <p className="text-xs font-medium text-text-secondary mt-2">{formattedDate}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-bold rounded-xl text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onSave(selected.getTime());
                            onClose();
                        }}
                        className="flex-1 px-4 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb] shadow-[0_0_15px_rgba(160,74,249,0.3)] transition-all active:scale-[0.98]"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}