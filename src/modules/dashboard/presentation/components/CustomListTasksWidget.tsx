import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../../tasks/application/store/tasksStore';
import { useTaskListsStore } from '../../../tasks/application/store/taskListsStore';

export default function CustomListTasksWidget() {
    const { userId } = useAuthStore();
    const { lists, fetchLists } = useTaskListsStore();
    const { tasks, updateTask } = useTasksStore();
    const [selectedListId, setSelectedListId] = useState<string>(() => {
        return localStorage.getItem('dashboard_custom_list_id') || '';
    });

    useEffect(() => {
        if (userId) {
            fetchLists(userId);
        }
    }, [userId, fetchLists]);

    useEffect(() => {
        if (selectedListId) {
            localStorage.setItem('dashboard_custom_list_id', selectedListId);
        }
    }, [selectedListId]);

    // Filtrar tareas de la lista seleccionada que no estén completadas
    const listTasks = tasks.filter(t => 
        t.status !== 'completed' && 
        t.listId === selectedListId
    ).slice(0, 8); // Mostrar máximo 8 para no romper el layout

    const currentList = lists.find(l => l.id === selectedListId);

    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <select 
                            value={selectedListId}
                            onChange={(e) => setSelectedListId(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-xl font-bold text-text-primary cursor-pointer hover:text-primary transition-colors pr-8 appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '1.2em' }}
                        >
                            <option value="" disabled className="text-sm dark:bg-zinc-900">Seleccionar lista...</option>
                            {lists.map(list => (
                                <option key={list.id} value={list.id} className="text-sm dark:bg-zinc-900">
                                    {list.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-sm text-text-secondary">Explora tus proyectos</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentList?.color || 'bg-gray-100 dark:bg-gray-800'}`}>
                    <span className="text-lg">📁</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-auto">
                {!selectedListId ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-60">
                        <span className="text-3xl mb-3">📂</span>
                        <p className="text-sm font-bold text-text-secondary text-center">Selecciona una lista para ver sus tareas</p>
                    </div>
                ) : listTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-60">
                        <span className="text-3xl mb-3">🍃</span>
                        <p className="text-sm font-bold text-text-secondary text-center">No hay tareas pendientes en esta lista</p>
                    </div>
                ) : (
                    listTasks.map((task) => (
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

                            <div className={`w-1 h-4 rounded-full flex-shrink-0 ${currentList?.color || 'bg-gray-300'}`}></div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
