import { describe, expect, it } from "vitest";
import { buildRoomInviteUrl, copyRoomInviteUrl } from "./useRoomInvite";

describe("buildRoomInviteUrl", () => {
  it("builds a room invite URL from an origin and local room id", () => {
    expect(
      buildRoomInviteUrl({
        origin: "https://example.com",
        roomId: "local-room-123",
      }),
    ).toBe("https://example.com/room/local-room-123");
  });

  it("encodes room ids before adding them to the URL", () => {
    expect(
      buildRoomInviteUrl({
        origin: "https://example.com",
        roomId: "room with spaces",
      }),
    ).toBe("https://example.com/room/room%20with%20spaces");
  });

  it("rejects missing room ids", () => {
    expect(() =>
      buildRoomInviteUrl({
        origin: "https://example.com",
        roomId: "   ",
      }),
    ).toThrow("Room ID is required");
  });

  it("rejects missing origins", () => {
    expect(() =>
      buildRoomInviteUrl({
        origin: "   ",
        roomId: "local-room-123",
      }),
    ).toThrow("Origin is required");
  });
});

describe("copyRoomInviteUrl", () => {
  it("copies the invite URL", async () => {
    let copiedText = "";

    await copyRoomInviteUrl({
      inviteUrl: "https://example.com/room/local-room-123",
      writeText: async (text) => {
        copiedText = text;
      },
    });

    expect(copiedText).toBe("https://example.com/room/local-room-123");
  });

  it("rejects empty invite URLs before calling clipboard", async () => {
    let clipboardCalled = false;

    await expect(
      copyRoomInviteUrl({
        inviteUrl: "   ",
        writeText: async () => {
          clipboardCalled = true;
        },
      }),
    ).rejects.toThrow("Invite URL is required");

    expect(clipboardCalled).toBe(false);
  });
});
