import { useMemo, type ReactNode } from 'react';
import type { Task } from '../../../domain/models/Task';
import { WEEKDAY_INITIALS, getMonthGrid, isSameMonth, isToday, toDateKey } from '../calendarDateUtils';
import { sortTasksForCalendar, tasksForDay } from '../taskCalendarUtils';

interface Props {
    cursor: Date;
    tasks: Task[];
    selectedDateKey?: string | null;
    onSelectDate?: (key: string) => void;
    renderDayExtra?: (day: Date, dayTasks: Task[], dayKey: string) => ReactNode;
}

export default function MonthGrid({ cursor, tasks, selectedDateKey = null, onSelectDate, renderDayExtra }: Props) {
    const grid = useMemo(() => getMonthGrid(cursor), [cursor]);

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const day of grid) {
            map.set(toDateKey(day), sortTasksForCalendar(tasksForDay(tasks, day)));
        }
        return map;
    }, [tasks, grid]);

    return (
        <div>
            <div className="grid grid-cols-7 gap-1.5 lg:gap-2 mb-2">
                {WEEKDAY_INITIALS.map((label, index) => (
                    <div key={index} className="text-center text-sm font-black text-text-secondary py-1">
                        {label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 lg:gap-2 grid-auto-rows-[72px] lg:grid-auto-rows-[84px]">
                {grid.map((day) => {
                    const key = toDateKey(day);
                    const dayTasks = tasksByDay.get(key) ?? [];
                    const selected = key === selectedDateKey;
                    const inOtherMonth = !isSameMonth(day, cursor);
                    const today = isToday(day);

                    const cellClass = `relative flex flex-col items-start justify-start p-1.5 rounded-xl overflow-hidden min-h-0 transition-colors ${
                        inOtherMonth ? 'opacity-40' : ''
                    } ${selected ? 'bg-gray-100 dark:bg-gray-800' : ''}`;

                    const numberClass = `inline-flex items-center justify-center font-black leading-none ${
                        today
                            ? 'mb-0.5 w-5 h-5 rounded-full bg-primary text-white text-[10px]'
                            : 'mb-0.5 text-sm lg:text-base'
                    } ${today ? '' : selected ? 'text-primary' : inOtherMonth ? 'text-text-secondary' : 'text-text-primary'}`;

                    const content = (
                        <>
                            <span className={numberClass}>{day.getDate()}</span>
                            {renderDayExtra?.(day, dayTasks, key)}
                        </>
                    );

                    if (onSelectDate) {
                        return (
                            <button
                                key={key}
                                onClick={() => onSelectDate(key)}
                                aria-label={`Seleccionar día ${day.getDate()}`}
                                className={`${cellClass} cursor-pointer`}
                            >
                                {content}
                            </button>
                        );
                    }
                    return <div key={key} className={cellClass}>{content}</div>;
                })}
            </div>
        </div>
    );
}