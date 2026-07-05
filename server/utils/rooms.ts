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

const rooms = new Map<string, RoomRecord>();
let nextRoomOrder = 0;

export function createRoom(input: CreateRoomInput): Room {
  const room: Room = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    cloudflareMeetingId: input.cloudflareMeetingId,
    createdAt: new Date().toISOString(),
  };

  rooms.set(room.id, {
    room,
    createdOrder: nextRoomOrder,
  });
  nextRoomOrder++;

  return room;
}

export function findRoomById(id: string): Room | undefined {
  return rooms.get(id)?.room;
}

export function listRooms(): Room[] {
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

export function resetRoomsForTest() {
  rooms.clear();
  nextRoomOrder = 0;
}
