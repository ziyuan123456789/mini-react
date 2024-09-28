## MiniReact
非常简单的React仿写
### 项目介绍
- **JSX 渲染**：支持 JSX 语法,将虚拟 DOM 转换为真实 DOM
- **虚拟 DOM**：模仿React实现了一版虚拟DOM
- **Fiber 架构**：实现了 Fiber 算法 能够在浏览器空闲时间分块执行渲染任务 不过调度应该是有点毛病,卡卡的
- **函数式组件**：支持简单的函数式组件 
- **Hooks 实现**：项目中实现了基础的 `useState`，用于管理组件内的状态 并能够触发组件重新渲染

### 相似项目链接
[AutumnFramework:简单的SpringBoot仿写]('https://github.com/ziyuan123456789/AutumnFramework')


### 使用方法
```shell
npm run dev
```

### 示例代码
```js
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

const root = document.getElementById("root");
if (root) {
    Dong.render(<App />, root);
}

```

### 夹带私货
- React这个心智负担真的恶心,整的什么函数式+Hooks一般人真玩不来,每次被迫写React都想着Vue的好,都是打工仔写Vue早下班不香吗?