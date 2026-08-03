import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, resetRoomsForTest, type Room } from "./rooms";
import { getRoomByIdOrThrow } from "./room-lookup";

describe("getRoomByIdOrThrow", () => {
  beforeEach(() => {
    resetRoomsForTest();
  });

  it("returns a room by local room id", () => {
    const room = createRoom({
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
    });

    expect(getRoomByIdOrThrow(room.id)).toEqual(room);
  });

  it("throws 404 when the local room id does not exist", () => {
    expect(() => getRoomByIdOrThrow("missing-room")).toThrow("Room not found");
  });

  it("loads a room through an injected asynchronous repository", async () => {
    const persistedRoom: Room = {
      id: "room-123",
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: "2026-07-13T12:00:00.000Z",
    };
    let requestedRoomId: string | undefined;

    const getPersistedRoomByIdOrThrow = getRoomByIdOrThrow as unknown as (
      id: string,
      findRoom: (id: string) => Promise<Room | undefined>,
    ) => Promise<Room>;

    await expect(
      Promise.resolve().then(() =>
        getPersistedRoomByIdOrThrow("room-123", async (id) => {
          requestedRoomId = id;
          return persistedRoom;
        }),
      ),
    ).resolves.toEqual(persistedRoom);

    expect(requestedRoomId).toBe("room-123");
  });
});
