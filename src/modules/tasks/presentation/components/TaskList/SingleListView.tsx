import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTasksStore } from '../../../application/store/tasksStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { GENERAL_LIST_ID } from '../../../domain/constants/defaults';
import TaskItem from './TaskItem';
import InlineTaskCreator from './InlineTaskCreator';
import TaskSortDropdown from './TaskSortDropdown';
import { GripIcon } from './ListDragPreview';
import { AnimatePresence } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';
import type { TaskSortMode } from '../../../domain/models/TaskList';
import { sortTasksByMode } from '../../../domain/utils/taskSorting';
import { useSortableSensors } from '../../hooks/useSortableSensors';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SystemScrollArea } from '../../../../../shared/ui/SystemScrollArea';

interface Props {
    onSelectTask: (task: Task) => void;
    listId: string;
}

function SortableTask({ task, onSelect }: { task: Task; onSelect: (t: Task) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { task },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // 'manipulation' en lugar de 'none': permite scrollear por touch
        // mientras la presión sostenida (long-press) arranca el arrastre.
        touchAction: 'manipulation' as const,
        zIndex: isDragging ? 999 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`select-none cursor-grab active:cursor-grabbing rounded-xl transition-shadow ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
        >
            <TaskItem task={task} onSelect={onSelect} />
        </div>
    );
}

export default function SingleListView({ onSelectTask, listId }: Props) {
    const { userId } = useAuthStore();
    const { tasks, addTask, reorderTasks } = useTasksStore();
    const { lists, updateList } = useTaskListsStore();
    const [inputValue, setInputValue] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [localSortMode, setLocalSortMode] = useState<TaskSortMode | undefined>(undefined);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSortableSensors();

    const list = lists.find(l => l.id === listId);
    const listTasks = useMemo(
        () => tasks.filter(t => t.listId === listId && t.status !== 'completed'),
        [tasks, listId]
    );

    const sortMode = list?.taskSortMode ?? localSortMode ?? 'manual';
    const isManual = sortMode === 'manual';

    // El criterio es POR LISTA: cada lista guarda el suyo en `taskSortMode`.
    const sortedTasks = useMemo(() => sortTasksByMode(listTasks, sortMode), [listTasks, sortMode]);

    const handleSortChange = useCallback((mode: TaskSortMode) => {
        setLocalSortMode(mode);
        // `updateList` es optimista: el orden renderizado conmuta al instante.
        // La lista general está protegida por el store, así que ahí solo aplica en sesión.
        if (userId && listId && listId !== GENERAL_LIST_ID) {
            void updateList(userId, listId, { taskSortMode: mode });
        }
    }, [userId, listId, updateList]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveTask(event.active.data.current?.task ?? null);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over || active.id === over.id) return;

        const oldIndex = sortedTasks.findIndex(t => t.id === active.id);
        const newIndex = sortedTasks.findIndex(t => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // Usa el `order` persistido: reorderTasks reasigna 0..n en Firestore.
        const orderedIds = arrayMove(sortedTasks.map(t => t.id), oldIndex, newIndex);
        void reorderTasks(listId, orderedIds);
    }, [sortedTasks, reorderTasks, listId]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() && userId) {
            const newTask: Omit<Task, 'id'> = {
                userId,
                title: inputValue.trim(),
                status: 'todo',
                priority: 'medium',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isRecurring: false,
                order: 0,
                listId: listId || GENERAL_LIST_ID,
                source: 'manual',
                subtasks: [],
            };
            addTask(newTask);
            setInputValue('');
        }
    };

    if (!list) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-text-secondary">Lista no encontrada</p>
            </div>
        );
    }

    return (
        <>
        <SystemScrollArea className="w-full h-full flex flex-col p-6 max-w-3xl mx-auto gap-6">
            <div className="bg-surface rounded-2xl p-2 pl-4 border border-blue-500 shadow-sm shadow-blue-500/10 flex items-center gap-3 shrink-0">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe una tarea nueva y presiona Enter..."
                    className="w-full bg-transparent border-none focus:outline-none text-text-primary placeholder:text-gray-400 font-medium py-2"
                />
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0">
                <p className={`hidden sm:flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-opacity ${isManual ? 'opacity-80' : 'opacity-0'}`}>
                    <GripIcon className="w-3.5 h-3.5" />
                    Arrastra las tareas para reordenar
                </p>
                <div className="ml-auto">
                    <TaskSortDropdown value={sortMode} onChange={handleSortChange} />
                </div>
            </div>

            {listTasks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl opacity-50 mb-2">{list.color ? '📋' : '📝'}</span>
                    <p className="font-bold text-text-secondary">Esta lista está vacía.</p>
                    <p className="text-sm font-medium text-gray-400 max-w-sm text-center mt-2">
                        Agrega tareas a "{list.name}" para comenzar a organizarte.
                    </p>
                </div>
            ) : isManual ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveTask(null)}
                >
                    <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-3">
                            {sortedTasks.map(t => (
                                t.id === editingTaskId ? (
                                    <div key={t.id} className="w-full">
                                        <InlineTaskCreator editTask={t} onCancel={() => setEditingTaskId(null)} />
                                    </div>
                                ) : (
                                    <SortableTask
                                        key={t.id}
                                        task={t}
                                        onSelect={(task) => {
                                            setEditingTaskId(task.id);
                                            onSelectTask(task);
                                        }}
                                    />
                                )
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeTask ? (
                            <div className="rotate-1 scale-[1.01] drop-shadow-2xl">
                                <TaskItem task={activeTask} onSelect={onSelectTask} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                <div className="flex flex-col gap-3">
                    <AnimatePresence>
                        {sortedTasks.map(t => (
                            t.id === editingTaskId ? (
                                <div key={t.id} className="w-full">
                                    <InlineTaskCreator editTask={t} onCancel={() => setEditingTaskId(null)} />
                                </div>
                            ) : (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onSelect={(task) => {
                                        setEditingTaskId(task.id);
                                        onSelectTask(task);
                                    }}
                                />
                            )
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </SystemScrollArea>

        {/* Botón flotante */}
        <button
            type="button"
            onClick={() => setIsCreatorOpen(true)}
            className="fixed bottom-6 right-6 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            title="Añadir tarea a esta lista"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
        </button>

        {/* Modal de Creación */}
        {isCreatorOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCreatorOpen(false)}>
                <div className="w-full max-w-2xl px-4 pb-8 max-h-full overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
                    <InlineTaskCreator defaultListId={listId} onCancel={() => setIsCreatorOpen(false)} />
                </div>
            </div>
        )}
        </>
    );
}