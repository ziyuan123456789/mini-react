import * as esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['src/App.tsx'],
    outfile: 'app.transpiled.js',
    bundle: false,
    format: 'esm',
    jsxFactory: 'Dong.createElement',
    jsxFragment: 'Fragment',
    loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
    },
    logLevel: 'info',
}).then(() => {
    console.log('✔ JSX 转换完成（使用 Dong.createElement）');
});
