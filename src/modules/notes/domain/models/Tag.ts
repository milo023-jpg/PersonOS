export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  notesCount: number;
  createdAt: number;
}

export function createTag(userId: string, name: string, color: string = '#6366f1'): Omit<Tag, 'id'> {
  return {
    userId,
    name: name.toLowerCase().replace(/^#/, ''),
    color,
    notesCount: 0,
    createdAt: Date.now(),
  };
}