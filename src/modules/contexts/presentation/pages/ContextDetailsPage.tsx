import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useContextsStore } from '../../application/store/contextsStore';

// --- MOCK DATA ---
const MOCK_TASKS = [
    { id: 1, title: "Definir arquitectura del sistema base", priority: "alta", status: "completada", date: "Hoy" },
    { id: 2, title: "Diseñar UI/UX en Figma (Dark Mode)", priority: "alta", status: "pendiente", date: "Mañana" },
    { id: 3, title: "Revisión de requerimientos con el cliente", priority: "media", status: "pendiente", date: "Jueves" },
    { id: 4, title: "Configurar entorno CI/CD", priority: "baja", status: "pendiente", date: "Viernes" },
];

const MOCK_NOTES = [
    { id: 1, title: "Ideas de Onboarding", preview: "Flujo: Email -> Perfil -> Primer Hábito. Añadir tooltips...", date: "Hace 2h" },
    { id: 2, title: "Notas Sprint Planning", preview: "Objetivo: Lanzar módulo de Contextos. Riesgos de scope creep advertidos.", date: "Ayer" },
    { id: 3, title: "Specs de Integración Stripe", preview: "Usar Webhooks para sincronizar estados. Documentación oficial dice...", date: "10 Abr" },
];

const MOCK_HABITS = [
    { id: 1, name: "Revisar PRs de equipo", consistency: 85, focus: "Alta" },
    { id: 2, name: "Sync de estatus 15 min", consistency: 100, focus: "Media" },
];

const MOCK_OBJECTIVES = [
    { id: 1, name: "Lanzar MVP a producción", progress: 65, deadline: "Q3 2026" },
    { id: 2, name: "Llegar a 1,000 usuarios activos", progress: 30, deadline: "Q4 2026" },
];

const MOCK_LISTS = [
    { id: 1, name: "Backlog Frontend", taskCount: 12, color: "bg-blue-500" },
    { id: 2, name: "Bugs Críticos", taskCount: 3, color: "bg-red-500" },
    { id: 3, name: "Ideas y Mejoras (P2)", taskCount: 8, color: "bg-purple-500" },
];

