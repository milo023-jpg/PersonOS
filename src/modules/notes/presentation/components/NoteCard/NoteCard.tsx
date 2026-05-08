import type { Note } from '../../../domain/models/Note';
import type { Context } from '../../../../contexts/domain/models/types';
import type { NoteList } from '../../../domain/models/NoteList';

interface NoteCardProps {
  note: Note;
  contextsMap: Map<string, Context>;
  listsMap: Map<string, NoteList>;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NoteCard({ note, contextsMap, listsMap, onClick, onToggleFavorite, onDelete }: NoteCardProps) {
  const preview = note.plainText?.slice(0, 140) || 'Sin contenido';
  const noteContexts = note.contextIds
    .map(id => contextsMap.get(id))
    .filter(Boolean) as Context[];
  const noteList = note.noteListId ? listsMap.get(note.noteListId) : undefined;

  return (
    <div
      onClick={onClick}
      className="group relative bg-surface rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/15"
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate mb-1.5">
            {note.title || 'Sin título'}
          </h3>

          <p className="text-sm text-text-secondary line-clamp-2 mb-3 leading-relaxed">
            {preview}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {noteContexts.map(ctx => (
              <span
                key={ctx.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                style={{
                  backgroundColor: `${ctx.color}12`,
                  borderColor: `${ctx.color}25`,
                  color: ctx.color,
                }}
              >
                <span>{ctx.icon}</span>
                <span>{ctx.name}</span>
              </span>
            ))}

            {noteList && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-text-secondary">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: noteList.color }}
                />
                {noteList.name}
              </span>
            )}

            <span className="text-[11px] text-text-secondary/70 ml-auto">
              {formatDate(note.updatedAt)}
            </span>
          </div>
        </div>

        {/* Actions - visible on hover */}
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              note.isFavorite ? 'text-yellow-500' : 'text-text-secondary'
            }`}
            title={note.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {note.isFavorite ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface NoteCardListProps {
  notes: Note[];
  contextsMap: Map<string, Context>;
  listsMap: Map<string, NoteList>;
  onNoteClick: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onCreateNote: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
}

export function NoteCardList({
  notes,
  contextsMap,
  listsMap,
  onNoteClick,
  onToggleFavorite,
  onDelete,
  onCreateNote,
  emptyTitle = 'Aún no hay notas aquí',
  emptyDescription = 'Crea una nota para comenzar a organizar tu conocimiento.',
  emptyIcon = '📝',
}: NoteCardListProps) {
  const pinnedNotes: Note[] = [];
  const regularNotes: Note[] = [];
  for (const note of notes) {
    if (note.isPinned) pinnedNotes.push(note);
    else regularNotes.push(note);
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 text-center py-16 px-8">
        <div className="text-5xl opacity-80">{emptyIcon}</div>
        <h3 className="text-xl font-bold text-text-primary">{emptyTitle}</h3>
        <p className="text-text-secondary max-w-sm">{emptyDescription}</p>
        <button
          onClick={onCreateNote}
          className="mt-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          Crear nota
        </button>
        <p className="text-xs text-text-secondary/60 mt-2">
          Las notas se organizan automáticamente según su contexto y lista
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            Fijadas ({pinnedNotes.length})
          </h3>
          <div className="grid gap-3">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                contextsMap={contextsMap}
                listsMap={listsMap}
                onClick={() => onNoteClick(note)}
                onToggleFavorite={() => onToggleFavorite(note.id)}
                onDelete={() => onDelete(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {regularNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
              Notas
            </h3>
          )}
          <div className="grid gap-3">
            {regularNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                contextsMap={contextsMap}
                listsMap={listsMap}
                onClick={() => onNoteClick(note)}
                onToggleFavorite={() => onToggleFavorite(note.id)}
                onDelete={() => onDelete(note.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
