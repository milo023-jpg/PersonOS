import type { Subtask } from '../../../domain/models/Task';
import SubtaskItem from './SubtaskItem';
import AddSubtaskInput from './AddSubtaskInput';

interface Props {
    subtasks: Subtask[];
    onToggle: (subtaskId: string) => void;
    onEdit: (subtaskId: string, newTitle: string) => void;
    onDelete: (subtaskId: string) => void;
    onAdd: (title: string) => void;
}

export default function SubtaskList({ subtasks, onToggle, onEdit, onDelete, onAdd }: Props) {
    const completedCount = subtasks.filter(s => s.completed).length;

    return (
        <div className="flex flex-col gap-1 pr-1">
            {/* Header con progreso */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-text-secondary/50">
                        Subtareas
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {completedCount} / {subtasks.length}
                    </span>
                </div>
                
                {subtasks.length > 0 && (
                    <div className="flex items-center gap-3 w-24 sm:w-32">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-text-secondary/60 tabular-nums">
                            {Math.round((completedCount / subtasks.length) * 100)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Lista de subtareas */}
            {subtasks.map(subtask => (
                <SubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}

            {/* Input de añadir */}
            <AddSubtaskInput onAdd={onAdd} />
        </div>
    );
}
