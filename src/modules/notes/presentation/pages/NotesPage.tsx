import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useNotesStore } from '../../application/store/notesStore';
import { useAuthStore } from '../../../auth/application/store/authStore';
import { useContextsStore } from '../../../contexts/application/store/contextsStore';
import { useNoteListsStore } from '../../application/store/noteListsStore';
import { NotesSidebar } from '../components/NotesSidebar/NotesSidebar';
import { NoteCardList } from '../components/NoteCard/NoteCard';
import { ContextSelectorChips } from '../components/ContextSelector/ContextSelectorChips';
import { ListSelector } from '../components/ListSelector/ListSelector';
import { BlockNoteEditor, toPartialBlocks, fromPartialBlocks } from '../components/BlockNoteEditor';
import { QuickCaptureModal } from '../components/QuickCapture/QuickCaptureModal';
import { Tooltip } from '../components/Tooltip/Tooltip';
import type { Note } from '../../domain/models/Note';
import type { NoteList } from '../../domain/models/NoteList';
import type { Context } from '../../../contexts/domain/models/types';
import type { NotesActiveFilter } from '../../application/store/notesStore';

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */
const IconArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconDuplicate = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconLink = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const IconDots = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Save status indicator                                               */
/* ------------------------------------------------------------------ */
function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-secondary/60">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
        Guardando...
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-500/70">
        <IconCheck />
        Guardado
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Options menu                                                        */
/* ------------------------------------------------------------------ */
function OptionsMenu({
  onDuplicate,
  onDelete,
  onCopyLink,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface/80 transition-colors"
        aria-label="Opciones"
      >
        <IconDots />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-gray-200/10 dark:border-gray-700/50 rounded-xl shadow-xl shadow-black/20 py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <button
            onClick={() => {
              onDuplicate();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-secondary hover:bg-surface hover:text-text-primary"
          >
            <IconDuplicate />
            Duplicar nota
          </button>
          <button
            onClick={() => {
              onCopyLink();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-secondary hover:bg-surface hover:text-text-primary"
          >
            <IconLink />
            Copiar enlace
          </button>
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <IconTrash />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function getInheritedContexts(noteListId: string | undefined, noteLists: NoteList[]): string[] {
  if (!noteListId) return [];
  const list = noteLists.find(l => l.id === noteListId);
  return list?.defaultContextId ? [list.defaultContextId] : [];
}

/** Determina si una nota está completamente vacía (sin título ni contenido) */
function isNoteEmpty(note: Note): boolean {
  const hasTitle = note.title.trim().length > 0;
  const hasContent = (note.plainText?.trim().length ?? 0) > 0;
  return !hasTitle && !hasContent;
}

/** Elimina una nota vacía silenciosamente (sin confirmación) */
async function deleteIfEmpty(userId: string | null, noteId: string | null, deleteFn: (userId: string, noteId: string) => Promise<void>) {
  if (!noteId || !userId) return;
  const note = useNotesStore.getState().notes.find(n => n.id === noteId);
  if (note && isNoteEmpty(note)) {
    await deleteFn(userId, noteId);
  }
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
export default function NotesPage() {
  const { userId } = useAuthStore();
  const {
    notes,
    currentNote,
    isLoading,
    searchQuery,
    searchResults,
    selectedContextId,
    selectedListId,
    activeFilter,
    fetchNotes,
    updateNote,
    deleteNote,
    toggleFavorite,
    restoreDeletedNote,
    permanentlyDeleteNote,
    setCurrentNote,
    setSelectedContext,
    setSelectedListId,
    setActiveFilter,
    search,
    setSearchQuery,
    openQuickCapture,
    createNote,
  } = useNotesStore();

  const { contexts, fetchContexts } = useContextsStore();
  const { lists: noteLists, fetchLists: fetchNoteLists } = useNoteListsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNoteListCollapsed, setIsNoteListCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  /* sync currentNoteIdRef with currentNote */
  useEffect(() => {
    currentNoteIdRef.current = currentNote?.id ?? null;
  }, [currentNote]);

  /* fetch data */
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetchNotes(userId),
      fetchContexts(userId),
      fetchNoteLists(userId),
    ]);
  }, [userId, fetchNotes, fetchContexts, fetchNoteLists]);

  /* reset save status after showing "saved" */
  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  /* cleanup: delete empty note when leaving the page */
  useEffect(() => {
    return () => {
      const noteId = currentNoteIdRef.current;
      if (noteId && userId) {
        deleteIfEmpty(userId, noteId, deleteNote).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextsMap = useMemo(() => {
    const map = new Map<string, Context>();
    contexts.forEach(ctx => { if (ctx.id) map.set(ctx.id, ctx); });
    return map;
  }, [contexts]);

  const noteListsMap = useMemo(() => {
    const map = new Map<string, NoteList>();
    noteLists.forEach(l => map.set(l.id, l));
    return map;
  }, [noteLists]);

  const filteredNotes = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const hasSearch = searchQuery.trim().length > 0;

    // Filtrar según el filtro activo
    const result = notes.filter(n => {
      if (activeFilter === 'deleted') {
        return n.isDeleted;
      }
      // Para todos los demás filtros, excluir eliminadas
      if (n.isDeleted) return false;
      switch (activeFilter) {
        case 'favorites':
          if (!n.isFavorite) return false;
          break;
        case 'context':
          if (selectedContextId && !n.contextIds.includes(selectedContextId)) return false;
          break;
        case 'list':
          if (selectedListId && n.noteListId !== selectedListId) return false;
          break;
      }
      if (hasSearch && !n.title.toLowerCase().includes(lower) && !(n.plainText?.toLowerCase().includes(lower) ?? false)) {
        return false;
      }
      return true;
    });

    if (activeFilter === 'recent') {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    if (activeFilter === 'deleted') {
      result.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
    }

    return result;
  }, [notes, activeFilter, selectedContextId, selectedListId, searchQuery]);

  const displayedNotes = useMemo(() =>
    searchQuery && searchResults.length > 0 ? searchResults : filteredNotes,
    [searchQuery, searchResults, filteredNotes]
  );

  const handleFilterChange = useCallback((filter: NotesActiveFilter, contextId?: string | null, listId?: string | null) => {
    setActiveFilter(filter);

    // Limpiar o establecer selectedContextId según el filtro
    if (filter === 'context' && contextId !== undefined) {
      setSelectedContext(contextId);
    } else if (filter !== 'context') {
      setSelectedContext(null);
    }

    // Limpiar o establecer selectedListId según el filtro
    if (filter === 'list' && listId !== undefined) {
      setSelectedListId(listId);
    } else if (filter !== 'list') {
      setSelectedListId(null);
    }
  }, [setActiveFilter, setSelectedContext, setSelectedListId]);

  const handleNoteClick = useCallback(async (note: Note) => {
    // Si la nota anterior está vacía (y es distinta de la nueva), eliminarla
    if (currentNoteIdRef.current && currentNoteIdRef.current !== note.id) {
      await deleteIfEmpty(userId, currentNoteIdRef.current, deleteNote);
    }
    setCurrentNote(note);
    setIsEditing(true);
    setShowMobileList(false);
  }, [setCurrentNote, userId, deleteNote]);

  const handleToggleFavorite = useCallback(async (noteId: string) => {
    if (!userId) return;
    await toggleFavorite(userId, noteId);
  }, [userId, toggleFavorite]);

  const trashList = useMemo(() => noteLists.find(l => l.isTrash), [noteLists]);

  const handleDelete = useCallback(async (noteId: string) => {
    if (!userId) return;
    await deleteNote(userId, noteId, trashList?.id);
    if (currentNoteIdRef.current === noteId) {
      setCurrentNote(null);
      currentNoteIdRef.current = null;
      setIsEditing(false);
      setShowMobileList(true);
    }
  }, [userId, deleteNote, setCurrentNote, trashList]);

  const defaultList = useMemo(() => noteLists.find(l => l.isDefault), [noteLists]);

  const handleRestore = useCallback(async (noteId: string) => {
    if (!userId) return;
    await restoreDeletedNote(userId, noteId, defaultList?.id);
  }, [userId, restoreDeletedNote, defaultList]);

  const handlePermanentDelete = useCallback(async (noteId: string) => {
    if (!userId) return;
    await permanentlyDeleteNote(userId, noteId);
  }, [userId, permanentlyDeleteNote]);

  const handleCreateNote = useCallback(async (options?: { noteListId?: string; contextIds?: string[] }) => {
    if (!userId) return;
    // Si no se especifica noteListId, usar la lista por defecto (General)
    let targetListId = options?.noteListId;
    if (!targetListId) {
      const defaultList = noteLists.find(l => l.isDefault) || noteLists.find(l => l.name === 'General');
      targetListId = defaultList?.id;
    }
    const inherited = getInheritedContexts(targetListId, noteLists);
    const mergedContexts = [...new Set([...(options?.contextIds || []), ...inherited])];
    const noteId = await createNote(userId, '', { noteListId: targetListId, contextIds: mergedContexts });
    setIsEditing(true);
    setShowMobileList(false);
    return noteId;
  }, [userId, createNote, noteLists]);

  const handleContentChange = useCallback(async (blocks: Record<string, unknown>[]) => {
    if (!userId) return;
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await updateNote(userId, noteId, { blocknoteContent: blocks });
      setSaveStatus('saved');
    }, 500);
  }, [userId, updateNote]);

  /* Focus mode: auto-collapse panels when editing */
  const handleEditorFocus = useCallback(() => {
    setSidebarCollapsed(true);
    setIsNoteListCollapsed(true);
  }, []);

  const handleTitleChange = useCallback(async (title: string) => {
    if (!userId) return;
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await updateNote(userId, noteId, { title });
      setSaveStatus('saved');
    }, 500);
  }, [userId, updateNote]);

  const handleBack = useCallback(async () => {
    // Si la nota actual está vacía, eliminarla antes de salir
    await deleteIfEmpty(userId, currentNoteIdRef.current, deleteNote);
    setCurrentNote(null);
    currentNoteIdRef.current = null;
    setIsEditing(false);
    setSaveStatus('idle');
    setShowMobileList(true);
  }, [setCurrentNote, userId, deleteNote]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() && userId) {
      search(userId, query);
    }
  }, [userId, setSearchQuery, search]);

  const handleNoteContextsChange = useCallback(async (contextIds: string[]) => {
    if (!userId) return;
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;
    const primaryContextId = contextIds.length > 0 ? contextIds[0] : '';
    await updateNote(userId, noteId, { contextIds, primaryContextId });
  }, [userId, updateNote]);

  const handleNoteListChange = useCallback(async (noteListId: string | undefined) => {
    if (!userId) return;
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;
    const inherited = getInheritedContexts(noteListId, noteLists);
    // Obtener los contextIds actuales de la nota en el store
    const note = useNotesStore.getState().notes.find(n => n.id === noteId);
    const currentContextIds = note?.contextIds || [];
    const newContextIds = [...new Set([...currentContextIds, ...inherited])];
    await updateNote(userId, noteId, {
      noteListId,
      contextIds: newContextIds,
      primaryContextId: newContextIds[0] || note?.primaryContextId || '',
    });
  }, [userId, updateNote, noteLists]);

  /* ---- Active filter label ---------------------------------------- */
  const activeFilterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'favorites': return 'Favoritas';
      case 'recent': return 'Recientes';
      case 'deleted': return 'Eliminadas recientemente';
      case 'context': {
        const ctx = selectedContextId ? contextsMap.get(selectedContextId) : null;
        return ctx ? `${ctx.icon} ${ctx.name}` : 'Contexto';
      }
      case 'list': {
        const list = selectedListId ? noteListsMap.get(selectedListId) : null;
        return list ? `${list.name}` : 'Lista';
      }
      default: return 'Todas las notas';
    }
  }, [activeFilter, selectedContextId, selectedListId, contextsMap, noteListsMap]);

  /* ---- Note editor panel ------------------------------------------ */
  const isCompact = !sidebarCollapsed && !isNoteListCollapsed;
  const editorPadding = isCompact
    ? 'pl-4 pr-4 md:pl-6 md:pr-6 py-6 md:py-8'
    : 'px-4 md:px-6 lg:pl-12 lg:pr-12 py-6 md:py-10';

  const NoteEditorPanel = currentNote && (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-100/30 dark:border-gray-800/30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-text-secondary/70 hover:text-text-primary hover:bg-surface/60 rounded-lg transition-colors"
          >
            <IconArrowLeft />
          </button>
          {/* Expand panels button (focus mode exit) */}
          {sidebarCollapsed && isNoteListCollapsed && (
            <button
              onClick={() => { setSidebarCollapsed(false); setIsNoteListCollapsed(false); }}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-sm text-text-secondary/70 hover:text-text-primary hover:bg-surface/60 rounded-lg transition-colors"
              title="Salir del modo enfoque"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <span className="text-xs font-medium">Modo enfoque</span>
            </button>
          )}
          <SaveStatus status={saveStatus} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-4 bg-gray-200/50 dark:bg-gray-700/50 mx-1" />
          <OptionsMenu
            onDuplicate={() => alert('Duplicar - próximamente')}
            onDelete={() => {
              deleteNote(userId!, currentNote.id);
              handleBack();
            }}
            onCopyLink={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Enlace copiado al portapapeles');
            }}
          />
        </div>
      </div>

      {/* Editor surface */}
      <div className="flex-1 overflow-y-auto overflow-x-visible">
          <div className={`w-full min-h-full max-w-full md:max-w-4xl mx-auto transition-all duration-300 ${editorPadding}`}>
          {/* Inline metadata tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <ListSelector
              lists={noteLists}
              selectedListId={currentNote.noteListId}
              onChange={handleNoteListChange}
              placeholder="Sin lista"
            />
            <ContextSelectorChips
              selectedContextIds={currentNote.contextIds}
              onChange={handleNoteContextsChange}
            />
          </div>

          <BlockNoteEditor
            key={currentNote.id}
            title={currentNote.title}
            onTitleChange={handleTitleChange}
            initialContent={toPartialBlocks(currentNote.blocknoteContent)}
            onContentChange={(partialBlocks) => handleContentChange(fromPartialBlocks(partialBlocks))}
            onFocus={handleEditorFocus}
            compactMode={isCompact}
          />
        </div>
      </div>
    </div>
  );

  /* ---- Note list panel -------------------------------------------- */
  const NoteListPanel = (
    <div className="flex flex-col h-full bg-surface/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Abrir filtros"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{activeFilterLabel}</h2>
            <p className="text-xs text-text-secondary/70">
              {displayedNotes.length} {displayedNotes.length === 1 ? 'nota' : 'notas'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openQuickCapture()}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            title="Captura Rápida"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {/* Desktop create button */}
          <button
            onClick={() => handleCreateNote()}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nueva</span>
          </button>
          {/* Collapse note list button (desktop only) */}
          <Tooltip label="Ocultar lista" placement="bottom">
            <button
              onClick={() => setIsNoteListCollapsed(true)}
              className="hidden lg:flex p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search inside list */}
      <div className="px-4 md:px-5 py-2 border-b border-gray-100 dark:border-gray-800/40 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar notas..."
            className="w-full pl-9 pr-4 py-2 bg-background rounded-xl text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:ring-2 ring-primary/15 transition-all"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <NoteCardList
            notes={displayedNotes}
            contextsMap={contextsMap}
            listsMap={noteListsMap}
            onNoteClick={handleNoteClick}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onCreateNote={() => handleCreateNote()}
            emptyTitle={activeFilter === 'favorites' ? 'No tienes favoritas' : activeFilter === 'context' ? 'No hay notas en este contexto' : activeFilter === 'list' ? 'No hay notas en esta lista' : activeFilter === 'deleted' ? 'Papelera vacía' : 'Aún no tienes notas'}
            emptyDescription={activeFilter === 'favorites' ? 'Marca notas como favoritas para acceder rápidamente.' : activeFilter === 'context' ? 'Crea una nota y asígnale este contexto.' : activeFilter === 'list' ? 'Crea una nota en esta lista.' : activeFilter === 'deleted' ? 'Las notas eliminadas aparecerán aquí por 30 días.' : 'Comienza capturando una idea, una reunión o cualquier pensamiento.'}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <NotesSidebar
        onFilterChange={handleFilterChange}
        activeFilter={activeFilter}
        selectedContextId={selectedContextId}
        selectedListId={selectedListId}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Note list - hidden on mobile when editing */}
        <div className={`
          ${showMobileList ? 'flex' : 'hidden'}
          lg:flex flex-col border-r border-gray-100 dark:border-gray-800/60
          transition-all duration-300 ease-in-out
          ${isNoteListCollapsed ? 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0' : 'w-full lg:w-80 xl:w-96'}
        `}>
          {NoteListPanel}
        </div>

        {/* Collapsed note list indicator bar (desktop only) */}
        {isNoteListCollapsed && (
          <div className="hidden lg:flex flex-col items-center py-3 bg-surface/40 border-r border-gray-100 dark:border-gray-800/60 w-10 shrink-0">
            <Tooltip label="Mostrar lista de notas" placement="right">
              <button
                onClick={() => setIsNoteListCollapsed(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </Tooltip>
          </div>
        )}

        {/* Editor - hidden on mobile when not editing */}
        {isEditing && currentNote && (
          <div className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
            {NoteEditorPanel}
          </div>
        )}

        {/* Empty state when no note selected on desktop */}
        {!isEditing && (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Selecciona una nota</h3>
            <p className="text-sm text-text-secondary max-w-xs">
              Elige una nota de la lista para editarla, o crea una nueva para comenzar.
            </p>
            <button
              onClick={() => handleCreateNote()}
              className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Crear nota
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {showMobileList && (
        <button
          onClick={() => handleCreateNote()}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all z-30 flex items-center justify-center"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <QuickCaptureModal />
    </div>
  );
}
