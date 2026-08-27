import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import { GENERAL_LIST_ID } from '../../domain/constants/defaults';
import type { TaskList } from '../../domain/models/TaskList';
import { useTasksMobileNavigation } from './MobileNavigationContext';
import { useSortableSensors } from '../hooks/useSortableSensors';
import InlineTaskCreator from '../components/TaskList/InlineTaskCreator';
import CreateListModal from '../components/TaskList/CreateListModal';
import { ListDragPreview } from '../components/TaskList/ListDragPreview';
import { isDueBeforeOrToday, toTaskDateTimestamp } from '../../domain/utils/taskDate';
import { useReminderSync } from '../../../../shared/hooks/useReminderSync';
import { buildTaskReminders } from '../../application/services/taskReminder';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableListRow({ list, children }: { list: TaskList; children: ReactNode }) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: list.id,
        data: { list },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="cursor-grab active:cursor-grabbing">
            <div ref={setActivatorNodeRef} {...attributes} {...listeners}>
                {children}
            </div>
        </div>
    );
}

export default function TasksHomeMobile() {
    const { userId } = useAuthStore();
    const { tasks, fetchTasks } = useTasksStore();
    const { lists, fetchLists, reorderListsTo } = useTaskListsStore();
    const { goToList } = useTasksMobileNavigation();

    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isListCreatorOpen, setIsListCreatorOpen] = useState(false);
    const [creatorDate, setCreatorDate] = useState(() => Date.now());
    const [activeList, setActiveList] = useState<TaskList | null>(null);

    const sensors = useSortableSensors();

    // La lista general queda siempre primero y no se arrastra.
    const sortedLists = useMemo(() => {
        const arr = [...lists];
        arr.sort((a, b) => {
            if (a.id === GENERAL_LIST_ID) return -1;
            if (b.id === GENERAL_LIST_ID) return 1;
            return ((a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
                || (a.createdAt - b.createdAt);
        });
        return arr;
    }, [lists]);

    const sortableIds = useMemo(
        () => sortedLists.filter(l => l.id !== GENERAL_LIST_ID).map(l => l.id),
        [sortedLists]
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveList(event.active.data.current?.list ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveList(null);
        if (!over || active.id === over.id || !userId) return;

        const oldIndex = sortableIds.indexOf(String(active.id));
        const newIndex = sortableIds.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const orderedIds = arrayMove(sortableIds, oldIndex, newIndex);

        // Persistir el orden completo 1..n vía `reorderListsTo` (General queda 0).
        void reorderListsTo(userId, orderedIds);
    };

    useEffect(() => {
        if (userId) {
            fetchTasks(userId);
            fetchLists(userId);
        }
    }, [userId, fetchTasks, fetchLists]);

    const reminderPayloads = useMemo(() => buildTaskReminders(tasks), [tasks]);
    useReminderSync(reminderPayloads, [reminderPayloads, userId]);

    const todayCount = tasks.filter(t => {
        if (t.status === 'completed') return false;
        const isUnscheduledHighPriority = toTaskDateTimestamp(t.dueDate) === undefined && (t.priority === 'high' || t.priority === 'urgent');
        return isDueBeforeOrToday(t.dueDate) || isUnscheduledHighPriority;
    }).length;
    const allCount = tasks.filter(t => t.status !== 'completed').length;
    const generalCount = tasks.filter(t => t.listId === GENERAL_LIST_ID && t.status !== 'completed').length;

    const smartViews = [
        { id: 'today', label: 'Hoy', icon: '⭐', count: todayCount },
        { id: 'all', label: 'Todas', icon: '📋', count: allCount },
    ] as const;

    return (
        <motion.div
            className="h-full min-h-0 w-full flex flex-col bg-background"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Smart Views */}
            <div className="px-4 py-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">Vistas inteligentes</h2>
                <div className="grid grid-cols-2 gap-4">
                    {smartViews.map(view => (
                        <button
                            key={view.id}
                            onClick={() => goToList(view.id)}
                            className="bg-surface border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="text-3xl">{view.icon}</span>
                            <span className="font-bold text-text-primary">{view.label}</span>
                            <span className="text-sm text-text-secondary bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                {view.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Listas */}
            <div className="px-4 py-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Listas</h2>
                    <button
                        onClick={() => setIsListCreatorOpen(true)}
                        className="flex items-center gap-1.5 text-primary font-bold text-sm px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Nueva Lista
                    </button>
                </div>
                <div className="space-y-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={() => setActiveList(null)}
                    >
                        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                            {sortedLists.map(list => {
                                const listTasksCount = tasks.filter(t => t.listId === list.id && t.status !== 'completed').length;

                                const rowButton = () => (
                                    <div className="flex items-center gap-1 bg-surface border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <button
                                            onClick={() => goToList('list', list.id)}
                                            className="flex-1 min-w-0 flex items-center justify-between px-4 py-4 text-left"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`w-4 h-4 rounded-full shrink-0 ${list.color}`}></div>
                                                <span className="font-bold text-text-primary truncate">{list.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-text-secondary bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                                    {listTasksCount}
                                                </span>
                                                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                );

                                return list.id === GENERAL_LIST_ID
                                    ? <div key={list.id}>{rowButton()}</div>
                                    : (
                                        <SortableListRow key={list.id} list={list}>
                                            {rowButton()}
                                        </SortableListRow>
                                    );
                            })}
                        </SortableContext>
                        <DragOverlay>
                            {activeList ? <ListDragPreview list={activeList} /> : null}
                        </DragOverlay>
                    </DndContext>
                </div>
                <p className="mt-3 text-xs font-medium text-text-secondary">
                    General agrupa tareas sin una lista específica. {generalCount > 0 ? `${generalCount} activas por organizar.` : 'No hay tareas sin organizar.'}
                </p>
            </div>

            {/* Botón flotante */}
            <button
                onClick={() => {
                    setCreatorDate(Date.now());
                    setIsCreatorOpen(true);
                }}
                className="fixed bottom-6 right-6 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
            </button>

            {/* Modal de Creación */}
            {isCreatorOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCreatorOpen(false)}>
                    <div className="w-full max-w-2xl px-4 pb-8 max-h-full overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
                        <InlineTaskCreator defaultDate={creatorDate} onCancel={() => setIsCreatorOpen(false)} />
                    </div>
                </div>
            )}

            {/* Modal de Creación de Lista */}
            {isListCreatorOpen && (
                <CreateListModal onClose={() => setIsListCreatorOpen(false)} />
            )}
        </motion.div>
    );
}