export default function ContextDetailsPage() {
    const { id } = useParams();
    const { userId } = useAuthStore();
    const { contexts, fetchContexts } = useContextsStore();

    useEffect(() => {
        if (userId && contexts.length === 0) {
            fetchContexts(userId);
        }
    }, [userId, fetchContexts, contexts.length]);

    const context = contexts.find(c => c.id === id);

    if (!context) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary font-bold">Cargando contexto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500">
            {/* Nav & Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/contexts" className="w-10 h-10 flex items-center justify-center bg-white dark:bg-surface rounded-xl shadow-sm border border-gray-100 dark:border-transparent text-text-secondary hover:text-primary transition-all group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </Link>
                    <h2 className="text-lg font-medium text-text-secondary">Contextos / <span className="font-bold text-text-primary">{context.name}</span></h2>
                </div>
            </div>

            {/* TOP LAYOUT: Hero Left + Quick Stats Right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* HERO SECTION (SaaS Style) */}
                <div className="lg:col-span-3 relative overflow-hidden bg-surface p-8 lg:p-10 rounded-[32px] shadow-sm border border-gray-100 dark:border-transparent">
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 90% 10%, ${context.color}, transparent 50%)` }}></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-[24px] flex items-center justify-center text-5xl shadow-lg border border-white/10 backdrop-blur-md transition-transform hover:scale-105" style={{ backgroundColor: `${context.color}15`, color: context.color }}>
                                {context.icon}
                            </div>
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-sm border border-white/5" style={{ backgroundColor: `${context.color}20`, color: context.color }}>
                                    {context.type}
                                </span>
                                <h1 className="text-4xl lg:text-5xl font-black text-text-primary tracking-tight">{context.name}</h1>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-start md:self-auto">
                            <button className="px-5 py-2.5 rounded-xl font-bold bg-gray-50 dark:bg-background text-text-primary hover:bg-gray-100 dark:hover:bg-background/80 border border-gray-200 dark:border-transparent shadow-sm transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                Editar
                            </button>
                            <button className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-background text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-background/80 border border-gray-200 dark:border-transparent shadow-sm transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TICKER / QUICK STATS (Vertical Stack Right) */}
                <div className="flex flex-col gap-3">
                    {[
                        { label: "Tareas Act", value: "8", icon: "✓", color: "text-blue-500", bg: "bg-blue-500" },
                        { label: "Notas", value: "12", icon: "📓", color: "text-purple-500", bg: "bg-purple-500" },
                        { label: "Hábitos", value: "2", icon: "🔄", color: "text-orange-500", bg: "bg-orange-500" },
                        { label: "Listas", value: "3", icon: "🗂️", color: "text-emerald-500", bg: "bg-emerald-500" }
                    ].map((stat, i) => (
                        <div key={i} className="flex-1 bg-surface py-3 px-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-transparent flex items-center justify-between group hover:-translate-x-1 transition-transform duration-300">
                            <div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-black text-text-primary leading-none mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${stat.bg}/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 mt-2">
                    
                    {/* 📝 TAREAS */}
                    <div className="bg-surface rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-transparent flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="bg-blue-500/10 text-blue-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm">✓</span>
                                Tareas
                            </h3>
                            <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Ver todas</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {MOCK_TASKS.map(task => (
                                <div key={task.id} className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-background hover:bg-white dark:hover:bg-background/80 hover:shadow-md transition-all cursor-pointer">
                                    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.status === 'completada' ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'}`}>
                                        {task.status === 'completada' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate transition-colors ${task.status === 'completada' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{task.title}</p>
                                        <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                            <span className="text-[10px] font-bold text-text-secondary">{task.date}</span>
                                            <span className={`w-2 h-2 rounded-full ${task.priority === 'alta' ? 'bg-red-400' : task.priority === 'media' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-text-secondary font-bold hover:bg-gray-50 dark:hover:bg-background hover:text-text-primary hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                            + Añadir Tarea
                        </button>
                    </div>

                    {/* 📓 NOTAS */}
                    <div className="bg-surface rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-transparent flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="bg-purple-500/10 text-purple-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm">📓</span>
                                Notas
                            </h3>
                            <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Ver todas</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {MOCK_NOTES.map(note => (
                                <div key={note.id} className="group p-5 rounded-2xl border border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-background hover:bg-white dark:hover:bg-background/80 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{note.title}</h4>
                                        <span className="text-[10px] font-bold text-text-secondary whitespace-nowrap ml-4">{note.date}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{note.preview}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🔄 HÁBITOS */}
                    <div className="bg-surface rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-transparent flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="bg-orange-500/10 text-orange-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm">🔄</span>
                                Hábitos
                            </h3>
                            <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Ver todos</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {MOCK_HABITS.map(habit => (
                                <div key={habit.id} className="p-4 rounded-2xl border border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-background hover:bg-white dark:hover:bg-background/80 transition-all flex flex-col gap-2 cursor-pointer">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-sm text-text-primary">{habit.name}</p>
                                        <span className="text-[10px] font-bold text-text-secondary bg-gray-200 dark:bg-surface px-2 py-0.5 rounded-md">{habit.focus}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-gray-200 dark:bg-surface h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-orange-400 h-full rounded-full" style={{ width: `${habit.consistency}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-orange-500">{habit.consistency}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🎯 OBJETIVOS */}
                    <div className="bg-surface rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-transparent flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="bg-rose-500/10 text-rose-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm">🎯</span>
                                Objetivos
                            </h3>
                            <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Ir a Objetivos</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {MOCK_OBJECTIVES.map(obj => (
                                <div key={obj.id} className="p-5 rounded-2xl border border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-background hover:bg-white dark:hover:bg-background/80 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-text-primary text-sm">{obj.name}</h4>
                                        <span className="text-[10px] font-bold text-text-secondary">{obj.deadline}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex-1 bg-gray-200 dark:bg-surface h-2 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full" style={{ width: `${obj.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-black text-text-primary">{obj.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🗂️ LISTAS RELACIONADAS (Span 2 cols on Large) */}
                    <div className="lg:col-span-2 bg-surface rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-transparent">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm">🗂️</span>
                                Listas Relacionadas
                            </h3>
                            <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Administrar listas</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {MOCK_LISTS.map(list => (
                                <div key={list.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-background hover:bg-white dark:hover:bg-background/80 hover:scale-[1.02] transition-all cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-surface shadow-sm shrink-0">
                                        <div className={`w-4 h-4 rounded-full ${list.color}`}></div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary text-sm">{list.name}</p>
                                        <p className="text-xs font-bold text-text-secondary mt-0.5">{list.taskCount} tareas pendientes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

        </div>
    );
}
