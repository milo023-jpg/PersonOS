import { useCallback, useMemo, useState } from 'react';
import type { Task } from '../../domain/models/Task';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import { getDayRange } from '../../domain/utils/taskDate';
import { formatMonthTitle, toDateKey } from './calendarDateUtils';
import CalendarHeader from './viewComponents/CalendarHeader';
import MonthGrid from './viewComponents/MonthGrid';
import FabButton from './viewComponents/FabButton';
import CalendarTaskOverlays from './CalendarTaskOverlays';

const MAX_PILLS = 3;

export default function MonthlyGridAlt() {
    const tasks = useTasksStore((state) => state.tasks);
    const lists = useTaskListsStore((state) => state.lists);
    const [cursor, setCursor] = useState<Date>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => toDateKey(new Date()));
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [creationDate, setCreationDate] = useState<number | null>(null);

    const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;

    const listColorMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const list of lists) map.set(list.id, list.color);
        return map;
    }, [lists]);

    const goToToday = useCallback(() => {
        const now = new Date();
        setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDateKey(toDateKey(now));
    }, []);

    const changeMonth = useCallback((month: number, year: number) => {
        setCursor(new Date(year, month, 1));
    }, []);

    const openTask = useCallback((task: Task) => setSelectedTaskId(task.id), []);
    const openCreate = useCallback((timestamp: number) => setCreationDate(timestamp), []);
    const closeTask = useCallback(() => setSelectedTaskId(null), []);
    const closeCreate = useCallback(() => setCreationDate(null), []);

    const createForSelected = useCallback(() => {
        const date = selectedDateKey ? new Date(`${selectedDateKey}T12:00:00`) : new Date();
        openCreate(getDayRange(date).start);
    }, [selectedDateKey, openCreate]);

    const renderDayExtra = useCallback(
        (_day: Date, dayTasks: Task[]) => {
            if (dayTasks.length === 0) return null;
            const shown = dayTasks.slice(0, MAX_PILLS);
            const more = dayTasks.length - shown.length;

            return (
                <div className="w-full mt-0.5 flex flex-col gap-0.5">
                    {shown.map((task) => (
                        <button
                            key={task.id}
                            title={task.title}
                            onClick={(e) => {
                                e.stopPropagation();
                                openTask(task);
                            }}
                            className={`w-full truncate text-left text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold cursor-pointer hover:opacity-90 transition-opacity ${
                                listColorMap.get(task.listId) ?? 'bg-primary'
                            }`}
                        >
                            {task.title}
                        </button>
                    ))}
                    {more > 0 && <span className="px-1 text-[9px] font-black text-text-secondary">+{more}</span>}
                </div>
            );
        },
        [openTask, listColorMap],
    );

    return (
        <div className="w-full h-full min-h-0 flex flex-col relative">
            <div className="shrink-0 px-4 lg:px-6 pt-3 pb-3">
                <CalendarHeader
                    variant="centered"
                    title={formatMonthTitle(cursor)}
                    onToday={goToToday}
                    monthYear={{ month: cursor.getMonth(), year: cursor.getFullYear() }}
                    onMonthChange={changeMonth}
                    leading={
                        <button
                            title="Abrir panel"
                            aria-label="Abrir panel"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    }
                    actions={
                        <button
                            title="Ver lista del mes"
                            aria-label="Ver lista del mes"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                            </svg>
                        </button>
                    }
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto system-scroll px-4 lg:px-6 pb-8">
                <div className="max-w-3xl mx-auto">
                    <MonthGrid
                        cursor={cursor}
                        tasks={tasks}
                        selectedDateKey={selectedDateKey}
                        onSelectDate={setSelectedDateKey}
                        renderDayExtra={renderDayExtra}
                    />
                </div>
            </div>

            <FabButton onClick={createForSelected} />

            <CalendarTaskOverlays
                selectedTask={selectedTask}
                creationDate={creationDate}
                onCloseTask={closeTask}
                onCloseCreation={closeCreate}
            />
        </div>
    );
}