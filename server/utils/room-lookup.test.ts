import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, resetRoomsForTest } from "./rooms";
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
});
