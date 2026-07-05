export default defineEventHandler(async () => {
  const config = getRealtimeKitConfig();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/realtime/kit/${config.realtimekitAppId}/meetings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cloudflareApiToken}`,
      },
      body: JSON.stringify({
        title: "Just The Guys",
      }),
    },
  );

  const data = await readCloudflareJsonResponse(response);

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: "Failed to create meeting",
      data,
    });
  }

  return data;
});
