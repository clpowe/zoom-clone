import { afterEach, describe, expect, it, vi } from "vitest";
import { getRoomByIdOrThrow } from "../../../utils/room-lookup";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/meetings/:id/participants", () => {
  it("creates a participant for the requested D1 room", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;
    let requestedUrl: string | undefined;

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

    const participantResponse = {
      data: {
        token: "participant-token",
      },
    };

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
    vi.stubGlobal("getRouterParam", () => "room-123");
    vi.stubGlobal("getRoomByIdOrThrow", getRoomByIdOrThrow);
    vi.stubGlobal("getRealtimeKitConfig", () => ({
      cloudflareAccountId: "account-123",
      realtimekitAppId: "app-123",
      realtimekitPresetName: "group-call",
      cloudflareApiToken: "token-123",
    }));
    vi.stubGlobal("readBody", async () => ({
      name: "Taylor",
    }));
    vi.stubGlobal("fetch", async (input: string | URL) => {
      requestedUrl = input.toString();

      return {
        ok: true,
        status: 200,
      };
    });
    vi.stubGlobal("readCloudflareJsonResponse", async () => participantResponse);

    const { default: handler } = await import("./participants.post");

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

    await expect(response).resolves.toEqual(participantResponse);

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe(
      "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms WHERE id = ?",
    );
    expect(boundValues).toEqual(["room-123"]);
    expect(requestedUrl).toBe(
      "https://api.cloudflare.com/client/v4/accounts/account-123/realtime/kit/app-123/meetings/cf-meeting-123/participants",
    );
  });
});
