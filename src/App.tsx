import Dong from './dong';

declare const echarts: any;

function Square({value, onSquareClick}) {
    return (
        <div
            style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#f4f4f4',
                border: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
            }}
            onClick={onSquareClick}
        >
            {value}
        </div>
    );
}


const Board = ({xIsNext, squares, onPlay}) => {
    function handleClick(i) {
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        const nextSquares = squares.slice();
        if (xIsNext) {
            nextSquares[i] = 'X';
        } else {
            nextSquares[i] = 'O';
        }
        onPlay(nextSquares);
    }

    const winner = calculateWinner(squares);
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    } else {
        status = 'Next player: ' + (xIsNext ? 'X' : 'O');
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', marginBottom: '20px'}}>
            <div style={{fontSize: '20px', marginBottom: '20px'}}>{status}</div>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '5px'}}>
                <Square value={squares[0]} onSquareClick={() => handleClick(0)}/>
                <Square value={squares[1]} onSquareClick={() => handleClick(1)}/>
                <Square value={squares[2]} onSquareClick={() => handleClick(2)}/>
            </div>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '5px'}}>
                <Square value={squares[3]} onSquareClick={() => handleClick(3)}/>
                <Square value={squares[4]} onSquareClick={() => handleClick(4)}/>
                <Square value={squares[5]} onSquareClick={() => handleClick(5)}/>
            </div>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <Square value={squares[6]} onSquareClick={() => handleClick(6)}/>
                <Square value={squares[7]} onSquareClick={() => handleClick(7)}/>
                <Square value={squares[8]} onSquareClick={() => handleClick(8)}/>
            </div>
        </div>
    );
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

const Parent = () => {
    const [num, setNum] = Dong.useState(0);

    const computeResult = Dong.useMemo(() => {
        console.error("useMemo计算");
        return <h4>{num}</h4>
    }, [num])


    return (
        <div>
            {computeResult}
            <h5
                onClick={() => {
                    setNum(num + 1)
                }}
            >
                useMemo测试
            </h5>
        </div>
    );
};



function App() {
    const divRef = Dong.useRef(null);
    const [position, setPosition] = Dong.useState({
        x: 0,
        y: 0
    });
    const [history, setHistory] = Dong.useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = Dong.useState(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const [data, setData] = Dong.useState(114514);
    const [backgroundColor, setBackgroundColor] = Dong.useState("");
    const [xData, setXData] = Dong.useState([]);
    const [yData, setYData] = Dong.useState([]);
    const [vDomString] = Dong.useAware();

    const inputRef = Dong.useRef(null);

    const chartRef = Dong.useRef(null);

    const handlePointerMove = Dong.useCallBack((e) => {
        const divRect = divRef.current.getBoundingClientRect();
        const x = e.clientX - divRect.left;
        const y = e.clientY - divRect.top;
        setPosition({x, y});
    }, []);

    const handlePlay = Dong.useCallBack((nextSquares) => {
        const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }, [history, currentMove]);


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

    const testFunctionWithUseCallBack = Dong.useCallBack(() => {
        console.log('愚蠢的的MiniReact还是并不知道函数到底变了没,所以他打算引入一些外援');
    }, []);

    const [functionHandler] = Dong.useState(testFunction);

    const [functionHandlerWithUseCallBack] = Dong.useState(testFunctionWithUseCallBack);

    Dong.useEffect(() => {
        if (testFunction === functionHandler) {
            console.log('第一次运行,所以引用相同');
        } else {
            console.log('什么事情都是第一次好,第二次就不是一个感觉了');
        }
    });

    Dong.useEffect(() => {
        if (testFunctionWithUseCallBack === functionHandlerWithUseCallBack) {
            console.log('useCallBack生效中');
        } else {
            console.log('useCallBack失效了');
        }
    });

    Dong.useEffect(() => {
        const realDomContainer = document.getElementById('realdom');
        if (realDomContainer) {
            realDomContainer.innerHTML = `
        <h2>虚拟 DOM 展示</h2>
        <div>这段内容已脱离虚拟DOM管理,MiniReact无法感知到这部分的变化</div>
        <pre>${Dong.useAware()[0]}</pre>
    `;
        }
    }, [vDomString])

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
        <div id="app" style={{fontFamily: 'sans-serif', padding: '2rem', maxWidth: '960px', margin: '0 auto'}}>
            <h1 style={{backgroundColor, transition: 'background 0.5s', padding: '1rem', borderRadius: '8px'}}
                onClick={handleClick}>
                🎯 MiniReact - 点击触发一次 useState
            </h1>
            <p style={{color: '#888', fontSize: '15px'}}>
                当useState造成数据变动后,Diff算法会找出更新/插入的节点,绘制淡蓝色边框以提示组件发生了重新渲染
                如果没有妥善使用useCallBack/Memo,MiniReact会因为函数地址的变更认为组件变动,进行重绘
            </p>


            <section style={{marginTop: '2rem'}}>
                <h2>📘 React 官方教程的井字棋游戏</h2>
                <div className="game" style={{display: 'flex', justifyContent: 'center'}}>
                    <div className="game-board">
                        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay}/>
                    </div>
                </div>
            </section>

            <section style={{marginTop: '2rem'}}>
                <h2>🎈 来试一下移动小球</h2>
                <p style={{color: '#888', fontSize: '14px'}}>
                    在鼠标移动这样的情况中控制台频繁输出会造成掉帧,建议关闭 Console 提升帧率
                </p>
                <div
                    ref={divRef}
                    onPointerMove={handlePointerMove}
                    style={{
                        position: 'relative',
                        width: '40vw',
                        height: '40vh',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginTop: '1rem',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            backgroundColor: 'red',
                            borderRadius: '50%',
                            transform: `translate(${position.x - 10}px, ${position.y - 10}px)`,
                            width: '20px',
                            height: '20px',
                            transition: 'transform 0.05s linear',
                        }}
                    />
                </div>
            </section>

            <section style={{marginTop: '2rem'}}>
                <h2>🧪 useRef与useCallBack/useMemo测试</h2>
                <input ref={inputRef}
                       style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '200px'}}/>
                <button onClick={handleRef} style={{marginLeft: '1rem'}}>
                    点击获取输入框内容
                </button>
                <div ref={chartRef} style={{width: '400px', height: '400px'}}></div>
                <Parent/>
            </section>
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
