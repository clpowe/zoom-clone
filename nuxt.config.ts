// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  nitro: {
    preset: "cloudflare_module",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  runtimeConfig: {
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    realtimekitAppId: process.env.REALTIMEKIT_APP_ID,
    realtimekitPresetName: process.env.REALTIMEKIT_PRESET_NAME,
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  },

  modules: ["nitro-cloudflare-dev"],
});
