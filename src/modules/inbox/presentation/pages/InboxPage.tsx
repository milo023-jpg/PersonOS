import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useTasksStore } from '../../../tasks/application/store/tasksStore';
import { useTaskListsStore } from '../../../tasks/application/store/taskListsStore';
import { GENERAL_LIST_ID } from '../../../tasks/domain/constants/defaults';
import { dbService } from '../../../../services/dbService';
import { SystemScrollArea } from '../../../../shared/ui/SystemScrollArea';

interface InboxItem {
    id: string;
    userId: string;
    title: string;
    createdAt: number;
}

export default function InboxPage() {
    const { userId } = useAuthStore();
    const { addTask } = useTasksStore();
    const { ensureGeneralList } = useTaskListsStore();
    const [items, setItems] = useState<InboxItem[]>([]);
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadItems = async () => {
            if (!userId) return;
            setIsLoading(true);
            try {
                const inboxItems = await dbService.getCollectionDocuments<InboxItem>(`users/${userId}/inboxItems`);
                setItems(inboxItems.sort((a, b) => b.createdAt - a.createdAt));
            } finally {
                setIsLoading(false);
            }
        };

        void loadItems();
    }, [userId]);

    const handleCapture = async () => {
        if (!userId || !value.trim()) return;

        const title = value.trim();
        const createdAt = Date.now();
        const id = await dbService.addDocument(`users/${userId}/inboxItems`, {
            userId,
            title,
            createdAt
        });

        setItems((current) => [{ id, userId, title, createdAt }, ...current]);
        setValue('');
    };

    const handleDelete = async (itemId: string) => {
        if (!userId) return;
        await dbService.deleteDocument(`users/${userId}/inboxItems`, itemId);
        setItems((current) => current.filter((item) => item.id !== itemId));
    };

    const handleConvertToTask = async (item: InboxItem) => {
        if (!userId) return;

        await ensureGeneralList(userId);
        await addTask({
            userId,
            title: item.title,
            status: 'todo',
            priority: 'medium',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            listId: GENERAL_LIST_ID,
            source: 'inbox',
            isRecurring: false,
            order: 0,
            isImportant: false,
        });
        await handleDelete(item.id);
    };

    return (
        <SystemScrollArea className="h-full min-h-0 w-full">
            <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text-primary">Inbox</h1>
                    <p className="text-sm text-text-secondary mt-2">
                        Captura ideas r&aacute;pidas aqu&iacute; y convi&eacute;rtelas luego en tareas dentro de la lista General.
                    </p>
                </div>

                <div className="bg-surface border border-gray-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Captura una idea, pendiente o recordatorio..."
                            className="w-full min-h-28 bg-transparent text-text-primary placeholder:text-text-secondary/50 resize-none outline-none text-base"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleCapture}
                                disabled={!value.trim()}
                                className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            >
                                Guardar en Inbox
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary">Capturas</h2>
                    <span className="text-sm font-bold text-text-secondary">{items.length}</span>
                </div>

                {isLoading ? (
                    <div className="text-sm text-text-secondary">Cargando capturas...</div>
                ) : items.length === 0 ? (
                    <div className="bg-surface border border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-10 text-center">
                        <p className="font-bold text-text-secondary">No hay capturas todav&iacute;a.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pb-8">
                        {items.map((item) => (
                            <div key={item.id} className="bg-surface border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-text-primary break-words">{item.title}</p>
                                    <p className="text-xs text-text-secondary mt-2">
                                        {new Date(item.createdAt).toLocaleString('es-MX')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleConvertToTask(item)}
                                        className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                                    >
                                        Convert to Task
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-text-secondary text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SystemScrollArea>
    );
}
