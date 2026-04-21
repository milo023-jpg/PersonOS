import { useTasksStore } from '../../../application/store/tasksStore';
import TaskItem from '../TaskList/TaskItem';
import { DndContext, DragOverlay, closestCorners, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '../../../domain/models/Task';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import InlineTaskCreator from '../TaskList/InlineTaskCreator';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SystemScrollArea } from '../../../../../shared/ui/SystemScrollArea';

// ... (omitiendo hasta SortDropdown)


interface Props {
  onSelectTask: (task: Task) => void;
}

type ColumnSort = 'manual' | 'updated_desc' | 'created_desc' | 'created_asc' | 'priority_desc' | 'due_asc';

const PRIORITY_WEIGHT: Record<Task['priority'], number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
};

function sortTasks(tasks: Task[], sort: ColumnSort): Task[] {
    const sorted = [...tasks];

    switch (sort) {
        case 'created_desc':
            return sorted.sort((a, b) => b.createdAt - a.createdAt);
        case 'created_asc':
            return sorted.sort((a, b) => a.createdAt - b.createdAt);
        case 'priority_desc':
            return sorted.sort((a, b) => {
                const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return (a.order ?? 0) - (b.order ?? 0);
            });
        case 'due_asc':
            return sorted.sort((a, b) => {
                const aDue = a.dueDate ?? Number.MAX_SAFE_INTEGER;
                const bDue = b.dueDate ?? Number.MAX_SAFE_INTEGER;
                if (aDue !== bDue) return aDue - bDue;
                return (a.order ?? 0) - (b.order ?? 0);
            });
        case 'updated_desc':
            return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
        case 'manual':
        default:
            return sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
}

function SortableTask({ task, onSelect }: { task: Task, onSelect: (t: Task) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { task }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`select-none touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : ''}`}
        >
            <TaskItem task={task} onSelect={onSelect} />
        </div>
    );
}


