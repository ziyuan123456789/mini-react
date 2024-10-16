import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'Dong.createElement',  // 使用自定义JSX工厂函数
    jsxFragment: 'Fragment',           // Fragment处理
  },
  build: {
    lib: {
      entry: './src/dong.ts',           // 定义入口文件
      name: 'Dong',                     // 导出的库名称
      fileName: 'dong',                 // 输出的文件名称
      formats: ['umd'],                 // 使用 UMD 格式
    },
    rollupOptions: {
      output: {
        exports: 'named',               // 解决 named 和 default exports 一起使用的警告
        entryFileNames: '[name].umd.js', // 强制生成 .js 文件扩展名
      },
    },
  },
});
