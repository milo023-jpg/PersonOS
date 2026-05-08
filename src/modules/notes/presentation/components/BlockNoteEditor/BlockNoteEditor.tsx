import { useEffect, useCallback, useRef, memo } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { PartialBlock } from '@blocknote/core';
import { appTheme } from './theme';

interface BlockNoteEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  initialContent?: PartialBlock[];
  onContentChange: (blocks: Record<string, unknown>[]) => void;
  editable?: boolean;
}

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  );
}

export const BlockNoteEditor = memo(function BlockNoteEditor({
  title,
  onTitleChange,
  initialContent,
  onContentChange,
  editable = true,
}: BlockNoteEditorProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  // NOTA: no usar useMemo aquí. useCreateBlockNote es un hook que internamente
  // usa useMemo, y anidarlo causa "Do not call Hooks inside useMemo" en HMR.
  // El componente padre (NotesPage) usa key={currentNote.id} así que este
  // componente se desmonta/monta completo al cambiar de nota.
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
  });

  // Sync editor content changes
  useEffect(() => {
    if (!editor) return;
    const unsubscribe = editor.onChange(() => {
      onContentChange(editor.document as unknown as Record<string, unknown>[]);
    });
    return () => unsubscribe();
  }, [editor, onContentChange]);

  // Debounced save to parent/store
  const debouncedTitleChange = useDebouncedCallback(onTitleChange, 600);

  // Handle title input - UNCONTROLLED for performance
  const handleTitleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    
    // Auto-resize
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    
    // Mark as typing to prevent external updates
    isTypingRef.current = true;
    
    // Debounced save only
    debouncedTitleChange(target.value);
  }, [debouncedTitleChange]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        editor?.focus();
      }
    },
    [editor]
  );

  // Click on empty space focuses the editor
  const handleSurfaceClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.bn-editor') || target.closest('textarea')) {
      return;
    }
    editor?.focus();
  }, [editor]);

  // Sync external title changes ONLY when not typing
  useEffect(() => {
    const el = titleRef.current;
    if (!el || isTypingRef.current) return;
    
    // Only update if value actually changed externally
    if (el.value !== title) {
      el.value = title;
      // Trigger resize
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
    
    // Reset typing flag after a delay
    const t = setTimeout(() => { isTypingRef.current = false; }, 100);
    return () => clearTimeout(t);
  }, [title]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={surfaceRef}
      className="relative min-h-fit cursor-text pl-2"
      onClick={handleSurfaceClick}
    >
      {/* Title - UNCONTROLLED textarea for zero-lag typing */}
      <textarea
        ref={titleRef}
        defaultValue={title}
        onInput={handleTitleInput}
        onKeyDown={handleTitleKeyDown}
        placeholder="Título de la nota"
        rows={1}
        className="w-full bg-transparent outline-none resize-none overflow-hidden
                   text-4xl md:text-[2.75rem] font-bold tracking-tight
                   text-text-primary placeholder:text-text-secondary/25
                   mb-8 md:mb-10 leading-[1.1]"
        style={{ height: 'auto' }}
      />

      {/* BlockNote Editor - isolated, won't rerender on title changes */}
      <div className="min-h-[50vh]">
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme={appTheme}
        />
      </div>
    </div>
  );
});
