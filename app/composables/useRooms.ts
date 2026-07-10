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

  return {
    rooms,
    hasRooms,
    loading,
    errorMessage,
    refreshRooms,
  };
}
