import { useState } from 'react';
import WeekCalendarView from './WeekCalendarView';
import MonthCalendarView from './MonthCalendarView';

type CalendarMode = 'week' | 'month';

export default function CalendarView() {
    const [mode, setMode] = useState<CalendarMode>('week');

    const activeClass = 'bg-white dark:bg-background text-text-primary shadow-sm';
    const idleClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-4 lg:px-6 pt-2">
                <div className="flex bg-gray-100 dark:bg-surface p-1 rounded-xl gap-1 w-max">
                    <button
                        onClick={() => setMode('week')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === 'week' ? activeClass : idleClass}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setMode('month')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === 'month' ? activeClass : idleClass}`}
                    >
                        Mes
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {mode === 'week' ? <WeekCalendarView /> : <MonthCalendarView />}
            </div>
        </div>
    );
}