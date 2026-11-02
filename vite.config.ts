import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { handleAiChat } from './server/typhoon';

function localAiApi(): Plugin {
  return {
    name: 'hardware-quest-local-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', (request, response) => {
        void handleAiChat(request, response);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TYPHOON_');
  process.env.TYPHOON_API_KEY ||= env.TYPHOON_API_KEY;
  process.env.TYPHOON_MODEL ||= env.TYPHOON_MODEL;
  return { plugins: [react(), tailwindcss(), localAiApi()] };
});
