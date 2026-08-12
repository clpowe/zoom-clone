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

const {
  isLobby,
  hasLeft,
  connectionMessage,
  markJoined: markCallJoined,
  markLeft,
  prepareRejoin,
  attachConnectionEvents,
} = useCallLifecycle();

const {
  name,
  trimmedName,
  canSubmit: canSubmitJoin,
  shouldRenderMeeting,
  buttonLabel: joinButtonLabel,
  errorMessage: joinErrorMessage,
  beginJoin,
  markParticipantCreated,
  markClientLoaded,
  markJoined: markJoinComplete,
  fail: failJoin,
  reset: resetJoin,
} = useRoomJoin();

const canJoinMeeting = computed(
  () => canSubmitJoin.value && !roomLoading.value && !roomErrorMessage.value,
);

await loadRoom();

const meetingEl = ref<RealtimeKitMeetingElement | null>(null);
const activeMeeting = ref<RealtimeKitMeeting | null>(null);
let detachConnectionEvents: (() => void) | undefined;

function detachMeetingEvents() {
  detachConnectionEvents?.();
  detachConnectionEvents = undefined;

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
  resetJoin();
  markLeft();
}

async function joinMeeting() {
  if (!canJoinMeeting.value || !beginJoin()) {
    return;
  }

  try {
    const endpoint = `/api/meetings/${encodeURIComponent(roomId.value)}/participants`;
    const response = await $fetch<CreateParticipantResponse>(endpoint, {
      method: "POST",
      body: { name: trimmedName.value },
    });

    markParticipantCreated();

    const [{ default: RealtimeKitClient }, { defineCustomElements }] = await Promise.all([
      import("@cloudflare/realtimekit"),
      import("@cloudflare/realtimekit-ui/loader"),
    ]);

    defineCustomElements();

    const meeting = await RealtimeKitClient.init({
      authToken: response.data.token,
    });

    activeMeeting.value = meeting;
    markClientLoaded();

    await nextTick();

    if (!meetingEl.value) {
      throw new Error("RealtimeKit meeting element is not mounted");
    }

    meetingEl.value.meeting = meeting;
    meetingEl.value.addEventListener(
      "rtkStatesUpdate",
      handleRealtimeKitStatesUpdate as EventListener,
    );

    detachConnectionEvents = attachConnectionEvents(meeting.meta);

    await meeting.join();

    markJoinComplete();
    markCallJoined();
  } catch (error) {
    console.error(error);
    detachMeetingEvents();
    activeMeeting.value = null;
    failJoin(error);
  }
}

function rejoinRoom() {
  detachMeetingEvents();
  activeMeeting.value = null;
  meetingEl.value = null;
  resetJoin();
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
  <main v-if="isLobby && !shouldRenderMeeting" class="lobby">
    <section class="lobby-card">
      <h1>Join {{ roomTitle }}</h1>

      <p v-if="roomLoading">Loading room...</p>
      <p v-else-if="joinErrorMessage" class="error-message">
        {{ joinErrorMessage }}
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

      <p v-if="roomErrorMessage" class="error-message">
        {{ roomErrorMessage }}
      </p>

      <button :disabled="!canJoinMeeting" @click="joinMeeting">
        {{ joinButtonLabel }}
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

  <ClientOnly v-else-if="shouldRenderMeeting">
    <main class="meeting-shell">
      <p v-if="connectionMessage" class="connection-status" role="status" aria-live="polite">
        {{ connectionMessage }}
      </p>

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
  position: relative;
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

.connection-status {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 10;
  width: max-content;
  max-width: calc(100vw - 2rem);
  margin: 0;
  transform: translateX(-50%);
  border: 1px solid #404040;
  border-radius: 999px;
  background: rgb(23 23 23 / 92%);
  color: white;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  text-align: center;
}
</style>
