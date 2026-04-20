import { Link } from 'react-router-dom';
import type { Habit } from '../../domain/models/types';
import { useHabitsStore } from '../../application/store/habitsStore';

interface HabitCardProps {
    habit: Habit;
    isCompleted: boolean;
    selectedDate: string;
    userId: string;
}

export default function HabitCard({ habit, isCompleted, selectedDate, userId }: HabitCardProps) {
    const { toggleHabit, weeklyProgress } = useHabitsStore();

    const handleCheck = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleHabit(userId, habit.id!, selectedDate, !isCompleted);
    };

    // Para semanales: contador de la semana actual vs objetivo (motivante)
    const isWeekly = habit.type === 'weekly';
    const weeklyCompletions = weeklyProgress[habit.id!] ?? 0;
    const weeklyGoal = habit.frequency ?? 1;
    const weeklyProgressPct = isWeekly
        ? Math.min(100, Math.round((weeklyCompletions / weeklyGoal) * 100))
        : 0;
    // Para diarios: last7Days momentum
    const last7Days = habit.last7DaysCompletions ?? 0;
    const completionRate = habit.completionRate ?? 0;

    return (
        <Link to={`/habits/${habit.id}`} className="block bg-surface p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {/* Icono del Hábito */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm bg-${habit.colorClass}`}>
                        <span className={habit.textColorClass}>{habit.icon}</span>
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                            {habit.name}
                        </h3>
                        {/* Píldora de contexto */}
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md w-max mt-1 
                            ${isWeekly
                                ? weeklyCompletions >= weeklyGoal
                                    ? 'bg-success/10 text-success'
                                    : 'bg-primary/10 text-primary'
                                : isCompleted ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                            }`}>
                            {isWeekly
                                ? `🎯 ${weeklyCompletions}/${weeklyGoal} esta semana`
                                : `⚡ ${last7Days} / 7 días`
                            }
                        </div>
                    </div>
                </div>

                {/* Checkbox */}
                <button
                    onClick={handleCheck}
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${isCompleted ? 'bg-success border-success text-white scale-110' : 'border-gray-300 group-hover:border-primary'}
                `}>
                    {isCompleted && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                </button>
            </div>

            {/* Barra de Progreso: semanal para weekly, mensual para daily */}
            <div className="mt-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                    {isWeekly ? (
                        <>
                            <span className="text-text-secondary uppercase">Esta semana</span>
                            <span className="text-primary">{weeklyCompletions}/{weeklyGoal}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-text-secondary uppercase">Este mes</span>
                            <span className="text-primary">{completionRate}%</span>
                        </>
                    )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${isWeekly ? weeklyProgressPct : completionRate}%` }}
                    ></div>
                </div>
            </div>
        </Link>
    );
}
