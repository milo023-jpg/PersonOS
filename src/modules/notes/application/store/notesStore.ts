import { create } from 'zustand';
import { getNotesRepository } from '../../infrastructure/repositories/notes.repository';
import { createEmptyNote, extractPlainText, countWords, extractTextFromBlockNoteContent, countWordsFromBlockNoteContent, type Note } from '../../domain/models/Note';
import type { SearchFilters } from '../../domain/repositories/notes.repository.interface';
import { logger } from '../../../../shared/utils/logger';

export type NotesActiveFilter = 'all' | 'favorites' | 'recent' | 'context' | 'list' | 'deleted';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Note[];
  selectedContextId: string | null;
  selectedListId: string | null;
  activeFilter: NotesActiveFilter;
  viewMode: 'list' | 'board';
  isQuickCaptureOpen: boolean;
}

interface NotesActions {
  fetchNotes: (userId: string) => Promise<void>;
  fetchNote: (userId: string, noteId: string) => Promise<void>;
  createNote: (userId: string, title?: string, options?: { noteListId?: string; contextIds?: string[] }) => Promise<string>;
  updateNote: (userId: string, noteId: string, partial: Partial<Note>) => Promise<void>;
  deleteNote: (userId: string, noteId: string, trashListId?: string) => Promise<void>;
  restoreNote: (userId: string, noteId: string) => Promise<void>;
  toggleFavorite: (userId: string, noteId: string) => Promise<void>;
  togglePin: (userId: string, noteId: string) => Promise<void>;
  addContext: (userId: string, noteId: string, contextId: string) => Promise<void>;
  removeContext: (userId: string, noteId: string, contextId: string) => Promise<void>;
  setNoteList: (userId: string, noteId: string, noteListId: string | undefined) => Promise<void>;
  search: (userId: string, query: string, filters?: SearchFilters) => Promise<void>;
  fetchDeletedNotes: (userId: string) => Promise<void>;
  permanentlyDeleteNote: (userId: string, noteId: string) => Promise<void>;
  restoreDeletedNote: (userId: string, noteId: string, targetListId?: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  setSelectedContext: (contextId: string | null) => void;
  setSelectedListId: (listId: string | null) => void;
  setActiveFilter: (filter: NotesActiveFilter) => void;
  setViewMode: (mode: 'list' | 'board') => void;
  setSearchQuery: (query: string) => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  clearError: () => void;
}

type NotesStore = NotesState & NotesActions;

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  selectedContextId: null,
  selectedListId: null,
  activeFilter: 'all',
  viewMode: 'list',
  isQuickCaptureOpen: false,

  clearError: () => set({ error: null }),

  fetchNotes: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = getNotesRepository(userId);
      const allNotes = await repo.listRecent(200);

      // Cleanup: eliminar permanentemente notas en papelera con >30 días
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const notesToDelete = allNotes.filter(
        n => n.isDeleted && n.deletedAt && (now - n.deletedAt) > THIRTY_DAYS_MS
      );
      const deletedIds = new Set(notesToDelete.map(n => n.id));
      await Promise.all(notesToDelete.map(n => repo.permanentDelete(n.id)));

      // Incluir todas las notas (activas y eliminadas), excepto las limpiadas permanentemente
      const keptNotes = allNotes.filter(n => !deletedIds.has(n.id));
      const migratedNotes = keptNotes.map((note) => {
        if (note.blocks && note.blocks.length > 0 && (!note.blocknoteContent || note.blocknoteContent.length === 0)) {
          return {
            ...note,
            blocknoteContent: note.blocks.map((b) => ({
              type: b.type || 'paragraph',
              props: {},
              content: b.content ? [{ type: 'text', text: b.content }] : [{ type: 'text', text: '' }],
              children: [],
            })) as Record<string, unknown>[],
          };
        }
        return note;
      });

