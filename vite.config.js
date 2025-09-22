import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";
// gzip压缩
import viteCompression from 'vite-plugin-compression'
// 打包配置
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g
const DRIVE_LETTER_REGEX = /^[a-z]:/i

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: 'static',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {  //静态资源分类打包
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',

        // TODO: 处理GitHub Pages 部署 _plugin-vue_export-helper.js 404
        sanitizeFileName(name) {
          const match = DRIVE_LETTER_REGEX.exec(name)
          const driveLetter = match ? match[0] : ''
          // A `:` is only allowed as part of a windows drive letter (ex: C:\foo)
          // Otherwise, avoid them because they can refer to NTFS alternate data streams.
          return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, '')
        },

        manualChunks(id) { //静态资源拆分打包
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }

      }

    },
    sourcemap: true
  },
  plugins: [
    vue(), vueJsx(), viteCompression({
      filter: /\.(js|css|json|txt|html|ico|svg|png|map)(\?.*)?$/i, // 需要压缩的文件
      threshold: 1024, // 文件容量大于这个值进行压缩
      algorithm: 'gzip', // 压缩方式
      ext: 'gz', // 后缀名
      deleteOriginFile: false, // 压缩后是否删除压缩源文件
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
