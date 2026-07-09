<script setup lang="ts">
type CreateParticipantResponse = {
  data: {
    token: string;
  };
};

type RealtimeKitMeeting = Awaited<
  ReturnType<(typeof import("@cloudflare/realtimekit"))["default"]["init"]>
>;

type RealtimeKitMeetingElement = HTMLElement & {
  meeting?: RealtimeKitMeeting;
};

type RealtimeKitStatesUpdateEvent = CustomEvent<{
  meeting?: string;
  roomLeftState?: string;
}>;

const route = useRoute();

const roomId = computed(() => String(route.params.id ?? ""));
const {
  roomTitle,
  loading: roomLoading,
  errorMessage: roomErrorMessage,
  loadRoom,
} = useRoomDetails(roomId.value);

const {
  inviteUrl,
  copied: inviteCopied,
  errorMessage: inviteErrorMessage,
  copyInviteLink,
} = useRoomInvite(roomId.value);

const { isLobby, isInCall, hasLeft, markJoined, markLeft, prepareRejoin } = useCallLifecycle();

await loadRoom();

const meetingEl = ref<RealtimeKitMeetingElement | null>(null);
const activeMeeting = ref<RealtimeKitMeeting | null>(null);
const name = ref("");
const joining = ref(false);
const errorMessage = ref("");

const trimmedName = computed(() => name.value.trim());

function detachMeetingEvents() {
  meetingEl.value?.removeEventListener(
    "rtkStatesUpdate",
    handleRealtimeKitStatesUpdate as EventListener,
  );
}

function handleRealtimeKitStatesUpdate(event: Event) {
  const { detail } = event as RealtimeKitStatesUpdateEvent;

  if (!isRealtimeKitEndedState(detail ?? {})) {
    return;
  }

  detachMeetingEvents();
  activeMeeting.value = null;
  markLeft();
}

async function joinMeeting() {
  if (joining.value || roomLoading.value || roomErrorMessage.value || !trimmedName.value) {
    return;
  }

  joining.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<CreateParticipantResponse>(
      `/api/meetings/${encodeURIComponent(roomId.value)}/participants`,
      {
        method: "POST",
        body: { name: trimmedName.value },
      },
    );

    const token = response.data.token;

    const [{ default: RealtimeKitClient }, { defineCustomElements }] = await Promise.all([
      import("@cloudflare/realtimekit"),
      import("@cloudflare/realtimekit-ui/loader"),
    ]);

    defineCustomElements();

    const meeting = await RealtimeKitClient.init({
      authToken: token,
    });

    activeMeeting.value = meeting;
    markJoined();

    await nextTick();

    if (!meetingEl.value) {
      throw new Error("RealtimeKit meeting element is not mounted");
    }

    meetingEl.value.meeting = meeting;
    meetingEl.value.addEventListener(
      "rtkStatesUpdate",
      handleRealtimeKitStatesUpdate as EventListener,
    );

    await meeting.join();
  } catch (error) {
    console.error(error);
    errorMessage.value = "Could not join meeting. Please try again.";
  } finally {
    joining.value = false;
  }
}

function rejoinRoom() {
  detachMeetingEvents();
  activeMeeting.value = null;
  meetingEl.value = null;
  errorMessage.value = "";
  prepareRejoin();
}

async function returnHome() {
  await navigateTo("/");
}

onBeforeUnmount(() => {
  detachMeetingEvents();
});
</script>

<template>
  <main v-if="isLobby" class="lobby">
    <section class="lobby-card">
      <h1>Join {{ roomTitle }}</h1>

      <p v-if="roomLoading">Loading room...</p>
      <p v-else-if="roomErrorMessage" class="error-message">
        {{ roomErrorMessage }}
      </p>
      <p v-else>Enter your name before joining the call.</p>

      <ClientOnly>
        <div v-if="inviteUrl" class="invite-row">
          <input :value="inviteUrl" readonly aria-label="Invite link" />
          <button type="button" @click="copyInviteLink">
            {{ inviteCopied ? "Copied" : "Copy link" }}
          </button>
        </div>
      </ClientOnly>

      <p v-if="inviteErrorMessage" class="error-message">
        {{ inviteErrorMessage }}
      </p>

      <label>
        Name
        <input v-model="name" type="text" placeholder="Your name" />
      </label>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <button
        :disabled="joining || roomLoading || !!roomErrorMessage || !trimmedName"
        @click="joinMeeting"
      >
        {{ joining ? "Joining..." : "Join Meeting" }}
      </button>
    </section>
  </main>

  <main v-else-if="hasLeft" class="lobby">
    <section class="lobby-card">
      <h1>You left {{ roomTitle }}</h1>
      <p>The room is still available if you want to join again.</p>

      <div class="action-row">
        <button type="button" @click="rejoinRoom">Rejoin</button>
        <button type="button" class="secondary-button" @click="returnHome">Home</button>
      </div>
    </section>
  </main>

  <ClientOnly v-else-if="isInCall">
    <main class="meeting-shell">
      <rtk-meeting ref="meetingEl" show-setup-screen="true" class="meeting" />
    </main>
  </ClientOnly>
</template>

<style scoped>
.lobby {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0a0a0a;
  color: white;
  padding: 1rem;
}

.lobby-card {
  width: min(100%, 420px);
  display: grid;
  gap: 1rem;
  background: #171717;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 2rem;
}

.lobby-card h1 {
  margin: 0;
  font-size: 1.75rem;
}

.lobby-card p {
  margin: 0;
  color: #a3a3a3;
}

.lobby-card label {
  display: grid;
  gap: 0.5rem;
  color: #d4d4d4;
}

.lobby-card input {
  border: 1px solid #404040;
  border-radius: 10px;
  background: #0a0a0a;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.lobby-card button {
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  padding: 0.85rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.lobby-card button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.invite-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.invite-row input {
  min-width: 0;
  color: #d4d4d4;
  font-size: 0.9rem;
}

.invite-row button {
  background: #262626;
  padding: 0.75rem 1rem;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.secondary-button {
  background: #262626 !important;
}

.meeting-shell {
  min-height: 100vh;
  background: #0a0a0a;
}

.meeting {
  height: 100vh;
  width: 100vw;
}

.lobby-card .error-message {
  margin: 0;
  color: #fca5a5;
  font-size: 0.9rem;
}
</style>
