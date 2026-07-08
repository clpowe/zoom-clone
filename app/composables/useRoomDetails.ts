export type RoomDetails = {
  id: string;
  title: string;
  cloudflareMeetingId: string;
  createdAt: string;
};

type RoomDetailsResponse = {
  data: RoomDetails;
};

type FetchRoomInput = {
  roomId: string;
};

type LoadRoomDetailsInput = {
  roomId: string;
  fetchRoom: (input: FetchRoomInput) => Promise<RoomDetailsResponse>;
};

export async function loadRoomDetails(input: LoadRoomDetailsInput) {
  const roomId = input.roomId.trim();

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const response = await input.fetchRoom({ roomId });

  return response.data;
}

export function useRoomDetails(roomId: string) {
  const room = ref<RoomDetails | null>(null);
  const loading = ref(false);
  const errorMessage = ref("");

  const roomTitle = computed(() => room.value?.title ?? "Meeting");

  async function loadRoom() {
    loading.value = true;
    errorMessage.value = "";

    try {
      room.value = await loadRoomDetails({
        roomId,
        fetchRoom: ({ roomId }) => {
          const endpoint = `/api/rooms/${encodeURIComponent(roomId)}`;

          return $fetch<RoomDetailsResponse>(endpoint);
        },
      });
    } catch (error) {
      console.error(error);
      errorMessage.value = "Room not found.";
    } finally {
      loading.value = false;
    }
  }

  return {
    room,
    roomTitle,
    loading,
    errorMessage,
    loadRoom,
  };
}
