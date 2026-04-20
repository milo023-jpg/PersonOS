import { dbService } from '../../../../services/dbService';
import type { Task } from '../../domain/models/Task';

export const taskRepository = {
    async getTasks(userId: string): Promise<Task[]> {
        return await dbService.getCollectionDocuments<Task>(`users/${userId}/tasks`);
    },

    async createTask(task: Omit<Task, 'id'>): Promise<string> {
        return await dbService.addDocument(`users/${task.userId}/tasks`, task);
    },

    async updateTask(userId: string, taskId: string, partial: Partial<Task>): Promise<void> {
        await dbService.updateDocument(`users/${userId}/tasks`, taskId, partial);
    },

    async deleteTask(userId: string, taskId: string): Promise<void> {
        await dbService.deleteDocument(`users/${userId}/tasks`, taskId);
    }
};
