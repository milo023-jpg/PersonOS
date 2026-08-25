import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useTaskListsStore } from '../../../application/store/taskListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';

interface Props {
    onClose: () => void;
    onCreated?: (listId: string) => void;
}

const LIST_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
    'bg-slate-500', 'bg-zinc-500', 'bg-stone-500'
];

export default function CreateListModal({ onClose, onCreated }: Props) {
    const { userId } = useAuthStore();
    const { createList } = useTaskListsStore();
    const { contexts, fetchContexts } = useContextsStore();

    const [name, setName] = useState('');
    const [color, setColor] = useState('bg-blue-500');
    const [defaultContextId, setDefaultContextId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchContexts(userId);
        }
    }, [userId, fetchContexts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const id = await createList(userId, {
                name: name.trim(),
                color,
                order: Date.now(),
                ...(defaultContextId ? { defaultContextId } : {})
            });
            if (onCreated) {
                onCreated(id);
            }
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4 pb-8 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-surface border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-black text-text-primary mb-4">Nueva Lista</h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre de la lista..."
                        className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none text-text-primary placeholder:text-gray-400 font-bold text-lg pb-2"
                    />

                    <div className="flex flex-wrap gap-2 items-center">
                        {LIST_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-all ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                            />
                        ))}
                    </div>

                    {contexts.length > 0 && (
                        <select
                            value={defaultContextId}
                            onChange={(e) => setDefaultContextId(e.target.value)}
                            className="bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-3 py-2 focus:border-primary outline-none text-sm w-full"
                        >
                            <option value="">Sin contexto</option>
                            {contexts.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    )}

                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-bold text-text-secondary hover:text-text-primary py-2 px-4"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="bg-primary text-white text-sm font-bold py-2 px-5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}