import { useState, useRef } from 'react';

interface Props {
    onAdd: (title: string) => void;
}

export default function AddSubtaskInput({ onAdd }: Props) {
    const [value, setValue] = useState('');
    const [isActive, setIsActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            setValue('');
            setIsActive(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="flex items-center gap-3 mt-1.5 px-2 py-2 rounded-xl group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-200">
            {/* Icono + */}
            <div className={`shrink-0 w-4.5 h-4.5 rounded-md flex items-center justify-center transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary/40 group-hover:text-primary/60'
            }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m-6-6h12" />
                </svg>
            </div>

            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsActive(true)}
                onBlur={() => {
                    handleSubmit(); // guardar si hay texto al perder foco
                    setIsActive(false);
                }}
                placeholder="Añadir una subtarea..."
                className="flex-1 bg-transparent text-[13.5px] font-medium text-text-primary/90 placeholder:text-text-secondary/30 focus:outline-none"
            />
        </div>
    );
}
