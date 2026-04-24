import { useEffect } from 'react';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../../tasks/application/store/tasksStore';
import { isDueToday } from '../../../tasks/domain/utils/taskDate';

export default function TodayTasksWidget() {
    const { userId } = useAuthStore();
    const { tasks, fetchTasks, updateTask } = useTasksStore();

    useEffect(() => {
        if (userId) {
            fetchTasks(userId);
        }
    }, [userId, fetchTasks]);

    // Filtrar tareas que vencen hoy y no están completadas
    const todayTasks = tasks.filter(t => 
        t.status !== 'completed' && 
        t.dueDate && 
        isDueToday(t.dueDate)
    );

    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Tareas de Hoy</h2>
                    <p className="text-sm text-text-secondary">Enfoque para este día</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
                {todayTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-60">
                        <span className="text-3xl mb-3">✨</span>
                        <p className="text-sm font-bold text-text-secondary">No hay tareas para hoy</p>
                        <p className="text-[10px] text-gray-400">¡Disfruta tu día libre!</p>
                    </div>
                ) : (
                    todayTasks.map((task) => (
                        <div 
                            key={task.id} 
                            onClick={() => updateTask(userId!, task.id, { status: 'completed', completedAt: Date.now() })}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-transparent dark:hover:bg-background hover:border-primary/30 transition-all cursor-pointer group"
                        >
                            <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 group-hover:border-primary flex-shrink-0 flex items-center justify-center transition-colors"></div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-text-primary truncate transition-colors group-hover:text-primary">
                                    {task.title}
                                </h4>
                            </div>

                            <div className={`w-2 h-2 rounded-full flex-shrink-0
                                ${task.priority === 'urgent' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'}
                            `}></div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
