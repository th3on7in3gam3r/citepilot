import { beforeEach } from "vitest";

process.env.CITEPILOT_TEST_DB_PATH = ":memory:";

beforeEach(() => {
  const globalDb = globalThis as { citepilotDb?: { close: () => void } };
  if (globalDb.citepilotDb) {
    globalDb.citepilotDb.close();
    delete globalDb.citepilotDb;
  }
});
