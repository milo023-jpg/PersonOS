import { useState, useRef, useEffect } from 'react';
import { useTasksStore } from '../../../application/store/tasksStore';
import TaskItem from './TaskItem';
import InlineTaskCreator from './InlineTaskCreator';
import { AnimatePresence } from 'framer-motion';
import type { Task, TaskStatus, TaskPriority } from '../../../domain/models/Task';
import { toTaskDateTimestamp } from '../../../domain/utils/taskDate';

interface Props {
  onSelectTask: (task: Task) => void;
}

type SortOption = 'created_desc' | 'created_asc' | 'due_asc' | 'due_desc';

export default function AllTasksView(_props: Props) {
    const { tasks } = useTasksStore();
    const [isCreating, setIsCreating] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<SortOption>('created_desc');

    // Popovers
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const statusRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setIsStatusOpen(false);
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setIsPriorityOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredAndSorted = tasks.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        return true;
    }).sort((a, b) => {
        if (sortOrder === 'created_desc') return b.createdAt - a.createdAt;
        if (sortOrder === 'created_asc') return a.createdAt - b.createdAt;
        
        const timeA = toTaskDateTimestamp(a.dueDate) ?? Number.MAX_SAFE_INTEGER;
        const timeB = toTaskDateTimestamp(b.dueDate) ?? Number.MAX_SAFE_INTEGER;
        
        if (sortOrder === 'due_asc') return timeA - timeB;
        if (sortOrder === 'due_desc') return timeB - timeA;
        
        return 0;
    });

    const pendingTasks = filteredAndSorted.filter(t => t.status !== 'completed');
    const completedTasks = filteredAndSorted.filter(t => t.status === 'completed');

    const getStatusLabel = () => {
        if (filterStatus === 'todo') return 'Por hacer';
        if (filterStatus === 'in_progress') return 'En curso';
        if (filterStatus === 'completed') return 'Completadas';
        return 'Estado: Todos';
    };

    const getPriorityLabel = () => {
        if (filterPriority === 'urgent') return 'Urgente';
        if (filterPriority === 'high') return 'Alta';
        if (filterPriority === 'medium') return 'Media';
        if (filterPriority === 'low') return 'Baja';
        return 'Prioridad: Todas';
    };

    const getSortLabel = () => {
        if (sortOrder === 'created_desc') return 'Más recientes';
        if (sortOrder === 'created_asc') return 'Más antiguas';
        if (sortOrder === 'due_asc') return 'Próximas a vencer';
        if (sortOrder === 'due_desc') return 'Más lejanas';
        return 'Ordenar';
    };

    return (
        <div className="absolute inset-0 flex flex-col p-6 max-w-5xl mx-auto w-full gap-6 h-full overflow-hidden">
            
            {/* Toolbar Filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-surface rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm shrink-0 items-center">
                
                {/* 1. Status Filter */}
                <div className="relative shrink-0" ref={statusRef}>
                    <button 
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${filterStatus !== 'all' ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {getStatusLabel()}
                    </button>
                    {isStatusOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 p-1 flex flex-col gap-1">
                            <button onClick={() => { setFilterStatus('all'); setIsStatusOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary">Todos los estados</button>
                            <button onClick={() => { setFilterStatus('todo'); setIsStatusOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary">O Por hacer</button>
                            <button onClick={() => { setFilterStatus('in_progress'); setIsStatusOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-blue-500">▶ En curso</button>
                            <button onClick={() => { setFilterStatus('completed'); setIsStatusOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-success">✓ Completadas</button>
                        </div>
                    )}
                </div>

                {/* 2. Priority Filter */}
                <div className="relative shrink-0" ref={priorityRef}>
                    <button 
                        onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${filterPriority !== 'all' ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                        {getPriorityLabel()}
                    </button>
                    {isPriorityOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-48 p-1 flex flex-col gap-1">
                            <button onClick={() => { setFilterPriority('all'); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary">Todas las prioridades</button>
                            <button onClick={() => { setFilterPriority('urgent'); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-red-500">! Urgente</button>
                            <button onClick={() => { setFilterPriority('high'); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-orange-500">! Alta</button>
                            <button onClick={() => { setFilterPriority('medium'); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-blue-400">! Media</button>
                            <button onClick={() => { setFilterPriority('low'); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">! Baja</button>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2 hidden sm:block"></div>

                {/* 3. Sort Order */}
                <div className="relative shrink-0" ref={sortRef}>
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                        {getSortLabel()}
                    </button>
                    {isSortOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden w-56 p-1 flex flex-col gap-1">
                            <span className="px-3 py-1 text-[10px] font-black uppercase text-text-secondary tracking-wider">Fecha de creación</span>
                            <button onClick={() => { setSortOrder('created_desc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary ${sortOrder === 'created_desc' ? 'bg-gray-50 dark:bg-white/5' : ''}`}>Más recientes primero</button>
                            <button onClick={() => { setSortOrder('created_asc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary ${sortOrder === 'created_asc' ? 'bg-gray-50 dark:bg-white/5' : ''}`}>Más antiguas primero</button>
                            <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-1"></div>
                            <span className="px-3 py-1 text-[10px] font-black uppercase text-text-secondary tracking-wider">Vencimiento</span>
                            <button onClick={() => { setSortOrder('due_asc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary ${sortOrder === 'due_asc' ? 'bg-gray-50 dark:bg-white/5' : ''}`}>Próximas a vencer</button>
                            <button onClick={() => { setSortOrder('due_desc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-text-primary ${sortOrder === 'due_desc' ? 'bg-gray-50 dark:bg-white/5' : ''}`}>Más lejanas</button>
                        </div>
                    )}
                </div>
                
                <div className="ml-auto flex items-center text-sm font-bold text-text-secondary pr-2 bg-gray-50 dark:bg-background px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                    {filteredAndSorted.length} Resultados
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pb-24 flex flex-col gap-3 custom-scrollbar pr-2 min-h-0">
                <AnimatePresence>
                    {pendingTasks.map(t => (
                        t.id === editingTaskId ? (
                            <div key={t.id} className="w-full">
                                <InlineTaskCreator editTask={t} onCancel={() => setEditingTaskId(null)} />
                            </div>
                        ) : (
                            <TaskItem key={t.id} task={t} onSelect={() => setEditingTaskId(t.id)} />
                        )
                    ))}
                    
                    {completedTasks.length > 0 && (
                        <div className="mt-4 mb-2 flex items-center gap-4">
                            <div className="h-px bg-gray-200 dark:bg-white/5 flex-1"></div>
                            <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Completadas</span>
                            <div className="h-px bg-gray-200 dark:bg-white/5 flex-1"></div>
                        </div>
                    )}
                    
                    {completedTasks.map(t => (
                        t.id === editingTaskId ? (
                            <div key={t.id} className="w-full">
                                <InlineTaskCreator editTask={t} onCancel={() => setEditingTaskId(null)} />
                            </div>
                        ) : (
                            <TaskItem key={t.id} task={t} onSelect={() => setEditingTaskId(t.id)} />
                        )
                    ))}
                </AnimatePresence>
                {filteredAndSorted.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center font-bold text-text-secondary opacity-60">
                        <span className="text-4xl mb-4">🔍</span>
                        No hay tareas que coincidan con estos filtros.
                    </div>
                )}
                <div className="mt-2 shrink-0">
                    {isCreating ? (
                        <InlineTaskCreator 
                            onCancel={() => setIsCreating(false)} 
                            defaultDate={Date.now()}
                        />
                    ) : (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="w-full text-left py-4 px-4 rounded-xl text-text-secondary hover:text-primary font-bold transition-all flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/30 hover:bg-primary/5 group"
                        >
                            <svg className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Añadir nueva tarea
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
