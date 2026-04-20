import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabitsStore } from '../../../habits/application/store/habitsStore';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { getLocalISODate } from '../../../../utils/dateUtils';
import { habitLogService } from '../../../../services/habitLog.service';
import type { HabitLog } from '../../../habits/domain/models/types';

export default function HabitsWidget() {
    const { userId } = useAuthStore();
    const { habits, fetchHabits, toggleHabit } = useHabitsStore();
    
    const today = getLocalISODate();
    const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);

    useEffect(() => {
        if (userId) {
            if (habits.length === 0) fetchHabits(userId);
            
            // Cargar explícitamente los logs de HOY para el dashboard
            habitLogService.getLogsByDate(userId, today).then(setTodayLogs);
        }
    }, [userId, fetchHabits, habits.length, today]);

    const handleCheck = async (e: React.MouseEvent, habitId: string, isCompleted: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (userId) {
            // Actualización optimista local
            setTodayLogs(prev => {
                const exists = prev.find(l => l.habitId === habitId);
                if (exists) {
                    return prev.map(l => l.habitId === habitId ? { ...l, completed: !isCompleted } : l);
                }
                return [...prev, { userId, habitId, date: today, completed: !isCompleted, createdAt: Date.now() } as HabitLog];
            });

            // Disparar lógica global
            await toggleHabit(userId, habitId, today, !isCompleted);
        }
    };

    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Hábitos del Día</h2>
                    <p className="text-sm text-text-secondary">Tu progreso diario</p>
                </div>
                <Link to="/habits" className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex-shrink-0" title="Ver todos">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </Link>
            </div>

            <div className="flex flex-col gap-3 flex-1">
                {habits.length === 0 ? (
                    <div className="text-sm text-text-secondary italic text-center p-4 border border-dashed border-gray-200 rounded-xl m-auto w-full">
                        No hay hábitos configurados.
                    </div>
                ) : (
                    habits.slice(0, 5).map((habit) => {
                        const isCompleted = todayLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                        const isWeekly = habit.type === 'weekly';
                        const momentum = isWeekly ? `${habit.last7DaysCompletions || 0} esta sem` : `${habit.last7DaysCompletions || 0}/7 d`;
                        
                        return (
                            <div 
                                key={habit.id} 
                                className="flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-transparent hover:bg-gray-50 dark:hover:bg-background transition-colors cursor-pointer group"
                                onClick={(e) => handleCheck(e, habit.id!, isCompleted)}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <button className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isCompleted ? 'bg-success border-success' : 'border-gray-300 group-hover:border-primary'}`}>
                                        {isCompleted && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        )}
                                    </button>
                                    <span className={`font-medium line-clamp-1 ${isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                        {habit.name}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 ml-2">
                                    <span>⚡</span>
                                    <span>{momentum}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    )
}