function SortDropdown({ value, onChange }: { value: ColumnSort, onChange: (v: ColumnSort) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const options: { value: ColumnSort, label: string, icon: React.ReactNode }[] = [
        { 
            value: 'manual', 
            label: 'Manual', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m3.024-4.5a1.5 1.5 0 113 0V15m-3.024-4.5V12m.024-9a1.5 1.5 0 10-3 0V12a3 3 0 106 0V6a1.5 1.5 0 10-3 0v.5M7 10a2 2 0 10-4 0v1a7 7 0 007 7h3a7 7 0 007-7V9a2 2 0 00-4 0" /></svg>
        },
        { 
            value: 'updated_desc', 
            label: 'Recientes', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        { 
            value: 'priority_desc', 
            label: 'Prioridad', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        },
        { 
            value: 'due_asc', 
            label: 'Fecha límite', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        },
        { 
            value: 'created_desc', 
            label: 'Nuevas', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
        },
        { 
            value: 'created_asc', 
            label: 'Antiguas', 
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
    ];

    const currentLabel = options.find(o => o.value === value)?.label || 'Manual';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5 transition-all duration-200 group shadow-sm active:scale-95"
            >
                <span className="text-[11px] uppercase tracking-wider font-black text-text-secondary group-hover:text-text-primary transition-colors">{currentLabel}</span>
                <svg 
                    className={`w-3 h-3 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 overflow-hidden"
                        >
                            <div className="flex flex-col gap-1">
                                {options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                            value === opt.value
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={value === opt.value ? 'text-white' : 'text-primary dark:text-primary-light'}>
                                            {opt.icon}
                                        </div>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function KanbanColumn({
    id,
    title,
    color,
    tasks,
    sort,
    onSortChange,
    onSelectTask
}: {
    id: TaskStatus,
    title: string,
    color: string,
    tasks: Task[],
    sort: ColumnSort,
    onSortChange: (sort: ColumnSort) => void,
    onSelectTask: (t: Task) => void
}) {
    const [isCreating, setIsCreating] = useState(false);
    const { setNodeRef, isOver } = useDroppable({
        id: `column:${id}`,
    });

    return (
        <div ref={setNodeRef} className={`flex-shrink-0 w-96 h-full flex flex-col rounded-2xl border ${color} p-4 transition-colors ${isOver ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary">
                        {title}
                    </h3>
                    <span className="bg-white dark:bg-background px-2 py-0.5 rounded-full text-xs font-black shadow-sm">
                        {tasks.length}
                    </span>
                </div>

                <SortDropdown 
                    value={sort} 
                    onChange={onSortChange} 
                />
            </div>
            {/* Scroll oculto */}
            <SystemScrollArea className="flex-1 flex flex-col gap-4">
                <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(t => (
                        <SortableTask key={t.id} task={t} onSelect={onSelectTask} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && !isCreating && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800/50 rounded-xl my-2 opacity-50">
                        <p className="text-xs font-bold text-gray-400">Suelta tareas aquí</p>
                    </div>
                )}
                {isCreating ? (
                    <div className="mt-1 mb-4">
                       <InlineTaskCreator 
                            onCancel={() => setIsCreating(false)} 
                            defaultDate={id === 'todo' ? Date.now() : undefined}
                            defaultStatus={id}
                       />
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="w-full text-left py-2 px-3 mt-1 mb-4 rounded-xl text-text-secondary hover:text-primary font-bold transition-all flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                    >
                        <svg className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Añadir tarea
                    </button>
                )}
            </SystemScrollArea>
        </div>
    );
}

export default function KanbanBoard({ onSelectTask }: Props) {
    const { userId } = useAuthStore();
    const { tasks, updateTasksBulk } = useTasksStore();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Sensores con restricciones para permitir interacción con botones internos
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const [columnSorts, setColumnSorts] = useState<Record<TaskStatus, ColumnSort>>({
        todo: 'manual',
        in_progress: 'manual',
        completed: 'manual',
        archived: 'manual',
    });

    const columns: { id: TaskStatus, title: string, color: string }[] = [
        { id: 'todo', title: 'Pendientes', color: 'bg-gray-100 dark:bg-surface border-gray-200 dark:border-gray-800' },
        { id: 'in_progress', title: 'En Curso', color: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' },
        { id: 'completed', title: 'Completado', color: 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' }
    ];

    const getColumnTasks = (status: TaskStatus) => sortTasks(tasks.filter((task) => task.status === status), columnSorts[status]);

    const setColumnSort = (status: TaskStatus, sort: ColumnSort) => {
        setColumnSorts((current) => ({ ...current, [status]: sort }));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTask(event.active.data.current?.task ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over || !userId || active.id === over.id) return;

        const activeId = active.id as string;
        const activeTaskData = tasks.find((task) => task.id === activeId);
        if (!activeTaskData) return;

        const overId = String(over.id);
        const overTask = tasks.find((task) => task.id === overId);
        const sourceStatus = activeTaskData.status;
        const targetStatus = overTask?.status ?? (overId.startsWith('column:') ? overId.replace('column:', '') as TaskStatus : sourceStatus);

        const sourceTasks = getColumnTasks(sourceStatus).filter((task) => task.id !== activeId);
        const targetBase = sourceStatus === targetStatus ? sourceTasks : getColumnTasks(targetStatus).filter((task) => task.id !== activeId);

        let targetTasks: Task[];

        if (sourceStatus === targetStatus) {
            const previousTasks = getColumnTasks(sourceStatus);
            const oldIndex = previousTasks.findIndex((task) => task.id === activeId);
            const newIndex = overTask
                ? previousTasks.findIndex((task) => task.id === overTask.id)
                : previousTasks.length - 1;

            targetTasks = arrayMove(previousTasks, oldIndex, newIndex);
            setColumnSort(sourceStatus, 'manual');
        } else {
            const insertIndex = overTask ? targetBase.findIndex((task) => task.id === overTask.id) : 0;
            const movedTask = { ...activeTaskData, status: targetStatus };
            targetTasks = [...targetBase];
            targetTasks.splice(insertIndex >= 0 ? insertIndex : 0, 0, movedTask);
            setColumnSorts((current) => ({
                ...current,
                [sourceStatus]: 'manual',
                [targetStatus]: 'manual',
            }));
        }

        const updates: Array<{ taskId: string; partial: Partial<Task> }> = [];

        sourceTasks.forEach((task, index) => {
            updates.push({
                taskId: task.id,
                partial: { order: index }
            });
        });

        targetTasks.forEach((task, index) => {
            const partial: Partial<Task> = { order: index };
            if (task.id === activeId && task.status !== activeTaskData.status) {
                partial.status = task.status;
                partial.completedAt = task.status === 'completed' ? Date.now() : null as any;
            }
            updates.push({
                taskId: task.id,
                partial
            });
        });

        const dedupedUpdates = Array.from(
            new Map(updates.map((update) => [update.taskId, update])).values()
        );

        void updateTasksBulk(userId, dedupedUpdates);
    };

    const orderedColumns = columns.map((col) => ({
        ...col,
        tasks: getColumnTasks(col.id),
        sort: columnSorts[col.id],
    }));

    return (
        <SystemScrollArea direction="x" className="absolute inset-0 p-6 flex justify-center gap-6 w-full h-full pb-6">
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCorners} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd} 
                onDragCancel={() => setActiveTask(null)}
            >
                {orderedColumns.map(col => {
                    return (
                        <KanbanColumn 
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            tasks={col.tasks}
                            sort={col.sort}
                            onSortChange={(sort) => setColumnSort(col.id, sort)}
                            onSelectTask={onSelectTask}
                        />
                    );
                })}
                <DragOverlay>
                    {activeTask ? (
                        <div className="w-96 rotate-1 scale-[1.01] drop-shadow-2xl">
                            <TaskItem task={activeTask} onSelect={onSelectTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </SystemScrollArea>
    );
}
