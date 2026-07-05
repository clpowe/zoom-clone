import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, findRoomById, listRooms, resetRoomsForTest } from "./rooms";

describe("rooms", () => {
  beforeEach(() => {
    resetRoomsForTest();
  });

  it("creates a room with id, title, cloudflareMeetingId, and createdAt", () => {
    const room = createRoom({
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
    });

    expect(room).toEqual({
      id: expect.any(String),
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: expect.any(String),
    });
  });

  it("trims room titles before storing them", () => {
    const room = createRoom({
      title: "  Family Call  ",
      cloudflareMeetingId: "cf-meeting-456",
    });

    expect(room.title).toBe("Family Call");
  });

  it("can find a room by local room id", () => {
    const room = createRoom({
      title: "Planning",
      cloudflareMeetingId: "cf-meeting-789",
    });

    expect(findRoomById(room.id)).toEqual(room);
  });

  it("lists rooms newest first", () => {
    const first = createRoom({
      title: "First",
      cloudflareMeetingId: "cf-meeting-1",
    });
    const second = createRoom({
      title: "Second",
      cloudflareMeetingId: "cf-meeting-2",
    });

    expect(listRooms()).toEqual([second, first]);
  });
});
