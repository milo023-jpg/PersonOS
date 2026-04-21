import { dbService } from '../../../../services/dbService';
import type { TaskList } from '../../domain/models/TaskList';

export const taskListsRepository = {
    async getLists(userId: string): Promise<TaskList[]> {
        return await dbService.getCollectionDocuments<TaskList>(`users/${userId}/taskLists`);
    },

    async createList(list: Omit<TaskList, 'id'>): Promise<string> {
        return await dbService.addDocument(`users/${list.userId}/taskLists`, list);
    },

    async upsertList(userId: string, listId: string, data: Omit<TaskList, 'id' | 'userId' | 'createdAt'>): Promise<void> {
        await dbService.upsertDocument(`users/${userId}/taskLists`, listId, {
            ...data,
            userId,
            createdAt: Date.now()
        });
    },

    async updateList(userId: string, listId: string, partial: Partial<TaskList>): Promise<void> {
        await dbService.updateDocument(`users/${userId}/taskLists`, listId, partial);
    },

    async deleteList(userId: string, listId: string): Promise<void> {
        await dbService.deleteDocument(`users/${userId}/taskLists`, listId);
    }
};
