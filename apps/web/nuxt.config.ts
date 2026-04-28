// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-09-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    session: {
      // nuxt-auth-utils reads NUXT_SESSION_SECRET automatically
      password: process.env.NUXT_SESSION_SECRET ?? '',
      cookie: {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge:   60 * 60 * 24 * 7, // 7 days
      },
    },
    public: {
      appName: process.env.APP_NAME ?? 'MyApp',
      appUrl:  process.env.APP_URL  ?? 'http://localhost:3000',
    },
  },

  typescript: {
    strict:    true,
    typeCheck: false,
  },

  nitro: {
    experimental: { tasks: true },
  },

  ssr: true,
})