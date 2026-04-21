import { MobileNavigationProvider, useTasksMobileNavigation } from './MobileNavigationContext';
import TasksHomeMobile from './TasksHome.mobile';
import TaskListViewMobile from './TaskListView.mobile';
import { AnimatePresence } from 'framer-motion';

function TasksMobileContent() {
    const { view } = useTasksMobileNavigation();

    return (
        <AnimatePresence mode="wait">
            {view === 'home' ? (
                <TasksHomeMobile key="home" />
            ) : (
                <TaskListViewMobile key="list" />
            )}
        </AnimatePresence>
    );
}

export default function TasksMobile() {
    return (
        <MobileNavigationProvider>
            <TasksMobileContent />
        </MobileNavigationProvider>
    );
}