import { useCallback, useMemo, useState } from 'react';
import type { Task } from '../../domain/models/Task';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import { addDays, formatWeekTitle, getWeekdayLabel, getWeekDays, isToday, startOfDay, toDateKey } from './calendarDateUtils';
import { sortTasksForCalendar, tasksForDay } from './taskCalendarUtils';
import CalendarHeader from './viewComponents/CalendarHeader';
import MiniTaskChip from './viewComponents/MiniTaskChip';
import { groupTasksByHour } from './viewComponents/TimelineColumn';
import { isAllDayTask, taskHour } from './viewComponents/TimelineItem';
import CalendarTaskOverlays from './CalendarTaskOverlays';
import { CALENDAR_HOURS, CALENDAR_START_HOUR } from './calendarDateUtils';

const HOURS = CALENDAR_HOURS;

const MAX_CHIPS = 3;

function shortHourLabel(hour: number): string {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}${hour < 12 ? 'a' : 'p'}`;
}

export default function WeekTimelineView() {
    const tasks = useTasksStore((state) => state.tasks);
    const lists = useTaskListsStore((state) => state.lists);
    const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [creationDate, setCreationDate] = useState<number | null>(null);

    const days = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

    const dayColumns = useMemo(
        () =>
            days.map((day) => {
                const dayTasks = sortTasksForCalendar(tasksForDay(tasks, day));
                const timed = dayTasks.filter(
                    (task) => !isAllDayTask(task) && taskHour(task) >= CALENDAR_START_HOUR,
                );
                const allDay = dayTasks.filter(
                    (task) => isAllDayTask(task) || taskHour(task) < CALENDAR_START_HOUR,
                );
                const colors = new Map<string, string | undefined>();
                for (const task of timed) {
                    const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
                    colors.set(task.id, list?.color);
                }
                const allDayColors = new Map<string, string | undefined>();
                for (const task of allDay) {
                    const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
                    allDayColors.set(task.id, list?.color);
                }
                return {
                    day,
                    key: toDateKey(day),
                    tasksByHour: groupTasksByHour(timed),
                    allDay,
                    allDayColors,
                    colors,
                };
            }),
        [tasks, days, lists],
    );

    const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;

    const openTask = useCallback((task: Task) => setSelectedTaskId(task.id), []);
    const openCreate = useCallback((timestamp: number) => setCreationDate(timestamp), []);
    const closeTask = useCallback(() => setSelectedTaskId(null), []);
    const closeCreate = useCallback(() => setCreationDate(null), []);

    const createAtHour = useCallback(
        (day: Date, hour: number) => {
            openCreate(startOfDay(day).getTime() + hour * 3_600_000);
        },
        [openCreate],
    );

    const moveWeek = useCallback((delta: number) => {
        setReferenceDate((prev) => addDays(prev, delta));
    }, []);

    const goToToday = useCallback(() => {
        setReferenceDate(new Date());
    }, []);

    const changeMonth = useCallback((month: number, year: number) => {
        setReferenceDate(new Date(year, month, 1));
    }, []);

    const columnClass = 'grid grid-cols-[24px_repeat(7,1fr)]';

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="shrink-0 px-3 lg:px-4 pt-2 pb-1">
                <CalendarHeader
                    title={formatWeekTitle(referenceDate)}
                    onPrev={() => moveWeek(-7)}
                    onNext={() => moveWeek(7)}
                    onToday={goToToday}
                    monthYear={{ month: referenceDate.getMonth(), year: referenceDate.getFullYear() }}
                    onMonthChange={changeMonth}
                />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden px-3 lg:px-4 pb-3 flex flex-col">
                <div className={`${columnClass} shrink-0 mb-1`}>
                    <div />
                    {days.map((day) => {
                        const key = toDateKey(day);
                        const today = isToday(day);
                        return (
                            <div
                                key={key}
                                title={day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                className={`flex flex-col items-center justify-center gap-0.5 py-0.5 rounded-lg ${
                                    today ? 'bg-primary/5' : 'bg-gray-50 dark:bg-white/5'
                                }`}
                            >
                                <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-wider leading-none ${today ? 'text-primary' : 'text-text-secondary'}`}>
                                    {getWeekdayLabel(day)}
                                </span>
                                <span className={`text-[10px] lg:text-xs font-black leading-none ${today ? 'text-primary' : 'text-text-primary'}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className={`${columnClass} flex-1 min-h-0 border-t border-r border-gray-100 dark:border-gray-800`}>
                    <div className="flex flex-col min-h-0">
                        {/* Relleno alineado con la franja "todo el día" de las columnas */}
                        <div className="min-h-[28px] lg:min-h-[32px] shrink-0 border-b border-gray-100 dark:border-gray-800" />
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex-1 min-h-0 border-b border-gray-100 dark:border-gray-800">
                                <span className="block pt-0.5 pr-1 text-right text-[8px] lg:text-[9px] font-bold text-text-secondary leading-none tabular-nums">
                                    {shortHourLabel(hour)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {dayColumns.map(({ day, key, tasksByHour, allDay, allDayColors, colors }) => {
                        const today = isToday(day);
                        return (
                            <div
                                key={key}
                                className={`flex flex-col min-h-0 border-l border-gray-100 dark:border-gray-800 ${
                                    today ? 'bg-primary/[0.04]' : ''
                                }`}
                            >
                                {/* Franja "todo el día": tareas sin hora programada */}
                                <div className="min-h-[28px] lg:min-h-[32px] shrink-0 px-1 py-0.5 flex items-start flex-wrap gap-y-0.5 border-b border-gray-100 dark:border-gray-800 overflow-hidden">
                                    {allDay.slice(0, MAX_CHIPS).map((task) => (
                                        <MiniTaskChip
                                            key={task.id}
                                            task={task}
                                            listColor={allDayColors.get(task.id)}
                                            onOpen={openTask}
                                        />
                                    ))}
                                    {allDay.length > MAX_CHIPS && (
                                        <span className="px-1 text-[9px] font-black text-text-secondary">
                                            +{allDay.length - MAX_CHIPS}
                                        </span>
                                    )}
                                </div>
                                {HOURS.map((hour) => {
                                    const hourTasks = tasksByHour.get(hour) ?? [];
                                    return (
                                        <div key={hour} className="relative flex-1 min-h-0 border-b border-gray-100 dark:border-gray-800">
                                            <button
                                                type="button"
                                                onClick={() => createAtHour(day, hour)}
                                                aria-label={`Crear tarea ${getWeekdayLabel(day)} ${shortHourLabel(hour)}`}
                                                className="absolute inset-0 w-full h-full cursor-pointer"
                                            />
                                            <div className="relative h-full min-h-0 flex flex-col gap-0.5 p-px overflow-hidden">
                                                {hourTasks.slice(0, MAX_CHIPS).map((task) => (
                                                    <MiniTaskChip
                                                        key={task.id}
                                                        task={task}
                                                        listColor={colors.get(task.id)}
                                                        onOpen={openTask}
                                                    />
                                                ))}
                                                {hourTasks.length > MAX_CHIPS && (
                                                    <span className="px-1 text-[9px] font-black text-text-secondary">
                                                        +{hourTasks.length - MAX_CHIPS}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
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