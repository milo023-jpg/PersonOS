import { useState, useRef, useEffect, useMemo } from 'react';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import type { Context } from '../../../../contexts/domain/models/types';

interface ContextSelectorChipsProps {
  selectedContextIds: string[];
  onChange: (contextIds: string[]) => void;
  onCreateContext?: (name: string) => Promise<string | undefined>;
}

export function ContextSelectorChips({ selectedContextIds, onChange, onCreateContext }: ContextSelectorChipsProps) {
  const { userId } = useAuthStore();
  const { contexts, fetchContexts, createContext } = useContextsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId && contexts.length === 0) {
      fetchContexts(userId);
    }
  }, [userId, fetchContexts, contexts.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const activeContexts = useMemo(() => contexts.filter(c => !c.isArchived), [contexts]);

  const selectedContexts = useMemo(() => {
    const map = new Map<string, Context>();
    activeContexts.forEach(c => { if (c.id) map.set(c.id, c); });
    return selectedContextIds.map(id => map.get(id)).filter(Boolean) as Context[];
  }, [activeContexts, selectedContextIds]);

  const availableContexts = useMemo(() => {
    return activeContexts.filter(c => !selectedContextIds.includes(c.id || ''));
  }, [activeContexts, selectedContextIds]);

  const filteredAvailable = useMemo(() => {
    if (!query.trim()) return availableContexts;
    const lower = query.toLowerCase();
    return availableContexts.filter(c => c.name.toLowerCase().includes(lower));
  }, [availableContexts, query]);

  const canCreateNew = query.trim() && !activeContexts.some(c => c.name.toLowerCase() === query.trim().toLowerCase());

  const handleAdd = (contextId: string) => {
    onChange([...selectedContextIds, contextId]);
    setQuery('');
  };

  const handleRemove = (contextId: string) => {
    onChange(selectedContextIds.filter(id => id !== contextId));
  };

  const handleCreateNew = async () => {
    const name = query.trim();
    if (!name || !userId) return;

    let newId: string | undefined;
    if (onCreateContext) {
      newId = await onCreateContext(name);
    } else {
      const newContextData: Omit<Context, 'id' | 'userId'> = {
        name,
        type: 'other',
        color: '#6366f1',
        icon: '🏷️',
        isArchived: false,
        createdAt: Date.now(),
      };
      newId = await createContext(userId, newContextData);
    }

    if (newId) {
      handleAdd(newId);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedContexts.map(ctx => (
          <span
            key={ctx.id}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
            style={{
              backgroundColor: `${ctx.color}15`,
              borderColor: `${ctx.color}30`,
              color: ctx.color,
            }}
          >
            <span>{ctx.icon}</span>
            <span>{ctx.name}</span>
            <button
              onClick={() => handleRemove(ctx.id || '')}
              className="ml-0.5 hover:opacity-70 transition-opacity"
              title="Remover contexto"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface border border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {selectedContexts.length === 0 ? 'Agregar contexto' : 'Agregar'}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-surface border border-gray-200/10 dark:border-gray-700/50 rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canCreateNew) {
                  e.preventDefault();
                  handleCreateNew();
                }
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setQuery('');
                }
              }}
              placeholder="Buscar o crear contexto..."
              className="w-full px-3 py-1.5 bg-background rounded-lg text-sm text-text-primary placeholder:text-text-secondary/40 outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredAvailable.length === 0 && !canCreateNew && (
              <div className="px-3 py-2 text-xs text-text-secondary/60 text-center">
                No hay contextos disponibles
              </div>
            )}
            {filteredAvailable.map(ctx => (
              <button
                key={ctx.id}
                onClick={() => {
                  handleAdd(ctx.id || '');
                  if (selectedContextIds.length + 1 >= 1) {
                    // keep open if they want to add more
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              >
                <span style={{ color: ctx.color }}>{ctx.icon}</span>
                <span>{ctx.name}</span>
              </button>
            ))}
            {canCreateNew && (
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors border-t border-gray-100 dark:border-gray-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Crear "{query.trim()}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
