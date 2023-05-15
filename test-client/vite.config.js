/*
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-05-12 14:33:46
 * @LastEditors: Libra
 * @Description:
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.ELECTRON ? './' : '/',
  plugins: [vue()],
  server: {
    https: {
      key: fs.readFileSync('./src/ssl/libra.key'),
      cert: fs.readFileSync('./src/ssl/libra.pem')
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
