import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente que o Studio injetou
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve((process as any).cwd(), "src"),
      },
    },
    // A MÁGICA: Injeta a chave do servidor no código do navegador
    define: {
      'process.env.API_KEY': JSON.stringify(env.GOOGLE_API_KEY || env.API_KEY || process.env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0', // Garante que rode em qualquer IP no preview
      port: 8080
    }
  }
})