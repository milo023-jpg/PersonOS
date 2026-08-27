import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TaskSortMode } from '../../../domain/models/TaskList';
import { GripIcon } from './ListDragPreview';

const OPTIONS: { value: TaskSortMode; label: string; icon: ReactNode }[] = [
    {
        value: 'manual',
        label: 'Manual',
        icon: <GripIcon className="w-3.5 h-3.5" />,
    },
    {
        value: 'created_desc',
        label: 'Más recientes',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        value: 'due_asc',
        label: 'Fecha de vencimiento',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
];

interface Props {
    value: TaskSortMode;
    onChange: (mode: TaskSortMode) => void;
}

export default function TaskSortDropdown({ value, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const current = OPTIONS.find(o => o.value === value) ?? OPTIONS[0];

    return (
        <div className="relative shrink-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5 transition-all duration-200 group shadow-sm active:scale-95"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Ordenar por"
            >
                <span className="text-[11px] uppercase tracking-wider font-black text-text-secondary group-hover:text-text-primary transition-colors whitespace-nowrap">
                    {current.label}
                </span>
                <svg
                    className={`w-3 h-3 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 overflow-hidden"
                        >
                            <div className="flex flex-col gap-1">
                                {OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                            value === opt.value
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={value === opt.value ? 'text-white' : 'text-primary dark:text-primary-light'}>
                                            {opt.icon}
                                        </div>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}