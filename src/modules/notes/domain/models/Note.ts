export type NoteBlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'checklist'
  | 'code'
  | 'quote'
  | 'divider'
  | 'callout';

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  content: string;
  metadata?: {
    language?: string;
    checked?: boolean;
    icon?: string;
    color?: string;
  };
  order: number;
}

export type NoteType = 'text' | 'checklist' | 'template';

export interface Note {
  id: string;
  userId: string;
  title: string;
  blocks: NoteBlock[];
  blocknoteContent?: Record<string, unknown>[];
  plainText?: string;
  contextIds: string[];
  primaryContextId: string;
  noteListId?: string;
  tags: string[];
  type: NoteType;
  isFavorite: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: number;
  relatedNoteIds: string[];
  backlinkNoteIds: string[];
  derivedTaskIds: string[];
  version: number;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  lastViewedAt?: number;
}

export function createEmptyNote(userId: string): Omit<Note, 'id'> {
  const now = Date.now();
  return {
    userId,
    title: '',
    blocks: [{ id: crypto.randomUUID(), type: 'paragraph', content: '', order: 0 }],
    blocknoteContent: [{ type: 'paragraph', content: '' }] as Record<string, unknown>[],
    plainText: '',
    contextIds: [],
    primaryContextId: '',
    noteListId: undefined,
    tags: [],
    type: 'text',
    isFavorite: false,
    isPinned: false,
    isDeleted: false,
    relatedNoteIds: [],
    backlinkNoteIds: [],
    derivedTaskIds: [],
    version: 1,
    wordCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function extractPlainText(blocks: NoteBlock[]): string {
  return blocks
    .map(b => b.content.replace(/<[^>]*>/g, ''))
    .join('\n')
    .trim();
}

export function countWords(blocks: NoteBlock[]): number {
  const text = extractPlainText(blocks);
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

export function extractTextFromBlockNoteContent(content: Record<string, unknown>[]): string {
  const parts: string[] = [];

  function walkBlocks(blocks: Record<string, unknown>[]) {
    for (const block of blocks) {
      const contentField = block['content'];
      if (typeof contentField === 'string') {
        parts.push(contentField);
      } else if (Array.isArray(contentField)) {
        for (const item of contentField as Record<string, unknown>[]) {
          if (typeof item === 'string') {
            parts.push(item);
          } else if (item && typeof item === 'object' && 'text' in item) {
            parts.push(String(item['text']));
          } else if (item && typeof item === 'object' && 'type' in item && item['type'] === 'link') {
            const linkContent = item['content'];
            if (typeof linkContent === 'string') {
              parts.push(linkContent);
            } else if (Array.isArray(linkContent)) {
              for (const c of linkContent as Record<string, unknown>[]) {
                if (c && typeof c === 'object' && 'text' in c) {
                  parts.push(String(c['text']));
                }
              }
            }
          }
        }
      }
      const children = block['children'];
      if (Array.isArray(children)) {
        walkBlocks(children as Record<string, unknown>[]);
      }
    }
  }

  walkBlocks(content);
  return parts.join('\n').trim();
}

export function countWordsFromBlockNoteContent(content: Record<string, unknown>[]): number {
  const text = extractTextFromBlockNoteContent(content);
  return text.split(/\s+/).filter(w => w.length > 0).length;
}