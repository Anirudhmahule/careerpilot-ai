export class Logger {
  info(message: string, context?: unknown) {
    console.log(`[INFO] ${message}`, context ? context : "");
  }

  warn(message: string, context?: unknown) {
    console.warn(`[WARN] ${message}`, context ? context : "");
  }

  error(message: string, context?: unknown) {
    console.error(`[ERROR] ${message}`, context ? context : "");
  }
}

export const logger = new Logger();
