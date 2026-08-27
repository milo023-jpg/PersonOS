import { memo } from 'react';
import type { Task, TaskPriority } from '../../domain/models/Task';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import { isOverdue } from './taskCalendarUtils';

interface Props {
    task: Task;
    todayStart: number;
    onOpen: (task: Task) => void;
    showTime?: boolean;
}

const priorityDotColor: Record<TaskPriority, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-400 dark:bg-gray-600',
};

const TaskRow = memo(function TaskRow({ task, todayStart, onOpen, showTime = false }: Props) {
    const { userId } = useAuthStore();
    const { moveTaskStatus } = useTasksStore();
    const { lists } = useTaskListsStore();

    const completed = task.status === 'completed';
    const overdue = isOverdue(task, todayStart);

    const list = task.listId ? lists.find((list) => list.id === task.listId) : null;

    let timeLabel: string | null = null;
    if (showTime && typeof task.dueDate === 'number') {
        const date = new Date(task.dueDate);
        if (date.getHours() + date.getMinutes() > 0) {
            timeLabel = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
    }

    return (
        <div
            onClick={() => onOpen(task)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(task);
                }
            }}
            className={`group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors select-none
                ${completed
                    ? 'opacity-50 border-transparent'
                    : overdue
                        ? 'border-danger/25 bg-danger/5 hover:bg-danger/10'
                        : 'border-gray-100 dark:border-gray-800 bg-surface hover:border-primary/30'
                }`}
        >
            {/* Checkbox */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (userId) moveTaskStatus(userId, task.id, completed ? 'todo' : 'completed');
                }}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all
                    ${completed
                        ? 'bg-primary text-white border border-primary'
                        : 'border-2 border-gray-300 dark:border-gray-600 hover:border-primary text-transparent'
                    }`}
                aria-label={completed ? 'Desmarcar tarea' : 'Completar tarea'}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </button>

            {/* Contenido */}
            <div className="min-w-0 flex-1">
                <p
                    className={`text-[13px] font-semibold truncate transition-colors ${
                        completed ? 'line-through text-text-secondary' : 'text-text-primary'
                    }`}
                    title={task.title}
                >
                    {task.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDotColor[task.priority]}`} />
                    {timeLabel && (
                        <span className="text-[10px] font-bold text-text-secondary tabular-nums">{timeLabel}</span>
                    )}
                    {overdue && (
                        <span className="text-[10px] font-bold text-danger flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Atrasada
                        </span>
                    )}
                    {list && (
                        <span
                            className={`w-2 h-2 rounded-sm shrink-0 ${list.color}`}
                            title={list.name}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

export default TaskRow;