export const WEEKDAY_LABELS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export const MONTH_LABELS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function addDays(date: Date, count: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + count);
    return d;
}

// getDay(): 0 = Domingo … 6 = Sábado. Convertimos a índice con inicio el lunes.
export function getMondayOfWeek(reference: Date): Date {
    const start = startOfDay(reference);
    const mondayOffset = (start.getDay() + 6) % 7;
    return addDays(start, -mondayOffset);
}

export function getWeekDays(reference: Date): Date[] {
    const monday = getMondayOfWeek(reference);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

// 6 semanas (42 celdas) alineadas de lunes a domingo.
export function getMonthGrid(reference: Date): Date[] {
    const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const monday = getMondayOfWeek(firstOfMonth);
    return Array.from({ length: 42 }, (_, index) => addDays(monday, index));
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

// Trabaja sobre getDay() (0 = domingo) y devuelve la etiqueta del calendario.
export function getWeekdayLabel(date: Date): string {
    return WEEKDAY_LABELS_SHORT[(date.getDay() + 6) % 7];
}

// Título de semana tipo "26 ago – 1 sep" o "2 – 8 ago" (es-ES).
export function formatWeekTitle(reference: Date): string {
    const days = getWeekDays(reference);
    const start = days[0];
    const end = days[6];
    const startMonth = start.toLocaleDateString('es-ES', { month: 'short' });
    const endMonth = end.toLocaleDateString('es-ES', { month: 'short' });

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} – ${end.getDate()} ${endMonth}`;
    }
    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
}

export function formatMonthTitle(reference: Date): string {
    return `${MONTH_LABELS[reference.getMonth()]} ${reference.getFullYear()}`;
}

export function formatFullDayLabel(date: Date): string {
    const base = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return base.charAt(0).toUpperCase() + base.slice(1);
}