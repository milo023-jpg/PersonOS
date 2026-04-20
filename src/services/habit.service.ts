import { dbService } from './dbService';
import type { Habit } from '../modules/habits/domain/models/types';

export const habitService = {
  // Obtener hábitos por userId
  async getHabitsByUser(userId: string): Promise<Habit[]> {
    return await dbService.getCollectionDocuments<Habit>(`users/${userId}/habits`);
  },

  // Crear nuevo hábito
  async createHabit(habitData: Omit<Habit, 'id'>): Promise<string> {
    return await dbService.addDocument(`users/${habitData.userId}/habits`, habitData);
  },

  // Actualizar hábito
  async updateHabit(userId: string, habitId: string, data: Partial<Habit>): Promise<void> {
    await dbService.updateDocument(`users/${userId}/habits`, habitId, data);
  },

  // Eliminar hábito
  async deleteHabit(userId: string, habitId: string): Promise<void> {
    await dbService.deleteDocument(`users/${userId}/habits`, habitId);
  }
};
