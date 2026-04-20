import { useState } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTasksStore } from '../../../application/store/tasksStore';
import TaskItem from './TaskItem';
import { AnimatePresence } from 'framer-motion';
import type { Task } from '../../../domain/models/Task';

interface Props {
  onSelectTask: (task: Task) => void;
}

export default function InboxView({ onSelectTask }: Props) {
    const { userId } = useAuthStore();
    const { tasks, addTask } = useTasksStore();
    const [inputValue, setInputValue] = useState('');

    const inboxTasks = tasks.filter(t => t.isInbox && t.status !== 'completed');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() && userId) {
            const newTask: Task = {
                id: `t-${Date.now()}`,
                userId,
                title: inputValue.trim(),
                status: 'todo',
                priority: 'medium',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isRecurring: false,
                order: 0,
                isImportant: false,
                isInbox: true,
            };
            addTask(newTask);
            setInputValue('');
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col p-6 max-w-3xl mx-auto w-full gap-6">
            <div className="bg-surface rounded-2xl p-2 pl-4 border border-blue-500 shadow-sm shadow-blue-500/10 flex items-center gap-3">
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

            <div className="flex-1 overflow-y-auto pr-2 pb-6">
                {inboxTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl opacity-50 mb-2">📥</span>
                        <p className="font-bold text-text-secondary">Tu Inbox está vacío.</p>
                        <p className="text-sm font-medium text-gray-400 max-w-sm text-center mt-2">
                            Todo lo capturado rápidamente sin procesar aparecerá aquí. Es una zona temporal antes de asignarle fecha o proyecto.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {inboxTasks.map(t => (
                                <TaskItem key={t.id} task={t} onSelect={onSelectTask} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
