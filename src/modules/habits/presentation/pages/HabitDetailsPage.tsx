import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useHabitsStore } from '../../application/store/habitsStore';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { habitLogService } from '../../../../services/habitLog.service';
import { dbService } from '../../../../services/dbService';
import { getLocalISODate } from '../../../../utils/dateUtils';
import type { HabitLog } from '../../domain/models/types';
import CreateHabitModal from '../components/CreateHabitModal';

interface MonthlyStats {
    completedCount: number;
    target: number;
    completionRate: number;
    activeDays: number;
}

export default function HabitDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId } = useAuthStore();
    const { habits, fetchHabits, weeklyProgress, deleteHabit } = useHabitsStore();
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthLogs, setMonthLogs] = useState<HabitLog[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        if (userId && habits.length === 0) fetchHabits(userId);
    }, [userId, habits.length, fetchHabits]);

    const habit = habits.find(h => h.id === id);

    const formatDate = (d: Date) => getLocalISODate(d);

    // Cargar logs + monthlyStats del mes visible
    useEffect(() => {
        if (!userId || !id) return;

        const loadMonthData = async () => {
            setIsLoadingLogs(true);
            try {
                const y = currentMonth.getFullYear();
                const m = currentMonth.getMonth();
                const monthId = `${y}-${String(m + 1).padStart(2, '0')}`;

                const [logs, stats] = await Promise.all([
                    habitLogService.getLogsByDateRange(
                        userId,
                        formatDate(new Date(y, m, 1)),
                        formatDate(new Date(y, m + 1, 0))
                    ),
                    dbService.getDocument<MonthlyStats>(
                        `users/${userId}/habits/${id}/monthlyStats`,
                        monthId
                    )
                ]);

                setMonthLogs(logs.filter(l => l.habitId === id && l.completed));
                setMonthlyStats(stats ?? null);
            } catch (e) {
                console.error("Error al cargar datos del mes", e);
            } finally {
                setIsLoadingLogs(false);
            }
        };

        loadMonthData();
    }, [userId, id, currentMonth]);

    if (!habit) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary font-bold">Cargando hábito...</p>
                </div>
            </div>
        );
    }

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDayOfWeek = new Date(y, m, 1).getDay();
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentMonth);

    const logsMap = new Set(monthLogs.map(l => l.date));

    // Métricas del panel lateral
    const isWeekly = habit.type === 'weekly';
    const weeklyCompletions = weeklyProgress[habit.id!] ?? 0;
    const weeklyGoal = habit.frequency ?? 1;
    const thisMonthCount = monthlyStats?.completedCount ?? monthLogs.length;
    const thisMonthTarget = monthlyStats?.target ?? '--';
    const thisMonthRate = monthlyStats?.completionRate ?? 0;
    const last7Days = habit.last7DaysCompletions ?? 0;
    const bestMonthLabel = habit.bestMonth
        ? `${habit.bestMonth.completedCount}× en ${habit.bestMonth.month}`
        : '--';
    const avgPerMonth = habit.averagePerMonth ?? 0;

    // Consistency Score (visual, sin guardar)
    const consistencyScore = daysInMonth > 0
        ? Math.min(100, Math.round(((monthlyStats?.activeDays ?? monthLogs.length) / daysInMonth) * 100))
        : 0;

    // Tendencia: currentMonth vs lastMonth
    const trend = (habit.currentMonthCount ?? 0) - (habit.lastMonthCount ?? 0);

    const handleDelete = async () => {
        if (!userId || !id) return;
        if (window.confirm("¿Estás seguro de eliminar este hábito? Esta acción borrará el hábito permanentemente.")) {
            await deleteHabit(userId, id);
            navigate('/habits');
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link to="/habits" className="w-10 h-10 flex items-center justify-center bg-white dark:bg-background rounded-xl shadow-sm border border-gray-100 text-text-secondary hover:text-primary hover:border-primary/20 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </Link>
                <h2 className="text-xl font-bold text-text-primary">Volver a Hábitos</h2>
            </div>

            {/* Header del Hábito */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-surface p-8 rounded-3xl shadow-sm border border-gray-100 gap-6">
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-sm bg-${habit.colorClass}`}>
                        <span className={habit.textColorClass}>{habit.icon}</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">{habit.name}</h1>
                        <p className="text-text-secondary mt-1 capitalize">
                            Hábito {habit.type === 'daily' ? 'Diario' : `Semanal (${habit.frequency}x)`}
                        </p>
                    </div>
                </div>

                {/* Mini-métricas rápidas en el header */}
                <div className="flex gap-3">
                    {/* Para semanales: contador X/objetivo de la semana actual */}
                    {isWeekly && (
                        <div className={`px-5 py-4 rounded-2xl flex flex-col items-center min-w-[100px] border-2 transition-colors
                            ${ weeklyCompletions >= weeklyGoal
                                ? 'bg-success/10 border-success/20'
                                : 'bg-gray-50 dark:bg-background border-gray-100'
                            }`}>
                            <span className={`text-2xl font-black ${ weeklyCompletions >= weeklyGoal ? 'text-success' : 'text-primary' }`}>
                                {weeklyCompletions}<span className="text-base font-normal text-text-secondary">/{weeklyGoal}</span>
                            </span>
                            <span className="text-xs text-text-secondary font-bold uppercase mt-1 text-center leading-tight">Esta<br/>semana</span>
                        </div>
                    )}
                    <div className="bg-gray-50 dark:bg-background px-5 py-4 rounded-2xl flex flex-col items-center min-w-[90px]">
                        <span className="text-2xl font-black text-primary">{last7Days}</span>
                        <span className="text-xs text-text-secondary font-bold uppercase mt-1 text-center leading-tight">Últimos<br/>7 días</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-background px-5 py-4 rounded-2xl flex flex-col items-center min-w-[90px]">
                        <span className={`text-2xl font-black flex items-center gap-1 ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '–'} {Math.abs(trend)}
                        </span>
                        <span className="text-xs text-text-secondary font-bold uppercase mt-1 text-center leading-tight">vs mes<br/>anterior</span>
                    </div>
                </div>
            </div>

            {/* Analíticas + Calendario */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Calendario */}
                <div className="lg:col-span-2 bg-surface p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">Mapa de Consistencia</h3>
                            <p className="text-sm text-text-secondary mt-0.5">
                                Consistency Score: <span className="font-bold text-primary">{consistencyScore}%</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-background px-2 py-1 rounded-xl">
                            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-surface rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <span className="font-bold text-text-primary min-w-[120px] text-center capitalize">{monthName}</span>
                            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-surface rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div className={`transition-opacity duration-300 ${isLoadingLogs ? 'opacity-40' : 'opacity-100'}`}>
                        {/* Barra de progreso mensual */}
                        <div className="mb-5">
                            <div className="flex justify-between text-xs font-bold text-text-secondary mb-1.5">
                                <span>{thisMonthCount} completados</span>
                                <span>Meta: {thisMonthTarget}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${thisMonthRate}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Cabecera días */}
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-text-secondary">
                            <div>LUN</div><div>MAR</div><div>MIE</div><div>JUE</div><div>VIE</div><div>SAB</div><div>DOM</div>
                        </div>

                        {/* Grilla */}
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: emptyDays }).map((_, i) => (
                                <div key={`e-${i}`} className="aspect-square rounded-xl bg-transparent"></div>
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isCompleted = logsMap.has(dateStr);
                                const isToday = dateStr === getLocalISODate();
                                return (
                                    <div
                                        key={dateStr}
                                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2
                                            ${isCompleted
                                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105'
                                                : isToday
                                                    ? 'bg-primary/5 border-primary text-primary'
                                                    : 'bg-gray-50 dark:bg-background border-transparent text-text-secondary hover:bg-gray-100 dark:hover:bg-surface'
                                            }`}
                                        title={dateStr}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Panel lateral de métricas */}
                <div className="flex flex-col gap-4">
                    {/* Este mes + Esta semana (semanales) */}
                    <div className="bg-gradient-to-br from-primary to-purple-500 p-6 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden">
                        <h4 className="text-sm font-bold uppercase opacity-80 relative z-10">Este mes</h4>
                        <p className="text-4xl font-black mt-1 relative z-10">
                            {thisMonthCount}
                            <span className="text-lg font-normal opacity-70"> / {thisMonthTarget}</span>
                        </p>
                        <p className="text-sm font-bold mt-1 opacity-80 relative z-10">{thisMonthRate}% completado</p>
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 rounded-full bg-white/10 blur-xl"></div>
                    </div>

                    {/* Bloque semanal exclusivo para hábitos semanales */}
                    {isWeekly && (
                        <div className="bg-surface p-5 rounded-2xl border-2 border-primary/20 shadow-sm">
                            <p className="text-xs text-text-secondary font-bold uppercase">🎯 Esta Semana</p>
                            <div className="flex items-end gap-2 mt-1">
                                <p className="text-3xl font-black text-primary">{weeklyCompletions}</p>
                                <p className="text-lg font-bold text-text-secondary mb-0.5">/ {weeklyGoal}</p>
                            </div>
                            {/* Bolitas de progreso visual */}
                            <div className="flex gap-1.5 mt-3">
                                {Array.from({ length: weeklyGoal }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-2.5 rounded-full transition-all ${
                                            i < weeklyCompletions ? 'bg-primary' : 'bg-gray-100'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mejor mes */}
                    <div className="bg-surface p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-text-secondary font-bold uppercase">🏆 Mejor Mes</p>
                        <p className="text-2xl font-black text-text-primary mt-1">{bestMonthLabel}</p>
                    </div>

                    {/* Promedio */}
                    <div className="bg-surface p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-text-secondary font-bold uppercase">📈 Promedio / Mes</p>
                        <p className="text-2xl font-black text-text-primary mt-1">{avgPerMonth} <span className="text-sm font-normal text-text-secondary">veces</span></p>
                    </div>

                    {/* Acciones */}
                    <div className="bg-surface p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-full py-2.5 bg-gray-50 dark:bg-background hover:bg-gray-100 dark:hover:bg-surface/80 font-bold text-text-secondary rounded-xl transition-colors text-sm">
                            Editar Hábito
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="w-full py-2.5 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm">
                            Eliminar Hábito
                        </button>
                    </div>
                </div>
            </div>

            {userId && habit && (
                <CreateHabitModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    userId={userId}
                    habitToEdit={habit}
                />
            )}
        </div>
    );
}
