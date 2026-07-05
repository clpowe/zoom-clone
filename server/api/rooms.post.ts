import { parseCreateRoomBody } from "../utils/room-request";
import { createRoomForMeeting } from "../utils/create-room";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  let parsedBody: ReturnType<typeof parseCreateRoomBody>;

  try {
    parsedBody = parseCreateRoomBody(body);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: error,
    });
  }

  const room = await createRoomForMeeting({
    title: parsedBody.title,
    createCloudflareMeeting: async ({ title }) => {
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
            title,
          }),
        },
      );

      const data = await readCloudflareJsonResponse<{
        data: {
          id: string;
        };
      }>(response);

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: "Failed to create meeting",
          data,
        });
      }

      return {
        id: data.data.id,
      };
    },
  });

  return {
    data: room,
  };
});
