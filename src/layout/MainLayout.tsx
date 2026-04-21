import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { SystemScrollArea } from "../shared/ui/SystemScrollArea";

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
}

const NavIcon = ({ children }: { children: React.ReactNode }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
    </svg>
);

const NAV_ITEMS: NavItem[] = [
    {
        to: "/",
        label: "Dashboard",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></NavIcon>,
    },
    {
        to: "/inbox",
        label: "Inbox",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></NavIcon>,
    },
    {
        to: "/contexts",
        label: "Contextos",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></NavIcon>,
    },
    {
        to: "/habits",
        label: "Hábitos",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></NavIcon>,
    },
    {
        to: "/tasks",
        label: "Tareas",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></NavIcon>,
    },
    {
        to: "/planner",
        label: "Planner",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></NavIcon>,
    },
    {
        to: "/goals",
        label: "Objetivos",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></NavIcon>,
    },
    {
        to: "/finance",
        label: "Finanzas",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></NavIcon>,
    },
    {
        to: "/crm",
        label: "CRM",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></NavIcon>,
    },
    {
        to: "/notes",
        label: "Notas",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></NavIcon>,
    },
    {
        to: "/routines",
        label: "Rutinas",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></NavIcon>,
    },
    {
        to: "/stats",
        label: "Estadísticas",
        icon: <NavIcon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></NavIcon>,
    },
];

const PAGE_TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/inbox": "Inbox",
    "/contexts": "Contextos",
    "/habits": "Hábitos",
    "/tasks": "Tareas",
    "/planner": "Planner",
    "/goals": "Objetivos",
    "/finance": "Finanzas",
    "/crm": "CRM Freelance",
    "/notes": "Notas",
    "/routines": "Rutinas",
    "/stats": "Estadísticas",
};



export default function MainLayout() {
    const location = useLocation();

    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    
    // Initialize open on desktop, closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768; // md breakpoint
        }
        return false;
    });

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    // Close sidebar when clicking a link only on mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const next = !prev;
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const getPageTitle = () => {
        const match = Object.keys(PAGE_TITLES)
            .sort((a, b) => b.length - a.length)
            .find(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
        return match ? PAGE_TITLES[match] : 'Dashboard';
    };

    const isActive = (to: string) =>
        to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

    return (
        <div className="flex h-screen bg-background text-text-primary font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <SystemScrollArea
                className={`fixed md:static inset-y-0 left-0 bg-surface flex flex-col shadow-sm z-30 overflow-y-auto overflow-x-hidden transform transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? "translate-x-0 w-64 p-6" : "-translate-x-full md:translate-x-0 md:w-20 md:px-4 md:py-6"
                }`}
            >
                {/* Logo & Toggle */}
                <div className={`flex items-center mb-10 ${isSidebarOpen ? "gap-3 justify-start" : "justify-center"}`}>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex-shrink-0"
                        title="Alternar Sidebar"
                    >
                        <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {/* Close icon for mobile when open */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <svg className="w-5 h-5 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {/* Panel icon to represent controlling sidebar */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                    </button>
                    {isSidebarOpen && (
                        <span className="text-xl font-bold text-text-primary">Person OS</span>
                    )}
                </div>

                {/* Quick Capture */}
                <button className={`flex items-center justify-center bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 p-3 rounded-xl font-bold shadow-md transition-all mb-6 ${isSidebarOpen ? "w-full gap-2" : "w-12 h-12 self-center px-0"}`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                    {isSidebarOpen && <span>Captura Rápida</span>}
                </button>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1">
                    {NAV_ITEMS.map(({ to, label, icon }) => {
                        const active = isActive(to);
                        return (
                            <Link
                                key={to}
                                to={to}
                                title={!isSidebarOpen ? label : undefined}
                                className={`flex items-center rounded-xl font-medium transition-all group ${
                                    isSidebarOpen ? "gap-3 px-4 py-3" : "justify-center p-3"
                                } ${active
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-text-secondary hover:bg-gray-50 dark:hover:bg-surface"
                                    }`}
                            >
                                <span className={`flex-shrink-0 ${!active && "group-hover:text-primary transition-colors"}`}>
                                    {icon}
                                </span>
                                {isSidebarOpen && <span>{label}</span>}
                                {/* Inbox badge placeholder */}
                                {to === "/inbox" && (
                                    <span className={`text-[11px] font-bold rounded-full min-w-[20px] text-center ${
                                        isSidebarOpen ? "ml-auto px-2 py-0.5" : "absolute top-2 right-2 px-1 py-0"
                                    } ${active ? "bg-white/20 text-white" : "bg-danger/10 text-danger"}`}>
                                        5
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle */}
                <div className={`mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 ${!isSidebarOpen && "flex justify-center"}`}>
                    <button 
                        onClick={toggleTheme} 
                        title={!isSidebarOpen ? (isDarkMode ? "Light Mode" : "Dark Mode") : undefined}
                        className={`flex items-center rounded-xl font-medium transition-all text-text-secondary hover:bg-gray-50 dark:hover:bg-surface ${
                            isSidebarOpen ? "gap-3 px-4 py-3 w-full" : "justify-center p-3"
                        }`}
                    >
                        {isDarkMode ? (
                            <>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                {isSidebarOpen && <span>Light Mode</span>}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                                {isSidebarOpen && <span>Dark Mode</span>}
                            </>
                        )}
                    </button>
                </div>
            </SystemScrollArea>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 md:h-20 bg-surface flex items-center justify-between px-4 md:px-10 shadow-sm z-10 relative dark:border-b dark:border-gray-800">
                    <div className="flex items-center gap-3 md:gap-0">
                        {/* Mobile Toggle Button (only visible when sidebar is closed on mobile) */}
                        {!isSidebarOpen && (
                            <button 
                                className="md:hidden bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl md:text-2xl font-bold text-text-primary truncate">{getPageTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative hidden sm:block">
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input type="text" placeholder="Search here..." className="bg-gray-100/80 dark:bg-background text-sm rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 ring-primary/20 w-48 lg:w-64 dark:text-text-primary placeholder:text-text-secondary" />
                        </div>

                        <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-gray-100 dark:border-gray-800">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 overflow-hidden shrink-0">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-text-primary">Camilo</p>
                                <p className="text-xs text-text-secondary">Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Main */}
                <SystemScrollArea direction="both" className="flex-1 p-4 md:p-10 bg-background">
                    <Outlet />
                </SystemScrollArea>
            </div>
        </div>
    );
}
