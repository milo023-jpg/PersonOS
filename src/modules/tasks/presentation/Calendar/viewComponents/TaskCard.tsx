import { memo } from 'react';
import type { Task } from '../../../domain/models/Task';
import { useTaskListsStore } from '../../../application/store/taskListsStore';

interface Props {
    task: Task;
    listColor?: string;
    listName?: string;
    onOpen?: (task: Task) => void;
    onMenu?: (task: Task) => void;
}

const TaskCard = memo(function TaskCard({ task, listColor, listName, onOpen, onMenu }: Props) {
    const { lists } = useTaskListsStore();

    const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
    const colorClass = listColor ?? list?.color ?? 'bg-gray-200 dark:bg-gray-700';
    const name = listName ?? list?.name ?? 'General';

    const completed = task.status === 'completed';

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
            className={`relative rounded-2xl border px-3 pt-3 pb-2.5 flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                completed
                    ? 'opacity-60 border-transparent'
                    : 'border-gray-100 dark:border-gray-800 bg-surface shadow-sm hover:border-primary/40 hover:shadow-md'
            }`}
        >
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