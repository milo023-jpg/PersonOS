import { useCallback, useMemo, useState } from 'react';
import type { Task } from '../../domain/models/Task';
import { useTasksStore } from '../../application/store/tasksStore';
import { getDayRange } from '../../domain/utils/taskDate';
import {
    MONTH_LABELS,
    WEEKDAY_LABELS_SHORT,
    formatFullDayLabel,
    formatMonthTitle,
    getMonthGrid,
    isSameMonth,
    isToday,
    toDateKey,
} from './calendarDateUtils';
import { countPending, isOverdue, sortTasksForCalendar, tasksForDay } from './taskCalendarUtils';
import CalendarNavigation from './CalendarNavigation';
import DayTasksPanel from './DayTasksPanel';
import CalendarTaskOverlays from './CalendarTaskOverlays';

interface DayDotsProps {
    tasks: Task[];
    todayStart: number;
}

function DayDots({ tasks, todayStart }: DayDotsProps) {
    const pending = tasks.filter((task) => task.status !== 'completed');
    const ordered = [...pending].sort((a, b) => Number(isOverdue(b, todayStart)) - Number(isOverdue(a, todayStart)));
    const shown = ordered.slice(0, 4);
    const more = pending.length - shown.length;

    if (pending.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-1 min-h-[10px] px-1">
            {shown.map((task) => (
                <span
                    key={task.id}
                    className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${
                        isOverdue(task, todayStart) ? 'bg-danger' : 'bg-primary'
                    }`}
                />
            ))}
            {more > 0 && <span className="text-[10px] font-black text-text-secondary leading-none">+{more}</span>}
        </div>
    );
}

export default function MonthCalendarView() {
    const tasks = useTasksStore((state) => state.tasks);
    const [cursor, setCursor] = useState<Date>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => {
        const now = new Date();
        return toDateKey(now);
    });
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [creationDate, setCreationDate] = useState<number | null>(null);

    const todayStart = useMemo(() => getDayRange().start, []);

    const grid = useMemo(() => getMonthGrid(cursor), [cursor]);

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const day of grid) {
            map.set(toDateKey(day), sortTasksForCalendar(tasksForDay(tasks, day)));
        }
        return map;
    }, [tasks, grid]);

    const selectedDate = selectedDateKey ? grid.find((day) => toDateKey(day) === selectedDateKey) ?? null : null;
    const selectedTasks = selectedDateKey ? tasksByDay.get(selectedDateKey) ?? [] : [];

    const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;

    const openTask = useCallback((task: Task) => setSelectedTaskId(task.id), []);
    const openCreate = useCallback((timestamp: number) => setCreationDate(timestamp), []);
    const closeTask = useCallback(() => setSelectedTaskId(null), []);
    const closeCreate = useCallback(() => setCreationDate(null), []);

    const prevMonth = useCallback(() => {
        setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const nextMonth = useCallback(() => {
        setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        const now = new Date();
        const todayKey = toDateKey(now);
        setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDateKey(todayKey);
    }, []);

    const prevMonthLabel = MONTH_LABELS[(cursor.getMonth() + 11) % 12];
    const nextMonthLabel = MONTH_LABELS[(cursor.getMonth() + 1) % 12];

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-4 lg:px-6 pt-3 pb-3">
                <CalendarNavigation
                    title={formatMonthTitle(cursor)}
                    prevLabel={prevMonthLabel}
                    nextLabel={nextMonthLabel}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                    onToday={goToToday}
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto system-scroll px-4 lg:px-6 pb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Grid mensual */}
                    <div className="w-full lg:flex-1 min-w-0">
                        <div className="grid grid-cols-7 gap-1 lg:gap-1.5 mb-1.5">
                            {WEEKDAY_LABELS_SHORT.map((label) => (
                                <div
                                    key={label}
                                    className="text-center text-[11px] font-black uppercase tracking-wider text-text-secondary py-1"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
                            {grid.map((day) => {
                                const key = toDateKey(day);
                                const dayTasks = tasksByDay.get(key) ?? [];
                                const inCurrentMonth = isSameMonth(day, cursor);
                                const today = isToday(day);
                                const selected = key === selectedDateKey;
                                const pending = countPending(dayTasks);

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedDateKey(key)}
                                        className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl border transition-colors cursor-pointer min-h-[52px] lg:min-h-[68px]
                                            ${selected
                                                ? 'border-primary bg-primary/10'
                                                : inCurrentMonth
                                                    ? 'bg-surface border-gray-100 dark:border-gray-800 hover:border-primary/40'
                                                    : 'bg-transparent border-transparent opacity-45 hover:opacity-70'
                                            }`}
                                    >
                                        <span
                                            className={`h-6 min-w-6 px-1 flex items-center justify-center text-xs lg:text-sm font-bold rounded-full
                                                ${today
                                                    ? 'bg-primary text-white ring-2 ring-primary/30'
                                                    : selected
                                                        ? 'text-primary'
                                                        : 'text-text-primary'
                                                }`}
                                        >
                                            {day.getDate()}
                                        </span>
                                        {pending > 0 && <DayDots tasks={dayTasks} todayStart={todayStart} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Panel de tareas del día seleccionado */}
                    <aside className="w-full lg:w-80 shrink-0 flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-surface overflow-hidden lg:sticky lg:top-0">
                        {selectedDate ? (
                            <>
                                <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`text-xs font-black uppercase tracking-wider truncate ${isToday(selectedDate) ? 'text-primary' : 'text-text-secondary'}`}>
                                            {formatFullDayLabel(selectedDate)}
                                        </span>
                                        {isToday(selectedDate) && (
                                            <span className="shrink-0 bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                                Hoy
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openCreate(getDayRange(selectedDate).start)}
                                        title="Crear tarea para este día"
                                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto system-scroll p-3 max-h-[28rem] lg:max-h-none">
                                    <DayTasksPanel
                                        date={selectedDate}
                                        tasks={selectedTasks}
                                        todayStart={todayStart}
                                        onOpenTask={openTask}
                                        onCreateTask={openCreate}
                                        showCreateButton={false}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-sm font-bold text-text-secondary">
                                    Selecciona un día para ver sus tareas.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <CalendarTaskOverlays
                selectedTask={selectedTask}
                creationDate={creationDate}
                onCloseTask={closeTask}
                onCloseCreation={closeCreate}
            />
        </div>
    );
}