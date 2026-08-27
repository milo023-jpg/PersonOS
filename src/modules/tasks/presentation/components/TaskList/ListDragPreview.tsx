import type { TaskList } from '../../../domain/models/TaskList';

export function GripIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="5" cy="3" r="1.4" />
            <circle cx="11" cy="3" r="1.4" />
            <circle cx="5" cy="8" r="1.4" />
            <circle cx="11" cy="8" r="1.4" />
            <circle cx="5" cy="13" r="1.4" />
            <circle cx="11" cy="13" r="1.4" />
        </svg>
    );
}

/** Vista previa compacta de una lista mientras se arrastra. */
export function ListDragPreview({ list }: { list: TaskList }) {
    return (
        <div className="flex items-center gap-2.5 bg-surface border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-2xl rotate-1">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${list.color}`} />
            <span className="text-sm font-black text-text-primary whitespace-nowrap">{list.name}</span>
            <GripIcon className="w-3.5 h-3.5 text-text-secondary ml-1 shrink-0" />
        </div>
    );
}