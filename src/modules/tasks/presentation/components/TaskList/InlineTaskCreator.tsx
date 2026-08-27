import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTasksStore } from '../../../application/store/tasksStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import { GENERAL_LIST_ID } from '../../../domain/constants/defaults';
import type { Task, TaskPriority, TaskStatus } from '../../../domain/models/Task';
import DatePickerPopover from './DatePickerPopover';
import { logger } from '../../../../../shared/utils/logger';
import { buildTaskReminder, cancelTaskReminder } from '../../../application/services/taskReminder';
import { notificationService, type NotificationPermissionStatus } from '../../../../../services/notifications/NotificationService';

interface Props {
  onCancel: () => void;
  defaultContextId?: string;
  defaultListId?: string;
  defaultDate?: number;
  defaultStatus?: TaskStatus;
  editTask?: Task;
}

const priorities: { value: TaskPriority, label: string, color: string }[] = [
    { value: 'urgent', label: 'Urgente', color: 'text-red-500' },
    { value: 'high', label: 'Alta', color: 'text-orange-500' },
    { value: 'medium', label: 'Media', color: 'text-blue-400' },
    { value: 'low', label: 'Baja', color: 'text-gray-400' }
];

function formatReminderInput(timestamp?: number): string {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

export default function InlineTaskCreator({ onCancel, defaultContextId, defaultListId, defaultDate, defaultStatus = 'todo', editTask }: Props) {
    const { userId } = useAuthStore();
    const { addTask, updateTask } = useTasksStore();
    const { lists } = useTaskListsStore();
    const { contexts, fetchContexts } = useContextsStore();
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchContexts(userId);
        }
    }, [userId, fetchContexts]);

    const initialTime = editTask?.dueDate 
        ? `${new Date(editTask.dueDate).getHours().toString().padStart(2, '0')}:${new Date(editTask.dueDate).getMinutes().toString().padStart(2, '0')}`
        : '';
    
    const [title, setTitle] = useState(editTask?.title || '');
    const [description, setDescription] = useState(editTask?.description || '');
    const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'medium');
    const [dueDate, setDueDate] = useState<number | undefined>(editTask?.dueDate || defaultDate);
    const [dueTime, setDueTime] = useState<string>(initialTime === '00:00' ? '' : initialTime);
    
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [isReminderOpen, setIsReminderOpen] = useState(false);

    const [reminderAt, setReminderAt] = useState<number | undefined>(editTask?.reminderAt);
    const [reminderInput, setReminderInput] = useState<string>(formatReminderInput(editTask?.reminderAt));
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [reminderPermission, setReminderPermission] = useState<NotificationPermissionStatus>(() => {
        const p = notificationService.getPermission();
        return p === 'unsupported' ? 'denied' : p;
    });
    
    // Selectors
    const [isListOpen, setIsListOpen] = useState(false);
    const [selectedListId, setSelectedListId] = useState<string>(editTask?.listId || defaultListId || GENERAL_LIST_ID);

    const [isContextOpen, setIsContextOpen] = useState(false);
    const [selectedContextId, setSelectedContextId] = useState<string | undefined>(editTask?.contextId || defaultContextId);

    const formRef = useRef<HTMLFormElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const contextRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLDivElement>(null);
    const reminderRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown si se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
                setIsPriorityOpen(false);
            }
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                setIsListOpen(false);
            }
            if (contextRef.current && !contextRef.current.contains(event.target as Node)) {
                setIsContextOpen(false);
            }
            if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
                setIsTimeOpen(false);
            }
            if (reminderRef.current && !reminderRef.current.contains(event.target as Node)) {
                setIsReminderOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        
        if (!title.trim() || !userId || isLoading) return;

        setIsLoading(true);
        setReminderError(null);

        let scheduledAt: number | undefined;
        if (reminderAt !== undefined) {
            if (reminderAt <= Date.now()) {
                setReminderError('El recordatorio debe ser en el futuro.');
                setIsLoading(false);
                return;
            }
            scheduledAt = reminderAt;
        }

        if (reminderAt !== undefined && notificationService.getPermission() !== 'granted' && notificationService.isAvailable()) {
            const p = await notificationService.requestPermission();
            setReminderPermission(p);
        }

        try {
            const updates: Partial<Task> = {
                title: title.trim(),
                priority,
                updatedAt: Date.now(),
                listId: selectedListId || GENERAL_LIST_ID,
            };

            const trimmedDesc = description.trim();
            if (trimmedDesc) updates.description = trimmedDesc;
            else updates.description = ''; // clear if empty
            
            if (dueDate !== undefined) {
                let finalTime = dueDate;
                if (dueTime) {
                    const [hours, mins] = dueTime.split(':').map(Number);
                    const d = new Date(dueDate);
                    d.setHours(hours, mins, 0, 0);
                    finalTime = d.getTime();
                } else {
                    const d = new Date(dueDate);
                    d.setHours(0, 0, 0, 0);
                    finalTime = d.getTime();
                }
                updates.dueDate = finalTime;
            } else {
                updates.dueDate = undefined;
            }
            
            updates.contextId = selectedContextId || undefined;

            if (reminderAt !== undefined) {
                updates.reminderAt = reminderAt;
                updates.reminderStatus = 'scheduled';
            } else {
                updates.reminderAt = undefined;
                updates.reminderStatus = undefined;
            }

            let savedTaskId: string;
            if (editTask) {
                savedTaskId = editTask.id;
                await updateTask(userId, editTask.id, updates);
            } else {
                const newTask: Omit<Task, 'id'> = {
                    ...updates as any,
                    userId,
                    status: defaultStatus,
                    createdAt: Date.now(),
                    isRecurring: false,
                    order: 0,
                    source: 'manual',
                    subtasks: [],
                };
                savedTaskId = await addTask(newTask);
            }

            // Sincronizar la notificación local
            if (scheduledAt !== undefined) {
                if (!notificationService.isAvailable()) {
                    setReminderError('Este dispositivo no puede mostrar notificaciones programadas. Se guardó la tarea, pero el recordatorio no se activará.');
                } else if (notificationService.getPermission() !== 'granted') {
                    setReminderError('PersonOS no tiene permiso para notificarte. Haz clic en el candado junto a la URL (o en "Permisos" del sitio) y habilita "Notificaciones". Tu tarea se guardó, pero el recordatorio no se disparará.');
                } else {
                    const payload = buildTaskReminder({
                        id: savedTaskId,
                        title: title.trim(),
                        status: editTask?.status || defaultStatus,
                        reminderAt: scheduledAt,
                    } as Task);
                    if (payload) {
                        const ok = await notificationService.schedule(payload);
                        if (!ok) {
                            setReminderError('No se pudo programar el recordatorio en este navegador. Tu tarea se guardó correctamente.');
                        }
                    }
                }
            } else if (editTask?.reminderAt !== undefined) {
                await cancelTaskReminder(editTask.id);
            }

            // Cerrar el modal/formulario
            onCancel();
        } catch (error) {
            logger.error('Error saving task.', error);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
    };

    const getDateText = () => {
        if (!dueDate) return 'Fecha';
        const d = new Date(dueDate);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Hoy';
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    };

    const formatScheduledReminder = (timestamp: number) =>
        new Date(timestamp).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

    const applyReminderTime = (at: number) => {
        setReminderInput(formatReminderInput(at));
        setReminderAt(at);
        setReminderError(null);
    };

    const handleSaveReminderInput = () => {
        const timestamp = reminderInput ? new Date(reminderInput).getTime() : NaN;
        if (!Number.isFinite(timestamp)) {
            setReminderError('Elige una fecha y hora válidas.');
            return;
        }
        if (timestamp <= Date.now()) {
            setReminderError('El recordatorio debe ser en el futuro.');
            return;
        }
        setReminderAt(timestamp);
        setReminderError(null);
        setIsReminderOpen(false);
    };

    const handleClearReminder = () => {
        setReminderAt(undefined);
        setReminderInput('');
        setReminderError(null);
        setIsReminderOpen(false);
    };

    const handleEnableNotifications = async () => {
        if (!notificationService.isAvailable()) {
            setReminderPermission('denied');
            return;
        }
        const p = await notificationService.requestPermission();
        setReminderPermission(p);
        if (p === 'denied') {
            setReminderError('Las notificaciones están bloqueadas por el navegador. Actívalas tocando el candado junto a la URL (o Ajustes → Notificaciones del sitio) y eligiendo Permitir.');
        }
    };

    return (
        <div 
            ref={formRef as any}
            onKeyDown={handleKeyDown}
            className={`w-full p-5 relative bg-white dark:bg-[#111116] ${editTask ? 'rounded-2xl border border-primary/30 shadow-[0_4px_20px_rgb(160,74,249,0.1)]' : 'rounded-[24px] mb-4 animate-in fade-in slide-in-from-top-2 border border-gray-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]'}`}
        >
            {!editTask && (
                <div className="absolute top-5 right-5 text-gray-300 dark:text-gray-600 pointer-events-none">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h16M4 18h16" opacity="0.3"></path>
                    </svg>
                </div>
            )}

            <input 
                type="text" 
                autoFocus
                placeholder="Nombre de la tarea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-text-primary text-xl font-bold focus:outline-none placeholder:text-text-primary/40 mb-3"
            />
            
            <textarea 
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent text-text-secondary text-sm focus:outline-none resize-none placeholder:text-text-secondary/50 mb-5"
                rows={1}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                }}
            />

            {/* Fila de botones tipo Pill */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-6 overflow-visible pb-1 relative">
                
                {/* 1. Fecha Custom */}
                <div className="relative shrink-0">
                    <button 
                        type="button" 
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${dueDate ? 'bg-primary/20 text-primary dark:text-purple-300' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {getDateText()}
                    </button>
                    {isDateOpen && (
                        <DatePickerPopover 
                            value={dueDate} 
                            onChange={setDueDate} 
                            onClose={() => setIsDateOpen(false)} 
                        />
                    )}
                </div>

                {/* 1.5 Hora Custom */}
                {dueDate && (
                    <div className="relative shrink-0" ref={timeRef}>
                        <button 
                            type="button" 
                            title="Hora de vencimiento"
                            onClick={() => setIsTimeOpen(!isTimeOpen)}
                            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors outline-none focus:outline-none cursor-pointer ${dueTime ? 'bg-primary/20 text-primary dark:text-purple-300' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {dueTime || 'Sin hora'}
                        </button>
                        {isTimeOpen && (
                            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden w-auto max-w-[calc(100vw-2rem)] p-3 flex flex-col gap-2">
                                <span className="text-xs font-bold text-text-secondary w-max">Asignar hora (Opcional)</span>
                                <input 
                                    type="time" 
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="bg-gray-100 dark:bg-surface text-text-primary px-3 py-2 rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 w-full"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Prioridad */}
                <div className="relative shrink-0" ref={priorityRef}>
                    <button 
                        type="button"
                        onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${priority !== 'medium' ? 'bg-white/10 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    >
                        <span className={`flex items-center justify-center font-black ${priorities.find(p => p.value === priority)?.color}`}>
                            !
                        </span>
                        {priority === 'medium' ? 'Prioridad' : priorities.find(p => p.value === priority)?.label}
                    </button>

                    {isPriorityOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden w-40 p-1 flex flex-col gap-1">
                            {priorities.map(p => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => {
                                        setPriority(p.value);
                                        setIsPriorityOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-3 ${p.color}`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Recordatorio */}
                <div className="relative shrink-0" ref={reminderRef}>
                    <button 
                        type="button"
                        title="Recordatorio"
                        onClick={async () => {
                            setReminderError(null);
                            if (reminderPermission === 'default') {
                                const p = await notificationService.requestPermission();
                                setReminderPermission(p);
                            }
                            setIsReminderOpen(!isReminderOpen);
                        }}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
                            reminderAt
                                ? 'bg-primary/20 text-primary dark:text-purple-300'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                        <span>🔔</span>
                        {reminderAt ? formatScheduledReminder(reminderAt) : 'Recordarme'}
                    </button>
                    {isReminderOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden w-[280px] max-w-[calc(100vw-2rem)] p-4 flex flex-col gap-3">
                            {reminderPermission === 'granted' && (
                                <>
                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Programar recordatorio</span>
                                    <input 
                                        type="datetime-local"
                                        value={reminderInput || formatReminderInput(reminderAt)}
                                        onChange={(e) => setReminderInput(e.target.value)}
                                        className="bg-gray-100 dark:bg-surface text-text-primary px-3 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                                    />
                                    <div className="flex flex-col gap-1.5">
                                        {quickReminderOptions.map((q) => (
                                            <button
                                                key={q.label}
                                                type="button"
                                                onClick={() => applyReminderTime(q.compute())}
                                                className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary flex items-center gap-2 transition-colors"
                                            >
                                                <span>⚡</span>
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleSaveReminderInput}
                                        className="w-full px-3 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb] shadow-[0_0_15px_rgba(160,74,249,0.3)] transition-all active:scale-[0.98]"
                                    >
                                        Listo
                                    </button>
                                    {reminderAt !== undefined && (
                                        <button 
                                            type="button"
                                            onClick={handleClearReminder}
                                            className="w-full px-3 py-2 text-sm font-bold rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            Quitar recordatorio
                                        </button>
                                    )}
                                </>
                            )}

                            {reminderPermission === 'default' && (
                                <>
                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Activa las notificaciones</span>
                                    <p className="text-sm font-medium text-text-primary">
                                        Para programar recordatorios necesitas permitir notificaciones en este dispositivo.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => { void handleEnableNotifications(); }}
                                        className="w-full px-3 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb] shadow-[0_0_15px_rgba(160,74,249,0.3)] transition-all active:scale-[0.98]"
                                    >
                                        Activar notificaciones
                                    </button>
                                </>
                            )}

                            {reminderPermission === 'denied' && (
                                <>
                                    <span className="text-xs font-black uppercase text-text-secondary tracking-wider">Notificaciones bloqueadas</span>
                                    <p className="text-sm font-medium text-text-primary">
                                        Las notificaciones están bloqueadas por el navegador. Actívalas tocando el candado junto a la URL (o Ajustes → Notificaciones del sitio) y eligiendo Permitir.
                                    </p>
                                </>
                            )}

                            {reminderError && <p className="text-xs font-bold text-red-500">{reminderError}</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-px bg-gray-200 dark:bg-white/5 mb-5"></div>

            <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 4. Selector de Lista */}
                    <div className="relative shrink-0" ref={listRef}>
                        <button 
                            type="button"
                            onClick={() => setIsListOpen(!isListOpen)}
                            className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            {selectedListId ? (
                                <>
                                    <div className={`w-3 h-3 rounded-full ${lists.find(l => l.id === selectedListId)?.color || 'bg-gray-400'}`}></div>
                                    {lists.find(l => l.id === selectedListId)?.name || 'General'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                    General
                                </>
                            )}
                        </button>
                        {isListOpen && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden w-56 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto system-scroll p-1 flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedListId(GENERAL_LIST_ID);
                                        setIsListOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-3 text-gray-500 dark:text-gray-400"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                    General
                                </button>
                                {lists.map(list => (
                                    <button
                                        key={list.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedListId(list.id);
                                            // Auto-heredar contexto de la lista si lo tiene
                                            if (list.defaultContextId) setSelectedContextId(list.defaultContextId);
                                            setIsListOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-3 text-text-primary"
                                    >
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${list.color}`}></div>
                                        <span className="truncate">{list.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Selector de Contexto */}
                    <div className="relative shrink-0" ref={contextRef}>
                        <button 
                            type="button"
                            onClick={() => setIsContextOpen(!isContextOpen)}
                            className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            {selectedContextId ? (
                                <>
                                    <span>{contexts.find(c => c.id === selectedContextId)?.icon || '💼'}</span>
                                    {contexts.find(c => c.id === selectedContextId)?.name || 'Contexto oculto'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Añadir Contexto
                                </>
                            )}
                        </button>
                        {isContextOpen && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden w-56 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto system-scroll p-1 flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedContextId(undefined);
                                        setIsContextOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-3 text-gray-500 dark:text-gray-400"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Sin Contexto
                                </button>
                                {contexts.filter(c => !c.isArchived).map(ctx => (
                                    <button
                                        key={ctx.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedContextId(ctx.id);
                                            setIsContextOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-3 text-text-primary"
                                    >
                                        <span className="shrink-0">{ctx.icon}</span>
                                        <span className="truncate">{ctx.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap justify-end items-center gap-2">
                    <button 
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2 text-sm font-bold text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleAdd}
                        disabled={!title.trim() || isLoading}
                        className="px-5 py-2 text-sm font-bold text-white rounded-full 
                                   bg-gradient-to-r from-[#A04AF9] to-[#C33FFF] hover:from-[#8f41e5] hover:to-[#b43aeb]
                                   shadow-[0_0_15px_rgba(160,74,249,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                   transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4m0 12v4" opacity="0.3" />
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            editTask ? 'Guardar Cambios' : 'Añadir Tarea'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
