import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../application/store/tasksStore';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import { GENERAL_LIST_ID } from '../../domain/constants/defaults';
import { useTasksMobileNavigation } from './MobileNavigationContext';
import InlineTaskCreator from '../components/TaskList/InlineTaskCreator';
import { isDueBeforeOrToday, toTaskDateTimestamp } from '../../domain/utils/taskDate';

export default function TasksHomeMobile() {
    const { userId } = useAuthStore();
    const { tasks, fetchTasks } = useTasksStore();
    const { lists, fetchLists } = useTaskListsStore();
    const { goToList } = useTasksMobileNavigation();

    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchTasks(userId);
            fetchLists(userId);
        }
    }, [userId, fetchTasks, fetchLists]);

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
    ];

    return (
        <motion.div
            className="h-full min-h-0 w-full flex flex-col bg-background"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-black text-text-primary">Tareas</h1>
            </div>

            {/* Smart Views */}
            <div className="px-4 py-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">Vistas inteligentes</h2>
                <div className="grid grid-cols-2 gap-4">
                    {smartViews.map(view => (
                        <button
                            key={view.id}
                            onClick={() => goToList(view.id as any)}
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
                <h2 className="text-lg font-bold text-text-primary mb-4">Listas</h2>
                <div className="space-y-2">
                    {lists.map(list => {
                        const listTasksCount = tasks.filter(t => t.listId === list.id && t.status !== 'completed').length;
                        return (
                            <button
                                key={list.id}
                                onClick={() => goToList('list', list.id)}
                                className="w-full bg-surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${list.color}`}></div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-text-primary">{list.name}</span>
                                        {list.id === GENERAL_LIST_ID}
                                    </div>
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
                        );
                    })}
                </div>
                <p className="mt-3 text-xs font-medium text-text-secondary">
                    General agrupa tareas sin una lista específica. {generalCount > 0 ? `${generalCount} activas por organizar.` : 'No hay tareas sin organizar.'}
                </p>
            </div>

            {/* Botón flotante */}
            <button
                onClick={() => setIsCreatorOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
            </button>

            {/* Modal de Creación */}
            {isCreatorOpen && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCreatorOpen(false)}>
                    <div className="w-full max-w-2xl px-4" onClick={e => e.stopPropagation()}>
                        <InlineTaskCreator defaultDate={Date.now()} onCancel={() => setIsCreatorOpen(false)} />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
