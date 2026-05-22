export default defineEventHandler(() => {
  const config = useRuntimeConfig();

  return {
    accountIdLoaded: Boolean(config.cloudflareAccountId),
    appIdLoaded: Boolean(config.realtimekitAppId),
    tokenLoaded: Boolean(config.cloudflareApiToken),
  };
});
