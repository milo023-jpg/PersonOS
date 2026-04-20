// Mock data para el planner
const mockSchedule = [
    { id: 1, time: "08:00 AM", task: "Rutina de Mañana", type: "routine", active: false },
    { id: 2, time: "10:00 AM", task: "Trabajo Profundo (Deep Work)", type: "focus", active: true },
    { id: 3, time: "01:00 PM", task: "Almuerzo y Descanso", type: "break", active: false },
    { id: 4, time: "03:00 PM", task: "Llamadas de CRM", type: "work", active: false },
];

export default function PlannerWidget() {
    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Planner del Día</h2>
                    <p className="text-sm text-text-secondary">Bloques de tiempo</p>
                </div>
                {/* Botón flotante para editar */}
                <button className="bg-pastel-purple text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                    Editar
                </button>
            </div>

            <div className="flex flex-col gap-0 flex-1">
                {mockSchedule.map((block, index) => (
                    <div 
                        key={block.id} 
                        className={`flex items-stretch gap-4 group
                            ${index !== mockSchedule.length - 1 ? 'pb-4' : ''}
                        `}
                    >
                        {/* Bloque de hora */}
                        <div className="w-16 flex-shrink-0 text-right">
                            <span className={`text-xs font-bold leading-none
                                ${block.active ? 'text-primary' : 'text-text-secondary'}
                            `}>
                                {block.time.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-gray-400 block">{block.time.split(' ')[1]}</span>
                        </div>

                        {/* Línea divisoria */}
                        <div className="w-px bg-gray-100 dark:bg-gray-800 relative shadow-sm">
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ring-4 ring-white dark:ring-surface
                                ${block.active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                            `}></div>
                            {/* Línea activa que rellena el espacio si está en "active" */}
                            {block.active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/20 h-full rounded-full"></div>
                            )}
                        </div>

                        {/* Tarjeta del bloque de tiempo */}
                        <div className={`flex-1 p-3 rounded-xl border transition-all mb-1
                            ${block.active 
                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02] -translate-y-1' 
                                : 'bg-gray-50 dark:bg-background border-gray-100 hover:border-gray-200 text-text-primary'
                            }
                        `}>
                            <p className="text-sm font-medium">{block.task}</p>
                            
                            {/* Badge del tipo de tarea */}
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                ${block.active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400'}
                            `}>
                                {block.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
