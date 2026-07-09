type BuildRoomInviteUrlInput = {
  origin: string;
  roomId: string;
};

type CopyRoomInviteUrlInput = {
  inviteUrl: string;
  writeText: (text: string) => Promise<void>;
};

export function buildRoomInviteUrl(input: BuildRoomInviteUrlInput) {
  const origin = input.origin.trim();
  const roomId = input.roomId.trim();

  if (!origin) {
    throw new Error("Origin is required");
  }

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  return new URL(`/room/${encodeURIComponent(roomId)}`, origin).toString();
}

export async function copyRoomInviteUrl(input: CopyRoomInviteUrlInput) {
  const inviteUrl = input.inviteUrl.trim();

  if (!inviteUrl) {
    throw new Error("Invite URL is required");
  }

  await input.writeText(inviteUrl);
}

export function useRoomInvite(roomId: string) {
  const copied = ref(false);
  const errorMessage = ref("");

  const inviteUrl = computed(() => {
    if (!import.meta.client) {
      return "";
    }

    return buildRoomInviteUrl({
      origin: window.location.origin,
      roomId,
    });
  });

  async function copyInviteLink() {
    copied.value = false;
    errorMessage.value = "";

    try {
      await copyRoomInviteUrl({
        inviteUrl: inviteUrl.value,
        writeText: (text) => navigator.clipboard.writeText(text),
      });
    } catch (error) {
      console.error(error);
      errorMessage.value = "Could not copy invite link.";
    }
  }

  return {
    inviteUrl,
    copied,
    errorMessage,
    copyInviteLink,
  };
}
