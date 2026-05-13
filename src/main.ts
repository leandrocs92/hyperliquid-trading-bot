import { HyperliquidBot } from "./bot.js";
import { loadConfig } from "./config.js";
import { logger, setLogLevel } from "./logger.js";

const cfg = loadConfig();
setLogLevel(cfg.LOG_LEVEL);

const bot = new HyperliquidBot(cfg);

async function shutdown(signal: string) {
  logger.warn("shutdown", { signal });
  await bot.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await bot.start();
} catch (e) {
  logger.fatal("bot_failed_to_start");
  process.exit(1);
}
