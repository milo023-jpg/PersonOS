export interface NoteList {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  createdAt: number;
  isDefault?: boolean;
  defaultContextId?: string;
}
