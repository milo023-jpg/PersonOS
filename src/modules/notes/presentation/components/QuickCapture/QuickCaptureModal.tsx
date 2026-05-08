import { useState, useEffect, useRef, useMemo } from 'react';
import { useNotesStore } from '../../../application/store/notesStore';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useNoteListsStore } from '../../../application/store/noteListsStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import { ListSelector } from '../ListSelector/ListSelector';
import { ContextSelectorChips } from '../ContextSelector/ContextSelectorChips';
import type { NoteList } from '../../../domain/models/NoteList';

function getInheritedContexts(noteListId: string | undefined, noteLists: NoteList[]): string[] {
  if (!noteListId) return [];
  const list = noteLists.find(l => l.id === noteListId);
  return list?.defaultContextId ? [list.defaultContextId] : [];
}

export function QuickCaptureModal() {
  const { isQuickCaptureOpen, closeQuickCapture, createNote } = useNotesStore();
  const { userId } = useAuthStore();
  const { lists: noteLists } = useNoteListsStore();
  const { contexts } = useContextsStore();

  const [title, setTitle] = useState('');
  const [selectedNoteListId, setSelectedNoteListId] = useState<string | undefined>(undefined);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setTitle('');
      setSelectedNoteListId(undefined);
      setSelectedContextIds([]);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isQuickCaptureOpen]);

  const inheritedContexts = useMemo(() => {
    return getInheritedContexts(selectedNoteListId, noteLists);
  }, [selectedNoteListId, noteLists]);

  const mergedContextIds = useMemo(() => {
    return [...new Set([...selectedContextIds, ...inheritedContexts])];
  }, [selectedContextIds, inheritedContexts]);

  const handleCreate = async () => {
    if (!title.trim() || !userId) return;

    try {
      await createNote(userId, title.trim(), {
        noteListId: selectedNoteListId,
        contextIds: mergedContextIds,
      });
      setTitle('');
      setSelectedNoteListId(undefined);
      setSelectedContextIds([]);
      closeQuickCapture();
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      closeQuickCapture();
    }
  };

  if (!isQuickCaptureOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeQuickCapture}
      />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Captura Rápida</h2>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una nota rápida..."
            className="w-full px-4 py-3 bg-background rounded-xl text-text-primary placeholder:text-text-secondary outline-none focus:ring-2 ring-primary/30 transition-all text-lg"
          />

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-secondary/70 w-16 shrink-0">Lista</span>
              <div className="flex-1">
                <ListSelector
                  lists={noteLists}
                  selectedListId={selectedNoteListId}
                  onChange={(listId) => {
                    setSelectedNoteListId(listId);
                  }}
                  placeholder="Sin lista"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-text-secondary/70 w-16 shrink-0 pt-1">Contextos</span>
              <div className="flex-1">
                <ContextSelectorChips
                  selectedContextIds={selectedContextIds}
                  onChange={setSelectedContextIds}
                />
                {inheritedContexts.length > 0 && (
                  <p className="text-[11px] text-text-secondary/50 mt-1">
                    Heredado: {inheritedContexts.map(id => contexts.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={closeQuickCapture}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear nota
          </button>
        </div>
        <div className="px-6 py-2 bg-primary/5 text-xs text-text-secondary flex items-center justify-between">
          <span>
            Presiona <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">Enter</kbd> para crear, <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">Esc</kbd> para cerrar
          </span>
          {mergedContextIds.length > 0 && (
            <span className="text-[11px] text-text-secondary/60">
              {mergedContextIds.length} contexto{mergedContextIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
