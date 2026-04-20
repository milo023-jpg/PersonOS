export type ContextType = 'project' | 'area' | 'personal' | 'client' | 'other';

export interface Context {
    id?: string;
    userId: string;
    name: string;
    type: ContextType;
    color: string;
    icon: string;
    isArchived: boolean;
    createdAt: number;
}
