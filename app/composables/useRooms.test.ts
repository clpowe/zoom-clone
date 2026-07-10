import { describe, expect, it } from "vitest";
import { loadRooms } from "./useRooms";

describe("loadRooms", () => {
  it("loads rooms from the API response", async () => {
    const rooms = await loadRooms({
      fetchRooms: async () => ({
        data: [
          {
            id: "room-2",
            title: "Second Room",
            cloudflareMeetingId: "cf-meeting-2",
            createdAt: "2026-07-09T12:00:00.000Z",
          },
          {
            id: "room-1",
            title: "First Room",
            cloudflareMeetingId: "cf-meeting-1",
            createdAt: "2026-07-09T11:00:00.000Z",
          },
        ],
      }),
    });

    expect(rooms).toEqual([
      {
        id: "room-2",
        title: "Second Room",
        cloudflareMeetingId: "cf-meeting-2",
        createdAt: "2026-07-09T12:00:00.000Z",
      },
      {
        id: "room-1",
        title: "First Room",
        cloudflareMeetingId: "cf-meeting-1",
        createdAt: "2026-07-09T11:00:00.000Z",
      },
    ]);
  });
});
