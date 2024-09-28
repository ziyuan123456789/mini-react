import Dong from './dong';

function App() {
    const [count, setCount] = Dong.useState(114514);
    return (
        <div id="app">
            <h1>Fuck React</h1>
            <ul>
                <li onClick={()=>fx(count,setCount)}>{count}</li>
                <li>Item 2</li>
            </ul>
        </div>
    );
}

function fx(count:any,setCount:any){
    setCount(Math.ceil(Math.random()*10))
    console.log(count)
}


// 渲染组件
const root = document.getElementById("root");
if (root) {
    Dong.render(<App />, root);
}
