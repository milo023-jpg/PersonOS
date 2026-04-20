import { useTasksStore } from '../../../application/store/tasksStore';
import { useState } from 'react';
import TaskItem from './TaskItem';
import InlineTaskCreator from './InlineTaskCreator';
import { AnimatePresence } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';
import { getDayRange, isDueBeforeOrToday, toTaskDateTimestamp } from '../../../domain/utils/taskDate';

interface Props {
  onSelectTask: (task: Task) => void;
}

export default function TodayView({ onSelectTask }: Props) {
    const { tasks } = useTasksStore();
    const [isCreating, setIsCreating] = useState(false);
    const { start: startOfToday, end: endOfToday } = getDayRange();

    const todayTasks = tasks.filter(t => {
        if (t.isInbox) return false;
        if (t.status === 'completed') return false;

        const isUnscheduledHighPriority =
            toTaskDateTimestamp(t.dueDate) === undefined && (t.priority === 'high' || t.priority === 'urgent');

        return isDueBeforeOrToday(t.dueDate) || isUnscheduledHighPriority;
    });

    // Ordenar de pasado a futuro
    const sortedTasks = [...todayTasks].sort((a, b) => {
        const timeA = toTaskDateTimestamp(a.dueDate) ?? Number.MAX_SAFE_INTEGER;
        const timeB = toTaskDateTimestamp(b.dueDate) ?? Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
    });

    const overdueTasks = sortedTasks.filter(t => {
        const time = toTaskDateTimestamp(t.dueDate);
        return time !== undefined && time < startOfToday;
    });

    const pendingTodayTasks = sortedTasks.filter(t => {
        const time = toTaskDateTimestamp(t.dueDate);
        return time === undefined || time >= startOfToday;
    });

    const completedToday = tasks.filter(t => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        return t.completedAt >= startOfToday && t.completedAt <= endOfToday;
    });

    return (
        <div className="absolute inset-0 flex flex-col p-6 max-w-6xl mx-auto w-full gap-8 overflow-hidden h-full">
            <div className={`grid grid-cols-1 ${overdueTasks.length > 0 ? 'xl:grid-cols-2' : ''} gap-8 items-start w-full h-full min-h-0`}>
                
                {/* Columna Izquierda: Atrasadas */}
                {overdueTasks.length > 0 && (
                    <section className="w-full flex flex-col h-full min-h-0">
                        <h3 className="text-sm font-black text-red-500 uppercase tracking-wider mb-4 flex items-center justify-between shrink-0">
                            <span>Atrasadas</span>
                            <span className="bg-red-500/10 text-red-500 px-2 rounded-md">{overdueTasks.length}</span>
                        </h3>
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-6">
                            <AnimatePresence>
                                {overdueTasks.map(t => (
                                    <TaskItem key={t.id} task={t} onSelect={onSelectTask} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Columna Derecha o Centro: Para Hoy */}
                <section className={`w-full flex flex-col h-full min-h-0 ${overdueTasks.length === 0 ? 'max-w-3xl mx-auto' : ''}`}>
                    <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-4 flex items-center justify-between shrink-0">
                        <span>Para Hoy</span>
                        <span className="bg-gray-100 dark:bg-surface px-2 rounded-md">{pendingTodayTasks.length}</span>
                    </h3>
                    
                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-6">
                        {todayTasks.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl mb-4 shrink-0">
                                <span className="text-3xl mb-2">🎉</span>
                                <p className="font-bold text-text-secondary text-sm">Todo al día por hoy</p>
                            </div>
                        ) : pendingTodayTasks.length === 0 ? (
                            <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl mb-4 shrink-0">
                                <span className="text-xl mb-1">👍</span>
                                <p className="font-bold text-text-secondary text-xs">No hay más tareas para hoy</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 mb-4 shrink-0">
                                <AnimatePresence>
                                    {pendingTodayTasks.map(t => (
                                        <TaskItem key={t.id} task={t} onSelect={onSelectTask} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="shrink-0">
                            {isCreating ? (
                                <InlineTaskCreator 
                                    onCancel={() => setIsCreating(false)} 
                                    defaultDate={Date.now()}
                                />
                            ) : (
                                <button 
                                    onClick={() => setIsCreating(true)}
                                    className="w-full text-left py-3 px-4 mt-2 rounded-xl text-text-secondary hover:text-primary font-bold transition-all flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                                >
                                    <svg className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Añadir tarea
                                </button>
                            )}
                        </div>

                        {completedToday.length > 0 && (
                            <div className="mt-8 shrink-0">
                                <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-4 flex items-center justify-between">
                                    <span>Completadas</span>
                                    <span className="bg-gray-100 dark:bg-surface px-2 rounded-md text-success">{completedToday.length}</span>
                                </h3>
                                
                                <div className="flex flex-col gap-3">
                                    <AnimatePresence>
                                        {completedToday.slice(0, 5).map(t => (
                                            <TaskItem key={t.id} task={t} onSelect={onSelectTask} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
