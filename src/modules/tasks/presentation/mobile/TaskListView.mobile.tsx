import { useState } from 'react';
import { motion } from 'framer-motion';
import TodayView from '../components/TaskList/TodayView';
import AllTasksView from '../components/TaskList/AllTasksView';
import ListsView from '../components/TaskList/ListsView';
import SingleListView from '../components/TaskList/SingleListView';
import { useTasksMobileNavigation } from './MobileNavigationContext';
import { useTaskListsStore } from '../../application/store/taskListsStore';
import type { Task } from '../../domain/models/Task';

export default function TaskListViewMobile() {
    const { filter, listId, goBack } = useTasksMobileNavigation();
    const { lists } = useTaskListsStore();
    const [, setSelectedTaskId] = useState<string | null>(null);

    const getTitle = () => {
        switch (filter) {
            case 'today': return 'Hoy';
            case 'all': return 'Todas';
            case 'list': {
                const list = lists.find(l => l.id === listId);
                return list ? list.name : 'Lista';
            }
            default: return 'Tareas';
        }
    };

    const renderView = () => {
        const onSelectTask = (task: Task) => setSelectedTaskId(task.id);

        switch (filter) {
            case 'today':
                return <TodayView onSelectTask={onSelectTask} />;
            case 'all':
                return <AllTasksView onSelectTask={onSelectTask} />;
            case 'list':
                return listId ? <SingleListView onSelectTask={onSelectTask} listId={listId} /> : <ListsView onSelectTask={onSelectTask} />;
            default:
                return <TodayView onSelectTask={onSelectTask} />;
        }
    };

    return (
        <motion.div
            className="h-full min-h-0 w-full flex flex-col bg-background"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
                <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <h1 className="text-xl font-black text-text-primary">{getTitle()}</h1>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-h-0">
                {renderView()}
            </div>
        </motion.div>
    );
}
