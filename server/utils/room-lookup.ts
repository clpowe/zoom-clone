import { findRoomById, type Room } from "./rooms";

type FindRoom = (id: string) => Promise<Room | undefined>;

function createRoomNotFoundError() {
  return Object.assign(new Error("Room not found"), {
    statusCode: 404,
    statusMessage: "Room not found",
  });
}

export function getRoomByIdOrThrow(id: string): Room;
export function getRoomByIdOrThrow(id: string, findRoom: FindRoom): Promise<Room>;
export function getRoomByIdOrThrow(id: string, findRoom?: FindRoom): Room | Promise<Room> {
  if (findRoom) {
    return findRoom(id).then((room) => {
      if (!room) {
        throw createRoomNotFoundError();
      }

      return room;
    });
  }

  const room = findRoomById(id);

  if (!room) {
    throw createRoomNotFoundError();
  }

  return room;
}
