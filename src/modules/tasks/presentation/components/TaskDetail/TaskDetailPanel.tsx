import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import ContextSelector from '../../../../contexts/presentation/components/ContextSelector';
import type { Task, TaskPriority, TaskStatus } from '../../../domain/models/Task';
import { useTasksStore } from '../../../application/store/tasksStore';
import { formatDateForInput, parseInputDateToTimestamp } from '../../../domain/utils/taskDate';
import SubtaskList from '../Subtasks/SubtaskList';
import { buildTaskReminder, cancelTaskReminder } from '../../../application/services/taskReminder';
import { notificationService, type NotificationPermissionStatus } from '../../../../../services/notifications/NotificationService';

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

const quickReminderOptions = [
    { label: 'En 1 hora', compute: () => Date.now() + 60 * 60 * 1000 },
    {
        label: 'Esta noche (21:00)',
        compute: () => {
            const d = new Date();
            d.setHours(21, 0, 0, 0);
            return d.getTime();
        },
    },
    {
        label: 'Mañana 09:00',
        compute: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(9, 0, 0, 0);
            return d.getTime();
        },
    },
];

export default function TaskDetailPanel({ task, onClose }: Props) {
    const { userId } = useAuthStore();
    const { updateTask, moveTaskStatus, addSubtask, toggleSubtask, editSubtask, deleteSubtask } = useTasksStore();

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    const [reminderInput, setReminderInput] = useState('');
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>(() => notificationService.getPermission());

    const statusRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const reminderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setIsStatusOpen(false);
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setIsPriorityOpen(false);
            if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) setIsReminderOpen(false);
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

    const formatReminderForInput = (timestamp?: number) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatScheduledReminder = (timestamp: number) =>
        new Date(timestamp).toLocaleString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

    const setReminderAt = async (at: number) => {
        setReminderError(null);
        if (!userId) return;

        if (!notificationService.isAvailable()) {
            setReminderError('Las notificaciones programadas no están disponibles en este navegador.');
            return;
        }

        let permission = notificationService.getPermission();
        if (permission !== 'granted') {
            permission = await notificationService.requestPermission();
        }

        if (permission !== 'granted') {
            setReminderError('Las notificaciones están bloqueadas en este navegador. Actívalas desde los ajustes del sitio (p. ej. Chrome: haz clic en el candado junto a la URL y habilita "Notificaciones") y vuelve a intentarlo.');
            setIsReminderOpen(false);
            return;
        }

        const payload = buildTaskReminder({ ...task, reminderAt: at });
        if (payload) {
            const ok = await notificationService.schedule(payload);
            if (!ok) {
                setReminderError('No se pudo programar el recordatorio en este navegador.');
                return;
            }
        }

        await updateTask(userId, task.id, { reminderAt: at, reminderStatus: 'scheduled' });
        setIsReminderOpen(false);
    };

    const handleSaveReminder = () => {
        const timestamp = reminderInput ? new Date(reminderInput).getTime() : NaN;
        if (!Number.isFinite(timestamp)) {
            setReminderError('Elige una fecha y hora válidas.');
            return;
        }
        if (timestamp <= Date.now()) {
            setReminderError('El recordatorio debe ser en el futuro.');
            return;
        }
        void setReminderAt(timestamp);
    };

    const handleRemoveReminder = async () => {
        if (!userId) return;
        setReminderError(null);
        await cancelTaskReminder(task.id);
        await updateTask(userId, task.id, { reminderAt: undefined, reminderStatus: undefined });
        setIsReminderOpen(false);
    };

    const handleEnableNotifications = async () => {
        if (!notificationService.isAvailable()) {
            setNotificationPermission('unsupported');
            return;
        }
        const p = await notificationService.requestPermission();
        setNotificationPermission(p);
        if (p === 'denied') {
            setReminderError('Las notificaciones están bloqueadas por el navegador. Actívalas tocando el candado junto a la URL (o Ajustes → Notificaciones del sitio) y eligiendo Permitir.');
        }
    };

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
                            <span className="text-xs font-black uppercase tracking-wider text-text-secondary bg-gray-100 dark:bg-background px-3 py-1.5 rounded-lg truncate">
                                Tarea: {task.id.slice(0,6)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => userId && moveTaskStatus(userId, task.id, task.status === 'completed' ? 'todo' : 'completed')}
                                className="text-sm font-bold px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-background transition-colors flex items-center gap-2 text-text-primary shrink-0"
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
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 max-w-[calc(100vw-2rem)] p-1 flex flex-col gap-1">
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
                                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 max-w-[calc(100vw-2rem)] p-1 flex flex-col gap-1">
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
                                    className="bg-white dark:bg-surface px-4 py-2.5 rounded-xl text-sm font-bold text-text-primary border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all w-full sm:w-auto"
                                />
                                {task.dueDate && (
                                    <input 
                                        title="Hora (opcional)"
                                        type="time" 
                                        value={dueTimeStr === '00:00' ? '' : dueTimeStr}
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        className="bg-white dark:bg-surface px-4 py-2.5 rounded-xl text-sm font-bold text-text-primary border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all text-center w-full sm:w-[120px]"
                                    />
                                )}
                            </div>

                            {/* Recordatorio */}
                            <div className="flex flex-col gap-2">
                                <div ref={reminderRef} className="relative w-max">
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            setReminderError(null);
                                            if (notificationPermission === 'default') {
                                                const p = await notificationService.requestPermission();
                                                setNotificationPermission(p);
                                            }
                                            setIsReminderOpen(!isReminderOpen);
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                                            task.reminderAt
                                                ? 'bg-primary/20 text-primary dark:text-purple-300'
                                                : 'bg-white dark:bg-surface text-text-primary border border-gray-200 dark:border-white/10 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <span>🔔</span>
                                        {task.reminderAt ? formatScheduledReminder(task.reminderAt) : 'Recordarme'}
                                    </button>

                                    {isReminderOpen && (
                                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-[280px] max-w-[calc(100vw-2rem)] p-4 flex flex-col gap-3">
                                            {notificationPermission === 'granted' && (
                                                <>
                                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Programar recordatorio</span>
                                                    <input 
                                                        type="datetime-local"
                                                        value={reminderInput || formatReminderForInput(task.reminderAt)}
                                                        onChange={(e) => setReminderInput(e.target.value)}
                                                        className="bg-gray-100 dark:bg-surface text-text-primary px-3 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                                                    />
                                                    <div className="flex flex-col gap-1.5">
                                                        {quickReminderOptions.map((q) => (
                                                            <button
                                                                key={q.label}
                                                                type="button"
                                                                onClick={() => {
                                                                    const at = q.compute();
                                                                    setReminderInput(formatReminderForInput(at));
                                                                    void setReminderAt(at);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary flex items-center gap-2 transition-colors"
                                                            >
                                                                <span>⚡</span>
                                                                {q.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={handleSaveReminder}
                                                        className="w-full px-3 py-2.5 text-sm font-black text-white rounded-xl bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb] shadow-[0_0_15px_rgba(160,74,249,0.3)] transition-all active:scale-[0.98]"
                                                    >
                                                        Programar
                                                    </button>
                                                    {task.reminderAt && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => { void handleRemoveReminder(); }}
                                                            className="w-full px-3 py-2 text-sm font-bold rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            Quitar recordatorio
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {notificationPermission === 'default' && (
                                                <>
                                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Activa las notificaciones</span>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        Para programar recordatorios necesitas permitir notificaciones en este dispositivo.
                                                    </p>
                                                    <button 
                                                        type="button"
                                                        onClick={() => { void handleEnableNotifications(); }}
                                                        className="w-full px-3 py-2.5 text-sm font-black text-white rounded-xl bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb] shadow-[0_0_15px_rgba(160,74,249,0.3)] transition-all active:scale-[0.98]"
                                                    >
                                                        Activar notificaciones
                                                    </button>
                                                </>
                                            )}

                                            {notificationPermission === 'denied' && (
                                                <>
                                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Notificaciones bloqueadas</span>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        Las notificaciones están bloqueadas por el navegador. Actívalas tocando el candado junto a la URL (o Ajustes → Notificaciones del sitio) y eligiendo Permitir.
                                                    </p>
                                                </>
                                            )}

                                            {notificationPermission === 'unsupported' && (
                                                <>
                                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">No disponible</span>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        Las notificaciones programadas no son compatibles con este navegador.
                                                    </p>
                                                </>
                                            )}

                                            {reminderError && (
                                                <p className="text-xs font-bold text-red-500">{reminderError}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
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

                        {/* Subtareas */}
                        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-background/50 border border-gray-100 dark:border-white/5 rounded-2xl">
                            <SubtaskList
                                subtasks={task.subtasks ?? []}
                                onToggle={(subtaskId) => userId && toggleSubtask(userId, task.id, subtaskId)}
                                onEdit={(subtaskId, newTitle) => userId && editSubtask(userId, task.id, subtaskId, newTitle)}
                                onDelete={(subtaskId) => userId && deleteSubtask(userId, task.id, subtaskId)}
                                onAdd={(title) => userId && addSubtask(userId, task.id, title)}
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
