import { useState } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTasksStore } from '../../../application/store/tasksStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { GENERAL_LIST_ID } from '../../../domain/constants/defaults';
import TaskItem from './TaskItem';
import InlineTaskCreator from './InlineTaskCreator';
import { AnimatePresence } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';
import { SystemScrollArea } from '../../../../../shared/ui/SystemScrollArea';

interface Props {
    onSelectTask: (task: Task) => void;
    listId: string;
}

export default function SingleListView({ onSelectTask, listId }: Props) {
    const { userId } = useAuthStore();
    const { tasks, addTask } = useTasksStore();
    const { lists } = useTaskListsStore();
    const [inputValue, setInputValue] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const list = lists.find(l => l.id === listId);
    const listTasks = tasks.filter(t => t.listId === listId && t.status !== 'completed');

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
        <SystemScrollArea className="w-full h-full flex flex-col p-6 max-w-3xl mx-auto gap-6">
            <div className="bg-surface rounded-2xl p-2 pl-4 border border-blue-500 shadow-sm shadow-blue-500/10 flex items-center gap-3 shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <input 
                    autoFocus
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe una tarea nueva y presiona Enter..."
                    className="w-full bg-transparent border-none focus:outline-none text-text-primary placeholder:text-gray-400 font-medium py-2"
                />
            </div>

            <div className="flex flex-col gap-3">
                {listTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl opacity-50 mb-2">{list.color ? '📋' : '📝'}</span>
                        <p className="font-bold text-text-secondary">Esta lista está vacía.</p>
                        <p className="text-sm font-medium text-gray-400 max-w-sm text-center mt-2">
                            Agrega tareas a "{list.name}" para comenzar a organizarte.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {listTasks.map(t => (
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
                )}
            </div>
        </SystemScrollArea>
    );
}
