import { deleteCloudflareMeeting } from "../../utils/realtimekit";
import { deleteRoom, deleteRoomById, findRoomById, getRoomsDatabase } from "../../utils/rooms";

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id")!;
  const database = getRoomsDatabase(
    event.context.cloudflare.env as unknown as { zoom_clone_rooms: D1Database },
  );

  await deleteRoomById({
    roomId,
    findRoom: (id) => findRoomById(id, database),
    deleteCloudflareMeeting: (meetingId) =>
      deleteCloudflareMeeting({
        meetingId,
        config: getRealtimeKitConfig(),
        fetch,
      }),
    deletePersistedRoom: (id) => deleteRoom(id, database),
  });

  return {
    data: null,
  };
});
