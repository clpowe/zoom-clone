<script setup lang="ts">
import RealtimeKitClient from "@cloudflare/realtimekit";

const route = useRoute();

const meetingEl = ref<any>(null);

onMounted(async () => {
  // Create Participant
  const response = await $fetch(`/api/meetings/${route.params.id}/participants`, {
    method: "POST",
  });

  const token = response.data.token;

  // Initialize SDK
  const meeting = await RealtimeKitClient.init({
    authToken: token,
  });

  // Attach meeting instance to web component
  meetingEl.value.meeting = meeting;

  // Join call
  await meeting.join();
});
</script>

<template>
  <ClientOnly>
    <rtk-meeting ref="meetingEl" show-setup-screen="true" class="h-screen w-screen" />
  </ClientOnly>
</template>
