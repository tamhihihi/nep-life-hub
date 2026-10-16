import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'esnext',
    // Tự động phân tách các thư viện nặng thành các tệp riêng biệt
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-effects';
            }
            return 'vendor-core';
          }
        },
      },
    },
    // Tối ưu ngưỡng cảnh báo kích thước tệp
    chunkSizeWarningLimit: 600,
  },
});