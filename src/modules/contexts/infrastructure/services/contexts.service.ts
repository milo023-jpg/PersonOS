import { dbService } from '../../../../services/dbService';
import type { Context } from '../../domain/models/types';

export const contextsService = {
    async getContexts(userId: string): Promise<Context[]> {
        return dbService.getCollectionDocuments<Context>(`users/${userId}/contexts`);
    },

    async createContext(userId: string, data: Omit<Context, 'id' | 'userId'>): Promise<string> {
        const docData = { ...data, userId };
        return dbService.addDocument(`users/${userId}/contexts`, docData);
    },

    async updateContext(userId: string, contextId: string, data: Partial<Context>): Promise<void> {
        return dbService.updateDocument(`users/${userId}/contexts`, contextId, data);
    },

    async archiveContext(userId: string, contextId: string, isArchived: boolean): Promise<void> {
        return dbService.updateDocument(`users/${userId}/contexts`, contextId, { isArchived });
    }
}
