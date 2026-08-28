import { memo, useMemo } from 'react';
import type { Task, TaskStatus } from '../../../domain/models/Task';
import { getDayRange } from '../../../domain/utils/taskDate';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { isOverdue } from '../taskCalendarUtils';

interface Props {
    task: Task;
    listColor?: string;
    listName?: string;
    onOpen?: (task: Task) => void;
    onMenu?: (task: Task) => void;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'Por hacer',
    in_progress: 'En curso',
    completed: 'Hecho',
    archived: 'Archivada',
};

const STATUS_STYLES: Record<TaskStatus, string> = {
    todo: 'bg-primary/15 text-primary',
    in_progress: 'bg-warning/15 text-warning',
    completed: 'bg-success/15 text-success',
    archived: 'bg-gray-100 dark:bg-gray-800 text-text-secondary',
};

const TaskCard = memo(function TaskCard({ task, listColor, listName, onOpen, onMenu }: Props) {
    const { lists } = useTaskListsStore();
    const todayStart = useMemo(() => getDayRange().start, []);

    const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
    const colorClass = listColor ?? list?.color ?? 'bg-gray-200 dark:bg-gray-700';
    const name = listName ?? list?.name ?? 'General';

    const completed = task.status === 'completed';
    const overdue = !completed && isOverdue(task, todayStart);

    const subtasks = task.subtasks ?? [];
    const total = subtasks.length;
    const done = subtasks.filter((s) => s.completed).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    const badgeStyle = overdue ? 'bg-danger/15 text-danger' : STATUS_STYLES[task.status];
    const badgeLabel = overdue ? 'Atrasada' : STATUS_LABEL[task.status];

    return (
        <div
            onClick={() => onOpen?.(task)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen?.(task);
                }
            }}
            className={`relative rounded-2xl border px-3 pt-4 pb-2.5 flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                completed
                    ? 'opacity-60 border-transparent'
                    : 'border-gray-100 dark:border-gray-800 bg-surface shadow-sm hover:border-primary/40 hover:shadow-md'
            }`}
        >
            <span
                className={`absolute -top-2 left-3 rounded-b-xl rounded-t-md px-2 py-0.5 inline-flex items-center text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}
            >
                {badgeLabel}
            </span>

            <div className="absolute -top-2 right-3 min-w-[34px] flex flex-col items-end gap-0.5">
                <span className={`text-[9px] font-black leading-none tabular-nums ${total > 0 ? 'text-primary' : 'text-text-secondary'}`}>
                    {progress}%
                </span>
                <div className="h-0.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white ${colorClass}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                </svg>
            </div>

            <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-bold truncate ${completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {task.title}
                </p>
                <p className="text-[11px] font-medium text-text-secondary truncate mt-1">{name}</p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onMenu?.(task);
                }}
                aria-label="Más opciones"
                title="Más opciones"
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8a1.75 1.75 0 110-3.5A1.75 1.75 0 0112 8zm0 5.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zm-1.75 4a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0z" />
                </svg>
            </button>
        </div>
    );
});

export default TaskCard;