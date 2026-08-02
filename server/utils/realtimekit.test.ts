import { describe, expect, it } from "vitest";
import * as realtimekit from "./realtimekit";

describe("deleteCloudflareMeeting", () => {
  it("sends an authenticated DELETE request for the meeting", async () => {
    let requestedUrl: string | undefined;
    let requestedInit: RequestInit | undefined;

    const deleteCloudflareMeeting = (
      realtimekit as typeof realtimekit & {
        deleteCloudflareMeeting?: (input: {
          meetingId: string;
          config: {
            cloudflareAccountId: string;
            realtimekitAppId: string;
            cloudflareApiToken: string;
          };
          fetch: typeof fetch;
        }) => Promise<void>;
      }
    ).deleteCloudflareMeeting;

    expect(deleteCloudflareMeeting).toBeTypeOf("function");

    await deleteCloudflareMeeting!({
      meetingId: "cf-meeting-123",
      config: {
        cloudflareAccountId: "account-123",
        realtimekitAppId: "app-123",
        cloudflareApiToken: "secret-token",
      },
      fetch: async (input, init) => {
        requestedUrl = input instanceof Request ? input.url : String(input);
        requestedInit = init;

        return new Response(null, { status: 204 });
      },
    });

    expect(requestedUrl).toBe(
      "https://api.cloudflare.com/client/v4/accounts/account-123/realtime/kit/app-123/meetings/cf-meeting-123",
    );
    expect(requestedInit).toMatchObject({
      method: "DELETE",
      headers: {
        Authorization: "Bearer secret-token",
      },
    });
  });

  it("reports the Cloudflare status when meeting deletion fails", async () => {
    await expect(
      realtimekit.deleteCloudflareMeeting({
        meetingId: "cf-meeting-123",
        config: {
          cloudflareAccountId: "account-123",
          realtimekitAppId: "app-123",
          cloudflareApiToken: "secret-token",
        },
        fetch: async () => new Response(null, { status: 404 }),
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
