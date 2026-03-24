import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const certDir = path.resolve(__dirname, 'cert');
const hasCerts = fs.existsSync(path.join(certDir, 'signet.pem'));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'node:crypto': path.resolve(__dirname, 'src/lib/crypto-shim.ts'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    ...(hasCerts
      ? {
          https: {
            cert: fs.readFileSync(path.join(certDir, 'signet.pem')),
            key: fs.readFileSync(path.join(certDir, 'signet-key.pem')),
          },
        }
      : {}),
  },
});
