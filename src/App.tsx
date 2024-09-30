import Dong from './dong';

function App() {
    const [elements, setElements] = Dong.useState([1, 2, 3, 4, 5]);
    const [data, setData] = Dong.useState(114514);
    return (
        <div id="app">
            <h1 onClick={() => setData((temp: any) =>temp+1 )}>MiniReact,点击触发一次useState</h1>
            <h2>{data}</h2>
            <button onClick={() => setElements((temp: any) => [...temp, 114])}>点击触发一次useState
            </button>
            <ul>
                {elements.map((item: any, index: any) => {
                    return (
                        <li key={index}>{item}</li>
                    );
                })}
            </ul>


        </div>
    );
}

// 渲染组件
const root = document.getElementById("root");
if (root) {
    Dong.render(<App/>, root);
}
