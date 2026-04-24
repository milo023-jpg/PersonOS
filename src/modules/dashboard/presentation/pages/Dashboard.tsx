import HabitsWidget from '../components/HabitsWidget';
import TodayTasksWidget from '../components/TodayTasksWidget';
import CustomListTasksWidget from '../components/CustomListTasksWidget';
import PlannerWidget from '../components/PlannerWidget';

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto h-full">
            {/* Main Content Area: Responsive Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-4">
                
                {/* Column 1: Hábitos (3/12) */}
                <div className="xl:col-span-3">
                    <HabitsWidget />
                </div>

                {/* Column 2: Tareas de Hoy y Personalizadas (5/12) */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <TodayTasksWidget />
                    <CustomListTasksWidget />
                </div>

                {/* Column 3: Planeador y Focos (4/12) */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    <PlannerWidget />
                </div>
                
            </div>
        </div>
    );
}

