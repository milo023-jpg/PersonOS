import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';
import { useTasksStore } from '../../../application/store/tasksStore';
import { normalizeTaskDateTimestamp } from '../../../domain/utils/taskDate';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import SubtaskList from '../Subtasks/SubtaskList';

interface Props {
  task: Task;
  onSelect: (task: Task) => void;
  bgClass?: string;
}

const getIntelligentDate = (timestamp: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(timestamp);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    return targetDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const priorityLabels: Record<string, string> = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
};

const priorityDotColor: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-300 dark:bg-gray-700',
};

export default function TaskItem({ task, onSelect, bgClass }: Props) {
    const { userId } = useAuthStore();
    const { moveTaskStatus, addSubtask, toggleSubtask, editSubtask, deleteSubtask } = useTasksStore();
    const { lists } = useTaskListsStore();
    const { contexts } = useContextsStore();

    const [isExpanded, setIsExpanded] = useState(false);

    const isCompleted = task.status === 'completed';
    const normalizedDueDate = task.dueDate ? normalizeTaskDateTimestamp(task.dueDate) : undefined;
    const subtasks = task.subtasks ?? [];
    const completedSubtasksCount = subtasks.filter(s => s.completed).length;

    const list = task.listId ? lists.find(l => l.id === task.listId) : null;
    const context = task.contextId ? contexts.find(c => c.id === task.contextId) : null;

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // No abrir si se clickeó un botón interno o un input (subtareas)
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) return;
        onSelect(task);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group flex flex-col rounded-xl border ${bgClass || 'bg-surface'} transition-all cursor-pointer select-none
                ${isCompleted
                    ? 'opacity-60 border-transparent hover:opacity-100'
                    : 'border-gray-100 dark:border-gray-800/80 hover:border-primary/30 shadow-sm hover:shadow-md'}
                ${isExpanded ? 'border-primary/20 dark:border-primary/20' : ''}
            `}
            onClick={handleCardClick}
        >
            {/* ── Fila principal ── */}
            <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (userId) moveTaskStatus(userId, task.id, isCompleted ? 'todo' : 'completed');
                    }}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all
                        ${isCompleted
                            ? 'bg-primary text-white border border-primary'
                            : 'border-2 border-gray-300 dark:border-gray-600 hover:border-primary text-transparent'}`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </button>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`text-[15px] font-bold transition-all ${isExpanded ? 'whitespace-normal' : 'truncate'} ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                            {task.title}
                        </h3>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[11px] font-bold text-text-secondary">
                        {/* Fecha */}
                        {normalizedDueDate !== undefined && (
                            <span className={`flex items-center gap-1 ${normalizedDueDate < Date.now() && !isCompleted && getIntelligentDate(normalizedDueDate) !== 'Hoy' ? 'text-red-500' : ''}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {getIntelligentDate(normalizedDueDate)}
                            </span>
                        )}

                        {/* Prioridad */}
                        <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${priorityDotColor[task.priority] ?? 'bg-gray-300'}`} />
                            {priorityLabels[task.priority] || task.priority}
                        </span>

                        {/* Lista */}
                        {list && (
                            <span className="flex items-center gap-1 overflow-hidden" title={`Lista: ${list.name}`}>
                                <span className={`w-2 h-2 rounded-sm shrink-0 ${list.color}`} />
                                <span className="truncate max-w-[100px]">{list.name}</span>
                            </span>
                        )}

                        {/* Contexto */}
                        {context && (
                            <span className="flex items-center gap-1 overflow-hidden" title={`Contexto: ${context.name}`}>
                                <span className="shrink-0">{context.icon}</span>
                                <span className="truncate max-w-[100px]">{context.name}</span>
                            </span>
                        )}

                        {/* Progreso de subtareas — solo si colapsado y hay subtareas */}
                        {subtasks.length > 0 && !isExpanded && (
                            <span className="flex items-center gap-1 text-primary/80">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                {completedSubtasksCount}/{subtasks.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Botón toggle subtareas — siempre visible */}
                <button
                    onClick={handleToggleExpand}
                    title={isExpanded ? 'Ocultar subtareas' : 'Ver subtareas'}
                    className={`shrink-0 p-1.5 rounded-lg transition-all
                        ${isExpanded
                            ? 'text-primary bg-primary/10'
                            : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* ── Panel expandido de subtareas ── */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="subtasks"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                            <SubtaskList
                                subtasks={subtasks}
                                onToggle={(subtaskId) => userId && toggleSubtask(userId, task.id, subtaskId)}
                                onEdit={(subtaskId, newTitle) => userId && editSubtask(userId, task.id, subtaskId, newTitle)}
                                onDelete={(subtaskId) => userId && deleteSubtask(userId, task.id, subtaskId)}
                                onAdd={(title) => userId && addSubtask(userId, task.id, title)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
