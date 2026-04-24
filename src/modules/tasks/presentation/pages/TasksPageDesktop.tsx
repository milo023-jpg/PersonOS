import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import TodayView from '../components/TaskList/TodayView';
import AllTasksView from '../components/TaskList/AllTasksView';
import ListsView from '../components/TaskList/ListsView';
import KanbanBoard from '../components/TaskBoard/KanbanBoard';

import InlineTaskCreator from '../components/TaskList/InlineTaskCreator';
import { GENERAL_LIST_ID } from '../../domain/constants/defaults';
import { isDueBeforeOrToday, toTaskDateTimestamp } from '../../domain/utils/taskDate';
import { logger } from '../../../../shared/utils/logger';

type ViewMode = 'today' | 'all' | 'lists' | 'board';

export default function TasksPageDesktop() {
    const { userId } = useAuthStore();
    const { tasks, fetchTasks, error, clearError } = useTasksStore();
    const { fetchLists } = useTaskListsStore();

    const [activeView, setActiveView] = useState<ViewMode>('today');
    const [, setSelectedTaskId] = useState<string | null>(null);
    const [isGlobalCreatorOpen, setIsGlobalCreatorOpen] = useState(false);
    // const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

    // Cargar data real de Firebase
    useEffect(() => {
        if (userId) {
            fetchTasks(userId);
            fetchLists(userId);
        }
    }, [userId, fetchTasks, fetchLists]);

    const tabs = [
        {
            id: 'today',
            label: '⭐ Hoy',
            count: tasks.filter(t => {
                if (t.status === 'completed') return false;
                const isUnscheduledHighPriority = toTaskDateTimestamp(t.dueDate) === undefined && (t.priority === 'high' || t.priority === 'urgent');
                return isDueBeforeOrToday(t.dueDate) || isUnscheduledHighPriority;
            }).length
        },
        { id: 'all', label: '📋 Todas', count: tasks.filter(t => t.status !== 'completed').length },
        { id: 'lists', label: '🗂️ Listas', count: tasks.filter(t => t.listId === GENERAL_LIST_ID && t.status !== 'completed').length },
        { id: 'board', label: '🛹 Tablero', count: null },
    ] as const;

    return (
        <div className="h-full min-h-0 w-full flex flex-col pt-2 bg-background relative overflow-hidden">

            {/* Cabecera / Pestañas */}
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
                {error && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.29 3.86l-7.17 12.42A2 2 0 004.84 19h14.32a2 2 0 001.72-2.72L13.71 3.86a2 2 0 00-3.42 0z"></path>
                        </svg>
                        <div className="min-w-0 flex-1 font-medium">{error}</div>
                        <button
                            onClick={clearError}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 dark:text-red-100 dark:hover:bg-red-500/10"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
                <h1 className="text-2xl font-black text-text-primary tracking-tight shrink-0 mr-4">Tareas</h1>

                <div className="flex bg-gray-100 dark:bg-surface p-1 rounded-xl gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as ViewMode)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeView === tab.id ? 'bg-white dark:bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeView === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={() => setIsGlobalCreatorOpen(true)}
                        className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Añadir Tarea
                    </button>
                    {/* Fake search or quick actions if needed */}
                    {import.meta.env.DEV && (
                        <button
                            onClick={async () => {
                                if (!userId) return;

                                const { seedDBWithLists } = await import('../../../../scripts/seedTasks');
                                await seedDBWithLists(userId);
                                await fetchTasks(userId);
                                logger.info('Seed ejecutado en entorno de desarrollo.', { userId });
                            }}
                            className="bg-yellow-500/10 text-yellow-600 font-bold px-3 py-2 rounded-xl text-xs hover:bg-yellow-500/20 transition-colors"
                        >
                            [DEV] Ejecutar Seed
                        </button>
                    )}
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Buscar (Cmd+K)" className="bg-gray-50 dark:bg-surface border-none rounded-xl text-sm pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 text-text-primary placeholder:text-gray-400" />
                    </div>
                </div>
                </div>
            </div>

            {/* Contenedor de la Vista Activa */}

            <div className="flex-1 min-h-0 w-full relative">
                {activeView === 'today' && <TodayView onSelectTask={(t) => setSelectedTaskId(t.id)} />}
                {activeView === 'all' && <AllTasksView onSelectTask={(t) => setSelectedTaskId(t.id)} />}
                {activeView === 'lists' && <ListsView onSelectTask={(t) => setSelectedTaskId(t.id)} />}
                {activeView === 'board' && <KanbanBoard onSelectTask={(t) => setSelectedTaskId(t.id)} />}
            </div>


            {/* Modal de Creación Global */}
            {isGlobalCreatorOpen && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsGlobalCreatorOpen(false)}>
                    <div className="w-full max-w-2xl px-4" onClick={e => e.stopPropagation()}>
                        <InlineTaskCreator defaultDate={Date.now()} onCancel={() => setIsGlobalCreatorOpen(false)} />
                    </div>
                </div>
            )}

        </div>
    );
}
