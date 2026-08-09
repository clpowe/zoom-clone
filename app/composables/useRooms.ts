export type ListedRoom = {
  id: string;
  title: string;
  cloudflareMeetingId: string;
  createdAt: string;
};

type ListRoomsResponse = {
  data: ListedRoom[];
};

type LoadRoomsInput = {
  fetchRooms: () => Promise<ListRoomsResponse>;
};

export async function loadRooms(input: LoadRoomsInput) {
  const response = await input.fetchRooms();

  return response.data;
}

export async function deleteRoomAndRefresh(input: {
  roomId: string;
  deleteRoom: (roomId: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
}): Promise<{ errorMessage: string } | undefined> {
  try {
    await input.deleteRoom(input.roomId);
    await input.refreshRooms();

    return undefined;
  } catch {
    return {
      errorMessage: "Could not delete room.",
    };
  }
}

export async function requestRoomDeletion(input: {
  roomId: string;
  fetchRoom: (endpoint: string, options: { method: "DELETE" }) => Promise<unknown>;
}): Promise<void> {
  await input.fetchRoom(`/api/rooms/${encodeURIComponent(input.roomId)}`, {
    method: "DELETE",
  });
}

export function useRooms() {
  const rooms = ref<ListedRoom[]>([]);
  const loading = ref(false);
  const errorMessage = ref("");

  const hasRooms = computed(() => rooms.value.length > 0);

  async function refreshRooms() {
    loading.value = true;
    errorMessage.value = "";

    try {
      rooms.value = await loadRooms({
        fetchRooms: () => {
          const roomsEndpoint = "/api/rooms";

          return $fetch<ListRoomsResponse>(roomsEndpoint);
        },
      });
    } catch (error) {
      console.error(error);
      errorMessage.value = "Could not load rooms.";
    } finally {
      loading.value = false;
    }
  }

  async function deleteRoom(roomId: string) {
    errorMessage.value = "";

    // $fetch's typed-route generics blow the TS instantiation depth when the
    // endpoint is a plain string, so call it through an untyped signature.
    const fetchRoom = $fetch as unknown as (
      endpoint: string,
      options: { method: "DELETE" },
    ) => Promise<unknown>;

    const result = await deleteRoomAndRefresh({
      roomId,
      deleteRoom: (roomId) =>
        requestRoomDeletion({
          roomId,
          fetchRoom,
        }),
      refreshRooms,
    });

    if (result) {
      errorMessage.value = result.errorMessage;
    }
  }

  onMounted(refreshRooms);

  return {
    rooms,
    hasRooms,
    loading,
    errorMessage,
    refreshRooms,
    deleteRoom,
  };
}
