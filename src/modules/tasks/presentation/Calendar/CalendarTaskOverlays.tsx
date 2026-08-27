import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../domain/models/Task';
import TaskDetailPanel from '../components/TaskDetail/TaskDetailPanel';
import InlineTaskCreator from '../components/TaskList/InlineTaskCreator';

interface Props {
    selectedTask: Task | null;
    creationDate: number | null;
    onCloseTask: () => void;
    onCloseCreation: () => void;
}

export default function CalendarTaskOverlays({
    selectedTask,
    creationDate,
    onCloseTask,
    onCloseCreation,
}: Props) {
    return (
        <>
            <AnimatePresence>
                {creationDate && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm px-2"
                        onClick={onCloseCreation}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <motion.div
                            className="w-full max-w-2xl pb-8 pt-2 max-h-full overflow-y-auto overscroll-contain"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 12, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <InlineTaskCreator defaultDate={creationDate} onCancel={onCloseCreation} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <TaskDetailPanel task={selectedTask} onClose={onCloseTask} />
        </>
    );
}