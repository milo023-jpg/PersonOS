import { useState } from 'react';
import DayCalendarView from './DayCalendarView';
import WeekTimelineView from './WeekTimelineView';
import MonthCalendarView from './MonthCalendarView';

type CalendarMode = 'day' | 'week' | 'month';

const TABS: ReadonlyArray<{ id: CalendarMode; label: string }> = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
];

export default function CalendarView() {
    const [mode, setMode] = useState<CalendarMode>('day');

    const activeClass = 'bg-white dark:bg-background text-text-primary shadow-sm';
    const idleClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-4 lg:px-6 pt-2">
                <div className="flex bg-gray-100 dark:bg-surface p-1 rounded-xl gap-1 w-max">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === tab.id ? activeClass : idleClass}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {mode === 'day' ? (
                    <DayCalendarView />
                ) : mode === 'week' ? (
                    <WeekTimelineView />
                ) : (
                    <MonthCalendarView />
                )}
            </div>
        </div>
    );
}