type FirestoreTimestampLike = {
  toMillis?: () => number;
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

const UTC_MIDNIGHT_HOURS = 0;

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseInputDateToTimestamp(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

export function toTaskDateTimestamp(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }

  if (typeof value === 'string') {
    if (!value.trim()) return undefined;
    if (isDateOnlyString(value)) return parseInputDateToTimestamp(value);
    if (/^\d+$/.test(value)) {
      const numericTimestamp = Number(value);
      return Number.isFinite(numericTimestamp) ? numericTimestamp : undefined;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof value === 'object') {
    const timestampLike = value as FirestoreTimestampLike;

    if (typeof timestampLike.toMillis === 'function') {
      const fromMillis = timestampLike.toMillis();
      return Number.isFinite(fromMillis) ? fromMillis : undefined;
    }

    if (typeof timestampLike.toDate === 'function') {
      const fromDate = timestampLike.toDate().getTime();
      return Number.isFinite(fromDate) ? fromDate : undefined;
    }

    if (typeof timestampLike.seconds === 'number') {
      const nanos = typeof timestampLike.nanoseconds === 'number' ? timestampLike.nanoseconds : 0;
      const fromSeconds = timestampLike.seconds * 1000 + Math.floor(nanos / 1_000_000);
      return Number.isFinite(fromSeconds) ? fromSeconds : undefined;
    }
  }

  return undefined;
}

export function normalizeTaskDateTimestamp(value: unknown): number | undefined {
  const timestamp = toTaskDateTimestamp(value);
  if (timestamp === undefined) return undefined;

  const date = new Date(timestamp);
  const isUtcMidnight =
    date.getUTCHours() === UTC_MIDNIGHT_HOURS &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (!isUtcMidnight) return timestamp;

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    12,
    0,
    0,
    0,
  ).getTime();
}

export function getDayRange(referenceDate: Date = new Date()) {
  const startOfDay = new Date(referenceDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(referenceDate);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: startOfDay.getTime(),
    end: endOfDay.getTime(),
  };
}

function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDueToday(dueDate: unknown, referenceDate: Date = new Date()): boolean {
  const normalizedDueDate = normalizeTaskDateTimestamp(dueDate);
  if (normalizedDueDate === undefined) return false;
  return toDateKey(normalizedDueDate) === toDateKey(referenceDate.getTime());
}

export function isDueBeforeOrToday(dueDate: unknown, referenceDate: Date = new Date()): boolean {
  const normalizedDueDate = normalizeTaskDateTimestamp(dueDate);
  if (normalizedDueDate === undefined) return false;
  const { end } = getDayRange(referenceDate);
  return normalizedDueDate <= end;
}

export function formatDateForInput(value: unknown): string {
  const normalizedTimestamp = normalizeTaskDateTimestamp(value);
  if (normalizedTimestamp === undefined) return '';

  const date = new Date(normalizedTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
