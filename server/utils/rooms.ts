export type Room = {
  id: string;
  title: string;
  cloudflareMeetingId: string;
  createdAt: string;
};

type CreateRoomInput = {
  title: string;
  cloudflareMeetingId: string;
};

type RoomRecord = {
  room: Room;
  createdOrder: number;
};

type RoomRow = {
  id: string;
  title: string;
  cloudflare_meeting_id: string;
  created_at: string;
};

const rooms = new Map<string, RoomRecord>();
let nextRoomOrder = 0;

export function createRoom(input: CreateRoomInput): Room;
export function createRoom(input: CreateRoomInput, database: D1Database): Promise<Room>;
export function createRoom(input: CreateRoomInput, database?: D1Database): Room | Promise<Room> {
  const room: Room = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    cloudflareMeetingId: input.cloudflareMeetingId,
    createdAt: new Date().toISOString(),
  };

  if (database) {
    return database
      .prepare(
        "INSERT INTO rooms (id, title, cloudflare_meeting_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(room.id, room.title, room.cloudflareMeetingId, room.createdAt)
      .run()
      .then(() => room);
  }

  rooms.set(room.id, {
    room,
    createdOrder: nextRoomOrder,
  });
  nextRoomOrder++;

  return room;
}

export function findRoomById(id: string): Room | undefined;
export function findRoomById(id: string, database: D1Database): Promise<Room | undefined>;
export function findRoomById(
  id: string,
  database?: D1Database,
): Room | undefined | Promise<Room | undefined> {
  if (!database) {
    return rooms.get(id)?.room;
  }

  return database
    .prepare("SELECT id, title, cloudflare_meeting_id, created_at FROM rooms WHERE id = ?")
    .bind(id)
    .first<RoomRow>()
    .then((row) => {
      if (!row) {
        return undefined;
      }

      return {
        id: row.id,
        title: row.title,
        cloudflareMeetingId: row.cloudflare_meeting_id,
        createdAt: row.created_at,
      };
    });
}

export function listRooms(): Room[];
export function listRooms(database: D1Database): Promise<Room[]>;
export function listRooms(database?: D1Database): Room[] | Promise<Room[]> {
  if (database) {
    return database
      .prepare(
        "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms ORDER BY created_at DESC",
      )
      .all<RoomRow>()
      .then(({ results }) =>
        results.map((row) => ({
          id: row.id,
          title: row.title,
          cloudflareMeetingId: row.cloudflare_meeting_id,
          createdAt: row.created_at,
        })),
      );
  }

  return [...rooms.values()]
    .sort((a, b) => {
      const createdAtComparison = b.room.createdAt.localeCompare(a.room.createdAt);

      if (createdAtComparison !== 0) {
        return createdAtComparison;
      }

      return b.createdOrder - a.createdOrder;
    })
    .map(({ room }) => room);
}

export async function deleteRoom(id: string, database: D1Database): Promise<void> {
  await database.prepare("DELETE FROM rooms WHERE id = ?").bind(id).run();
}

export function resetRoomsForTest() {
  rooms.clear();
  nextRoomOrder = 0;
}

export async function deleteRoomById(input: {
  roomId: string;
  findRoom: (roomId: string) => Promise<Room | undefined>;
  deleteCloudflareMeeting: (meetingId: string) => Promise<void>;
  deletePersistedRoom: (roomId: string) => Promise<void>;
}): Promise<void> {
  const room = await input.findRoom(input.roomId);

  if (!room) {
    throw Object.assign(new Error("Room not found"), {
      statusCode: 404,
      statusMessage: "Room not found",
    });
  }

  await deleteRoomForMeeting({
    room,
    deleteCloudflareMeeting: input.deleteCloudflareMeeting,
    deletePersistedRoom: input.deletePersistedRoom,
  });
}

export async function deleteRoomForMeeting(input: {
  room: Room;
  deleteCloudflareMeeting: (meetingId: string) => Promise<void>;
  deletePersistedRoom: (roomId: string) => Promise<void>;
}): Promise<void> {
  try {
    await input.deleteCloudflareMeeting(input.room.cloudflareMeetingId);
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("statusCode" in error) ||
      error.statusCode !== 404
    ) {
      throw error;
    }
  }
  await input.deletePersistedRoom(input.room.id);
}

export async function listRoomsForRequest(input: {
  listPersistedRooms: () => Promise<Room[]>;
}): Promise<{ data: Room[] }> {
  return {
    data: await input.listPersistedRooms(),
  };
}

export function getRoomsDatabase(environment: { zoom_clone_rooms: D1Database }): D1Database {
  return environment.zoom_clone_rooms;
}

export async function listRoomsFromD1ForRequest(input: {
  database: D1Database;
  listPersistedRooms: (database: D1Database) => Promise<Room[]>;
}): Promise<{ data: Room[] }> {
  return {
    data: await input.listPersistedRooms(input.database),
  };
}

export async function listRoomsForCloudflareRequest(input: {
  environment: { zoom_clone_rooms: D1Database };
  listPersistedRooms: (database: D1Database) => Promise<Room[]>;
}): Promise<{ data: Room[] }> {
  return listRoomsFromD1ForRequest({
    database: getRoomsDatabase(input.environment),
    listPersistedRooms: input.listPersistedRooms,
  });
}
