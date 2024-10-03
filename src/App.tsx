import Dong from './dong';

function App() {
    const [elements, setElements] = Dong.useState([1, 2, 3, 4, 5]);
    const [data, setData] = Dong.useState(114514);
    const vDom = Dong.useAware();
    Dong.useEffect(() => {
        alert("这是一个空数组依赖useEffect, 页面加载会运行一次");
        return () => {
            console.log("清理副作用");
        };
    }, []);
    Dong.useEffect(() => {
        alert("这个useEffect依赖于data, 页面加载会运行一次, data变动时也会触发，当前值为 " + data);
        return () => {
            console.log("清理副作用");
        };
    }, [data]);

    return (
        <div id="app">
            <h1 onClick={() => setData((temp: any) => temp + 1)}>MiniReact,点击触发一次useState</h1>
            <h2>{data}</h2>
            <button onClick={() => setElements((temp: any) => [...temp, ...temp])}>点击触发一次useState,复制数组
                [...temp, ...temp]
            </button>
            <ul>
                {elements.map((item: any, index: any) => {
                    return (
                        <li key={index}>{item}</li>
                    );
                })}
            </ul>
            <div>
                <h2 style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: '#333',
                }}>虚拟 DOM 展示</h2>
                <pre>{vDom}</pre>
            </div>
        </div>
    );
}

// 渲染组件
const root = document.getElementById("root");
if (root) {
    Dong.render(<App/>, root);
}
