import { dbService } from './dbService';
import type { HabitLog } from '../modules/habits/domain/models/types';
import { where, runTransaction, doc } from 'firebase/firestore';
import { db } from './firebase';
import { getYearMonth, getYearWeek } from '../modules/habits/application/services/statsCalculator';
import { getLocalISODate } from '../utils/dateUtils';

// Calcula la meta mensual para un hábito según su tipo y frecuencia
function calculateMonthlyTarget(habitData: any, year: number, month: number): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (habitData.type === 'daily') return daysInMonth;
    // Para semanales: semanas en el mes * frecuencia
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    return weeksInMonth * (habitData.frequency || 1);
}

export const habitLogService = {
    async getLogsByDate(userId: string, date: string): Promise<HabitLog[]> {
        return await dbService.queryDocuments<HabitLog>(`users/${userId}/habitLogs`, 'date', '==', date);
    },

    async getLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
        return await dbService.queryMultiple<HabitLog>(`users/${userId}/habitLogs`, [
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        ]);
    },

    async toggleHabitLog(userId: string, habitId: string, date: string, completed: boolean): Promise<HabitLog> {
        const logId = `${habitId}_${date}`;
        const monthId = getYearMonth(date); // YYYY-MM
        const [year, month] = monthId.split('-').map(Number);

        const logData = { userId, habitId, date, completed, createdAt: Date.now() };

        const weekId = getYearWeek(date);

        const habitRef      = doc(db, `users/${userId}/habits/${habitId}`);
        const logRef        = doc(db, `users/${userId}/habitLogs`, logId);
        const monthlyRef    = doc(db, `users/${userId}/habits/${habitId}/monthlyStats`, monthId);
        const weeklyRef     = doc(db, `users/${userId}/habits/${habitId}/weeklyStats`, weekId);
        const globalRef     = doc(db, `users/${userId}/habits/${habitId}/stats`, 'global');

        // Para last7Days necesitamos leer los logs sin abrir una nueva transacción pesada.
        // Lo calculamos antes de la transacción leyendo solo 7 docs.
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const formatDate = (d: Date) => getLocalISODate(d);

        // Read paralelo fuera de transacción (no modifica, solo lee)
        const recentLogs = await habitLogService.getLogsByDateRange(
            userId,
            formatDate(sevenDaysAgo),
            formatDate(today)
        );
        const recentForHabit = recentLogs.filter(l => l.habitId === habitId && l.completed);
        // Ajustar optimísticamente el conteo de los 7 días con el toggle actual
        const wasInRecent = recentForHabit.some(l => l.date === date);
        let new7Days = recentForHabit.length;
        if (completed && !wasInRecent) new7Days++;
        if (!completed && wasInRecent) new7Days = Math.max(0, new7Days - 1);

        await runTransaction(db, async (transaction) => {
            // --- Reads ---
            const habitDoc   = await transaction.get(habitRef);
            const monthlyDoc = await transaction.get(monthlyRef);
            const weeklyDoc  = await transaction.get(weeklyRef);
            const globalDoc  = await transaction.get(globalRef);
            const logDoc     = await transaction.get(logRef);

            if (!habitDoc.exists()) throw new Error('Habit not found');

            const habitData    = habitDoc.data();
            const monthlyData  = monthlyDoc.exists() ? monthlyDoc.data()! : { completedCount: 0, activeDays: 0 };
            const weeklyData   = weeklyDoc.exists() ? weeklyDoc.data()! : { completedDays: 0 };
            const globalData   = globalDoc.exists() ? globalDoc.data()! : {
                totalCompletions: 0,
                currentMonthCount: 0,
                lastMonthCount: 0,
                bestMonth: null,
                totalMonthsTracked: 1,
                averagePerMonth: 0,
            };

            const change = completed ? 1 : -1;

            // ── PASO 1: ¿El día ya tenía un log previo? (para activeDays)
            const wasCompleted = logDoc.exists() ? logDoc.data()?.completed === true : false;
            const dayChanged = wasCompleted !== completed; // solo si cambia el estado del día

            // ── PASO 2: Nuevos valores de monthlyStats
            const newCompletedCount = Math.max(0, (monthlyData.completedCount || 0) + change);
            const newActiveDays = dayChanged
                ? Math.max(0, (monthlyData.activeDays || 0) + change)
                : (monthlyData.activeDays || 0);

            const monthlyTarget = calculateMonthlyTarget(habitData, year, month - 1);
            const newCompletionRate = Math.min(100, Math.round((newCompletedCount / monthlyTarget) * 100));

            // ── PASO 3: Nuevos valores de stats/global
            const newTotalCompletions = Math.max(0, (globalData.totalCompletions || 0) + change);
            const newCurrentMonthCount = newCompletedCount;

            // Evaluar si es el mejor mes
            const currentBest = globalData.bestMonth || { month: monthId, completedCount: 0 };
            const newBestMonth = newCompletedCount > currentBest.completedCount
                ? { month: monthId, completedCount: newCompletedCount }
                : currentBest;

            // Promedio incremental
            const totalMonthsTracked = Math.max(1, globalData.totalMonthsTracked || 1);
            const newAveragePerMonth = Math.round((newTotalCompletions / totalMonthsTracked) * 10) / 10;

            // ── Writes atómicos
            transaction.set(logRef, logData, { merge: true });

            // weeklyStats: solo contador puro (sin rachas)
            const newWeeklyCount = Math.max(0, (weeklyData.completedDays || 0) + change);
            transaction.set(weeklyRef, { completedDays: newWeeklyCount }, { merge: true });

            transaction.set(monthlyRef, {
                completedCount: newCompletedCount,
                target: monthlyTarget,
                completionRate: newCompletionRate,
                activeDays: newActiveDays,
            }, { merge: true });

            transaction.set(globalRef, {
                totalCompletions: newTotalCompletions,
                currentMonthCount: newCurrentMonthCount,
                lastMonthCount: globalData.lastMonthCount || 0,
                bestMonth: newBestMonth,
                totalMonthsTracked,
                averagePerMonth: newAveragePerMonth,
                last7DaysCompletions: new7Days,
            }, { merge: true });

            // Root sync en documento del hábito para O(1) reads desde Dashboard
            transaction.set(habitRef, {
                totalCompletions: newTotalCompletions,
                currentMonthCount: newCurrentMonthCount,
                completionRate: newCompletionRate,
                last7DaysCompletions: new7Days,
                bestMonth: newBestMonth,
                averagePerMonth: newAveragePerMonth,
                lastMonthCount: globalData.lastMonthCount || 0,
            }, { merge: true });
        });

        return { id: logId, ...logData };
    }
};
