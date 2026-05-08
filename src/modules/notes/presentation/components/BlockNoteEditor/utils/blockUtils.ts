import type { PartialBlock } from '@blocknote/core';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Convert any content value to a valid BlockNote InlineContent array */
function sanitizeContent(content: unknown): Array<Record<string, unknown>> {
  // String → wrap as text inline
  if (typeof content === 'string') {
    return content ? [{ type: 'text', text: content }] : [{ type: 'text', text: '' }];
  }

  // Array → validate each item
  if (Array.isArray(content)) {
    const sanitized = content
      .filter((item): item is Record<string, unknown> => isPlainObject(item))
      .map((item) => {
        const type = typeof item.type === 'string' ? item.type : 'text';
        const text = typeof item.text === 'string' ? item.text : '';
        const href = typeof item.href === 'string' ? item.href : undefined;

        const clean: Record<string, unknown> = { type, text };
        if (href !== undefined) clean.href = href;

        // Preserve styles if valid
        if (isPlainObject(item.styles)) {
          clean.styles = item.styles;
        }

        return clean;
      });

    return sanitized.length > 0 ? sanitized : [{ type: 'text', text: '' }];
  }

  // Default fallback
  return [{ type: 'text', text: '' }];
}

/** Sanitize a single block into a valid PartialBlock */
function sanitizeBlock(block: Record<string, unknown>): PartialBlock | null {
  if (!isPlainObject(block)) return null;

  const rawType = typeof block.type === 'string' ? block.type : 'paragraph';

  // BlockNote block types that are safe to pass as PartialBlock
  const knownTypes = new Set([
    'paragraph',
    'heading',
    'bulletListItem',
    'numberedListItem',
    'checkListItem',
    'codeBlock',
    'table',
    'image',
    'video',
    'audio',
    'file',
    'embed',
    'alert',
  ]);

  // Normalize: strip legacy prefix (e.g. "heading1" → "heading" with level prop)
  let type = rawType;
  let extraProps: Record<string, unknown> = {};

  if (rawType.startsWith('heading') && rawType !== 'heading') {
    type = 'heading';
    const levelMatch = rawType.match(/heading(\d)/);
    if (levelMatch) {
      extraProps.level = parseInt(levelMatch[1], 10);
    }
  }

  if (!knownTypes.has(type)) {
    type = 'paragraph';
  }

  const content = sanitizeContent(block.content);

  const props: Record<string, unknown> = isPlainObject(block.props)
    ? { ...block.props }
    : {};

  // Merge extracted props (e.g. heading level)
  Object.assign(props, extraProps);

  const sanitized = {
    type,
    content: content as PartialBlock['content'],
    props,
  } as PartialBlock;

  // Sanitize children recursively
  if (Array.isArray(block.children)) {
    const validChildren = block.children
      .filter((child): child is Record<string, unknown> => isPlainObject(child))
      .map(sanitizeBlock)
      .filter((child): child is PartialBlock => child !== null);

    if (validChildren.length > 0) {
      sanitized.children = validChildren;
    }
  }

  return sanitized;
}

/** Recursively strip undefined values so Firestore doesn't choke */
function removeUndefinedValues<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedValues(item)) as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        result[key] = removeUndefinedValues(val);
      }
    }
    return result as T;
  }
  return value;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Convert raw stored blocks → valid BlockNote PartialBlock[] */
export function toPartialBlocks(
  bnoteContent: Record<string, unknown>[] | undefined
): PartialBlock[] {
  if (!bnoteContent || !Array.isArray(bnoteContent) || bnoteContent.length === 0) {
    return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] as PartialBlock[];
  }

  const sanitized = bnoteContent
    .filter((block): block is Record<string, unknown> => isPlainObject(block))
    .map(sanitizeBlock)
    .filter((block): block is PartialBlock => block !== null);

  return sanitized.length > 0
    ? sanitized
    : ([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] as PartialBlock[]);
}

/** Convert BlockNote PartialBlock[] → clean object for Firestore */
export function fromPartialBlocks(blocks: PartialBlock[]): Record<string, unknown>[] {
  const cleaned = removeUndefinedValues(blocks);
  return cleaned as unknown as Record<string, unknown>[];
}
