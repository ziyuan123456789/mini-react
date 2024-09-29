import Dong from './dong';

function App() {
    const [elements, setElements] = Dong.useState([1, 2, 3, 4, 5]);
    const [data, setData] = Dong.useState(114514);
    return (
        <div id="app">
            <h1 onClick={() => setData(Math.ceil(Math.random() * 10))}>点一下玩一年,不花一分钱</h1>
            <h2>{data}</h2>
            <ul>
                {elements.map((item, index) => {
                    return (
                        <li key={index}
                            onClick={() => setElements((temp: any) => [...temp, Math.ceil(Math.random() * 10)])}>{item}</li>
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
