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

const route = useRoute();

const meetingEl = ref<RealtimeKitMeetingElement | null>(null);
const name = ref("");
const joining = ref(false);
const joined = ref(false);
const errorMessage = ref("");

const trimmedName = computed(() => name.value.trim());
const meetingId = computed(() => String(route.params.id ?? ""));

async function joinMeeting() {
  if (joining.value || !trimmedName.value) {
    return;
  }

  joining.value = true;
  errorMessage.value = "";

  // Create Participant
  try {
    const response = await $fetch<CreateParticipantResponse>(
      `/api/meetings/${encodeURIComponent(meetingId.value)}/participants`,
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

    // Initialize SDK
    const meeting = await RealtimeKitClient.init({
      authToken: token,
    });

    joined.value = true;

    await nextTick();
    // Attach meeting instance to web component
    if (!meetingEl.value) {
      throw new Error("RealtimeKit meeting element is not mounted");
    }

    meetingEl.value.meeting = meeting;
    await meeting.join();
  } catch (error) {
    console.error(error);
    errorMessage.value = "Could not join meeting. Please try again.";
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <main v-if="!joined" class="lobby">
    <section class="lobby-card">
      <h1>Join Meeting</h1>
      <p>Enter your name before joining the call.</p>

      <label>
        Name
        <input v-model="name" type="text" placeholder="Your name" />
      </label>
      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>
      <button :disabled="joining || !trimmedName" @click="joinMeeting">
        {{ joining ? "Joining..." : "Join Meeting" }}
      </button>
    </section>
  </main>
  <ClientOnly v-else>
    <rtk-meeting ref="meetingEl" show-setup-screen="true" class="h-screen w-screen" />
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
