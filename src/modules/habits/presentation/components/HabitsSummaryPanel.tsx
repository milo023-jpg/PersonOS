import { useHabitsStore } from '../../application/store/habitsStore';
import { useMemo } from 'react';

export default function HabitsSummaryPanel() {
    const { habits } = useHabitsStore();

    const stats = useMemo(() => {
        if (!habits || habits.length === 0) return null;

        // Calcular métricas
        const totalCompletions = habits.reduce((acc, hab) => acc + (hab.currentMonthCount || 0), 0);
        
        let mostConsistent = habits[0];
        let mostNeglected = habits[0];
        let mostImproved = habits[0];
        let maxImprovement = -999;

        habits.forEach(h => {
            // Más constante
            if ((h.currentMonthCount || 0) > (mostConsistent.currentMonthCount || 0)) {
                mostConsistent = h;
            }
            // Más descuidado
            if ((h.currentMonthCount || 0) < (mostNeglected.currentMonthCount || 0)) {
                mostNeglected = h;
            }
            // Más mejorado
            const improvement = (h.currentMonthCount || 0) - (h.lastMonthCount || 0);
            if (improvement > maxImprovement) {
                maxImprovement = improvement;
                mostImproved = h;
            }
        });

        const globalRate = habits.length > 0 
            ? Math.round(habits.reduce((acc, h) => acc + (h.completionRate || 0), 0) / habits.length)
            : 0;

        const top3Habits = [...habits]
            .filter(h => (h.currentMonthCount || 0) > 0)
            .sort((a, b) => (b.currentMonthCount || 0) - (a.currentMonthCount || 0))
            .slice(0, 3);

        return {
            totalCompletions,
            globalRate,
            mostConsistent,
            mostNeglected,
            mostImproved: maxImprovement > 0 ? mostImproved : null,
            top3Habits,
        };
    }, [habits]);

    if (!habits || habits.length === 0) {
        return (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                <h2 className="text-lg font-bold text-text-primary">Resumen Inteligente</h2>
                <p className="text-sm text-text-secondary">Agrega hábitos para ver tus métricas y progreso del mes.</p>
            </div>
        );
    }

    return (
        <aside className="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between gap-6 h-full w-full">
            
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Resumen Inteligente
                </h2>
                <p className="text-sm text-text-secondary mt-1">Tu desempeño de este mes</p>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 dark:bg-background p-4 rounded-xl border border-blue-100/50 dark:border-transparent">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-400">{stats?.totalCompletions || 0}</p>
                    <p className="text-[10px] text-blue-600/70 dark:text-blue-500/80 mt-1">hábitos completados</p>
                </div>
                <div className="bg-green-50/50 dark:bg-background p-4 rounded-xl border border-green-100/50 dark:border-transparent">
                    <p className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">Eficacia</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-400">{stats?.globalRate || 0}%</p>
                    <p className="text-[10px] text-green-600/70 dark:text-green-500/80 mt-1">cumplimiento global</p>
                </div>
            </div>

            {/* Destacados */}
            <div className="flex flex-col gap-4">
                {stats?.mostConsistent && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">🥇</div>
                        <div className="flex-1">
                            <p className="text-xs text-text-secondary">Más constante</p>
                            <p className="font-bold text-text-primary text-sm line-clamp-1">{stats.mostConsistent.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{stats.mostConsistent.currentMonthCount || 0}</p>
                        </div>
                    </div>
                )}
                
                {stats?.mostImproved ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">📈</div>
                        <div className="flex-1">
                            <p className="text-xs text-text-secondary">Más mejorado</p>
                            <p className="font-bold text-text-primary text-sm line-clamp-1">{stats.mostImproved.name}</p>
                        </div>
                        <div className="text-right flex items-center gap-1 text-emerald-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                            <p className="text-sm font-bold">vs mes ant</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">📈</div>
                        <div className="flex-1">
                            <p className="text-xs text-text-secondary">Más mejorado</p>
                            <p className="font-bold text-text-primary text-sm">--</p>
                        </div>
                    </div>
                )}

                {stats?.mostNeglected && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">⚠️</div>
                        <div className="flex-1">
                            <p className="text-xs text-text-secondary">Más descuidado</p>
                            <p className="font-bold text-text-primary text-sm line-clamp-1">{stats.mostNeglected.name}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Top 3 Hábitos */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Top 3 del Mes
                </h3>
                
                {stats?.top3Habits && stats.top3Habits.length > 0 ? (
                    <div className="flex gap-3">
                        {stats.top3Habits.map((habit, index) => {
                            const isGold = index === 0;
                            const isSilver = index === 1;
                            
                            const cardBg = isGold ? 'bg-yellow-50/80 border-yellow-200/70 dark:border-transparent' : isSilver ? 'bg-gray-50/80 border-gray-200/70 dark:border-transparent' : 'bg-orange-50/80 border-orange-200/70 dark:border-transparent';
                            const badgeBg = isGold ? 'bg-yellow-200/60 text-yellow-800' : isSilver ? 'bg-gray-200/80 text-gray-700' : 'bg-orange-200/60 text-orange-800';
                            const titleColor = isGold ? 'text-yellow-900' : isSilver ? 'text-gray-800' : 'text-orange-950';
                            const numColor = isGold ? 'text-yellow-700' : isSilver ? 'text-gray-600' : 'text-orange-700';

                            return (
                                <div key={habit.id || index} className={`flex-1 ${cardBg} p-3 rounded-xl border flex flex-col items-center justify-between text-center min-w-0 min-h-[110px] shadow-sm transition-colors`}>
                                    <div className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs mb-2 flex-shrink-0 ${badgeBg}`}>
                                        #{index + 1}
                                    </div>
                                    <p className={`text-xs font-bold ${titleColor} px-1 leading-snug flex-1 flex items-center justify-center break-words w-full`}>{habit.name}</p>
                                    <div className="flex items-end justify-center gap-1 mt-2 flex-shrink-0">
                                        <span className={`text-lg font-bold ${numColor} leading-none`}>{habit.currentMonthCount}</span>
                                        <span className={`text-[10px] ${titleColor} opacity-70 leading-none mb-[2px]`}>veces</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-text-secondary italic border border-dashed border-gray-200 p-4 rounded-xl text-center">
                        Ningún récord este mes.
                    </div>
                )}
            </div>

            {/* Logros Recientes */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.673.418l2.25 4.562 5.034.732a.75.75 0 01.416 1.279l-3.643 3.551.86 5.015a.75.75 0 01-1.088.791L10 16.035l-4.502 2.368a.75.75 0 01-1.088-.791l.86-5.015-3.643-3.551a.75.75 0 01.416-1.279l5.034-.732 2.25-4.562A.75.75 0 0110 2z" clipRule="evenodd"></path></svg>
                    Progreso
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 dark:border-transparent p-3 rounded-lg flex items-center gap-3">
                    <div className="bg-yellow-100 text-yellow-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                        {stats?.totalCompletions || 0}x
                    </div>
                    <div>
                        <p className="text-sm font-bold text-yellow-900">
                            {(stats?.totalCompletions || 0) === 0 ? "Sin progreso aún" : `Gran progreso sumando`}
                        </p>
                        <p className="text-[10px] text-yellow-700">Acumulado este mes</p>
                    </div>
                </div>
            </div>
            
        </aside>
    );
}
