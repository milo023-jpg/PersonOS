export interface AppShortcut {
    path: string;
    label: string;
    iconPath: string;
}

export const MODULE_SHORTCUTS: AppShortcut[] = [
    { path: '/notes', label: 'Notas', iconPath: '/icons/notas-192.png' },
    { path: '/habits', label: 'Hábitos', iconPath: '/icons/habitos-192.png' },
    { path: '/tasks', label: 'Tareas', iconPath: '/icons/tareas-192.png' },
    { path: '/finance', label: 'Finanzas', iconPath: '/icons/finanzas-192.png' },
];