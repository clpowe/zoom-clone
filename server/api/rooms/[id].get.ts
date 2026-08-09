import { getRoomByIdOrThrow } from "../../utils/room-lookup";
import { findRoomById, getRoomsDatabase } from "../../utils/rooms";

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id");

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing room ID",
    });
  }

  const database = getRoomsDatabase(
    event.context.cloudflare.env as unknown as {
      zoom_clone_rooms: D1Database;
    },
  );

  return {
    data: await getRoomByIdOrThrow(roomId, (id) => findRoomById(id, database)),
  };
});
