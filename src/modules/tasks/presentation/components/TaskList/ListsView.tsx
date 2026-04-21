import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTasksStore } from '../../../application/store/tasksStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import { GENERAL_LIST_ID } from '../../../domain/constants/defaults';
import TaskItem from './TaskItem';
import InlineTaskCreator from './InlineTaskCreator';
import type { Task } from '../../../domain/models/Task';
import { AnimatePresence, motion } from 'framer-motion';
import { SystemScrollArea } from '../../../../../shared/ui/SystemScrollArea';

interface Props {
  onSelectTask: (task: Task) => void;
}

export default function ListsView({ onSelectTask }: Props) {
    const { userId } = useAuthStore();
    const { tasks } = useTasksStore();
    const { lists, fetchLists, createList, deleteList, updateList, reorderLists } = useTaskListsStore();
    const { contexts, fetchContexts } = useContextsStore();
    
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListColor, setNewListColor] = useState('bg-blue-500');
    const [newListDefaultContext, setNewListDefaultContext] = useState<string>('');
    
    // Estado para edición
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editListName, setEditListName] = useState('');
    const [editListColor, setEditListColor] = useState('');
    const [editListContext, setEditListContext] = useState('');

    // Estado para trackear qué listas están desplegadas mostrando todas sus tareas
    const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});
    const [activeCreatorListId, setActiveCreatorListId] = useState<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const toggleExpansion = (listId: string) => {
        setExpandedLists(prev => ({
            ...prev,
            [listId]: !prev[listId]
        }));
    };

    useEffect(() => {
        if (userId) {
            fetchLists(userId);
            fetchContexts(userId);
        }
    }, [userId, fetchLists, fetchContexts]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !newListName.trim()) return;
        
        await createList(userId, {
            name: newListName.trim(),
            color: newListColor,
            order: lists.length,
            ...(newListDefaultContext ? { defaultContextId: newListDefaultContext } : {})
        });
        
        setNewListName('');
        setNewListDefaultContext('');
        setIsCreatingList(false);
    };

    const handleDeleteList = async (listId: string) => {
        if (!userId || !confirm('¿Estás seguro de eliminar esta lista? Las tareas no se eliminarán, solo perderán su lista.')) return;
        await deleteList(userId, listId);
    };

    const handleUpdateList = async (listId: string) => {
        if (!userId || !editListName.trim()) return;
        await updateList(userId, listId, {
            name: editListName.trim(),
            color: editListColor,
            defaultContextId: editListContext || undefined
        });
        setEditingListId(null);
    };

    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
        'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
        'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500'
    ];

    return (
        <SystemScrollArea className="w-full h-full flex flex-col">
            <div className="mx-auto w-full max-w-7xl flex flex-col p-6 lg:px-8 gap-8 pb-24">
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-text-primary">Mis Listas</h2>
                    <p className="text-sm font-medium text-text-secondary mt-1">
                        Organiza tus tareas en listas personalizadas para tener mayor claridad.
                    </p>
                </div>
                {!isCreatingList && (
                    <button 
                        onClick={() => setIsCreatingList(true)}
                        className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Nueva Lista
                    </button>
                )}
            </div>

            {isCreatingList && (
                <form onSubmit={handleCreateList} className="bg-surface border border-gray-200 dark:border-white/5 rounded-2xl p-5 w-full shadow-sm">
                    <input 
                        autoFocus
                        type="text" 
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Nombre de la lista..."
                        className="w-full bg-transparent border-none focus:outline-none text-text-primary placeholder:text-gray-400 font-bold text-lg mb-4"
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Color Selector */}
                            <div className="flex gap-2 items-center">
                                {colors.slice(0, 6).map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        onClick={() => setNewListColor(c)}
                                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${c} ${newListColor === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110' : 'hover:scale-110'}`}
                                    />
                                ))}
                            </div>
                            {/* Selector Contexto por defecto */}
                            {contexts.length > 0 && (
                                <select 
                                    value={newListDefaultContext}
                                    onChange={e => setNewListDefaultContext(e.target.value)}
                                    className="bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-3 py-1.5 focus:border-primary outline-none text-sm w-48"
                                >
                                    <option value="">Sin contexto</option>
                                    {contexts.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCreatingList(false)}
                                className="text-sm font-bold text-text-secondary hover:text-text-primary py-2 px-4"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={!newListName.trim()}
                                className="bg-primary text-white text-sm font-bold py-2 px-5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {lists.length === 0 && !isCreatingList && (
                <div className="flex flex-col items-center justify-center p-12 opacity-60">
                     <span className="text-4xl mb-4">🗂️</span>
                     <p className="font-bold text-text-primary text-lg">No tienes listas aún</p>
                     <p className="text-sm text-text-secondary mt-1">Crea tu primera lista para organizar mejor tus tareas.</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {lists.map(list => {
                    const listTasks = tasks.filter(t => t.listId === list.id && t.status !== 'completed');
                    const isExpanded = !!expandedLists[list.id];
                    const displayedTasks = isExpanded ? listTasks : listTasks.slice(0, 4);
                    const isGeneralList = list.id === GENERAL_LIST_ID;
                    
                    return (
                        <div key={list.id} className="bg-surface border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all">
                            <div className="flex items-center justify-between group">
                                {editingListId === list.id ? (
                                    <div className="flex flex-col gap-3 w-full bg-white dark:bg-background p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <input 
                                            autoFocus
                                            value={editListName}
                                            onChange={e => setEditListName(e.target.value)}
                                            className="w-full bg-transparent font-bold text-lg text-text-primary focus:outline-none"
                                            placeholder="Nombre de la lista..."
                                        />
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex gap-2 items-center">
                                                {colors.slice(0, 6).map(c => (
                                                    <button 
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setEditListColor(c)}
                                                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${c} ${editListColor === c ? 'ring-2 ring-offset-1 ring-offset-surface ring-primary scale-110' : 'hover:scale-110'}`}
                                                    />
                                                ))}
                                            </div>
                                            {contexts.length > 0 && (
                                                <select 
                                                    value={editListContext}
                                                    onChange={e => setEditListContext(e.target.value)}
                                                    className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-transparent text-text-primary rounded-lg px-2 py-1 text-xs outline-none"
                                                >
                                                    <option value="">Sin contexto</option>
                                                    {contexts.map(c => (
                                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={() => setEditingListId(null)} className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-1.5">Cancelar</button>
                                            <button onClick={() => handleUpdateList(list.id)} className="text-xs font-bold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90">Guardar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5">
                                                <div className={`w-3.5 h-3.5 rounded-full ${list.color}`}></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black text-text-primary tracking-tight">{list.name}</h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-text-secondary bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                                                {listTasks.length}
                                            </span>
                                            <button 
                                                onClick={() => reorderLists(userId!, list.id, 'up')}
                                                disabled={lists.findIndex(l => l.id === list.id) === 0}
                                                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Mover arriba"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => reorderLists(userId!, list.id, 'down')}
                                                disabled={lists.findIndex(l => l.id === list.id) === lists.length - 1}
                                                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Mover abajo"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </button>
                                            {!isGeneralList && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingListId(list.id);
                                                            setEditListName(list.name);
                                                            setEditListColor(list.color);
                                                            setEditListContext(list.defaultContextId || '');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-all"
                                                        title="Editar lista"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteList(list.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                                                        title="Eliminar lista"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                {listTasks.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center">
                                        <p className="text-sm font-bold text-gray-400">Todo completo en esta lista. 🎉</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {/* 1. Lista de tareas (4 o todas según isExpanded) */}
                                        {displayedTasks.map(task => (
                                            <motion.div 
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="w-full"
                                            >
                                                {task.id === editingTaskId ? (
                                                    <InlineTaskCreator editTask={task} onCancel={() => setEditingTaskId(null)} />
                                                ) : (
                                                    <TaskItem
                                                        task={task}
                                                        onSelect={(selectedTask) => {
                                                            setEditingTaskId(selectedTask.id);
                                                            onSelectTask(selectedTask);
                                                        }}
                                                        bgClass="bg-gray-50 dark:bg-background"
                                                    />
                                                )}
                                            </motion.div>
                                        ))}

                                        {/* 2. Control de Expansión (Solo si hay más de 4 tareas) */}
                                        {!isExpanded && listTasks.length > 4 && (
                                            <motion.div 
                                                key={`expand-${list.id}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="w-full text-center mt-2"
                                            >
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpansion(list.id);
                                                    }}
                                                    className="w-full py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                                                >
                                                    + {listTasks.length - 4} tareas más
                                                </button>
                                            </motion.div>
                                        )}

                                        {isExpanded && listTasks.length > 4 && (
                                            <motion.div 
                                                key={`hide-${list.id}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="w-full text-center mt-2"
                                            >
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpansion(list.id);
                                                    }}
                                                    className="w-full py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                                                >
                                                    Ocultar tareas
                                                </button>
                                            </motion.div>
                                        )}

                                        {/* 3. Botón de Añadir Tarea (Siempre al final de todo el bloque) */}
                                        <motion.div key={`add-btn-${list.id}`} layout className="w-full">
                                            {activeCreatorListId === list.id ? (
                                                <div className="mt-3">
                                                    <InlineTaskCreator 
                                                        defaultListId={list.id}
                                                        onCancel={() => setActiveCreatorListId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setActiveCreatorListId(list.id)}
                                                    className="w-full text-left py-2.5 px-3 mt-2 rounded-xl text-text-secondary/60 hover:text-primary font-bold transition-all flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 group border border-dashed border-transparent hover:border-primary/20"
                                                >
                                                    <svg className="w-5 h-5 text-primary opacity-50 group-hover:opacity-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                    <span className="text-sm tracking-tight">Añadir tarea</span>
                                                </button>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </SystemScrollArea>
    );
}
