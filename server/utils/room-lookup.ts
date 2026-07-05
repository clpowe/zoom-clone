import { findRoomById, type Room } from "./rooms";

export function getRoomByIdOrThrow(id: string): Room {
  const room = findRoomById(id);

  if (!room) {
    throw Object.assign(new Error("Room not found"), {
      statusCode: 404,
      statusMessage: "Room not found",
    });
  }

  return room;
}
