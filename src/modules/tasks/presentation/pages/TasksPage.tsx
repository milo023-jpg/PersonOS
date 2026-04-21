import TasksPageDesktop from './TasksPageDesktop';
import TasksMobile from '../mobile/TasksMobile';
import { useMediaQuery } from '../mobile/useMediaQuery';

export default function TasksPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (isMobile) {
        return <TasksMobile />;
    }

    return <TasksPageDesktop />;
}
