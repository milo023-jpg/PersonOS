// Modo de ordenamiento de las tareas dentro de una lista.
// 'manual' usa `order` (drag & drop); los otros dos son modos automáticos.
export type TaskSortMode = 'manual' | 'created_desc' | 'due_asc';

export interface TaskList {
    id: string;
    userId: string;
    name: string;
    color: string;
    order: number;
    createdAt: number;
    isDefault?: boolean;
    defaultContextId?: string;
    taskSortMode?: TaskSortMode;
}
