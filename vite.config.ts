import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'Dong.createElement',  // 使用自定义JSX工厂函数
    jsxFragment: 'Fragment',           // Fragment处理
  },
});
