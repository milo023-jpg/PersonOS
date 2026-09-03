// Utilidades para distinguir errores de red y mostrar mensajes amigables.

const OFFLINE_CODES = new Set(['unavailable', 'network-request-failed', 'UNAVAILABLE']);

export function getErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return null;
    }
    return String((error as { code: unknown }).code);
}

export function isOfflineError(error: unknown): boolean {
    const code = getErrorCode(error);
    if (code && OFFLINE_CODES.has(code)) {
        return true;
    }
    const message = error instanceof Error ? error.message : String(error);
    return /fetch|network|offline|internet|connection/i.test(message);
}

export function friendlyFirestoreError(error: unknown, fallback = 'No se pudieron cargar los datos.'): Error {
    if (isOfflineError(error)) {
        return new Error('Sin conexión: revisa tu internet e inténtalo de nuevo. Los datos guardados siguen disponibles.');
    }
    if (error instanceof Error) {
        return error;
    }
    return new Error(fallback);
}