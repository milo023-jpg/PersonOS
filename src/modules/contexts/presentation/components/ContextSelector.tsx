import { useEffect } from 'react';
import { useContextsStore } from '../../application/store/contextsStore';
import { useAuthStore } from '../../../auth/application/store/authStore';

interface ContextSelectorProps {
    value: string | null;
    onChange: (contextId: string | null) => void;
}

export default function ContextSelector({ value, onChange }: ContextSelectorProps) {
    const { userId } = useAuthStore();
    const { contexts, fetchContexts, isLoading } = useContextsStore();

    useEffect(() => {
        if (userId && contexts.length === 0) {
            fetchContexts(userId);
        }
    }, [userId, fetchContexts, contexts.length]);

    const activeContexts = contexts.filter(c => !c.isArchived);

    return (
        <div className="flex flex-col gap-2">
            <label className="block text-sm font-bold text-text-primary mb-2">Contexto</label>
            <div className="relative">
                <select
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value || null)}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                    disabled={isLoading}
                >
                    <option value="">[ Sin contexto ]</option>
                    {activeContexts.map(ctx => (
                        <option key={ctx.id} value={ctx.id}>
                            {ctx.icon} {ctx.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                    ▼
                </div>
            </div>
        </div>
    );
}
