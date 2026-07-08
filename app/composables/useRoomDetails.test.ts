import { describe, expect, it } from "vitest";
import { loadRoomDetails } from "./useRoomDetails";

describe("loadRoomDetails", () => {
  it("load a room by local room id", async () => {
    let requestedRoomId = "";

    const room = await loadRoomDetails({
      roomId: "local-room-123",
      fetchRoom: async ({ roomId }) => {
        requestedRoomId = roomId;

        return {
          data: {
            id: roomId,
            title: "Team Standup",
            cloudflareMeetingId: "cf-meeting-123",
            createdAt: "2026-07-06T10:00:00.000Z",
          },
        };
      },
    });

    expect(requestedRoomId).toBe("local-room-123");
    expect(room.title).toBe("Team Standup");
  });

  it("rejects missing room ids before calling the API", async () => {
    let apiCalled = false;

    await expect(
      loadRoomDetails({
        roomId: "",
        fetchRoom: async () => {
          apiCalled = true;
          throw new Error("should not be called");
        },
      }),
    ).rejects.toThrow("Room ID is required");

    expect(apiCalled).toBe(false);
  });
});
