import type { Task } from '../../../domain/models/Task';
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

const HOURS = Array.from({ length: 24 }, (_, index) => index);

export default function TimelineColumn({ tasksByHour, onOpenTask, onMenuTask }: Props) {
    return (
        <div className="flex flex-col">
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