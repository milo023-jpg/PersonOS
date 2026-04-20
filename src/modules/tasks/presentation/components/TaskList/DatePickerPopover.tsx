import { useState, useEffect, useRef } from 'react';

interface Props {
    value: number | undefined;
    onChange: (date: number | undefined) => void;
    onClose: () => void;
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function DatePickerPopover({ value, onChange, onClose }: Props) {
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Adaptar a Lunes primero

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const handleSelectDay = (day: number) => {
        const newDate = new Date(year, month, day);
        newDate.setHours(12, 0, 0, 0); // Evitar problemas de zona horaria
        onChange(newDate.getTime());
        onClose();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const sel = new Date(value);
        return day === sel.getDate() && month === sel.getMonth() && year === sel.getFullYear();
    };

    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div ref={ref} className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden w-[280px] p-4 select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-text-primary">
                    {MONTHS[month]} {year}
                </span>
                <div className="flex gap-1">
                    <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => { onChange(Date.now()); onClose(); }} className="py-2 text-xs font-bold text-primary dark:text-purple-400 bg-primary/10 dark:bg-purple-500/10 hover:bg-primary/20 dark:hover:bg-purple-500/20 rounded-xl transition-colors">
                    Hoy
                </button>
                <button type="button" onClick={() => { onChange(undefined); onClose(); }} className="py-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                    Sin Fecha
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {blanks.map(b => (
                    <div key={`blank-${b}`} className="h-8"></div>
                ))}
                {days.map(d => {
                    const selected = isSelected(d);
                    const today = isToday(d);
                    return (
                        <button
                            key={d}
                            type="button"
                            onClick={() => handleSelectDay(d)}
                            className={`h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all relative ${
                                selected 
                                    ? 'bg-primary text-white dark:bg-purple-500 dark:text-white shadow-md scale-105 z-10' 
                                    : today
                                        ? 'bg-gray-100 dark:bg-white/10 text-primary dark:text-purple-400'
                                        : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {d}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
