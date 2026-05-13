import "dotenv/config";

const LEVEL_RANK: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: 1000,
};

type LevelName = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

function normalizeLevel(level: string): keyof typeof LEVEL_RANK {
  const k = level.trim().toLowerCase();
  return k in LEVEL_RANK ? k : "info";
}

function shouldLog(minRank: number, messageRank: number): boolean {
  return messageRank >= minRank;
}

function serializeValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatContext(ctx: Record<string, unknown>): string {
  const pairs = Object.entries(ctx).map(([k, v]) => `${k}=${serializeValue(v)}`);
  return pairs.length ? ` ${pairs.join(" ")}` : "";
}

let minRank = LEVEL_RANK[normalizeLevel(process.env.LOG_LEVEL ?? "info")];

/** Sync level after validated config load (overrides env). */
export function setLogLevel(level: string): void {
  minRank = LEVEL_RANK[normalizeLevel(level)];
}

function emit(
  level: LevelName,
  first: string | Record<string, unknown>,
  second?: string | Record<string, unknown>,
): void {
  const rank = LEVEL_RANK[level];
  if (!shouldLog(minRank, rank)) {
    return;
  }

  let lineMsg: string;
  let ctx: Record<string, unknown> | undefined;

  if (typeof first === "string") {
    lineMsg = first;
    if (
      second !== undefined &&
      typeof second === "object" &&
      second !== null &&
      !Array.isArray(second)
    ) {
      ctx = second as Record<string, unknown>;
    }
  } else {
    ctx = first as Record<string, unknown>;
    lineMsg =
      typeof second === "string"
        ? second
        : formatContext(first as Record<string, unknown>).trim() || "(object)";
  }

  const ctxStr = ctx ? formatContext(ctx) : "";
  const ts = new Date().toISOString();
  console.error(`${ts} [${level.toUpperCase()}] ${lineMsg}${ctxStr}`);
}

type LogFn = {
  (message: string, meta?: Record<string, unknown>): void;
  (ctx: Record<string, unknown>, message: string): void;
};

function makeLevel(level: LevelName): LogFn {
  return ((first: string | Record<string, unknown>, second?: string | Record<string, unknown>) => {
    emit(level, first, second);
  }) as LogFn;
}

export interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
}

export const logger: Logger = {
  trace: makeLevel("trace"),
  debug: makeLevel("debug"),
  info: makeLevel("info"),
  warn: makeLevel("warn"),
  error: makeLevel("error"),
  fatal: makeLevel("fatal"),
};
