export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let minLevel: LogLevel = import.meta.env.DEV ? "debug" : "warn";

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function format(scope: string, message: string): string {
  return `[Thistle&Crown:${scope}] ${message}`;
}

export const logger = {
  debug(scope: string, message: string, data?: unknown): void {
    if (!shouldLog("debug")) return;
    if (data !== undefined) {
      console.debug(format(scope, message), data);
    } else {
      console.debug(format(scope, message));
    }
  },
  info(scope: string, message: string, data?: unknown): void {
    if (!shouldLog("info")) return;
    if (data !== undefined) {
      console.info(format(scope, message), data);
    } else {
      console.info(format(scope, message));
    }
  },
  warn(scope: string, message: string, data?: unknown): void {
    if (!shouldLog("warn")) return;
    if (data !== undefined) {
      console.warn(format(scope, message), data);
    } else {
      console.warn(format(scope, message));
    }
  },
  error(scope: string, message: string, data?: unknown): void {
    if (!shouldLog("error")) return;
    if (data !== undefined) {
      console.error(format(scope, message), data);
    } else {
      console.error(format(scope, message));
    }
  },
};
