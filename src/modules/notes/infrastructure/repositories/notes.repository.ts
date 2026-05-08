import { dbService } from '../../../../services/dbService';
import type { Note } from '../../domain/models/Note';
import type { NotesRepository, SearchFilters } from '../../domain/repositories/notes.repository.interface';
import { where, orderBy, limit } from 'firebase/firestore';

const COLLECTION_PATH = (userId: string) => `users/${userId}/notes`;

export class FirestoreNotesRepository implements NotesRepository {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async create(note: Omit<Note, 'id'>): Promise<string> {
    return dbService.addDocument(COLLECTION_PATH(this.userId), note);
  }

  async getById(noteId: string): Promise<Note | null> {
    return dbService.getDocument<Note>(COLLECTION_PATH(this.userId), noteId);
  }

  async update(noteId: string, partial: Partial<Note>): Promise<void> {
    await dbService.updateDocument(COLLECTION_PATH(this.userId), noteId, {
      ...partial,
      updatedAt: Date.now(),
    });
  }

  async softDelete(noteId: string): Promise<void> {
    await this.update(noteId, { isDeleted: true, deletedAt: Date.now() });
  }

  async restore(noteId: string): Promise<void> {
    await this.update(noteId, { isDeleted: false, deletedAt: undefined });
  }

  async permanentDelete(noteId: string): Promise<void> {
    await dbService.deleteDocument(COLLECTION_PATH(this.userId), noteId);
  }

  async listByContext(contextId: string, limitCount = 50): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('contextIds', 'array-contains', contextId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount),
    ]);
  }

  async listByNoteListId(noteListId: string, limitCount = 50): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('noteListId', '==', noteListId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount),
    ]);
  }

  async listFavorites(limitCount = 50): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('isFavorite', '==', true),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount),
    ]);
  }

  async listPinned(): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('isPinned', '==', true),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
    ]);
  }

  async listDeleted(): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('isDeleted', '==', true),
      orderBy('deletedAt', 'desc'),
    ]);
  }

  async listRecent(limitCount = 100): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      orderBy('updatedAt', 'desc'),
      limit(limitCount),
    ]);
  }

  async listByTag(tag: string, limitCount = 50): Promise<Note[]> {
    return dbService.queryMultiple<Note>(COLLECTION_PATH(this.userId), [
      where('tags', 'array-contains', tag),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount),
    ]);
  }

  async listAll(): Promise<Note[]> {
    return dbService.getCollectionDocuments<Note>(COLLECTION_PATH(this.userId));
  }

  async search(searchQuery: string, filters?: SearchFilters): Promise<Note[]> {
    const allNotes = await this.listRecent(500);
    const lowerQuery = searchQuery.toLowerCase();
    
    let results = allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      (note.plainText?.toLowerCase().includes(lowerQuery) ?? false)
    );

    if (filters?.contextId) {
      results = results.filter(n => n.contextIds.includes(filters.contextId!));
    }
    if (filters?.tag) {
      results = results.filter(n => n.tags.includes(filters.tag!));
    }
    if (filters?.favorite) {
      results = results.filter(n => n.isFavorite);
    }

    return results;
  }

  async incrementVersion(noteId: string): Promise<void> {
    const note = await this.getById(noteId);
    if (note) {
      await this.update(noteId, { version: note.version + 1 });
    }
  }

  async updateBacklinks(noteId: string, backlinks: string[]): Promise<void> {
    await this.update(noteId, { backlinkNoteIds: backlinks });
  }
}

let repositoryInstance: FirestoreNotesRepository | null = null;

export function getNotesRepository(userId: string): FirestoreNotesRepository {
  if (!repositoryInstance || repositoryInstance['userId'] !== userId) {
    repositoryInstance = new FirestoreNotesRepository(userId);
  }
  return repositoryInstance;
}