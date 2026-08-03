import { existsSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DELETE /api/rooms/:id", () => {
  it("deletes the Cloudflare meeting before deleting the D1 room", async () => {
    const routeFile = new URL("./rooms/[id].delete.ts", import.meta.url);

    expect(existsSync(routeFile)).toBe(true);

    const calls: string[] = [];

    const database = {
      prepare() {
        return {
          bind(roomId: string) {
            return {
              async first() {
                calls.push(`find:${roomId}`);

                return {
                  id: roomId,
                  title: "Team Standup",
                  cloudflare_meeting_id: "cf-meeting-123",
                  created_at: "2026-07-13T12:00:00.000Z",
                };
              },
              async run() {
                calls.push(`d1:${roomId}`);
              },
            };
          },
        };
      },
    } as unknown as D1Database;

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
    vi.stubGlobal("getRouterParam", () => "room-123");
    vi.stubGlobal("getRealtimeKitConfig", () => ({
      cloudflareAccountId: "account-123",
      realtimekitAppId: "app-123",
      cloudflareApiToken: "token-123",
    }));
    vi.stubGlobal("fetch", async (input: string | URL) => {
      calls.push(`cloudflare:${input.toString()}`);
      return new Response(null, { status: 204 });
    });

    const routeModulePath = "./rooms/[id].delete.ts";
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

    expect(calls).toEqual([
      "find:room-123",
      "cloudflare:https://api.cloudflare.com/client/v4/accounts/account-123/realtime/kit/app-123/meetings/cf-meeting-123",
      "d1:room-123",
    ]);
    expect(response).toEqual({
      data: null,
    });
  });
});
