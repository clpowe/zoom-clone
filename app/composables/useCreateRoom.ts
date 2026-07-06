export type Room = {
  id: string;
  title: string;
  cloudflareMeetingId: string;
  createdAt: string;
};

type CreateRoomResponse = {
  data: Room;
};

type CreateRoomInput = {
  title: string;
};

type CreateRoomAndNavigateInput = {
  title: string;
  createRoom: (input: CreateRoomInput) => Promise<CreateRoomResponse>;
  navigateToRoom: (roomId: string) => Promise<void>;
};

export async function createRoomAndNavigate(input: CreateRoomAndNavigateInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Room title is required");
  }

  const response = await input.createRoom({ title });

  await input.navigateToRoom(response.data.id);
}

export function useCreateRoom() {
  const title = ref("New Room");
  const creating = ref(false);
  const errorMessage = ref("");

  const trimmedTitle = computed(() => title.value.trim());

  async function createRoom() {
    if (creating.value) {
      return;
    }

    errorMessage.value = "";
    creating.value = true;

    try {
      await createRoomAndNavigate({
        title: title.value,
        createRoom: ({ title }) => {
          const roomsEndpoint = "/api/rooms";
          return $fetch<CreateRoomResponse>(roomsEndpoint, {
            method: "POST",
            body: { title },
          });
        },
        navigateToRoom: (roomId) => navigateTo(`/room/${roomId}`) as Promise<void>,
      });
    } catch (error) {
      console.error(error);
      errorMessage.value = "Could not create a room. Please try again.";
    } finally {
      creating.value = false;
    }
  }

  return {
    title,
    trimmedTitle,
    creating,
    errorMessage,
    createRoom,
  };
}
