import type { Room } from "./rooms";

type FindRoom = (id: string) => Promise<Room | undefined>;

function createRoomNotFoundError() {
  return Object.assign(new Error("Room not found"), {
    statusCode: 404,
    statusMessage: "Room not found",
  });
}

export async function getRoomByIdOrThrow(id: string, findRoom: FindRoom): Promise<Room> {
  const room = await findRoom(id);

  if (!room) {
    throw createRoomNotFoundError();
  }

  return room;
}
