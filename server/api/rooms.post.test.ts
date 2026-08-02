import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/rooms", () => {
  it("persists the created room in the bound D1 database", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;
    let runCalls = 0;

    const statement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async run() {
        runCalls++;
      },
    };

    const database = {
      prepare(sql: string) {
        preparedSql = sql;
        return statement;
      },
    } as unknown as D1Database;

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
    vi.stubGlobal("readBody", async () => ({
      title: "Team Standup",
    }));
    vi.stubGlobal("getRealtimeKitConfig", () => ({
      cloudflareAccountId: "account-123",
      realtimekitAppId: "app-123",
      cloudflareApiToken: "token-123",
    }));
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
    }));
    vi.stubGlobal("readCloudflareJsonResponse", async () => ({
      data: {
        id: "cf-meeting-123",
      },
    }));

    const { default: handler } = await import("./rooms.post");

    const response = await (
      handler as unknown as (event: {
        context: {
          cloudflare: {
            env: { ROOMS_D1: D1Database };
          };
        };
      }) => Promise<unknown>
    )({
      context: {
        cloudflare: {
          env: { ROOMS_D1: database },
        },
      },
    });

    expect(preparedSql).toBe(
      "INSERT INTO rooms (id, title, cloudflare_meeting_id, created_at) VALUES (?, ?, ?, ?)",
    );
    expect(boundValues).toEqual([
      expect.any(String),
      "Team Standup",
      "cf-meeting-123",
      expect.any(String),
    ]);
    expect(runCalls).toBe(1);
    expect(response).toMatchObject({
      data: {
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
      },
    });
  });

  it("deletes the Cloudflare meeting when D1 persistence fails", async () => {
    const persistenceError = new Error("D1 insert failed");
    const requests: Array<{
      url: string;
      method: string | undefined;
    }> = [];

    const statement = {
      bind() {
        return statement;
      },
      async run() {
        throw persistenceError;
      },
    };

    const database = {
      prepare() {
        return statement;
      },
    } as unknown as D1Database;

    vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
    vi.stubGlobal("readBody", async () => ({
      title: "Team Standup",
    }));
    vi.stubGlobal("getRealtimeKitConfig", () => ({
      cloudflareAccountId: "account-123",
      realtimekitAppId: "app-123",
      cloudflareApiToken: "token-123",
    }));
    vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
      requests.push({
        url: input.toString(),
        method: init?.method,
      });

      return {
        ok: true,
        status: init?.method === "DELETE" ? 204 : 200,
      };
    });
    vi.stubGlobal("readCloudflareJsonResponse", async () => ({
      data: {
        id: "cf-meeting-123",
      },
    }));

    const { default: handler } = await import("./rooms.post");

    await expect(
      (
        handler as unknown as (event: {
          context: {
            cloudflare: {
              env: { ROOMS_D1: D1Database };
            };
          };
        }) => Promise<unknown>
      )({
        context: {
          cloudflare: {
            env: { ROOMS_D1: database },
          },
        },
      }),
    ).rejects.toBe(persistenceError);

    expect(requests).toEqual([
      {
        url: "https://api.cloudflare.com/client/v4/accounts/account-123/realtime/kit/app-123/meetings",
        method: "POST",
      },
      {
        url: "https://api.cloudflare.com/client/v4/accounts/account-123/realtime/kit/app-123/meetings/cf-meeting-123",
        method: "DELETE",
      },
    ]);
  });
});
