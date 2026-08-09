import { afterEach, describe, expect, it, vi } from "vitest";
import { getRoomByIdOrThrow } from "../../utils/room-lookup";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/rooms/:id", () => {
  it("reads the requested room from the bound D1 database", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;

    const statement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async first() {
        return {
          id: "room-123",
          title: "Team Standup",
          cloudflare_meeting_id: "cf-meeting-123",
          created_at: "2026-07-13T12:00:00.000Z",
        };
      },
    };

    const database = {
      prepare(sql: string) {
        preparedSql = sql;
        return statement;
      },
    } as unknown as D1Database;

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
    vi.stubGlobal("getRouterParam", () => "room-123");
    vi.stubGlobal("getRoomByIdOrThrow", getRoomByIdOrThrow);

    const { default: handler } = await import("./[id].get");

    const response = (
      handler as unknown as (event: {
        context: {
          cloudflare: {
            env: { zoom_clone_rooms: D1Database };
          };
        };
      }) => Promise<unknown>
    )({
      context: {
        cloudflare: {
          env: { zoom_clone_rooms: database },
        },
      },
    });

    await expect(response).resolves.toEqual({
      data: {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    });

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe(
      "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms WHERE id = ?",
    );
    expect(boundValues).toEqual(["room-123"]);
  });
});
