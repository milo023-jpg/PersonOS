import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Subtask } from '../../../domain/models/Task';

interface Props {
    subtask: Subtask;
    onToggle: (subtaskId: string) => void;
    onEdit: (subtaskId: string, newTitle: string) => void;
    onDelete: (subtaskId: string) => void;
}

export default function SubtaskItem({ subtask, onToggle, onEdit, onDelete }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(subtask.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(subtask.title);
    }, [subtask.title]);

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== subtask.title) {
            onEdit(subtask.id, trimmed);
        } else {
            setEditValue(subtask.title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditValue(subtask.title);
            setIsEditing(false);
        }
    };

    return (
        <div className="group flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-200">
            {/* Checkbox */}
            <button
                onClick={() => onToggle(subtask.id)}
                className={`shrink-0 w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all duration-300 border-2 ${
                    subtask.completed
                        ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-white/50 dark:bg-white/5'
                }`}
            >
                <motion.svg 
                    initial={false}
                    animate={{ scale: subtask.completed ? 1 : 0, opacity: subtask.completed ? 1 : 0 }}
                    className="w-3 h-3 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                </motion.svg>
            </button>

            {/* Título / Input */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-[13.5px] font-medium text-text-primary outline-none py-0"
                />
            ) : (
                <span
                    onClick={() => setIsEditing(true)}
                    className={`flex-1 text-[13.5px] font-medium transition-all duration-300 cursor-text ${
                        subtask.completed
                            ? 'line-through text-text-secondary/40'
                            : 'text-text-primary/90'
                    }`}
                >
                    {subtask.title}
                </span>
            )}

            {/* Eliminar (visible sólo en hover y cuando no está editando) */}
            {!isEditing && (
                <button
                    onClick={() => onDelete(subtask.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-secondary/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                    aria-label="Eliminar subtarea"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
