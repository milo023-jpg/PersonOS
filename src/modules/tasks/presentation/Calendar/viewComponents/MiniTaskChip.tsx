import { memo } from 'react';
import type { Task } from '../../../domain/models/Task';

interface Props {
    task: Task;
    listColor?: string;
    onOpen?: (task: Task) => void;
}

// Etiqueta compacta para la grilla de la semana: texto sobrepuesto en el fondo
// (sin recuadro), con un punto de color de la lista como única marca de color.
// Al tocar se abre el detalle completo.
const MiniTaskChip = memo(function MiniTaskChip({ task, listColor, onOpen }: Props) {
    return (
        <button
            type="button"
            onClick={() => onOpen?.(task)}
            title={task.title}
            className={`w-full min-w-0 text-left inline-flex items-center gap-1 px-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer ${
                task.status === 'completed' ? 'opacity-50' : ''
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${listColor ?? 'bg-primary'}`} />
            <span className="block text-[10px] leading-tight font-bold break-words line-clamp-2 text-text-primary">
                {task.title}
            </span>
        </button>
    );
});

export default MiniTaskChip;