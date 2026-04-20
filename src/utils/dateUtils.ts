/**
 * Obtiene la fecha local en formato YYYY-MM-DD sin problemas de zonas horarias UTC.
 * @param date Opcional, objeto Date a formatear. Si no se provee, usa la fecha actual.
 */
export const getLocalISODate = (date: Date = new Date()): string => {
    // Para evitar que a las 6pm (UTC) salte de día en zonas -06:00, usamos métodos locales
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Retorna la diferencia en días desde hoy (local) hasta una fecha dada YYYY-MM-DD
 * Si retorna negativo, la fecha ya pasó. Si es 0 es hoy.
 */
export const getDaysFromToday = (targetDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día local
    
    // Parse targetDateStr (YYYY-MM-DD) como hora local para comparar precisamente
    const [y, m, d] = targetDateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};
