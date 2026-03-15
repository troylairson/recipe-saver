export default defineNuxtConfig({
  compatibilityDate: '2026-02-28',
  devtools: { enabled: true },
  srcDir: 'app/',
  serverDir: 'server',

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  runtimeConfig: {
    tursoUrl:        '',
    tursoAuthToken:  '',
    anthropicApiKey: '',
    claudeModel:     'claude-opus-4-6',
    public: {},
  },

  app: {
    head: {
      script: [{
        // Prevent flash of wrong theme — runs before page renders
        children: `(function(){var d=localStorage.getItem('darkMode');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(d==='1'||(d===null&&p))document.documentElement.classList.add('dark')})()`,
        type: 'text/javascript',
      }],
    },
  },

  experimental: {
    appManifest: false,
  },

  nitro: {
    preset: 'netlify',
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },
})
