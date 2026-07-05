import { beforeEach, describe, expect, it } from "vitest";
import { findRoomById, resetRoomsForTest } from "./rooms";
import { createRoomForMeeting } from "./create-room";

describe("createRoomForMeeting", () => {
  beforeEach(() => {
    resetRoomsForTest();
  });

  it("creates a local room from a title and Cloudflare meeting response", async () => {
    const room = await createRoomForMeeting({
      title: "Team Standup",
      createCloudflareMeeting: async () => ({
        id: "cf-meeting-123",
      }),
    });

    expect(room).toEqual({
      id: expect.any(String),
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: expect.any(String),
    });
    expect(findRoomById(room.id)).toEqual(room);
  });

  it("trims the title before creating the Cloudflare meeting and local room", async () => {
    let cloudflareTitle = "";

    const room = await createRoomForMeeting({
      title: "  Family Call  ",
      createCloudflareMeeting: async ({ title }) => {
        cloudflareTitle = title;
        return { id: "cf-meeting-456" };
      },
    });

    expect(cloudflareTitle).toBe("Family Call");
    expect(room.title).toBe("Family Call");
  });

  it("rejects empty room titles", async () => {
    await expect(
      createRoomForMeeting({
        title: "   ",
        createCloudflareMeeting: async () => ({
          id: "cf-meeting-789",
        }),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Room title is required",
    });
  });
});
