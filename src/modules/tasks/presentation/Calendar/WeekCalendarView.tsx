import { useCallback, useMemo, useState } from 'react';
import type { Task } from '../../domain/models/Task';
import { useTasksStore } from '../../application/store/tasksStore';
import { getDayRange } from '../../domain/utils/taskDate';
import {
    addDays,
    formatWeekTitle,
    getWeekdayLabel,
    getWeekDays,
    isToday,
    toDateKey,
} from './calendarDateUtils';
import { sortTasksForCalendar, tasksForDay, tasksWithoutDate, countPending } from './taskCalendarUtils';
import CalendarNavigation from './CalendarNavigation';
import DayTasksPanel from './DayTasksPanel';
import TaskRow from './TaskRow';
import CalendarTaskOverlays from './CalendarTaskOverlays';

interface NoDateSectionProps {
    tasks: Task[];
    todayStart: number;
    onOpen: (task: Task) => void;
    className?: string;
}

function NoDateSection({ tasks, todayStart, onOpen, className = '' }: NoDateSectionProps) {
    return (
        <section className={`flex flex-col gap-1.5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/50 p-3 bg-transparent ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Sin fecha
                </span>
                <span className="text-[10px] font-bold text-text-secondary bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>
            {tasks.length === 0 ? (
                <p className="text-xs font-medium text-text-secondary/60 px-1 py-1">No hay tareas sin fecha.</p>
            ) : (
                tasks.map((task) => (
                    <TaskRow key={task.id} task={task} todayStart={todayStart} onOpen={onOpen} />
                ))
            )}
        </section>
    );
}

export default function WeekCalendarView() {
    const tasks = useTasksStore((state) => state.tasks);
    const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [creationDate, setCreationDate] = useState<number | null>(null);

    const todayStart = useMemo(() => getDayRange().start, []);

    const days = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const day of days) {
            map.set(toDateKey(day), sortTasksForCalendar(tasksForDay(tasks, day)));
        }
        return map;
    }, [tasks, days]);

    const noDateTasks = useMemo(() => sortTasksForCalendar(tasksWithoutDate(tasks)), [tasks]);

    const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;

    const openTask = useCallback((task: Task) => setSelectedTaskId(task.id), []);
    const openCreate = useCallback((timestamp: number) => setCreationDate(timestamp), []);
    const closeTask = useCallback(() => setSelectedTaskId(null), []);
    const closeCreate = useCallback(() => setCreationDate(null), []);

    const moveWeek = useCallback((delta: number) => {
        setReferenceDate((prev) => addDays(prev, delta));
    }, []);

    const goToToday = useCallback(() => {
        setReferenceDate(new Date());
    }, []);

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-4 lg:px-6 pt-3 pb-3">
                <CalendarNavigation
                    title={formatWeekTitle(referenceDate)}
                    onPrev={() => moveWeek(-7)}
                    onNext={() => moveWeek(7)}
                    onToday={goToToday}
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto system-scroll px-4 lg:px-6 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 lg:gap-2 items-start">
                    {days.map((day) => {
                        const key = toDateKey(day);
                        const dayTasks = tasksByDay.get(key) ?? [];
                        const today = isToday(day);
                        const pendingCount = countPending(dayTasks);

                        return (
                            <div
                                key={key}
                                className="flex flex-col min-h-0 rounded-2xl border border-gray-100 dark:border-gray-800 bg-surface/50 p-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
                            >
                                {/* Header del día */}
                                <div className={`flex items-center justify-between rounded-xl px-2 py-1.5 mb-2 shrink-0 ${today ? 'bg-primary/10' : 'bg-gray-50 dark:bg-white/5'}`}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                                                today ? 'bg-primary text-white' : 'text-text-primary'
                                            }`}
                                        >
                                            {day.getDate()}
                                        </span>
                                        <span className={`text-xs font-black uppercase tracking-wider ${today ? 'text-primary' : 'text-text-secondary'}`}>
                                            {getWeekdayLabel(day)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary">{pendingCount}</span>
                                </div>

                                <DayTasksPanel
                                    date={day}
                                    tasks={dayTasks}
                                    todayStart={todayStart}
                                    onOpenTask={openTask}
                                    onCreateTask={openCreate}
                                    className="lg:pr-1"
                                />
                            </div>
                        );
                    })}

                    {/* Tareas sin fecha: sección separada al final de la semana */}
                    <NoDateSection tasks={noDateTasks} todayStart={todayStart} onOpen={openTask} className="lg:col-span-7" />
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