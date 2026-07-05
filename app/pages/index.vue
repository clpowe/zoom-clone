<script setup lang="ts">
type CreateMeetingResponse = {
  data: {
    id: string;
  };
};

const creating = ref(false);
const errorMessage = ref("");

async function createMeeting() {
  if (creating.value) {
    return;
  }

  errorMessage.value = "";
  creating.value = true;

  try {
    const response = await $fetch<CreateMeetingResponse>("/api/meetings", {
      method: "POST",
    });

    const meetingId = response.data.id;

    await navigateTo(`/room/${meetingId}`);
  } catch (error) {
    console.error(error);
    errorMessage.value = "Could not create a meeting. Please try again.";
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <main class="home">
    <section class="start-panel">
      <button class="start-button" :disabled="creating" @click="createMeeting">
        {{ creating ? "Creating meeting..." : "Start meeting" }}
      </button>
      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0a0a0a;
  color: white;
}

.start-panel {
  display: grid;
  gap: 0.75rem;
  justify-items: center;
}

.start-button {
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.start-button:hover {
  background: #1d4ed8;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin: 0;
  color: #fca5a5;
  font-size: 0.9rem;
}
</style>
