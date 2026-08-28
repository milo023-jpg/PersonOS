import type { ReactNode } from 'react';
import type { Task } from '../../../domain/models/Task';

interface Props {
    hour: number;
    children?: ReactNode;
    compact?: boolean;
}

export function formatHourLabel(hour: number): string {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 ? 'am' : 'pm';
    return `${h} ${suffix}`;
}

// "Día completo": tareas sin dueDate, o con dueDate a las 00:00 (medianoche local,
// que es como la app guarda las fechas elegidas sin hora). Nota: 12:00 NO es
// "sin hora" — puede ser una hora real a mediodía y debe mostrarse en el timeline.
export function isAllDayTask(task: Task): boolean {
    if (typeof task.dueDate !== 'number' || !Number.isFinite(task.dueDate)) return true;
    const date = new Date(task.dueDate);
    return date.getHours() === 0 && date.getMinutes() === 0;
}

export function taskHour(task: Task): number {
    return new Date(task.dueDate as number).getHours();
}

export default function TimelineItem({ hour, children, compact = false }: Props) {
    const rowHeight = compact ? 'min-h-[16px] lg:min-h-[20px]' : 'min-h-[48px]';

    return (
        <div className={`flex items-stretch ${rowHeight}`}>
            <div className={`w-12 lg:w-14 shrink-0 pr-2.5 text-right ${compact ? 'pt-0' : 'pt-1.5'}`}>
                <span className="text-[10px] font-bold text-text-secondary tabular-nums">{formatHourLabel(hour)}</span>
            </div>
            <div className="flex-1 min-w-0 border-l-2 border-dashed border-gray-200 dark:border-gray-800 pl-2.5">
                {children}
            </div>
        </div>
    );
}