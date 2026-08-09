import { describe, expect, it } from "vitest";
import type { Room } from "./rooms";
import { getRoomByIdOrThrow } from "./room-lookup";

describe("getRoomByIdOrThrow", () => {
  it("loads a room through an injected asynchronous repository", async () => {
    const persistedRoom: Room = {
      id: "room-123",
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: "2026-07-13T12:00:00.000Z",
    };
    let requestedRoomId: string | undefined;

    await expect(
      getRoomByIdOrThrow("room-123", async (id) => {
        requestedRoomId = id;
        return persistedRoom;
      }),
    ).resolves.toEqual(persistedRoom);

    expect(requestedRoomId).toBe("room-123");
  });

  it("throws 404 when the injected repository cannot find the room", async () => {
    await expect(getRoomByIdOrThrow("missing-room", async () => undefined)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "Room not found",
    });
  });
});
