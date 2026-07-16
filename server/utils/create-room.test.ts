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

    const createPersistentRoomForMeeting = createRoomForMeeting as unknown as (input: {
      title: string;
      createCloudflareMeeting: (input: { title: string }) => Promise<{ id: string }>;
      persistRoom: (input: { title: string; cloudflareMeetingId: string }) => Promise<Room>;
    }) => Promise<Room>;

    const room = await createPersistentRoomForMeeting({
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

    const createPersistentRoomForMeeting = createRoomForMeeting as unknown as (input: {
      title: string;
      createCloudflareMeeting: (input: { title: string }) => Promise<{ id: string }>;
      persistRoom: (input: { title: string; cloudflareMeetingId: string }) => Promise<Room>;
      deleteCloudflareMeeting: (meetingId: string) => Promise<void>;
    }) => Promise<Room>;

    await expect(
      createPersistentRoomForMeeting({
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

    const createPersistentRoomForMeeting = createRoomForMeeting as unknown as (input: {
      title: string;
      createCloudflareMeeting: (input: { title: string }) => Promise<{ id: string }>;
      persistRoom: (input: { title: string; cloudflareMeetingId: string }) => Promise<Room>;
      deleteCloudflareMeeting: (meetingId: string) => Promise<void>;
    }) => Promise<Room>;

    await expect(
      createPersistentRoomForMeeting({
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
});
