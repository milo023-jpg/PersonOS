import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../../tasks/application/store/tasksStore';

export default function TasksWidget() {
    const { userId } = useAuthStore();
    const { tasks, fetchTasks, updateTask } = useTasksStore();
    // const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchTasks(userId);
        }
    }, [userId, fetchTasks]);

    // Filtrar top 5 tareas pendientes
    const pendingTasks = tasks
        .filter(t => t.status !== 'completed')
        .sort((a,b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Tareas Prioritarias</h2>
                    <p className="text-sm text-text-secondary">Lo más importante hoy</p>
                </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
                {pendingTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <span className="text-2xl mb-2">🎉</span>
                        <p className="text-sm font-bold text-text-secondary opacity-80">Todo al día por hoy</p>
                    </div>
                ) : (
                    pendingTasks.map((task) => (
                        <div 
                            key={task.id} 
                            onClick={() => updateTask(userId!, task.id, { status: 'completed', completedAt: Date.now() })}
                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-50 dark:border-transparent dark:hover:bg-background hover:border-primary/30 transition-all cursor-pointer group"
                        >
                            <div className="w-5 h-5 rounded border border-gray-400 group-hover:border-primary flex-shrink-0 flex items-center justify-center transition-colors"></div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-text-primary truncate">
                                    {task.title}
                                </h4>
                            </div>

                            <div className={`w-2 h-2 rounded-full flex-shrink-0
                                ${task.priority === 'urgent' ? 'bg-danger' : task.priority === 'high' ? 'bg-orange-500' : 'bg-primary'}
                            `}></div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
