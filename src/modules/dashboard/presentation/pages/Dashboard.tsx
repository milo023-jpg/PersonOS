import KPICards from '../components/KPICards';
import HabitsWidget from '../components/HabitsWidget';
import TasksWidget from '../components/TasksWidget';
import PlannerWidget from '../components/PlannerWidget';

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto h-full">
            {/* Top Row: Metric Cards */}
            <KPICards />
            
            {/* Main Content Area: 4 Columns side-by-side to save vertical space */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-4">
                
                {/* Column 1: Hábitos */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <HabitsWidget />
                </div>

                {/* Column 2: Tareas */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <TasksWidget />
                </div>

                {/* Column 3: Planeador y Focos */}
                <div className="xl:col-span-6 flex flex-col gap-6">
                    <PlannerWidget />
                </div>
                
            </div>
        </div>
    );
}

