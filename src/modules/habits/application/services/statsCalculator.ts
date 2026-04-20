import { getLocalISODate } from '../../../../utils/dateUtils';

export function getYearMonth(dateStr: string): string {
    return dateStr.substring(0, 7); // YYYY-MM
}

export function getYearWeek(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function getPreviousYearWeek(yearWeek: string): string {
    const [yearStr, weekStr] = yearWeek.split("-W");
    let year = parseInt(yearStr);
    let week = parseInt(weekStr);
    
    if (week > 1) {
        return `${year}-W${String(week - 1).padStart(2, '0')}`;
    }
    return getYearWeek(`${year - 1}-12-31`);
}

export function getPreviousDay(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return getLocalISODate(d);
}
