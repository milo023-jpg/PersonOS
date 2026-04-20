import { motion } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';
import { useTasksStore } from '../../../application/store/tasksStore';
import { normalizeTaskDateTimestamp } from '../../../domain/utils/taskDate';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';

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

export default function TaskItem({ task, onSelect, bgClass }: Props) {
    const { userId } = useAuthStore();
    const { moveTaskStatus, toggleTaskImportance } = useTasksStore();
    const { lists } = useTaskListsStore();
    const { contexts } = useContextsStore();

    const isCompleted = task.status === 'completed';
    const normalizedDueDate = task.dueDate ? normalizeTaskDateTimestamp(task.dueDate) : undefined;

    const list = task.listId ? lists.find(l => l.id === task.listId) : null;
    const context = task.contextId ? contexts.find(c => c.id === task.contextId) : null;

    const getPriorityColor = () => {
        if (isCompleted) return 'bg-gray-200 dark:bg-gray-800';
        switch(task.priority) {
            case 'urgent': return 'bg-danger text-white border-danger shadow-danger/20';
            case 'high': return 'bg-orange-500 text-white border-orange-500 shadow-orange-500/20';
            case 'medium': return 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20';
            default: return 'bg-gray-200 dark:bg-gray-700 text-text-secondary border-transparent';
        }
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group flex items-start gap-4 p-4 rounded-xl border ${bgClass || 'bg-surface'} transition-all cursor-pointer select-none ${isCompleted ? 'opacity-60 border-transparent hover:opacity-100' : 'border-gray-100 dark:border-gray-800/80 hover:border-primary/30 shadow-sm hover:shadow-md'}`}
            onClick={(e) => {
                // Ignore clicks on buttons to avoid opening the panel
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).closest('button')) {
                    return;
                }
                onSelect(task);
            }}
        >
            {/* Checkbox */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if(userId) moveTaskStatus(userId, task.id, isCompleted ? 'todo' : 'completed');
                }}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${isCompleted ? 'bg-primary text-white border border-primary' : 'border-2 border-gray-300 dark:border-gray-600 hover:border-primary text-transparent'}`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </button>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className={`text-[15px] font-bold truncate transition-colors ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                        {task.title}
                    </h3>
                    {task.isInbox && !isCompleted && (
                        <span className="shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[9px] uppercase font-black px-1.5 py-0.5 rounded">
                            NUEVA
                        </span>
                    )}
                </div>
                
                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-[11px] font-bold text-text-secondary">
                    
                    {/* Fecha */}
                    {normalizedDueDate !== undefined && (
                        <span className={`flex items-center gap-1 ${normalizedDueDate < Date.now() && !isCompleted && getIntelligentDate(normalizedDueDate) !== 'Hoy' ? 'text-red-500' : ''}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {getIntelligentDate(normalizedDueDate)}
                        </span>
                    )}
                    
                    {/* Prioridad visual compacta */}
                    <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor()}`}></span>
                        <span>{priorityLabels[task.priority] || task.priority}</span>
                    </span>

                    {/* Lista */}
                    {list && (
                        <span className="flex items-center gap-1 overflow-hidden" title={`Lista: ${list.name}`}>
                            <span className={`w-2 h-2 rounded-sm shrink-0 ${list.color}`}></span>
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


                </div>
            </div>

            {/* Acciones flotantes */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(userId) toggleTaskImportance(userId, task.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${task.isImportant ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <svg className="w-4 h-4" fill={task.isImportant ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                </button>
            </div>
        </motion.div>
    );
}
