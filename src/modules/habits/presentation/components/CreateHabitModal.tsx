import { useState } from 'react';
import { useHabitsStore } from '../../application/store/habitsStore';
import type { Habit } from '../../domain/models/types';
import { getLocalISODate } from '../../../../utils/dateUtils';
import ContextSelector from '../../../contexts/presentation/components/ContextSelector';

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    habitToEdit?: Habit;
}

export default function CreateHabitModal({ isOpen, onClose, userId, habitToEdit }: CreateHabitModalProps) {
    const { createHabit, updateHabit, isLoading } = useHabitsStore();
    
    // States del Formulario
    const [name, setName] = useState(habitToEdit?.name || '');
    const [icon, setIcon] = useState(habitToEdit?.icon || '🧘‍♂️');
    const [type, setType] = useState<'daily' | 'weekly'>(habitToEdit?.type || 'daily');
    const [frequency, setFrequency] = useState(habitToEdit?.frequency || 3);
    const [selectedColor, setSelectedColor] = useState(habitToEdit?.colorClass || 'pastel-purple');
    const [category, setCategory] = useState(habitToEdit?.category || '');
    const [endDate, setEndDate] = useState(habitToEdit?.endDate || '');
    const [contextId, setContextId] = useState<string | null>(habitToEdit?.contextId || null);

    if (!isOpen) return null;

    const colors = [
        { bg: 'pastel-purple', text: 'text-purple-500' },
        { bg: 'pastel-red', text: 'text-red-500' },
        { bg: 'pastel-orange', text: 'text-orange-500' },
        { bg: 'pastel-green', text: 'text-green-500' },
    ];

    const icons = ['🧘‍♂️', '🏋️‍♀️', '📚', '🛌', '💧', '🏃‍♀️', '💻', '💡'];

    const handleSave = async () => {
        if (!name.trim()) return;

        const colorMap = colors.find(c => c.bg === selectedColor) || colors[0];

        const baseData: Record<string, any> = {
            name,
            icon,
            type,
            colorClass: colorMap.bg,
            textColorClass: colorMap.text,
        };

        if (type === 'weekly') baseData.frequency = frequency;
        if (category.trim()) baseData.category = category.trim();
        if (endDate) baseData.endDate = endDate;
        if (contextId) baseData.contextId = contextId;
        else baseData.contextId = null; // Firebase Soporta null pero no undefined
        
        if (habitToEdit && habitToEdit.id) {
            await updateHabit(userId, habitToEdit.id, baseData);
        } else {
            const newHabit: Omit<Habit, 'id'> = {
                userId,
                ...baseData,
                createdAt: Date.now(),
                startDate: getLocalISODate(), // Empezar hoy
            } as Omit<Habit, 'id'>;
            await createHabit(newHabit);
        }
        
        // Reset form - Not strictly needed if modal is destroyed but good practice
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-surface w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-text-primary">{habitToEdit ? 'Editar Hábito' : 'Crear Nuevo Hábito'}</h2>
                    <button onClick={onClose} className="p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto system-scroll">

                    {/* Input: Nombre del Hábito */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">¿Qué hábito quieres construir? *</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Meditar por 10 minutos" 
                            className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>

                    {/* Input: Categoría y Fecha límite */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-2">Categoría (Op)</label>
                            <input 
                                type="text" 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ej. Salud" 
                                className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-2">Fecha Límite (Op)</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-transparent text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium [&::-webkit-calendar-picker-indicator]:dark:invert"
                            />
                        </div>
                    </div>

                    {/* Selector Global de Contexto */}
                    <div className="z-10">
                        <ContextSelector value={contextId} onChange={setContextId} />
                    </div>

                    {/* Frecuencia (Pills switch) */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Frecuencia</label>
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setType('daily')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${type === 'daily' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-text-secondary hover:border-gray-200 dark:hover:border-transparent dark:hover:bg-background'}`}>
                                Diario
                            </button>
                            <button onClick={() => setType('weekly')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${type === 'weekly' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-text-secondary hover:border-gray-200 dark:hover:border-transparent dark:hover:bg-background'}`}>
                                Semanal
                            </button>
                        </div>
                        {type === 'weekly' && (
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-background p-3 rounded-xl border border-gray-100 dark:border-transparent">
                                <span className="text-sm font-medium text-text-secondary">Días por semana:</span>
                                <input 
                                    type="number" min="1" max="7" 
                                    value={frequency} onChange={e => setFrequency(Number(e.target.value))}
                                    className="w-16 p-1 text-center bg-white dark:bg-background border border-gray-200 dark:border-transparent rounded-lg text-text-primary" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Iconos */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Ícono</label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map(i => (
                                <button key={i} onClick={() => setIcon(i)} className={`text-2xl p-2 rounded-xl transition-transform hover:scale-110 ${icon === i ? 'bg-gray-100 dark:bg-background ring-2 ring-primary' : 'hover:bg-gray-50 dark:hover:bg-background'}`}>
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selector de Color */}
                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-2">Color del Tema</label>
                        <div className="flex gap-3">
                            {colors.map(color => (
                                <button
                                    key={color.bg} onClick={() => setSelectedColor(color.bg)}
                                    className={`w-10 h-10 rounded-full bg-${color.bg} flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === color.bg ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-gray-200'}`}
                                >
                                    {selectedColor === color.bg && <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-transparent bg-gray-50 dark:bg-background flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 font-bold text-text-secondary hover:bg-gray-200 dark:hover:bg-surface rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading || !name.trim()}
                        className="px-5 py-2.5 font-bold bg-primary text-white hover:bg-primary/90 shadow-md rounded-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : habitToEdit ? 'Guardar Cambios' : 'Guardar Hábito'}
                    </button>
                </div>
            </div>
        </div>
    );
}
