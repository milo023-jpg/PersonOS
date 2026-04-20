export interface TaskStats {
  id: string; // date string YYYY-MM-DD for easy lookup
  userId: string;
  date: string; // YYYY-MM-DD
  
  tasksCreated: number;
  tasksCompleted: number;
  
  completionRate: number; // 0 a 100
  
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  
  overdueTasks: number;
}
