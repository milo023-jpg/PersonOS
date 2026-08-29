import type { Task } from '../../../domain/models/Task';
import { useMemo } from 'react';
import { CALENDAR_HOURS, CALENDAR_START_HOUR } from '../calendarDateUtils';
import TimelineItem, { taskHour } from './TimelineItem';
import TaskCard from './TaskCard';

export function groupTasksByHour(tasks: Task[]): Map<number, Task[]> {
    const map = new Map<number, Task[]>();
    for (const task of tasks) {
        const hour = taskHour(task);
        const bucket = map.get(hour);
        if (bucket) bucket.push(task);
        else map.set(hour, [task]);
    }
    return map;
}

interface Props {
    tasksByHour: Map<number, Task[]>;
    onOpenTask?: (task: Task) => void;
    onMenuTask?: (task: Task) => void;
}

const HOURS = CALENDAR_HOURS;

export default function TimelineColumn({ tasksByHour, onOpenTask, onMenuTask }: Props) {
    const earlyTasks = useMemo(() => {
        const early: Task[] = [];
        for (const [hour, tasks] of tasksByHour) {
            if (hour < CALENDAR_START_HOUR) early.push(...tasks);
        }
        return early;
    }, [tasksByHour]);

    return (
        <div className="flex flex-col">
            {earlyTasks.length > 0 && (
                <div className="mb-1.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-2 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                        Todo el día / Antes de las 7
                    </span>
                    <div className="flex flex-col gap-1">
                        {earlyTasks.map((task) => (
                            <TaskCard key={task.id} task={task} onOpen={onOpenTask} onMenu={onMenuTask} />
                        ))}
                    </div>
                </div>
            )}
            {HOURS.map((hour) => {
                const tasks = tasksByHour.get(hour);
                const hasTasks = !!tasks && tasks.length > 0;
                return (
                    <TimelineItem key={hour} hour={hour} compact={!hasTasks}>
                        {hasTasks ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                                {tasks!.map((task) => (
                                    <TaskCard key={task.id} task={task} onOpen={onOpenTask} onMenu={onMenuTask} />
                                ))}
                            </div>
                        ) : null}
                    </TimelineItem>
                );
            })}
        </div>
    );
}