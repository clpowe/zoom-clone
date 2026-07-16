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
