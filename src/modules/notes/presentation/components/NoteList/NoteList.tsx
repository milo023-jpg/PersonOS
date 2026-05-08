import type { Note } from '../../../domain/models/Note';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
}

export function EmptyState({ title, description, icon = '📝', action, tip }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16 px-8">
      <div className="text-5xl">{icon}</div>
      <h3 className="text-xl font-bold text-text-primary">{title}</h3>
      <p className="text-text-secondary max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
      {tip && (
        <p className="text-xs text-text-secondary mt-4">
          💡 {tip}
        </p>
      )}
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  contextNames?: Map<string, string>;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function NoteItem({ note, contextNames, onClick, onToggleFavorite, onDelete }: NoteItemProps) {
  const formatDate = (timestamp: number) => {
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
  };

  const preview = note.plainText?.slice(0, 120) || 'Sin contenido';
  const contextLabels = note.contextIds
    .map(id => contextNames?.get(id) || 'Sin contexto')
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="group bg-surface rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                📌
              </span>
            )}
            <h3 className="font-semibold text-text-primary truncate">
              {note.title || 'Sin título'}
            </h3>
          </div>
          
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">
            {preview}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {contextLabels.map(label => (
              <span
                key={label}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-text-secondary px-2 py-0.5 rounded-full"
              >
                {label}
              </span>
            ))}
            {note.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
            <span className="text-xs text-text-secondary">
              {formatDate(note.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              note.isFavorite ? 'text-yellow-500' : 'text-text-secondary'
            }`}
            title={note.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {note.isFavorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

interface NoteListProps {
  notes: Note[];
  contextNames?: Map<string, string>;
  onNoteClick: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onCreateNote: () => void;
}

export function NoteList({ notes, contextNames, onNoteClick, onToggleFavorite, onDelete, onCreateNote }: NoteListProps) {
  const pinnedNotes = notes.filter(n => n.isPinned);
  const regularNotes = notes.filter(n => !n.isPinned);

  if (notes.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes notas"
        description="Comienza capturando una idea, una reunión o cualquier pensamiento."
        icon="📝"
        action={{ label: 'Crear primera nota', onClick: onCreateNote }}
        tip="Usa Ctrl+Shift+N para captura rápida desde cualquier pantalla"
      />
    );
  }

  return (
    <div className="space-y-6">
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3 px-1">
            Fijadas ({pinnedNotes.length})
          </h3>
          <div className="grid gap-3">
            {pinnedNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                contextNames={contextNames}
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
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3 px-1">
              Recientes
            </h3>
          )}
          <div className="grid gap-3">
            {regularNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                contextNames={contextNames}
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