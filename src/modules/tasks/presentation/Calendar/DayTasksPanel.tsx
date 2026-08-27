import { memo } from 'react';
import type { Task } from '../../domain/models/Task';
import { getDayRange } from '../../domain/utils/taskDate';
import TaskRow from './TaskRow';

interface Props {
    date: Date;
    tasks: Task[];
    todayStart: number;
    onOpenTask: (task: Task) => void;
    onCreateTask: (timestamp: number) => void;
    showCreateButton?: boolean;
    className?: string;
}

const DayTasksPanel = memo(function DayTasksPanel({
    date,
    tasks,
    todayStart,
    onOpenTask,
    onCreateTask,
    showCreateButton = true,
    className = '',
}: Props) {
    const pending = tasks.filter((task) => task.status !== 'completed');
    const completed = tasks.filter((task) => task.status === 'completed');

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {pending.map((task) => (
                <TaskRow key={task.id} task={task} todayStart={todayStart} onOpen={onOpenTask} showTime />
            ))}

            {completed.length > 0 && (
                <div className="mt-2 mb-0.5 flex items-center gap-3 px-1">
                    <span className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                        Hechas
                    </span>
                    <span className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                </div>
            )}
            {completed.map((task) => (
                <TaskRow key={task.id} task={task} todayStart={todayStart} onOpen={onOpenTask} showTime />
            ))}

            {pending.length === 0 && completed.length === 0 && (
                <p className="text-xs font-medium text-text-secondary/70 px-1 py-1.5">Sin tareas este día</p>
            )}

            {showCreateButton && (
                <button
                    onClick={() => onCreateTask(getDayRange(date).start)}
                    className="flex items-center gap-1.5 self-start px-2 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:text-primary transition-colors mt-0.5"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Añadir tarea
                </button>
            )}
        </div>
    );
});

export default DayTasksPanel;