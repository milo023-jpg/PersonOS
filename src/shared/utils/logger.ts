const isDev = import.meta.env.DEV;

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const logger = {
  info(message: string, context?: unknown) {
    if (!isDev) return;
    console.info(message, context);
  },

  warn(message: string, context?: unknown) {
    if (!isDev) return;
    console.warn(message, context);
  },

  error(message: string, error?: unknown, context?: unknown) {
    if (isDev) {
      console.error(message, error, context);
      return;
    }

    console.error(message, error ? toErrorMessage(error) : undefined);
  },
};
