import { listRooms, listRoomsForCloudflareRequest } from "../utils/rooms";

export default defineEventHandler((event) => {
  return listRoomsForCloudflareRequest({
    environment: event.context.cloudflare.env as unknown as {
      ROOMS_D1: D1Database;
    },
    listPersistedRooms: (database) => listRooms(database),
  });
});
