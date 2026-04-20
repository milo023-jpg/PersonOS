import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useContextsStore } from '../../application/store/contextsStore';
import type { Context, ContextType } from '../../domain/models/types';

export default function ContextsPage() {
    const { userId } = useAuthStore();
    const { contexts, fetchContexts, isLoading, createContext } = useContextsStore();
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState<ContextType>("project");
    const [color, setColor] = useState("#3B82F6");
    const [icon, setIcon] = useState("💼");

    useEffect(() => {
        if (userId) {
            fetchContexts(userId);
        }
    }, [userId, fetchContexts]);

    const handleCreate = async () => {
        if (!userId || !name.trim()) return;
        await createContext(userId, {
            name: name.trim(),
            type,
            color,
            icon,
            isArchived: false,
            createdAt: Date.now()
        });
        setIsCreating(false);
        setName("");
    };

    const activeContexts = contexts.filter(c => !c.isArchived);

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Contextos y Proyectos</h1>
                    <p className="text-sm text-text-secondary">Gestiona tus áreas, clientes y proyectos</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl font-bold transition-all"
                >
                    + Nuevo Contexto
                </button>
            </div>

            {isCreating && (
                <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Crear Nuevo Contexto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-text-primary mb-2">Nombre</label>
                            <input 
                                value={name} onChange={e => setName(e.target.value)}
                                placeholder="Ej. Sistema Operativo"
                                className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-2.5 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-2">Tipo</label>
                            <select value={type} onChange={e => setType(e.target.value as ContextType)} className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-2.5 outline-none">
                                <option value="project">Proyecto</option>
                                <option value="area">Área</option>
                                <option value="personal">Personal</option>
                                <option value="client">Cliente</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-text-primary mb-2">Color</label>
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-11 rounded-xl cursor-pointer" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-text-primary mb-2">Ícono</label>
                                <input value={icon} onChange={e => setIcon(e.target.value)} className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-2 py-2.5 text-center outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsCreating(false)} className="px-5 py-2 font-bold text-text-secondary hover:bg-gray-100 dark:hover:bg-background rounded-xl">Cancelar</button>
                        <button onClick={handleCreate} disabled={!name.trim()} className="px-5 py-2 font-bold bg-primary text-white rounded-xl disabled:opacity-50">Guardar</button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <p className="text-center text-text-secondary mt-10">Cargando...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeContexts.map(ctx => (
                        <Link key={ctx.id} to={`/contexts/${ctx.id}`} className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all group flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${ctx.color}20` }}>
                                    <span>{ctx.icon}</span>
                                </div>
                                <span className="bg-gray-50 dark:bg-background text-text-secondary px-2 py-1 rounded-md text-xs font-bold uppercase">{ctx.type}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">{ctx.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
