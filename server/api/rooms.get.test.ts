import { existsSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

describe("GET /api/rooms", () => {
  it("returns persisted rooms", async () => {
    const routeFile = new URL("./rooms.get.ts", import.meta.url);

    expect(existsSync(routeFile)).toBe(true);

    const database = {
      prepare() {
        return {
          all: async () => ({
            results: [
              {
                id: "room-123",
                title: "Team Standup",
                cloudflare_meeting_id: "cf-meeting-123",
                created_at: "2026-07-13T12:00:00.000Z",
              },
            ],
          }),
        };
      },
    } as unknown as D1Database;

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);

    const routeModulePath = "./rooms.get.ts";
    const { default: handler } = await import(routeModulePath);

    const response = await (
      handler as (event: {
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

    expect(response).toEqual({
      data: [
        {
          id: "room-123",
          title: "Team Standup",
          cloudflareMeetingId: "cf-meeting-123",
          createdAt: "2026-07-13T12:00:00.000Z",
        },
      ],
    });
  });
});
