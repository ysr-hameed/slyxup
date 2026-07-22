export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogContext = Record<string, unknown>;

function getLevel(): LogLevel {
  return LogLevel.DEBUG;
}

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, msg: string, ctx?: LogContext) {
  if (level < getLevel()) return;
  const entry = { ts: timestamp(), level: LogLevel[level], msg, ...ctx };
  const output = JSON.stringify(entry);
  if (level === LogLevel.ERROR) console.error(output);
  else console.log(output);
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log(LogLevel.DEBUG, msg, ctx),
  info: (msg: string, ctx?: LogContext) => log(LogLevel.INFO, msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log(LogLevel.WARN, msg, ctx),
  error: (msg: string, ctx?: LogContext) => log(LogLevel.ERROR, msg, ctx),
};

export function createErrorResponse(err: unknown, env?: string): { success: false; error: string } {
  const isDev = env !== "production";

  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack, name: err.name });
    if (isDev) {
      return { success: false, error: `${err.name}: ${err.message}` };
    }
    return { success: false, error: "Something went wrong" };
  }

  logger.error("Unknown error", { error: String(err) });
  if (isDev) {
    return { success: false, error: String(err) };
  }
  return { success: false, error: "Something went wrong" };
}

export function createHonoErrorHandler(env?: string) {
  return (err: Error, c: any) => {
    const res = createErrorResponse(err, env ?? c?.env?.ENVIRONMENT);
    logger.error(err.message, {
      path: c?.req?.path,
      method: c?.req?.method,
      stack: err.stack,
    });
    return c.json(res, 500);
  };
}
