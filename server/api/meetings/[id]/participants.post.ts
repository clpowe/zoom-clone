export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const meetingId = getRouterParam(event, "id");

  const participantId = crypto.randomUUID();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/realtime/kit/${config.realtimekitAppId}/meetings/${meetingId}/participants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cloudflareApiToken}`,
      },
      body: JSON.stringify({
        name: "Christopher",
        preset_name: config.realtimekitPresetName,
        custom_participant_id: participantId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw createError({
      status: response.status,
      statusText: "Failed to create participant",
      data,
    });
  }

  return data;
});