      set({ notes: migratedNotes, isLoading: false });
    } catch (err) {
      logger.error('Failed to fetch notes', err);
      set({ error: 'No se pudieron cargar las notas', isLoading: false });
    }
  },

  fetchNote: async (userId: string, noteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = getNotesRepository(userId);
      const note = await repo.getById(noteId);

      // Fallback: si la nota tiene `blocks` pero no `blocknoteContent`, convertir
      if (note && note.blocks && note.blocks.length > 0 && (!note.blocknoteContent || note.blocknoteContent.length === 0)) {
        note.blocknoteContent = note.blocks.map((b: { id?: string; type?: string; content?: string; metadata?: Record<string, unknown> }) => ({
          id: b.id || crypto.randomUUID(),
          type: b.type || 'paragraph',
          props: {},
          content: b.content ? [{ type: 'text', text: b.content }] : [],
          children: [],
        })) as Record<string, unknown>[];
        // Guardar la conversión para que no se pierda
        await repo.update(noteId, { blocknoteContent: note.blocknoteContent });
      }

      // Si por alguna razón aun no tiene blocknoteContent, crear uno vacío
      if (note && (!note.blocknoteContent || note.blocknoteContent.length === 0)) {
        note.blocknoteContent = [{ type: 'paragraph', content: '' }] as Record<string, unknown>[];
      }

      set({ currentNote: note, isLoading: false });
    } catch (err) {
      logger.error('Failed to fetch note', err);
      set({ error: 'No se pudo cargar la nota', isLoading: false });
    }
  },

  createNote: async (userId: string, title?: string, options?: { noteListId?: string; contextIds?: string[] }) => {
    set({ isLoading: true, error: null });
    try {
      const repo = getNotesRepository(userId);
      const noteData = createEmptyNote(userId);
      if (title) {
        noteData.title = title;
        noteData.plainText = title;
        noteData.wordCount = title.split(/\s+/).filter(w => w.length > 0).length;
      }
      if (options?.noteListId) {
        noteData.noteListId = options.noteListId;
      }
      if (options?.contextIds && options.contextIds.length > 0) {
        noteData.contextIds = [...new Set(options.contextIds)];
        noteData.primaryContextId = noteData.contextIds[0];
      }
      const noteId = await repo.create(noteData);
      const newNote = { ...noteData, id: noteId } as Note;
      set(state => ({
        notes: [newNote, ...state.notes],
        currentNote: newNote,
        isLoading: false,
      }));
      return noteId;
    } catch (err) {
      logger.error('Failed to create note', err);
      set({ error: 'No se pudo crear la nota', isLoading: false });
      throw err;
    }
  },

  updateNote: async (userId: string, noteId: string, partial: Partial<Note>) => {
    const now = Date.now();
    const updatedPartial = { ...partial, updatedAt: now };

    if (partial.blocks) {
      updatedPartial.plainText = extractPlainText(partial.blocks);
      updatedPartial.wordCount = countWords(partial.blocks);
    }

    if (partial.blocknoteContent) {
      updatedPartial.plainText = extractTextFromBlockNoteContent(partial.blocknoteContent);
      updatedPartial.wordCount = countWordsFromBlockNoteContent(partial.blocknoteContent);
    }

    // Optimistic update
    set(state => ({
      currentNote: state.currentNote?.id === noteId
        ? { ...state.currentNote, ...updatedPartial }
        : state.currentNote,
      notes: state.notes.map(n =>
        n.id === noteId ? { ...n, ...updatedPartial } : n
      ),
    }));

    const repo = getNotesRepository(userId);
    try {
      await repo.update(noteId, updatedPartial);
    } catch (err) {
      logger.error('Failed to update note', err);
      // En vez de hacer rollback a un estado anterior (que puede ser inconsistente
      // si hubo otras actualizaciones después), re-fetch la nota desde Firestore
      // para sincronizar el estado real del servidor
      try {
        const freshNote = await repo.getById(noteId);
        if (freshNote) {
          set(state => ({
            currentNote: state.currentNote?.id === noteId ? freshNote : state.currentNote,
            notes: state.notes.map(n => n.id === noteId ? freshNote : n),
            error: null,
          }));
        }
      } catch (fetchErr) {
        logger.error('Failed to re-fetch note after update error', fetchErr);
        set({
          error: 'No se pudo guardar. Revisa tu conexión y recarga.',
        });
      }
    }
  },

  deleteNote: async (userId: string, noteId: string, trashListId?: string) => {
    const previousNotes = get().notes;
    const deletedAt = Date.now();

    // Optimistic update: marcar como eliminada y mover a papelera
    set(state => ({
      notes: state.notes.map(n =>
        n.id === noteId
          ? { ...n, isDeleted: true, deletedAt, noteListId: trashListId, isFavorite: false, isPinned: false }
          : n
      ),
      currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
    }));

    try {
      const repo = getNotesRepository(userId);
      await repo.update(noteId, {
        isDeleted: true,
        deletedAt,
        noteListId: trashListId,
        isFavorite: false,
        isPinned: false,
      });
    } catch (err) {
      logger.error('Failed to delete note, rolling back', err);
      set({ notes: previousNotes, error: 'No se pudo eliminar la nota.' });
    }
  },

  restoreNote: async (userId: string, noteId: string) => {
    try {
      const repo = getNotesRepository(userId);
      await repo.restore(noteId);
      await get().fetchNotes(userId);
    } catch (err) {
      logger.error('Failed to restore note', err);
      set({ error: 'No se pudo restaurar la nota.' });
    }
  },

  toggleFavorite: async (userId: string, noteId: string) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    await get().updateNote(userId, noteId, { isFavorite: !note.isFavorite });
  },

  togglePin: async (userId: string, noteId: string) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    await get().updateNote(userId, noteId, { isPinned: !note.isPinned });
  },

  addContext: async (userId: string, noteId: string, contextId: string) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note || note.contextIds.includes(contextId)) return;
    const newContextIds = [...note.contextIds, contextId];
    const primaryContextId = note.primaryContextId || contextId;
    await get().updateNote(userId, noteId, { contextIds: newContextIds, primaryContextId });
  },

  removeContext: async (userId: string, noteId: string, contextId: string) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    const newContextIds = note.contextIds.filter(id => id !== contextId);
    const primaryContextId = newContextIds.length > 0 ? newContextIds[0] : '';
    await get().updateNote(userId, noteId, { contextIds: newContextIds, primaryContextId });
  },

  setNoteList: async (userId: string, noteId: string, noteListId: string | undefined) => {
    await get().updateNote(userId, noteId, { noteListId });
  },

  fetchDeletedNotes: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = getNotesRepository(userId);
      const deletedNotes = await repo.listDeleted();
      set(state => ({
        notes: [...state.notes.filter(n => !n.isDeleted), ...deletedNotes],
        isLoading: false,
      }));
    } catch (err) {
      logger.error('Failed to fetch deleted notes', err);
      set({ isLoading: false });
    }
  },

  permanentlyDeleteNote: async (userId: string, noteId: string) => {
    set(state => ({
      notes: state.notes.filter(n => n.id !== noteId),
      currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
    }));
    try {
      const repo = getNotesRepository(userId);
      await repo.permanentDelete(noteId);
    } catch (err) {
      logger.error('Failed to permanently delete note', err);
      set({ error: 'No se pudo eliminar la nota permanentemente.' });
    }
  },

  restoreDeletedNote: async (userId: string, noteId: string, targetListId?: string) => {
    try {
      const repo = getNotesRepository(userId);
      await repo.update(noteId, {
        isDeleted: false,
        deletedAt: undefined,
        noteListId: targetListId,
      });
      set(state => ({
        notes: state.notes.map(n =>
          n.id === noteId
            ? { ...n, isDeleted: false, deletedAt: undefined, noteListId: targetListId }
            : n
        ),
      }));
    } catch (err) {
      logger.error('Failed to restore note', err);
      set({ error: 'No se pudo restaurar la nota.' });
    }
  },

  search: async (userId: string, query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: query });
      return;
    }

    set({ isLoading: true, searchQuery: query });
    try {
      const repo = getNotesRepository(userId);
      const results = await repo.search(query, filters);
      set({ searchResults: results, isLoading: false });
    } catch (err) {
      logger.error('Failed to search notes', err);
      set({ searchResults: [], isLoading: false });
    }
  },

  setCurrentNote: (note) => set({ currentNote: note }),
  setSelectedContext: (contextId) => set({ selectedContextId: contextId }),
  setSelectedListId: (listId) => set({ selectedListId: listId }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  openQuickCapture: () => set({ isQuickCaptureOpen: true }),
  closeQuickCapture: () => set({ isQuickCaptureOpen: false }),
}));
