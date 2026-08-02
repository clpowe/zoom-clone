import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, findRoomById, listRooms, resetRoomsForTest, type Room } from "./rooms";
import * as roomRepository from "./rooms";

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

  it("persists a created room in D1", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;
    let runCalls = 0;

    const statement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async run() {
        runCalls++;
        return { success: true };
      },
    };

    const database = {
      prepare(sql: string) {
        preparedSql = sql;
        return statement;
      },
    } as unknown as D1Database;

    const createPersistentRoom = createRoom as unknown as (
      input: Parameters<typeof createRoom>[0],
      database: D1Database,
    ) => Promise<Awaited<ReturnType<typeof createRoom>>>;

    const room = await createPersistentRoom(
      {
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
      },
      database,
    );

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe(
      "INSERT INTO rooms (id, title, cloudflare_meeting_id, created_at) VALUES (?, ?, ?, ?)",
    );
    expect(boundValues).toEqual([room.id, "Team Standup", "cf-meeting-123", room.createdAt]);
    expect(runCalls).toBe(1);
  });

  it("finds a room by id in D1", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;

    const statement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async first() {
        return {
          id: "room-123",
          title: "Team Standup",
          cloudflare_meeting_id: "cf-meeting-123",
          created_at: "2026-07-13T12:00:00.000Z",
        };
      },
    };

    const database = {
      prepare(sql: string) {
        preparedSql = sql;
        return statement;
      },
    } as unknown as D1Database;

    const findPersistentRoom = findRoomById as unknown as (
      id: string,
      database: D1Database,
    ) => Promise<Room | undefined>;

    const room = await findPersistentRoom("room-123", database);

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe(
      "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms WHERE id = ?",
    );
    expect(boundValues).toEqual(["room-123"]);
    expect(room).toEqual({
      id: "room-123",
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: "2026-07-13T12:00:00.000Z",
    });
  });

  it("lists D1 rooms newest first", async () => {
    let preparedSql: string | undefined;

    const database = {
      prepare(sql: string) {
        preparedSql = sql;

        return {
          async all() {
            return {
              success: true,
              results: [
                {
                  id: "room-new",
                  title: "Newest Room",
                  cloudflare_meeting_id: "cf-meeting-new",
                  created_at: "2026-07-13T13:00:00.000Z",
                },
                {
                  id: "room-old",
                  title: "Older Room",
                  cloudflare_meeting_id: "cf-meeting-old",
                  created_at: "2026-07-13T12:00:00.000Z",
                },
              ],
            };
          },
        };
      },
    } as unknown as D1Database;

    const listPersistentRooms = listRooms as unknown as (database: D1Database) => Promise<Room[]>;

    const result = await listPersistentRooms(database);

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe(
      "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms ORDER BY created_at DESC",
    );
    expect(result).toEqual([
      {
        id: "room-new",
        title: "Newest Room",
        cloudflareMeetingId: "cf-meeting-new",
        createdAt: "2026-07-13T13:00:00.000Z",
      },
      {
        id: "room-old",
        title: "Older Room",
        cloudflareMeetingId: "cf-meeting-old",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ]);
  });

  it("deletes a room from D1", async () => {
    let preparedSql: string | undefined;
    let boundValues: unknown[] | undefined;
    let runCalls = 0;

    const statement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async run() {
        runCalls++;
        return { success: true };
      },
    };

    const database = {
      prepare(sql: string) {
        preparedSql = sql;
        return statement;
      },
    } as unknown as D1Database;

    const deletePersistentRoom = (
      roomRepository as typeof roomRepository & {
        deleteRoom?: (id: string, database: D1Database) => Promise<void>;
      }
    ).deleteRoom;

    expect(deletePersistentRoom).toBeTypeOf("function");

    await deletePersistentRoom!("room-123", database);

    expect(preparedSql?.replace(/\s+/g, " ").trim()).toBe("DELETE FROM rooms WHERE id = ?");
    expect(boundValues).toEqual(["room-123"]);
    expect(runCalls).toBe(1);
  });

  it("deletes the persisted room when Cloudflare reports the meeting is already deleted", async () => {
    let deletedRoomId: string | undefined;

    await expect(
      roomRepository.deleteRoomForMeeting({
        room: {
          id: "room-123",
          title: "Team Standup",
          cloudflareMeetingId: "cf-meeting-123",
          createdAt: "2026-07-13T12:00:00.000Z",
        },
        deleteCloudflareMeeting: async () => {
          throw Object.assign(new Error("Meeting not found"), {
            statusCode: 404,
          });
        },
        deletePersistedRoom: async (roomId) => {
          deletedRoomId = roomId;
        },
      }),
    ).resolves.toBeUndefined();

    expect(deletedRoomId).toBe("room-123");
  });

  it("finds the persisted room before coordinating its deletion", async () => {
    const calls: string[] = [];

    const deleteRoomById = (
      roomRepository as typeof roomRepository & {
        deleteRoomById?: (input: {
          roomId: string;
          findRoom: (roomId: string) => Promise<Room | undefined>;
          deleteCloudflareMeeting: (meetingId: string) => Promise<void>;
          deletePersistedRoom: (roomId: string) => Promise<void>;
        }) => Promise<void>;
      }
    ).deleteRoomById;

    expect(deleteRoomById).toBeTypeOf("function");

    await deleteRoomById!({
      roomId: "room-123",
      findRoom: async (roomId) => {
        calls.push(`find:${roomId}`);

        return {
          id: roomId,
          title: "Team Standup",
          cloudflareMeetingId: "cf-meeting-123",
          createdAt: "2026-07-13T12:00:00.000Z",
        };
      },
      deleteCloudflareMeeting: async (meetingId) => {
        calls.push(`cloudflare:${meetingId}`);
      },
      deletePersistedRoom: async (roomId) => {
        calls.push(`d1:${roomId}`);
      },
    });

    expect(calls).toEqual(["find:room-123", "cloudflare:cf-meeting-123", "d1:room-123"]);
  });

  it("reports 404 when deleting a room that does not exist", async () => {
    await expect(
      roomRepository.deleteRoomById({
        roomId: "missing-room",
        findRoom: async () => undefined,
        deleteCloudflareMeeting: async () => {},
        deletePersistedRoom: async () => {},
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "Room not found",
    });
  });

  it("returns persisted rooms for the rooms API", async () => {
    const persistedRooms: Room[] = [
      {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ];

    const listRoomsForRequest = (
      roomRepository as typeof roomRepository & {
        listRoomsForRequest?: (input: {
          listPersistedRooms: () => Promise<Room[]>;
        }) => Promise<{ data: Room[] }>;
      }
    ).listRoomsForRequest;

    expect(listRoomsForRequest).toBeTypeOf("function");

    await expect(
      listRoomsForRequest!({
        listPersistedRooms: async () => persistedRooms,
      }),
    ).resolves.toEqual({
      data: persistedRooms,
    });
  });

  it("reads the rooms D1 binding from an injected enviroment", () => {
    const database = {} as D1Database;

    const getRoomsDatabase = (
      roomRepository as typeof roomRepository & {
        getRoomsDatabase?: (environment: { ROOMS_D1: D1Database }) => D1Database;
      }
    ).getRoomsDatabase;

    expect(getRoomsDatabase).toBeTypeOf("function");
    expect(getRoomsDatabase!({ ROOMS_D1: database })).toBe(database);
  });
  it("lists rooms through an injected D1 database", async () => {
    const database = {} as D1Database;
    const persistedRooms: Room[] = [
      {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ];
    let queriedDatabase: D1Database | undefined;

    const listRoomsFromD1ForRequest = (
      roomRepository as typeof roomRepository & {
        listRoomsFromD1ForRequest?: (input: {
          database: D1Database;
          listPersistedRooms: (database: D1Database) => Promise<Room[]>;
        }) => Promise<{ data: Room[] }>;
      }
    ).listRoomsFromD1ForRequest;

    expect(listRoomsFromD1ForRequest).toBeTypeOf("function");

    await expect(
      listRoomsFromD1ForRequest!({
        database,
        listPersistedRooms: async (receivedDatabase) => {
          queriedDatabase = receivedDatabase;
          return persistedRooms;
        },
      }),
    ).resolves.toEqual({
      data: persistedRooms,
    });

    expect(queriedDatabase).toBe(database);
  });

  it("lists rooms from the Cloudflare request environment", async () => {
    const database = {} as D1Database;
    const persistedRooms: Room[] = [
      {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ];
    let queriedDatabase: D1Database | undefined;

    const listRoomsForCloudflareRequest = (
      roomRepository as typeof roomRepository & {
        listRoomsForCloudflareRequest?: (input: {
          environment: { ROOMS_D1: D1Database };
          listPersistedRooms: (database: D1Database) => Promise<Room[]>;
        }) => Promise<{ data: Room[] }>;
      }
    ).listRoomsForCloudflareRequest;

    expect(listRoomsForCloudflareRequest).toBeTypeOf("function");

    await expect(
      listRoomsForCloudflareRequest!({
        environment: { ROOMS_D1: database },
        listPersistedRooms: async (receivedDatabase) => {
          queriedDatabase = receivedDatabase;
          return persistedRooms;
        },
      }),
    ).resolves.toEqual({
      data: persistedRooms,
    });

    expect(queriedDatabase).toBe(database);
  });
});
