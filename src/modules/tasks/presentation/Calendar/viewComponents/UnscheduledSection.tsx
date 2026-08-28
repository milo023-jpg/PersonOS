import type { Task } from '../../../domain/models/Task';
import TaskRow from '../TaskRow';

interface Props {
    title: string;
    tasks: Task[];
    todayStart: number;
    onOpen: (task: Task) => void;
    className?: string;
}

export default function UnscheduledSection({ title, tasks, todayStart, onOpen, className = '' }: Props) {
    if (tasks.length === 0) return null;

    return (
        <section className={`flex flex-col gap-1.5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/50 p-2.5 ${className}`}>
            <div className="flex items-center gap-2 px-1 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {title}
                </span>
                <span className="text-[10px] font-bold text-text-secondary bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            {tasks.map((task) => (
                <TaskRow key={task.id} task={task} todayStart={todayStart} onOpen={onOpen} showTime />
            ))}
        </section>
    );
}