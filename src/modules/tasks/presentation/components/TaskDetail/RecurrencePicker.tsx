import { useState } from 'react';
import type { RecurrenceRule } from '../../../domain/models/Task';

interface Props {
    rule: RecurrenceRule | undefined;
    onChange: (rule: RecurrenceRule | undefined) => void;
    referenceDate?: number;
}

const WEEKDAY_OPTIONS: { value: number; label: string; full: string }[] = [
    { value: 1, label: 'L', full: 'Lunes' },
    { value: 2, label: 'M', full: 'Martes' },
    { value: 3, label: 'X', full: 'Miércoles' },
    { value: 4, label: 'J', full: 'Jueves' },
    { value: 5, label: 'V', full: 'Viernes' },
    { value: 6, label: 'S', full: 'Sábado' },
    { value: 0, label: 'D', full: 'Domingo' },
];

const dayOfWeek = (reference: number) => new Date(reference).getDay();

export default function RecurrencePicker({ rule, onChange, referenceDate }: Props) {
    const days = rule?.type === 'weekly' ? (rule.daysOfWeek ?? []) : [];
    const interval = rule?.interval ?? 1;

    const [intervalInput, setIntervalInput] = useState(String(interval));
    const [now] = useState(() => Date.now());

    const activeType = !rule
        ? 'none'
        : rule.type === 'daily'
            ? 'daily'
            : rule.type === 'monthly'
                ? 'monthly'
                : days.length > 0
                    ? 'days'
                    : 'weekly';

    const defaultDay = referenceDate !== undefined ? dayOfWeek(referenceDate) : dayOfWeek(now);

    const handleType = (type: string) => {
        switch (type) {
            case 'daily':
                onChange({ type: 'daily', interval: 1 });
                setIntervalInput('1');
                break;
            case 'weekly':
                onChange({ type: 'weekly', interval: 1 });
                setIntervalInput('1');
                break;
            case 'days':
                onChange({ type: 'weekly', interval: 1, daysOfWeek: [defaultDay] });
                setIntervalInput('1');
                break;
            case 'monthly':
                onChange({ type: 'monthly', interval: 1 });
                setIntervalInput('1');
                break;
            default:
                onChange(undefined);
        }
    };

    const updateInterval = (value: string) => {
        setIntervalInput(value);
        const parsed = Number(value);
        if (!rule || !Number.isFinite(parsed) || parsed < 1) return;
        onChange({ ...rule, interval: Math.floor(parsed) });
    };

    const toggleDay = (day: number) => {
        if (!rule || rule.type !== 'weekly') return;
        const current = rule.daysOfWeek ?? [];

        let next: number[];
        if (current.includes(day)) {
            next = current.filter((d) => d !== day);
        } else {
            next = [...current, day];
        }
        if (next.length === 0) {
            next = [dayOfWeek(referenceDate ?? now)];
        }

        onChange({ ...rule, daysOfWeek: next.sort((a, b) => a - b) });
    };

    const pillClass = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            active
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10'
        }`;

    return (
        <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-text-secondary tracking-wider">🔁 Repetición</span>

            <div className="flex flex-wrap gap-1.5">
                <button type="button" className={pillClass(activeType === 'none')} onClick={() => handleType('none')}>
                    No repetir
                </button>
                <button type="button" className={pillClass(activeType === 'daily')} onClick={() => handleType('daily')}>
                    Diaria
                </button>
                <button type="button" className={pillClass(activeType === 'days')} onClick={() => handleType('days')}>
                    Días de la semana
                </button>
                <button type="button" className={pillClass(activeType === 'weekly')} onClick={() => handleType('weekly')}>
                    Semanal
                </button>
                <button type="button" className={pillClass(activeType === 'monthly')} onClick={() => handleType('monthly')}>
                    Mensual
                </button>
            </div>

            {activeType !== 'none' && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-secondary">Cada</span>
                    <input
                        type="number"
                        min={1}
                        value={intervalInput}
                        onChange={(e) => updateInterval(e.target.value)}
                        className="w-14 bg-gray-100 dark:bg-surface text-text-primary text-sm font-bold px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-center"
                    />
                    <span className="text-xs font-bold text-text-secondary">
                        {activeType === 'daily' ? (interval === 1 ? 'día' : 'días') : ''}
                        {activeType === 'weekly' || activeType === 'days' ? (interval === 1 ? 'semana' : 'semanas') : ''}
                        {activeType === 'monthly' ? (interval === 1 ? 'mes' : 'meses') : ''}
                    </span>
                </div>
            )}

            {activeType === 'days' && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                        {WEEKDAY_OPTIONS.map((day) => {
                            const selected = days.includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    title={day.full}
                                    onClick={() => toggleDay(day.value)}
                                    className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer border ${
                                        selected
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-gray-100 dark:bg-white/5 text-text-secondary border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    {rule && activeType === 'days' && (
                        <p className="text-[11px] font-medium text-text-secondary">
                            {days.map((d) => WEEKDAY_OPTIONS.find((w) => w.value === d)?.full).join(', ')}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}