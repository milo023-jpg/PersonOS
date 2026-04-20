import { create } from 'zustand';
import type { Habit, HabitLog } from '../../domain/models/types';
import { habitService } from '../../../../services/habit.service';
import { habitLogService } from '../../../../services/habitLog.service';
import { dbService } from '../../../../services/dbService';
import { getLocalISODate } from '../../../../utils/dateUtils';
import { getYearWeek } from '../services/statsCalculator';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  weeklyProgress: Record<string, number>; // habitId -> completedDays esta semana
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  setSelectedDate: (date: string, userId: string) => void;
  fetchHabits: (userId: string) => Promise<void>;
  fetchLogsForDate: (userId: string, date: string) => Promise<void>;
  fetchWeeklyProgress: (userId: string, date: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id'>) => Promise<void>;
  updateHabit: (userId: string, habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (userId: string, habitId: string) => Promise<void>;
  toggleHabit: (userId: string, habitId: string, date: string, completed: boolean) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  logs: [],
  weeklyProgress: {},
  selectedDate: getLocalISODate(),
  isLoading: false,
  error: null,

  setSelectedDate: (date: string, userId: string) => {
    set({ selectedDate: date });
    get().fetchLogsForDate(userId, date);
    get().fetchWeeklyProgress(userId, date);
  },

  fetchHabits: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitService.getHabitsByUser(userId);
      set({ habits });
      await Promise.all([
        get().fetchLogsForDate(userId, get().selectedDate),
        get().fetchWeeklyProgress(userId, get().selectedDate),
      ]);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLogsForDate: async (userId: string, targetDate: string) => {
    set({ error: null });
    try {
      const logs = await habitLogService.getLogsByDate(userId, targetDate);
      set({ logs });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  // Contador semanal puro (sin lógica de rachas)
  fetchWeeklyProgress: async (userId: string, date: string) => {
    try {
      const weekId = getYearWeek(date);
      const habits = get().habits;
      if (habits.length === 0) return;
      const progressMap: Record<string, number> = {};
      await Promise.all(
        habits.map(async (habit) => {
          if (!habit.id) return;
          try {
            const statDoc = await dbService.getDocument<{ completedDays: number }>(
              `users/${userId}/habits/${habit.id}/weeklyStats`, weekId
            );
            progressMap[habit.id] = statDoc?.completedDays ?? 0;
          } catch {
            progressMap[habit.id] = 0;
          }
        })
      );
      set({ weeklyProgress: progressMap });
    } catch (err: any) {
      console.error('Failed to fetch weekly progress', err);
    }
  },


  createHabit: async (habitData) => {
    set({ isLoading: true, error: null });
    try {
      const id = await habitService.createHabit(habitData);
      set((state) => ({
        habits: [...state.habits, { id, ...habitData }]
      }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateHabit: async (userId, habitId, habitData) => {
    try {
      await habitService.updateHabit(userId, habitId, habitData);
      set((state) => ({
        habits: state.habits.map(h => h.id === habitId ? { ...h, ...habitData } : h)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteHabit: async (userId, habitId) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.deleteHabit(userId, habitId);
      set((state) => ({
        habits: state.habits.filter(h => h.id !== habitId)
      }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleHabit: async (userId: string, habitId: string, date: string, completed: boolean) => {
    // Optimistic Update en logs
    set((state) => {
      const existingLogIndex = state.logs.findIndex(l => l.habitId === habitId && l.date === date);
      let newLogs = [...state.logs];
      if (existingLogIndex >= 0) {
        newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], completed };
      } else {
        newLogs.push({ id: 'temp-id', userId, habitId, date, completed, createdAt: Date.now() });
      }
      // Optimistic Update para weeklyProgress
      const change = completed ? 1 : -1;
      const newWeekly = { ...state.weeklyProgress };
      newWeekly[habitId] = Math.max(0, (newWeekly[habitId] || 0) + change);
      return { logs: newLogs, weeklyProgress: newWeekly };
    });

    try {
      const savedLog = await habitLogService.toggleHabitLog(userId, habitId, date, completed);
      
      set((state) => {
        const newLogs = state.logs.filter(l => l.id !== 'temp-id');
        const existingLogIndex = newLogs.findIndex(l => l.habitId === habitId && l.date === date);
        if (existingLogIndex >= 0) {
            newLogs[existingLogIndex] = savedLog;
        } else {
            newLogs.push(savedLog);
        }
        return { logs: newLogs };
      });
    } catch (err: any) {
      set({ error: err.message });
      // Revert in case of failure for robust optimistic UI could go here
    }
  }
}));
