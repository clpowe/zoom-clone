<script setup lang="ts">
const { title, trimmedTitle, canSubmit, creating, errorMessage, createRoom } = useCreateRoom();

const {
  rooms,
  hasRooms,
  loading: roomsLoading,
  errorMessage: roomsErrorMessage,
  refreshRooms,
  deleteRoom,
} = useRooms();
</script>

<template>
  <main class="home">
    <div class="home-layout">
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
      <section class="recent-rooms-panel">
        <div class="heading compact">
          <p class="eyebrow">Recent</p>
          <h2>Rooms</h2>
        </div>

        <p v-if="roomsLoading" class="muted-message">Loading rooms...</p>
        <p v-if="roomsErrorMessage" class="error-message">
          {{ roomsErrorMessage }}
        </p>
        <p v-if="!roomsLoading && !hasRooms" class="muted-message">
          No rooms yet. Create one to get started.
        </p>

        <ul v-if="!roomsLoading && hasRooms" class="room-list">
          <li v-for="room in rooms" :key="room.id" class="room-item">
            <div>
              <h3>{{ room.title }}</h3>
              <p>{{ new Date(room.createdAt).toLocaleString() }}</p>
            </div>

            <div class="room-actions">
              <NuxtLink :to="`/room/${room.id}`">Join</NuxtLink>
              <button type="button" @click="deleteRoom(room.id)">Delete</button>
            </div>
          </li>
        </ul>
      </section>
    </div>
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

.home-layout {
  width: min(100%, 960px);
  display: grid;
  grid-template-columns: minmax(0, 440px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.create-room-panel,
.recent-rooms-panel {
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

.heading.compact {
  gap: 0.35rem;
}

.eyebrow {
  margin: 0;
  color: #93c5fd;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.heading h1,
.heading h2 {
  margin: 0;
}

.heading h1 {
  font-size: 2rem;
}

.heading h2 {
  font-size: 1.4rem;
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

.create-room-form button,
.room-item a,
.room-item button {
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  padding: 0.85rem 1rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.create-room-form button:hover:not(:disabled),
.room-item a:hover,
.room-item button:hover {
  background: #1d4ed8;
}

.create-room-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-preview,
.muted-message {
  margin: 0;
  color: #a3a3a3;
  font-size: 0.9rem;
}

.room-preview strong {
  color: white;
}

.room-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.room-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  background: #0f0f0f;
  padding: 1rem;
}

.room-item h3,
.room-item p {
  margin: 0;
}

.room-item h3 {
  font-size: 1rem;
}

.room-item p {
  margin-top: 0.25rem;
  color: #a3a3a3;
  font-size: 0.85rem;
}

.error-message {
  margin: 0;
  color: #fca5a5;
  font-size: 0.9rem;
}

.room-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 760px) {
  .home {
    place-items: start center;
  }

  .home-layout {
    grid-template-columns: 1fr;
  }

  .create-room-panel,
  .recent-rooms-panel {
    padding: 1.25rem;
  }

  .room-item {
    grid-template-columns: 1fr;
  }
}
</style>
