// Mock data de actividad
const mockActivity = [
    { id: 1, type: "habit", action: "Completaste: Meditación", time: "Hace 10 min", icon: "🧘" },
    { id: 2, type: "task", action: "Creaste nueva tarea: Revisar UI", time: "Hace 1 hora", icon: "📝" },
    { id: 3, type: "finance", action: "Registraste ingreso: Venta Freelance", time: "Hoy a las 09:00", icon: "💰" },
    { id: 4, type: "system", action: "Iniciaste sesión", time: "Hoy a las 08:30", icon: "🚀" },
];

export default function RecentActivityWidget() {
    return (
        <section className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Actividad Reciente</h2>
                    <p className="text-sm text-text-secondary">Tu historial de acciones</p>
                </div>
            </div>

            <div className="relative pl-3 mt-4">
                {/* Línea vertical central del timeline */}
                <div className="absolute left-6 top-2 bottom-2 w-px bg-gray-100"></div>

                <div className="flex flex-col gap-6">
                    {mockActivity.map((activity, index) => (
                        <div key={activity.id} className="relative flex items-start gap-4">
                            {/* Punto del timeline */}
                            <div className="relative z-10 w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm ring-4 ring-white flex-shrink-0">
                                {activity.icon}
                            </div>
                            
                            {/* Contenido (Tarjeta) */}
                            <div className="bg-gray-50/50 dark:bg-background/50 p-3 rounded-xl border border-gray-50 dark:border-transparent flex-1 hover:bg-white dark:hover:bg-background hover:shadow-sm transition-all group cursor-default">
                                <p className="font-medium text-text-primary text-sm group-hover:text-primary transition-colors">
                                    {activity.action}
                                </p>
                                <p className="text-xs text-text-secondary mt-1 font-mono">
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <button className="w-full text-center mt-6 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Ver historial completo
            </button>
        </section>
    );
}
