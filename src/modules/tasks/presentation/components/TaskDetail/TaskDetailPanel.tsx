import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import ContextSelector from '../../../../contexts/presentation/components/ContextSelector';
import type { Task, TaskPriority, TaskStatus } from '../../../domain/models/Task';
import { useTasksStore } from '../../../application/store/tasksStore';
import { formatDateForInput, parseInputDateToTimestamp } from '../../../domain/utils/taskDate';

interface Props {
  task: Task | null;
  onClose: () => void;
}

const priorities: { value: TaskPriority, label: string, color: string }[] = [
    { value: 'urgent', label: 'Urgente', color: 'text-red-500' },
    { value: 'high', label: 'Alta', color: 'text-orange-500' },
    { value: 'medium', label: 'Media', color: 'text-blue-400' },
    { value: 'low', label: 'Baja', color: 'text-gray-400' }
];

const statuses: { value: TaskStatus, label: string, color: string, icon: string }[] = [
    { value: 'todo', label: 'Por hacer', color: 'text-text-primary', icon: '○' },
    { value: 'in_progress', label: 'En curso', color: 'text-blue-500', icon: '▶' },
    { value: 'completed', label: 'Completada', color: 'text-success', icon: '✓' }
];

export default function TaskDetailPanel({ task, onClose }: Props) {
    const { userId } = useAuthStore();
    const { updateTask, moveTaskStatus } = useTasksStore();

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    const statusRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setIsStatusOpen(false);
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setIsPriorityOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!task) return null;

    const handleChangeRecord = (field: Partial<Task>) => {
        if(userId) updateTask(userId, task.id, field);
    };

    const handleDateChange = (dateString: string) => {
        if (!dateString) {
            handleChangeRecord({ dueDate: undefined });
            return;
        }
        
        let newTimestamp = parseInputDateToTimestamp(dateString);
        // Preservar la hora si existía
        if (task.dueDate) {
            const oldDate = new Date(task.dueDate);
            const newDate = new Date(newTimestamp);
            newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
            newTimestamp = newDate.getTime();
        }
        handleChangeRecord({ dueDate: newTimestamp });
    };

    const handleTimeChange = (timeString: string) => {
        if (!task.dueDate) return;
        const d = new Date(task.dueDate);
        if (timeString) {
            const [h, m] = timeString.split(':').map(Number);
            d.setHours(h, m, 0, 0);
        } else {
            d.setHours(0, 0, 0, 0);
        }
        handleChangeRecord({ dueDate: d.getTime() });
    };

    const dueTimeStr = task.dueDate 
        ? `${new Date(task.dueDate).getHours().toString().padStart(2,'0')}:${new Date(task.dueDate).getMinutes().toString().padStart(2,'0')}` 
        : '';

    const currentStatus = statuses.find(s => s.value === task.status);
    const currentPriority = priorities.find(p => p.value === task.priority);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-surface shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-text-secondary bg-gray-100 dark:bg-background px-3 py-1.5 rounded-lg">
                                Tarea: {task.id.slice(0,6)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => userId && moveTaskStatus(userId, task.id, task.status === 'completed' ? 'todo' : 'completed')}
                                className="text-sm font-bold px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-background transition-colors flex items-center gap-2 text-text-primary"
                            >
                                {task.status === 'completed' ? 'Desmarcar' : '✓ Completar'}
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-background rounded-lg text-text-secondary transition-colors" title="Cerrar panel">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 system-scroll">
                        {/* Title input */}
                        <textarea 
                            value={task.title}
                            onChange={(e) => handleChangeRecord({ title: e.target.value })}
                            placeholder="Título de la tarea"
                            className="text-3xl font-black text-text-primary bg-transparent border-none resize-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
                            rows={2}
                        />

                        {/* Pills Area (Status, Priority) */}
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            
                            {/* Estado Pill */}
                            <div className="relative" ref={statusRef}>
                                <button 
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 ${currentStatus?.color || 'text-text-primary'}`}
                                >
                                    <span>{currentStatus?.icon}</span>
                                    {currentStatus?.label || 'Estado'}
                                </button>
                                {isStatusOpen && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 p-1 flex flex-col gap-1">
                                        {statuses.map(s => (
                                            <button 
                                                key={s.value}
                                                onClick={() => { handleChangeRecord({ status: s.value }); setIsStatusOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 ${s.color}`}
                                            >
                                                <span>{s.icon}</span>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Prioridad Pill */}
                            <div className="relative" ref={priorityRef}>
                                <button 
                                    onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${currentPriority?.color.replace('text-', 'bg-')} bg-gray-400`}></span>
                                    {currentPriority?.label || 'Prioridad'}
                                </button>
                                {isPriorityOpen && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 p-1 flex flex-col gap-1">
                                        {priorities.map(p => (
                                            <button 
                                                key={p.value}
                                                onClick={() => { handleChangeRecord({ priority: p.value }); setIsPriorityOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 ${p.color}`}
                                            >
                                                <span className="w-2h-2 rounded-full bg-current"></span>
                                                <span className="font-black text-xs">!</span>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Fecha y Hora Area */}
                        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-background/50 border border-gray-100 dark:border-white/5 rounded-2xl">
                            <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Planificación</span>
                            <div className="flex flex-wrap gap-3">
                                <input 
                                    title="Fecha de Vencimiento"
                                    type="date" 
                                    value={formatDateForInput(task.dueDate)}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="bg-white dark:bg-surface px-4 py-2.5 rounded-xl text-sm font-bold text-text-primary border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                                />
                                {task.dueDate && (
                                    <input 
                                        title="Hora (opcional)"
                                        type="time" 
                                        value={dueTimeStr === '00:00' ? '' : dueTimeStr}
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        className="bg-white dark:bg-surface px-4 py-2.5 rounded-xl text-sm font-bold text-text-primary border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all text-center w-[120px]"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Separador de Contexto */}
                        <div className="w-full">
                            <span className="text-xs font-black uppercase text-text-secondary tracking-wider block mb-3">Organización</span>
                            <ContextSelector 
                                value={task.contextId || null} 
                                onChange={(val) => handleChangeRecord({ contextId: val || undefined })} 
                            />
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* Description */}
                        <div className="flex-1 flex flex-col">
                            <h4 className="text-xs font-black uppercase text-text-secondary tracking-wider mb-3">Descripción (Markdown format)</h4>
                            <textarea 
                                value={task.description || ''}
                                onChange={(e) => handleChangeRecord({ description: e.target.value })}
                                placeholder="Añade más detalles, enlaces o notas sobre esta tarea..."
                                className="w-full flex-1 bg-transparent p-1 text-text-primary placeholder:text-gray-400 focus:outline-none transition-all font-medium resize-none min-h-[250px]"
                            />
                        </div>

                    </div>
                    
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
