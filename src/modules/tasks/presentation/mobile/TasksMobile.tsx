import { MobileNavigationProvider, useTasksMobileNavigation } from './MobileNavigationContext';
import TasksHomeMobile from './TasksHome.mobile';
import TaskListViewMobile from './TaskListView.mobile';
import CalendarView from '../Calendar/CalendarView';
import { AnimatePresence } from 'framer-motion';

function MobileTopBar() {
    const { view, goToHome, goToCalendar } = useTasksMobileNavigation();
    const activeClass = 'bg-white dark:bg-background text-text-primary shadow-sm';
    const idleClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="shrink-0 px-4 pt-3 pb-1 z-10">
            <div className="flex bg-gray-100 dark:bg-surface p-1 rounded-xl gap-1">
                <button
                    onClick={goToHome}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${view === 'home' ? activeClass : idleClass}`}
                >
                    Tareas
                </button>
                <button
                    onClick={goToCalendar}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${view === 'calendar' ? activeClass : idleClass}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendario
                </button>
            </div>
        </div>
    );
}

function TasksMobileContent() {
    const { view } = useTasksMobileNavigation();

    return (
        <div className="h-full min-h-0 w-full relative flex flex-col bg-background">
            {view !== 'list' && <MobileTopBar />}
            <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                    {view === 'home' && <TasksHomeMobile key="home" />}
                    {view === 'calendar' && (
                        <div key="calendar" className="h-full">
                            <CalendarView />
                        </div>
                    )}
                    {view === 'list' && <TaskListViewMobile key="list" />}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function TasksMobile() {
    return (
        <MobileNavigationProvider>
            <TasksMobileContent />
        </MobileNavigationProvider>
    );
}