import { useCallback, useMemo, useState } from 'react';
import type { Task } from '../../domain/models/Task';
import { useTasksStore } from '../../application/store/tasksStore';
import { getDayRange } from '../../domain/utils/taskDate';
import { addDays, formatMonthTitle, getWeekDays } from './calendarDateUtils';
import { sortTasksForCalendar, tasksForDay } from './taskCalendarUtils';
import CalendarHeader from './viewComponents/CalendarHeader';
import DateSelector from './viewComponents/DateSelector';
import TimelineColumn, { groupTasksByHour } from './viewComponents/TimelineColumn';
import FabButton from './viewComponents/FabButton';
import CalendarTaskOverlays from './CalendarTaskOverlays';

export default function DayCalendarView() {
    const tasks = useTasksStore((state) => state.tasks);
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [creationDate, setCreationDate] = useState<number | null>(null);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

    const dayTasks = useMemo(() => sortTasksForCalendar(tasksForDay(tasks, selectedDate)), [tasks, selectedDate]);
    const tasksByHour = useMemo(() => groupTasksByHour(dayTasks), [dayTasks]);

    const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;

    const openTask = useCallback((task: Task) => setSelectedTaskId(task.id), []);
    const openCreate = useCallback((timestamp: number) => setCreationDate(timestamp), []);
    const closeTask = useCallback(() => setSelectedTaskId(null), []);
    const closeCreate = useCallback(() => setCreationDate(null), []);

    const moveDay = useCallback((delta: number) => {
        setSelectedDate((prev) => addDays(prev, delta));
    }, []);

    const goToToday = useCallback(() => {
        setSelectedDate(new Date());
    }, []);

    const changeMonth = useCallback((month: number, year: number) => {
        setSelectedDate((prev) => new Date(year, month, prev.getDate()));
    }, []);

    const createForSelected = useCallback(() => {
        openCreate(getDayRange(selectedDate).start);
    }, [openCreate, selectedDate]);

    return (
        <div className="w-full h-full min-h-0 flex flex-col relative">
            <div className="shrink-0 px-4 lg:px-6 pt-3 pb-2">
                <CalendarHeader
                    title={formatMonthTitle(selectedDate)}
                    onPrev={() => moveDay(-1)}
                    onNext={() => moveDay(1)}
                    onToday={goToToday}
                    monthYear={{ month: selectedDate.getMonth(), year: selectedDate.getFullYear() }}
                    onMonthChange={changeMonth}
                />
            </div>
            <div className="shrink-0 px-4 lg:px-6 pb-3">
                <DateSelector weekDays={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} compact />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto system-scroll px-4 lg:px-6 pb-10">
                <div className="max-w-3xl mx-auto">
                    <TimelineColumn tasksByHour={tasksByHour} onOpenTask={openTask} onMenuTask={openTask} />
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