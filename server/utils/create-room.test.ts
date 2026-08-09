import { describe, expect, it } from "vitest";
import { createRoomForMeeting } from "./create-room";
import { deleteRoomForMeeting, type Room } from "./rooms";

describe("createRoomForMeeting", () => {
  it("trims the title before creating and persisting the room", async () => {
    let cloudflareTitle = "";
    let persistedTitle = "";

    const room = await createRoomForMeeting({
      title: "  Family Call  ",
      createCloudflareMeeting: async ({ title }) => {
        cloudflareTitle = title;
        return { id: "cf-meeting-456" };
      },
      persistRoom: async (input) => {
        persistedTitle = input.title;

        return {
          id: "room-456",
          title: input.title,
          cloudflareMeetingId: input.cloudflareMeetingId,
          createdAt: "2026-07-13T12:00:00.000Z",
        };
      },
    });

    expect(cloudflareTitle).toBe("Family Call");
    expect(persistedTitle).toBe("Family Call");
    expect(room.title).toBe("Family Call");
  });

  it("rejects empty room titles", async () => {
    await expect(
      createRoomForMeeting({
        title: "   ",
        createCloudflareMeeting: async () => ({
          id: "cf-meeting-789",
        }),
        persistRoom: async () => {
          throw new Error("Persistence should not be called");
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Room title is required",
    });
  });

  it("persists the Cloudflare meeting through the injected room repository", async () => {
    let persistedInput:
      | {
          title: string;
          cloudflareMeetingId: string;
        }
      | undefined;

    const persistedRoom: Room = {
      id: "room-123",
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: "2026-07-13T12:00:00.000Z",
    };

    const room = await createRoomForMeeting({
      title: "Team Standup",
      createCloudflareMeeting: async () => ({
        id: "cf-meeting-123",
      }),
      persistRoom: async (input) => {
        persistedInput = input;
        return persistedRoom;
      },
    });

    expect(persistedInput).toEqual({
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
    });
    expect(room).toEqual(persistedRoom);
  });

  it("attempts to delete the Cloudflare meeting when room persistence fails", async () => {
    const persistenceError = new Error("D1 insert failed");
    let deletedMeetingId: string | undefined;

    await expect(
      createRoomForMeeting({
        title: "Team Standup",
        createCloudflareMeeting: async () => ({
          id: "cf-meeting-123",
        }),
        persistRoom: async () => {
          throw persistenceError;
        },
        deleteCloudflareMeeting: async (meetingId) => {
          deletedMeetingId = meetingId;
        },
      }),
    ).rejects.toBe(persistenceError);

    expect(deletedMeetingId).toBe("cf-meeting-123");
  });

  it("preserves the persistence error when Cloudflare cleanup also fails", async () => {
    const persistenceError = new Error("D1 insert failed");

    await expect(
      createRoomForMeeting({
        title: "Team Standup",
        createCloudflareMeeting: async () => ({
          id: "cf-meeting-123",
        }),
        persistRoom: async () => {
          throw persistenceError;
        },
        deleteCloudflareMeeting: async () => {
          throw new Error("Cloudflare cleanup failed");
        },
      }),
    ).rejects.toBe(persistenceError);
  });

  it("deletes the Cloudflare meeting before deleting the persisted room", async () => {
    const calls: string[] = [];

    await deleteRoomForMeeting({
      room: {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
      deleteCloudflareMeeting: async (meetingId) => {
        calls.push(`cloudflare:${meetingId}`);
      },
      deletePersistedRoom: async (roomId) => {
        calls.push(`d1:${roomId}`);
      },
    });

    expect(calls).toEqual(["cloudflare:cf-meeting-123", "d1:room-123"]);
  });
});
