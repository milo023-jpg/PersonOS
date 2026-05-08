import type { Note } from '../models/Note';
import type { NoteVersion } from '../models/NoteVersion';
import type { Tag } from '../models/Tag';

export interface SearchFilters {
  contextId?: string;
  tag?: string;
  favorite?: boolean;
}

export interface NotesRepository {
  create(note: Omit<Note, 'id'>): Promise<string>;
  getById(noteId: string): Promise<Note | null>;
  update(noteId: string, partial: Partial<Note>): Promise<void>;
  softDelete(noteId: string): Promise<void>;
  restore(noteId: string): Promise<void>;
  permanentDelete(noteId: string): Promise<void>;

  listByContext(contextId: string, limit?: number): Promise<Note[]>;
  listByNoteListId(noteListId: string, limit?: number): Promise<Note[]>;
  listFavorites(limit?: number): Promise<Note[]>;
  listPinned(): Promise<Note[]>;
  listDeleted(): Promise<Note[]>;
  listRecent(limit?: number): Promise<Note[]>;
  listByTag(tag: string, limit?: number): Promise<Note[]>;
  listAll(): Promise<Note[]>;

  search(query: string, filters?: SearchFilters): Promise<Note[]>;

  incrementVersion(noteId: string): Promise<void>;
  updateBacklinks(noteId: string, backlinks: string[]): Promise<void>;
}

export interface VersionsRepository {
  create(version: Omit<NoteVersion, 'id'>): Promise<string>;
  getByNoteId(noteId: string): Promise<NoteVersion[]>;
  getVersion(noteId: string, version: number): Promise<NoteVersion | null>;
}

export interface TagsRepository {
  create(tag: Omit<Tag, 'id'>): Promise<string>;
  getAll(): Promise<Tag[]>;
  update(tagId: string, partial: Partial<Tag>): Promise<void>;
  delete(tagId: string): Promise<void>;
  ensureExists(name: string): Promise<string>;
}