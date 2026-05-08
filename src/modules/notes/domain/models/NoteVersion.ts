export interface NoteVersion {
  id: string;
  noteId: string;
  userId: string;
  title: string;
  blocks: import('./Note').NoteBlock[];
  version: number;
  createdAt: number;
  changeSummary?: string;
}