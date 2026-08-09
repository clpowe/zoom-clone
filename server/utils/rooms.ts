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

type RoomRow = {
  id: string;
  title: string;
  cloudflare_meeting_id: string;
  created_at: string;
};

export async function createRoom(input: CreateRoomInput, database: D1Database): Promise<Room> {
  const room: Room = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    cloudflareMeetingId: input.cloudflareMeetingId,
    createdAt: new Date().toISOString(),
  };

  await database
    .prepare("INSERT INTO rooms (id, title, cloudflare_meeting_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(room.id, room.title, room.cloudflareMeetingId, room.createdAt)
    .run();

  return room;
}

export async function findRoomById(id: string, database: D1Database): Promise<Room | undefined> {
  const row = await database
    .prepare("SELECT id, title, cloudflare_meeting_id, created_at FROM rooms WHERE id = ?")
    .bind(id)
    .first<RoomRow>();

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    title: row.title,
    cloudflareMeetingId: row.cloudflare_meeting_id,
    createdAt: row.created_at,
  };
}

export async function listRooms(database: D1Database): Promise<Room[]> {
  const { results } = await database
    .prepare(
      "SELECT id, title, cloudflare_meeting_id, created_at FROM rooms ORDER BY created_at DESC",
    )
    .all<RoomRow>();

  return results.map((row) => ({
    id: row.id,
    title: row.title,
    cloudflareMeetingId: row.cloudflare_meeting_id,
    createdAt: row.created_at,
  }));
}

export async function deleteRoom(id: string, database: D1Database): Promise<void> {
  await database.prepare("DELETE FROM rooms WHERE id = ?").bind(id).run();
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
