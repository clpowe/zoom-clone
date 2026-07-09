<script setup lang="ts">
const { title, trimmedTitle, canSubmit, creating, errorMessage, createRoom } = useCreateRoom();
</script>

<template>
  <main class="home">
    <section class="create-room-panel">
      <div class="heading">
        <p class="eyebrow">Video rooms</p>
        <h1>Create a room</h1>
        <p>Start a simple video call and share the room link.</p>
      </div>

      <form class="create-room-form" @submit.prevent="createRoom">
        <label>
          Room title
          <input
            v-model="title"
            type="text"
            name="title"
            placeholder="Team Standup"
            autocomplete="off"
            :disabled="creating"
          />
        </label>

        <button type="submit" :disabled="!canSubmit">
          {{ creating ? "Creating room..." : "Create room" }}
        </button>
      </form>

      <p v-if="trimmedTitle" class="room-preview">
        Room will be named <strong>{{ trimmedTitle }}</strong>
      </p>

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
  padding: 1rem;
}

.create-room-panel {
  width: min(100%, 440px);
  display: grid;
  gap: 1.25rem;
  background: #171717;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 2rem;
}

.heading {
  display: grid;
  gap: 0.5rem;
}

.eyebrow {
  margin: 0;
  color: #93c5fd;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.heading h1 {
  margin: 0;
  font-size: 2rem;
}

.heading p {
  margin: 0;
  color: #a3a3a3;
}

.create-room-form {
  display: grid;
  gap: 1rem;
}

.create-room-form label {
  display: grid;
  gap: 0.5rem;
  color: #d4d4d4;
}

.create-room-form input {
  border: 1px solid #404040;
  border-radius: 10px;
  background: #0a0a0a;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.create-room-form input:disabled {
  opacity: 0.7;
}

.create-room-form button {
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  padding: 0.85rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

.create-room-form button:hover:not(:disabled) {
  background: #1d4ed8;
}

.create-room-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-preview {
  margin: 0;
  color: #a3a3a3;
  font-size: 0.9rem;
}

.room-preview strong {
  color: white;
}

.error-message {
  margin: 0;
  color: #fca5a5;
  font-size: 0.9rem;
}
</style>
