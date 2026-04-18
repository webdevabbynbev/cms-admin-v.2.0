import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['zod', 'react-is'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['antd', '@ant-design/icons', 'antd/es'],
          charts: ['recharts'],
          utils: ['dayjs', 'axios', 'crypto-js', 'papaparse'],
          forms: ['react-quill', '@tiptap/react', '@tiptap/starter-kit'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit
  }
})
