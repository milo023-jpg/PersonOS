interface Props {
    onClick: () => void;
    label?: string;
    className?: string;
}

export default function FabButton({ onClick, label = 'Añadir tarea', className = '' }: Props) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`absolute bottom-5 right-5 z-20 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${className}`}
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
    );
}