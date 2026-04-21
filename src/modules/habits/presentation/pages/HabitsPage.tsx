import { useEffect, useState } from "react";
import HabitCard from '../components/HabitCard';
import CreateHabitModal from '../components/CreateHabitModal';
import HabitsSummaryPanel from '../components/HabitsSummaryPanel';
import { useHabitsStore } from '../../application/store/habitsStore';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { getLocalISODate } from '../../../../utils/dateUtils';

export default function HabitsPage() {
    const { userId } = useAuthStore();
    const { habits, logs, selectedDate, isLoading, setSelectedDate, fetchHabits } = useHabitsStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');

    // Initialization
    useEffect(() => {
        if (userId) {
            fetchHabits(userId);
        }
    }, [userId, fetchHabits]);

    // Lógica para Navegar entre Fechas
    const goPrevDay = () => {
        if (!userId) return;
        const d = new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() - 1);
        setSelectedDate(getLocalISODate(d), userId);
    };

    const goNextDay = () => {
        if (!userId) return;
        const d = new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() + 1);
        setSelectedDate(getLocalISODate(d), userId);
    };

    const goToday = () => {
        if (!userId) return;
        const d = new Date();
        setSelectedDate(getLocalISODate(d), userId);
    };

    // Formatear la fecha para mostrar ("Lunes, 12 de Abril")
    const dateObj = new Date(selectedDate + "T12:00:00"); // Fix del TZ
    const formattedDate = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj);
    const isToday = selectedDate === getLocalISODate(new Date());

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto relative">
            {/* Left Main Content */}
            <div className="flex-1 flex flex-col gap-8">
            {/* Header de la página */}
            <div className="flex justify-between items-center bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Mis Hábitos</h1>
                    <p className="text-sm text-text-secondary capitalize">{formattedDate} {isToday && <span className="ml-2 font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs">HOY</span>}</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Navegación por fechas */}
                    <div className="flex items-center bg-gray-50 dark:bg-background rounded-xl p-1 border border-gray-200 dark:border-transparent">
                        <button onClick={goPrevDay} className="p-2 hover:bg-white dark:hover:bg-surface rounded-lg text-text-secondary transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                        <button onClick={goToday} className="px-3 font-bold text-sm text-text-primary hover:bg-white dark:hover:bg-surface rounded-lg py-2 transition-colors">Hoy</button>
                        <button onClick={goNextDay} className="p-2 hover:bg-white dark:hover:bg-surface rounded-lg text-text-secondary transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
                    </div>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl font-bold shadow-md transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        Nuevo Hábito
                    </button>
                </div>
            </div>

            {/* Categorías / Filtros */}
            <div className="flex gap-3 overflow-x-auto pb-2 system-scroll">
                <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-full font-bold text-sm shadow-sm transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-white dark:bg-surface text-text-secondary hover:bg-gray-50 dark:hover:bg-background border border-gray-200 dark:border-transparent'}`}>Todos</button>
                <button onClick={() => setFilter('daily')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${filter === 'daily' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-surface text-text-secondary hover:bg-gray-50 dark:hover:bg-background border border-gray-200 dark:border-transparent'}`}>Diarios</button>
                <button onClick={() => setFilter('weekly')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${filter === 'weekly' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-surface text-text-secondary hover:bg-gray-50 dark:hover:bg-background border border-gray-200 dark:border-transparent'}`}>Semanales</button>
            </div>

            {/* Loader */}
            {isLoading && habits.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 animate-pulse">
                            <div className="flex gap-3 items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="w-32 h-4 bg-gray-100 rounded-md"></div>
                                    <div className="w-20 h-3 bg-gray-100 rounded-md"></div>
                                </div>
                                <div className="w-8 h-8 bg-gray-100 rounded-xl ml-auto"></div>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-md mt-2"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && habits.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300">
                    <span className="text-4xl">🌱</span>
                    <h3 className="text-lg font-bold text-text-primary mt-4">Aún no tienes hábitos</h3>
                    <p className="text-text-secondary mt-1 max-w-sm mx-auto">Comienza construyendo tu primera rutina haciendo clic en "Nuevo Hábito".</p>
                </div>
            )}

            {/* Grilla de Tarjetas de Hábitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {habits.filter(habit => {
                    if (filter === 'all') return true;
                    if (filter === 'daily') return habit.type === 'daily';
                    if (filter === 'weekly') return habit.type === 'weekly';
                    return true;
                }).map(habit => {
                    const isCompleted = logs.some(l => l.habitId === habit.id && l.date === selectedDate && l.completed);
                    return (
                        <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            isCompleted={isCompleted} 
                            selectedDate={selectedDate}
                            userId={userId!} 
                        />
                    );
                })}
            </div>

            </div> {/* Fin de Left Main Content */}

            {/* Right Summary Panel */}
            <div className="w-full xl:w-[380px] flex-shrink-0">
                <HabitsSummaryPanel />
            </div>

            {/* Modal de Creación */}
            <CreateHabitModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                userId={userId!} 
            />
        </div>
    );
}
