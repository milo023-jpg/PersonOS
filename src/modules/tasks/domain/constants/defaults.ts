import type { TaskList } from '../models/TaskList';

export const GENERAL_LIST_ID = 'general';

export const GENERAL_LIST: Omit<TaskList, 'userId' | 'createdAt'> = {
    id: GENERAL_LIST_ID,
    name: 'General',
    color: 'bg-emerald-500',
    order: 0,
    isDefault: true,
};
