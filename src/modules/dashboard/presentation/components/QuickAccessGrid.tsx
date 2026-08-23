import { Link } from 'react-router-dom';

interface QuickLink {
    to: string;
    label: string;
    description: string;
    iconBg: string;
    icon: React.ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
    {
        to: '/contexts',
        label: 'Contextos',
        description: 'Organiza por lugar',
        iconBg: 'bg-violet-500/10 text-violet-500',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
    {
        to: '/tasks',
        label: 'Tareas',
        description: 'Prioriza tu día',
        iconBg: 'bg-blue-500/10 text-blue-500',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    },
    {
        to: '/habits',
        label: 'Hábitos',
        description: 'Construye constancia',
        iconBg: 'bg-emerald-500/10 text-emerald-500',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
        to: '/notes',
        label: 'Notas',
        description: 'Captura ideas',
        iconBg: 'bg-amber-500/10 text-amber-500',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    },
];

export default function QuickAccessGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map(({ to, label, description, iconBg, icon }) => (
                <Link
                    key={to}
                    to={to}
                    className="bg-surface p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 hover:-translate-y-0.5 transition-all"
                >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">{label}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}