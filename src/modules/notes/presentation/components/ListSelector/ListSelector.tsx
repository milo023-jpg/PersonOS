import { useState, useRef, useEffect, useMemo } from 'react';
import type { NoteList } from '../../../domain/models/NoteList';

interface ListSelectorProps {
  lists: NoteList[];
  selectedListId?: string;
  onChange: (listId: string | undefined) => void;
  placeholder?: string;
}

export function ListSelector({ lists, selectedListId, onChange, placeholder = 'Seleccionar lista...' }: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface rounded-xl text-sm text-text-primary hover:bg-surface/80 border border-gray-100 dark:border-gray-800 transition-all"
      >
        {selectedList ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedList.color }}
            />
            <span className="flex-1 text-left truncate">{selectedList.name}</span>
          </>
        ) : (
          <span className="text-text-secondary/60">{placeholder}</span>
        )}
        <svg className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-surface border border-gray-200/10 dark:border-gray-700/50 rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto py-1">
            <button
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                !selectedListId ? 'text-primary bg-primary/5' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
              <span>Sin lista</span>
            </button>
            {lists.filter(l => !l.isTrash).map(list => (
              <button
                key={list.id}
                onClick={() => {
                  onChange(list.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  selectedListId === list.id ? 'text-primary bg-primary/5' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left truncate">{list.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
