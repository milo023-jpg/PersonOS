export interface Habit {
    id?: string;
    userId: string;
    name: string;
    type: 'daily' | 'weekly';
    frequency?: number; // Ej: 3 (veces por semana) si type es 'weekly'
    icon: string;
    colorClass: string;
    textColorClass: string;
    createdAt: number;
    startDate: string; // Formato YYYY-MM-DD
    endDate?: string; // Formato YYYY-MM-DD (Opcional)
    category?: string;

    // Global Stats Root Sync (enfoque en consistencia, sin rachas)
    totalCompletions?: number;
    currentMonthCount?: number;
    lastMonthCount?: number;
    completionRate?: number;       // completedCount / target del mes actual (0-100)
    last7DaysCompletions?: number;
    bestMonth?: { month: string; completedCount: number };
    averagePerMonth?: number;
    contextId?: string | null;
}

export interface HabitLog {
    id?: string;
    userId: string;
    habitId: string;
    date: string; // Formato YYYY-MM-DD
    completed: boolean;
    createdAt: number;
}
