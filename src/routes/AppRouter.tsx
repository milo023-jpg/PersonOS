import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Dashboard from '../modules/dashboard/presentation/pages/Dashboard';
import HabitsPage from '../modules/habits/presentation/pages/HabitsPage';
import HabitDetailsPage from '../modules/habits/presentation/pages/HabitDetailsPage';
import ContextsPage from '../modules/contexts/presentation/pages/ContextsPage';
import ContextDetailsPage from '../modules/contexts/presentation/pages/ContextDetailsPage';
import InboxPage from '../modules/inbox/presentation/pages/InboxPage';
import TasksPage from "../modules/tasks/presentation/pages/TasksPage";
import CRMPage from '../modules/crm/presentation/pages/CRMPage';
import FinancePage from '../modules/finance/presentation/pages/FinancePage';
import PlannerPage from '../modules/planner/presentation/pages/PlannerPage';
import GoalsPage from '../modules/goals/presentation/pages/GoalsPage';
import NotesPage from '../modules/notes/presentation/pages/NotesPage';
import RoutinesPage from '../modules/routines/presentation/pages/RoutinesPage';
import StatsPage from '../modules/stats/presentation/pages/StatsPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/habits/:id" element={<HabitDetailsPage />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/contexts" element={<ContextsPage />} />
                    <Route path="/contexts/:id" element={<ContextDetailsPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/crm" element={<CRMPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                    <Route path="/planner" element={<PlannerPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/routines" element={<RoutinesPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}