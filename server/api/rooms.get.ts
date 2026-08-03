import { listRooms, listRoomsForCloudflareRequest } from "../utils/rooms";

export default defineEventHandler((event) => {
  return listRoomsForCloudflareRequest({
    environment: event.context.cloudflare.env as unknown as {
      zoom_clone_rooms: D1Database;
    },
    listPersistedRooms: (database) => listRooms(database),
  });
});
