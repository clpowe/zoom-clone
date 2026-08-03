import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("rooms D1 migration", () => {
  it("creates the persistent rooms table", () => {
    const migrationFile = new URL("../../migrations/0001_create_rooms.sql", import.meta.url);

    expect(existsSync(migrationFile)).toBe(true);

    const normalizedSql = readFileSync(migrationFile, "utf8").replace(/\s+/g, " ").trim();

    expect(normalizedSql).toBe(
      "CREATE TABLE rooms ( id TEXT PRIMARY KEY, title TEXT NOT NULL, cloudflare_meeting_id TEXT NOT NULL, created_at TEXT NOT NULL );",
    );
  });
});
