import { useState, useMemo, useEffect, useRef } from 'react';
import { useNotesStore } from '../../../application/store/notesStore';
import { useAuthStore } from '../../../../auth/application/store/authStore';
import { useContextsStore } from '../../../../contexts/application/store/contextsStore';
import { useNoteListsStore } from '../../../application/store/noteListsStore';
import type { NotesActiveFilter } from '../../../application/store/notesStore';
import { Tooltip } from '../Tooltip/Tooltip';


interface NotesSidebarProps {
  onFilterChange: (filter: NotesActiveFilter, contextId?: string | null, listId?: string | null) => void;
  activeFilter: NotesActiveFilter;
  selectedContextId: string | null;
  selectedListId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Icons = {
  Star: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Folder: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#6b7280',
];

function NavItem({
  icon,
  label,
  count,
  isActive,
  onClick,
  isCollapsed,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 group ${
        isActive
          ? 'bg-primary text-white shadow-sm shadow-primary/20'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
    >
      <span className={isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}>
        {icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {typeof count === 'number' && (
            <span className={`text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-text-secondary/60'}`}>
              {count}
            </span>
          )}
        </>
      )}
    </button>
  );
}

/* Inline creator for contexts/lists */
function InlineCreator({
  placeholder,
  onCreate,
  onCancel,
  showColorPicker,
}: {
  placeholder: string;
  onCreate: (name: string, color: string) => void;
  onCancel: () => void;
  showColorPicker?: boolean;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[6]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), color);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="px-2 py-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 bg-background rounded-lg text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:ring-2 ring-primary/20"
      />
      {showColorPicker && (
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-3 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Crear
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-text-secondary hover:text-text-primary rounded-md text-xs font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function NotesSidebar({
  onFilterChange,
  activeFilter,
  selectedContextId,
  selectedListId,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}: NotesSidebarProps) {
  const { userId } = useAuthStore();
  const { notes } = useNotesStore();
  const { contexts, fetchContexts, createContext } = useContextsStore();
  const { lists: noteLists, fetchLists: fetchNoteLists, createList: createNoteList } = useNoteListsStore();

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetchContexts(userId),
      fetchNoteLists(userId),
    ]);
  }, [userId, fetchContexts, fetchNoteLists]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true,
    recent: true,
    contexts: true,
    lists: true,
  });
  const [isCreatingContext, setIsCreatingContext] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const counts = useMemo(() => {
    const activeNotes = notes.filter(n => !n.isDeleted);

    const contextCounts = new Map<string, number>();
    const listCounts = new Map<string, number>();

    for (const note of activeNotes) {
      for (const ctxId of note.contextIds) {
        contextCounts.set(ctxId, (contextCounts.get(ctxId) || 0) + 1);
      }
      if (note.noteListId) {
        listCounts.set(note.noteListId, (listCounts.get(note.noteListId) || 0) + 1);
      }
    }

    const deletedNotes = notes.filter(n => n.isDeleted);

    return {
      all: activeNotes.length,
      favorites: activeNotes.filter(n => n.isFavorite).length,
      recent: activeNotes.length,
      deleted: deletedNotes.length,
      byContext: (ctxId: string) => contextCounts.get(ctxId) || 0,
      byList: (listId: string) => listCounts.get(listId) || 0,
    };
  }, [notes]);

  const activeContexts = useMemo(() => contexts.filter(c => !c.isArchived), [contexts]);

  const handleCreateContext = async (name: string, color: string) => {
    if (!userId) return;
    await createContext(userId, {
      name,
      type: 'other',
      color,
      icon: '🏷️',
      isArchived: false,
      createdAt: Date.now(),
    });
    setIsCreatingContext(false);
  };

  const handleCreateList = async (name: string, color: string) => {
    if (!userId) return;
    await createNoteList(userId, { name, color, order: noteLists.length + 1 });
    setIsCreatingList(false);
  };

  const handleFilterClick = (filter: NotesActiveFilter, contextId?: string | null, listId?: string | null) => {
    onFilterChange(filter, contextId, listId);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
      />

      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-gray-100 dark:border-gray-800/60
          transition-all duration-300
          bg-surface dark:bg-[#0f1117] md:bg-surface/40 md:dark:bg-surface/40 md:h-full
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:relative top-16 md:top-0 bottom-0 left-0 z-50 md:z-auto
          md:translate-x-0 w-72 max-w-[85vw] md:w-auto md:max-w-none
          ${isCollapsed ? 'md:w-14' : 'md:w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
          {!isCollapsed && (
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">
              Workspace
            </span>
          )}
          <div className="flex items-center gap-1">
            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Cerrar filtros"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Collapse toggle (desktop) */}
            <Tooltip label={isCollapsed ? 'Expandir filtros' : 'Colapsar filtros'} placement="right">
              <button
                onClick={onToggleCollapse}
                className="hidden md:block p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
              </button>
            </Tooltip>
          </div>
        </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        <NavItem
          icon={<Icons.Document />}
          label="Todas las notas"
          count={counts.all}
          isActive={activeFilter === 'all'}
          onClick={() => handleFilterClick('all', null, null)}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={<Icons.Star />}
          label="Favoritas"
          count={counts.favorites}
          isActive={activeFilter === 'favorites'}
          onClick={() => handleFilterClick('favorites', null, null)}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={<Icons.Clock />}
          label="Recientes"
          isActive={activeFilter === 'recent'}
          onClick={() => handleFilterClick('recent', null, null)}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          }
          label="Eliminadas"
          count={counts.deleted}
          isActive={activeFilter === 'deleted'}
          onClick={() => handleFilterClick('deleted', null, null)}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="pt-3 pb-1" />}

        {/* Contexts */}
        {!isCollapsed && (
          <div className="pt-1">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <button
                onClick={() => toggleSection('contexts')}
                className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
              >
                <span>Contextos</span>
                <span className={`transition-transform duration-150 ${expandedSections.contexts ? 'rotate-90' : ''}`}>
                  <Icons.ChevronRight />
                </span>
              </button>
              <button
                onClick={() => { setIsCreatingContext(true); setExpandedSections(prev => ({ ...prev, contexts: true })); }}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title="Nuevo contexto"
              >
                <Icons.Plus />
              </button>
            </div>
            {expandedSections.contexts && (
              <div className="mt-1 space-y-0.5">
                {isCreatingContext && (
                  <InlineCreator
                    placeholder="Nombre del contexto..."
                    onCreate={handleCreateContext}
                    onCancel={() => setIsCreatingContext(false)}
                    showColorPicker
                  />
                )}
                {activeContexts.map(context => (
                  <NavItem
                    key={context.id}
                    icon={<span style={{ color: context.color }}>{context.icon}</span>}
                    label={context.name}
                    count={counts.byContext(context.id || '')}
                    isActive={activeFilter === 'context' && selectedContextId === context.id}
                    onClick={() => handleFilterClick('context', context.id || null, null)}
                    isCollapsed={isCollapsed}
                  />
                ))}
                {activeContexts.length === 0 && !isCreatingContext && (
                  <p className="px-2.5 py-1 text-xs text-text-secondary/60">Sin contextos</p>
                )}
              </div>
            )}
          </div>
        )}

        {isCollapsed && activeContexts.map(context => (
          <NavItem
            key={context.id}
            icon={<span style={{ color: context.color }}>{context.icon}</span>}
            label={context.name}
            isActive={activeFilter === 'context' && selectedContextId === context.id}
            onClick={() => handleFilterClick('context', context.id || null, null)}
            isCollapsed={isCollapsed}
          />
        ))}

        {!isCollapsed && <div className="pt-3 pb-1" />}

        {/* Lists */}
        {!isCollapsed && (
          <div className="pt-1">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <button
                onClick={() => toggleSection('lists')}
                className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
              >
                <span>Listas</span>
                <span className={`transition-transform duration-150 ${expandedSections.lists ? 'rotate-90' : ''}`}>
                  <Icons.ChevronRight />
                </span>
              </button>
              <button
                onClick={() => { setIsCreatingList(true); setExpandedSections(prev => ({ ...prev, lists: true })); }}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title="Nueva lista"
              >
                <Icons.Plus />
              </button>
            </div>
            {expandedSections.lists && (
              <div className="mt-1 space-y-0.5">
                {isCreatingList && (
                  <InlineCreator
                    placeholder="Nombre de la lista..."
                    onCreate={handleCreateList}
                    onCancel={() => setIsCreatingList(false)}
                    showColorPicker
                  />
                )}
                {noteLists.filter(l => !l.isTrash).map(list => (
                  <NavItem
                    key={list.id}
                    icon={<span style={{ color: list.color }}><Icons.Folder /></span>}
                    label={list.name}
                    count={counts.byList(list.id)}
                    isActive={activeFilter === 'list' && selectedListId === list.id}
                    onClick={() => handleFilterClick('list', null, list.id)}
                    isCollapsed={isCollapsed}
                  />
                ))}
                {noteLists.filter(l => !l.isTrash).length === 0 && !isCreatingList && (
                  <p className="px-2.5 py-1 text-xs text-text-secondary/60">Sin listas</p>
                )}
              </div>
            )}
          </div>
        )}

        {isCollapsed && noteLists.filter(l => !l.isTrash).map(list => (
          <NavItem
            key={list.id}
            icon={<span style={{ color: list.color }}><Icons.Folder /></span>}
            label={list.name}
            isActive={activeFilter === 'list' && selectedListId === list.id}
            onClick={() => handleFilterClick('list', null, list.id)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </aside>
    </>
  );
}
