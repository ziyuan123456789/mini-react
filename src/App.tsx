import Dong from './dong';

declare const echarts: any;

function App() {
    const [elements, setElements] = Dong.useState([1, 2, 3, 4, 5]);
    const [data, setData] = Dong.useState(114514);
    const [backgroundColor, setBackgroundColor] = Dong.useState("");
    const [xData, setXData] = Dong.useState([]);
    const [yData, setYData] = Dong.useState([]);
    const [vDomString]=Dong.useAware();

    const inputRef = Dong.useRef(null);

    const chartRef = Dong.useRef(null);


    const handleRef = Dong.useCallBack(() => {
        alert(inputRef.current?.value);
    }, []);

    Dong.useEffect(() => {
        const realDomContainer = document.getElementById('realdom');
        if (realDomContainer) {
            realDomContainer.innerHTML = `
        <h1>虚拟 DOM 展示</h1>
        <h5>来自useEffect的消息:这是一个空数组依赖useEffect, 页面加载会运行一次</h5>
        <div>这段内容已脱离虚拟DOM管理,MiniReact无法感知到这部分的变化</div>
        <pre>${Dong.useAware()[0]}</pre>`;
        }
        return () => {
            console.log("清理副作用");
        };
    }, []);

    const testFunction = () => {
        console.log('愚蠢的的MiniReact并不知道函数到底变了没');
    };

    const testFunctionWithUseCallBack =Dong.useCallBack(()=> {
        console.log('愚蠢的的MiniReact还是并不知道函数到底变了没,所以他打算引入一些外援');
    }, []);

    const [functionHandler] = Dong.useState(testFunction);

    const [functionHandlerWithUseCallBack] = Dong.useState(testFunctionWithUseCallBack);

    Dong.useEffect(() => {
        if (testFunction===functionHandler) {
            console.log('第一次运行,所以引用相同');
        } else {
            console.log('什么事情都是第一次好,第二次就不是一个感觉了');
        }
    });

    Dong.useEffect(() => {
        if (testFunctionWithUseCallBack===functionHandlerWithUseCallBack) {
            console.log('useCallBack生效中');
        } else {
            console.log('useCallBack失效了');
        }
    });

    Dong.useEffect(()=>{
        const realDomContainer = document.getElementById('realdom');
        if (realDomContainer) {
            realDomContainer.innerHTML = `
        <h2>虚拟 DOM 展示</h2>
        <div>这段内容已脱离虚拟DOM管理,MiniReact无法感知到这部分的变化</div>
        <pre>${Dong.useAware()[0]}</pre>
    `;
        }
    },[vDomString])

    Dong.useEffect(() => {
        const realDomContainer = document.getElementById('realdom');
        if (realDomContainer) {
            realDomContainer.innerHTML = `
        <h1>虚拟 DOM 展示</h1>
        <h5>来自useEffect的消息:这个useEffect依赖于data, 页面加载会运行一次, data变动时也会触发，当前值为 ${data}</h5>
        <div>这段内容已脱离虚拟DOM管理,MiniReact无法感知到这部分的变化</div>
        <pre>${Dong.useAware()[0]}</pre>`;
        }
        return () => {
            console.log("清理副作用");
        };
    }, [data]);

    const generateRandomColor = Dong.useCallBack(() => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }, []);



    const handleClick = Dong.useCallBack(() => {
        setData((temp: number) => temp + 1);
        setBackgroundColor(generateRandomColor());
    }, [generateRandomColor]);


    Dong.useEffect(() => {
        setTimeout(() => {
            const chartDom = chartRef.current;
            if (!chartDom) return;

            const myChart = echarts.init(chartDom);

            setXData(() => [...xData, 1]);
            setYData(() => [...xData, 1]);
            const option = {
                xAxis: {
                    type: 'category',
                    data: xData,
                },
                yAxis: {
                    type: 'value',
                },
                series: [
                    {
                        data: yData,
                        type: 'bar',
                    },
                ],
            };

            myChart.setOption(option);

            return () => {
                myChart.dispose();
            };
        }, 0);
    }, [data]);



    return (
        <div id="app">
            <h1
                style={{backgroundColor: backgroundColor, transition: 'background 0.5s'}} onClick={handleClick}
            >
                MiniReact - 点击触发一次 useState
            </h1>
            <h2>打开F12查看MiniReact工作详情 当差异出现会绘制一个淡蓝色的边框包裹住更新的元素</h2>
            <h2>{data}</h2>
            <input ref={inputRef}/>
            <button onClick={handleRef}>点击获取输入框内容</button>
            <button
                onClick={Dong.useCallBack(() => setElements((temp: any) => [...temp, ...temp]), [])}>点击触发一次useState,复制数组
                [...temp, ...temp]
            </button>
            <div ref={chartRef} style={{width: "600px", height: "400px"}}></div>
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

const realDomContainer = document.getElementById('realdom');
if (realDomContainer) {
    realDomContainer.innerHTML = `
        <h2>虚拟 DOM 展示</h2>
        <div>这段内容已脱离虚拟DOM管理,MiniReact无法感知到这部分的变化</div>
        <pre>${Dong.useAware()[0]}</pre>
    `;
}
