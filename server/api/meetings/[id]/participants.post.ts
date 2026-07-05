import { z } from "zod";

const createParticipantBodySchema = z.object({
  name: z.string().trim().min(1).default("Guest"),
});

export default defineEventHandler(async (event) => {
  const config = getRealtimeKitConfig();
  const roomId = getRouterParam(event, "id");

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing room ID",
    });
  }

  const room = getRoomByIdOrThrow(roomId);

  const body = await readBody(event);
  const result = createParticipantBodySchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: result.error.flatten(),
    });
  }

  const { name } = result.data;

  const participantId = crypto.randomUUID();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/realtime/kit/${config.realtimekitAppId}/meetings/${room.cloudflareMeetingId}/participants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cloudflareApiToken}`,
      },
      body: JSON.stringify({
        name,
        preset_name: config.realtimekitPresetName,
        custom_participant_id: participantId,
      }),
    },
  );

  const data = await readCloudflareJsonResponse(response);

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: "Failed to create participant",
      data,
    });
  }

  return data;
});
