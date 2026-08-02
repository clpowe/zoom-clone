type RealtimeKitRuntimeConfig = {
  cloudflareAccountId: string;
  realtimekitAppId: string;
  realtimekitPresetName: string;
  cloudflareApiToken: string;
};

const runtimeConfigKeys = [
  "cloudflareAccountId",
  "realtimekitAppId",
  "realtimekitPresetName",
  "cloudflareApiToken",
] as const satisfies readonly (keyof RealtimeKitRuntimeConfig)[];

export function getRealtimeKitConfig(): RealtimeKitRuntimeConfig {
  const config = useRuntimeConfig();
  const missingKeys = runtimeConfigKeys.filter((key) => !config[key]);

  if (missingKeys.length > 0) {
    throw createError({
      statusCode: 500,
      statusMessage: "RealtimeKit is not configured",
      data: {
        missingKeys,
      },
    });
  }

  return {
    cloudflareAccountId: config.cloudflareAccountId,
    realtimekitAppId: config.realtimekitAppId,
    realtimekitPresetName: config.realtimekitPresetName,
    cloudflareApiToken: config.cloudflareApiToken,
  };
}

export async function readCloudflareJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function deleteCloudflareMeeting(input: {
  meetingId: string;
  config: {
    cloudflareAccountId: string;
    realtimekitAppId: string;
    cloudflareApiToken: string;
  };
  fetch: typeof fetch;
}): Promise<void> {
  const response = await input.fetch(
    `https://api.cloudflare.com/client/v4/accounts/${input.config.cloudflareAccountId}/realtime/kit/${input.config.realtimekitAppId}/meetings/${input.meetingId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${input.config.cloudflareApiToken}`,
      },
    },
  );

  if (!response.ok) {
    throw Object.assign(new Error("Failed to delete meeting"), {
      statusCode: response.status,
      statusMessage: "Failed to delete meeting",
    });
  }
}
