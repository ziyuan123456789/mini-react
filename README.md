## MiniReact
非常简单的React仿写
### 项目介绍
- **JSX 渲染**：支持 JSX 语法,将虚拟 DOM 转换为真实 DOM
- **虚拟 DOM**：模仿React实现了一版虚拟DOM
- **Fiber 架构**：实现了 Fiber 算法 能够在浏览器空闲时间分块执行渲染任务 不过调度应该是有点毛病,卡卡的
- **函数式组件**：支持简单的函数式组件 
- **useState Hooks 实现**：项目中实现了基础的 `useState`用于管理组件内的状态 并能够触发组件重新渲染
- **useEffect Hooks 实现**：
- **简易Diff 算法**：可与进行准确更新真实DOM
### 相似项目链接
[AutumnFramework:简单的SpringBoot仿写](https://github.com/ziyuan123456789/AutumnFramework)


### 使用方法
```shell
npm run dev
```
推荐打开F12观察代码执行流程
从JSX语法生成虚拟DOM,再到初次真实DOM的生成,再到Fiber算法的调度,再到Hooks的触发,再到DIFF算法的变更查找,再到真实DOM的更新,再到最后的渲染
### 示例代码
```js
import Dong from './dong';

function App() {
    const [elements, setElements] = Dong.useState([1, 2, 3, 4, 5]);
    const [data, setData] = Dong.useState(114514);
    return (
        <div id="app">
            <h1 onClick={() => setData((temp: any) => temp + 1)}>MiniReact,点击触发一次useState</h1>
            <h2>{data}</h2>
            <button onClick={() => setElements((temp: any) => [...temp, ...temp])}>点击触发一次useState,复制数组  [...temp, ...temp]
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

```

### 夹带私货
- React这个心智负担真的恶心,整的什么函数式+Hooks一般人真玩不来,每次被迫写React都想着Vue的好,都是打工仔写Vue早下班不香吗?
### 源码:
```js
//暴露接口给Babel,在vite.config文件里指定这个方法为处理器,避免手动的显示调用
function createElement(type: string, props: any, ...children: any[]): any {
    console.log("createElement生成的原始虚拟DOM如下")
    if (type == undefined) {
        console.error("ERROR")
    }
    console.log({
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                    ? child
                    : createTextElement(child)
            ),
        }
    })
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                    ? child
                    : createTextElement(child)
            ),
        }
    };
}

//进行文本节点处理,给予一个简单的TEXT_ELEMENT标记
function createTextElement(text: string): any {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}


let nextFiberReconcileWork: any = null; //指向下一个待处理的节点
let wipRoot: any = null;//表示当前正在构建的Fiber根节点
let currentRoot: any = null; //保存当前已经提交的 Fiber 树根节点
let deletions: any[] = [];//保存需要删除的 Fiber 节点
let currentFiber: any = null; // 当前工作的 fiber
let hookIndex = 0; // 用于追踪当前 hooks 的索引

//render函数,进行渲染
export function render(element: any, container: HTMLElement): void {
    wipRoot = {
        dom: container, //渲染的目标容器
        props: {
            children: [element], //虚拟dom
        },
        alternate: currentRoot //当前根Fiber树存入wipRoot.alternate
    };
    nextFiberReconcileWork = wipRoot;//wipRoot作为下一次要处理的Fiber
    // console.log("render阶段结束,生成的wiproot如下")
    // console.log(wipRoot)
}

//注册到空闲回调

requestIdleCallback(workLoop);


//工作循环,从空闲循环中取得deadline参数,可以获取允许继续运行的时间
function workLoop(deadline: IdleDeadline): void {
    //是否让出
    let shouldYield = false;
    //当存在下一个work并且允许继续运行
    while (nextFiberReconcileWork && !shouldYield) {
        //执行下一个work,因为前驱指针和兄弟指针的存在,所以可以随时恢复之前的进度,在正常的DFS中走到一个节点是无法一下子找到兄弟节点的
        nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
        //空闲时间耗尽,让出
        shouldYield = deadline.timeRemaining() < 1;
        if (shouldYield) {
            console.error("空闲时间耗尽，生成虚拟 DOM 被打断，等待下次调度以便从上次中断的地方继续");
            // alert("空闲时间耗尽，生成虚拟 DOM 被打断，等待下次调度以便从上次中断的地方继续");
        }
    }
    //fiber节点都处理完了,就提交
    if (!nextFiberReconcileWork && wipRoot) {
        commitRoot();
    }
    //注册到空闲回调中
    requestIdleCallback(workLoop);
}

//手动进行的DFS
function performNextWork(fiber: any): any {
    currentFiber = fiber;  // 设置当前工作的 fiber

    // 仅在函数组件时重置 hookIndex 和初始化 hooks 数组
    if (typeof fiber.type === 'function') {
        hookIndex = 0;  // 每次执行函数组件时，重置 hookIndex
        fiber.hooks = [];  // 初始化 hooks 数组
    }

    // 协调
    reconcile(fiber);

    // 返回指向下一个的 fiber
    if (fiber.child) {
        return fiber.child;
    }

    // 如果没有子节点，就找兄弟节点
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        // 没有兄弟节点就回溯到父节点继续找兄弟节点
        nextFiber = nextFiber.return;
    }
    // 当 Fiber 树遍历完成时返回 null
    return null;
}


//协调
function reconcile(fiber: any): void {
    if (typeof fiber.type === 'function') {
        // 执行这个函数 并将返回的 JSX 结构作为新的子元素
        const child = fiber.type(fiber.props);
        if (Array.isArray(child)) {
            // 处理多个子元素
            reconcileChildren(fiber, child);
        } else {
            // 单个子元素,也包装为数组处理
            reconcileChildren(fiber, [child]);
        }
    } else {
        // 如果 fiber 不是函数式组件就直接创建 DOM
        //如果fiber节点不存在dom,比如说还没有遍历到这个节点或者第一次渲染
        if (!fiber.dom) {
            //给他创建一份
            fiber.dom = createDom(fiber);
        }
        //协调子元素
        const children = fiber.props?.children || [];
        reconcileChildren(fiber, children);
    }
}

//深对比,最小颗粒度进行,避免子元素过多影响父元素
function shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    //如果 key 数量不同直接返回 false
    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        const value1 = obj1[key];
        const value2 = obj2[key];
        if (key === 'children') {
            // 处理 children 是数组的情况
            if (Array.isArray(value1) && Array.isArray(value2)) {
                if (value1.length !== value2.length) return false;
                if (value1.length > 1) {
                    for (let i = 0; i < value1.length; i++) {
                        if (value1[i].type !== value2[i].type) {
                            return false;
                        }
                    }
                } else if (value1.length === 1) {
                    if (!Array.isArray(value1[0])) {
                        return value1[0].props.nodeValue === value2[0].props.nodeValue;
                    }

                }
            }
        } else {
            //对于监听器进行特殊处理,即使方法体一致但是函数内存地址也不一样,所以用===次次更新
            if (key.startsWith('on') && typeof value1 === 'function' && typeof value2 === 'function') {
                continue;
            }
            if (value1 !== value2) return false;
        }
    }

    return true;
}


//diff算法入口
function diff(oldfiber: any, newfiber: any): boolean {
    //俩对象指针一致,无需比较肯定一样
    if (oldfiber === newfiber) return true;
    //如果类型不一样,那肯定要更新
    if (oldfiber.type !== newfiber.type) return false;
    //进行深比对
    return shallowEqual(oldfiber.props, newfiber.props);
}



//协调子元素
function reconcileChildren(wipFiber: any, elements: any[]): void {
    let index = 0;
    let prevSibling: any = null;

    // 获取上一次渲染时的 Fiber 树
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    //对数组打平,为了适配JSX的循环,例如使用List.map方法一次性创建多个元素
    let flattenedElements = elements.flat();
    //进行循环遍历
    while (index < flattenedElements.length || oldFiber != null) {
        //遍历子元素,获取元素
        let element = flattenedElements[index];
        //文本节点进行特殊处理
        if (typeof element !== "object") {
            element = createTextElement(element);
        }
        let newFiber = null;

        const sameType = oldFiber && element && element.type === oldFiber.type;
        if (sameType) {
            //进行DIFF算法
            const shouldUpdate = !diff(element, oldFiber);
            if (shouldUpdate) {
                // 类型相同，但 props 不同，需要更新
                console.error("节点与上一课fiber树不一致,需要进行节点更新,更新的fiber如下")

                newFiber = {
                    type: oldFiber.type,
                    props: element.props,
                    dom: oldFiber.dom,
                    return: wipFiber,
                    alternate: oldFiber,
                    effectTag: "UPDATE",
                };
                alert("节点与上一课fiber树不一致,需要进行节点更新：" + JSON.stringify(newFiber.props));

                console.log(newFiber)
                console.log(oldFiber)
            } else {
                // 类型相同，props 相同，不需要更新
                newFiber = {
                    type: oldFiber.type,
                    props: element.props,
                    dom: oldFiber.dom,
                    return: wipFiber,
                    alternate: oldFiber,
                    effectTag: "",
                };
            }
        } else {
            if (element) {
                // 如果类型不同，创建新的 Fiber 节点
                newFiber = {
                    type: element.type,
                    props: element.props,
                    dom: null,
                    return: wipFiber,
                    alternate: null,
                    effectTag: "PLACEMENT",
                };
            }

            if (oldFiber) {
                // 如果类型不同，还要标记旧的 Fiber 节点为删除
                oldFiber.effectTag = "DELETION";
                deletions.push(oldFiber);
            }
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (prevSibling) {
            prevSibling.sibling = newFiber;
        }
        console.log("协调后的虚拟DOM如下")
        prevSibling = newFiber;
        console.log(prevSibling)
        index++;
    }
}

function commitRoot() {
    // 首先处理需要删除的节点
    deletions.forEach(commitWork);
    // 清空删除列表
    deletions = [];
    commitWork(wipRoot.child);
    // 在提交后更新 currentRoot
    currentRoot = wipRoot;
    wipRoot = null;
}

//提交工作
function commitWork(fiber: any): void {
    if (!fiber) {
        return;
    }

    let domParentFiber = fiber.return;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.return;
    }

    const domParent = domParentFiber.dom;
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
        console.log("节点插入");
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
        console.log("节点删除");
        return; // 删除时，不需要继续遍历子节点
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber: any, domParent: any): void {
    if (!fiber) return;
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }

    commitDeletion(fiber.sibling, domParent);
}




//创建真实DOM
function createDom(fiber: any): HTMLElement | Text {
    //判断一下类型,如果文本就创建文本节点
    let dom;
    if (fiber.type == "TEXT_ELEMENT") {
        dom = document.createTextNode(fiber.props.nodeValue);
    } else {
        dom = document.createElement(fiber.type == undefined ? "div" : fiber.type);
    }

    for (const prop in fiber.props) {
        //进行属性设置
        setAttribute(dom, prop, fiber.props[prop]);
    }
    console.log("真实DOM如下:")
    console.log(dom)
    return dom;
}
//检测是否为监听器?
function isEventListenerAttr(key: string, value: any): boolean {
    return typeof value == 'function' && key.startsWith('on');
}
//检测是不是要添加style
function isStyleAttr(key: string, value: any): boolean {
    return key == 'style' && typeof value == 'object';
}
//是一个普通属性吗
function isPlainAttr(_key: string, value: any): boolean {
    return typeof value != 'object' && typeof value != 'function';
}

const setAttribute = (dom: HTMLElement, key: string, value: any): void => {
    // 1. 如果属性名是 'children'，直接返回，不做任何处理
    if (key === 'children') {
        return;
    }

    // 2. 如果属性名是 'nodeValue'，表示这是文本节点，直接设置元素的 textContent 为该值
    if (key === 'nodeValue') {
        dom.textContent = value;
    }
    // 3. 检查属性是否为事件监听器
    else if (isEventListenerAttr(key, value)) {
        // 如果是事件监听器，获取事件类型（去掉 'on' 前缀并转换为小写）
        const eventType = key.slice(2).toLowerCase();
        // 为该 DOM 元素添加相应的事件监听器
        dom.addEventListener(eventType, value);
    }
    // 4. 检查属性是否是样式属性（style）
    else if (isStyleAttr(key, value)) {
        // 如果是样式对象，将样式对象的属性应用到 DOM 元素的 style 上
        Object.assign(dom.style, value);
    }
    // 5. 检查属性是否是普通属性
    else if (isPlainAttr(key, value)) {
        // 如果是普通属性，使用 setAttribute 将属性和值设置到 DOM 元素上
        dom.setAttribute(key, value);
    }
};
function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any) {
    // 处理文本节点
    if (dom instanceof Text) {
        if (prevProps.nodeValue !== nextProps.nodeValue) {
            dom.nodeValue = nextProps.nodeValue;
        }
        return;
    }

    // 移除旧的事件监听器
    Object.keys(prevProps)
        .filter(isEventListenerAttr)
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.removeEventListener(eventType, prevProps[name]);
        });

    // 添加新的事件监听器
    Object.keys(nextProps)
        .filter(isEventListenerAttr)
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, nextProps[name]);
        });

    // 移除旧的属性
    Object.keys(prevProps)
        .filter(isPlainAttr)
        .forEach(name => {
            if (!(name in nextProps)) {
                dom.removeAttribute(name);
            }
        });

    // 设置新的属性
    Object.keys(nextProps)
        .filter(isPlainAttr)
        .forEach(name => {
            if (prevProps[name] !== nextProps[name]) {
                dom.setAttribute(name, nextProps[name]);
            }
        });

    // 更新样式属性
    if (prevProps.style) {
        Object.keys(prevProps.style).forEach(key => {
            if (!nextProps.style || !(key in nextProps.style)) {
                dom.style[key] = "";
            }
        });
    }

    if (nextProps.style) {
        Object.keys(nextProps.style).forEach(key => {
            if (!prevProps.style || prevProps.style[key] !== nextProps.style[key]) {
                dom.style[key] = nextProps.style[key];
            }
        });
    }
}

export function useState(initialValue: any) {
    const oldHook =
        currentFiber.alternate && currentFiber.alternate.hooks
            ? currentFiber.alternate.hooks[hookIndex]
            : null;

    const hook = {
        state: oldHook ? oldHook.state : initialValue,
        queue: oldHook ? oldHook.queue : []
    };

    //处理队列中的所有动作
    hook.queue.forEach((action: (arg0: any) => any) => {
        console.log("处理hooks中")
        console.log('action', action);
        hook.state = action(hook.state);
    });

    //清空队列防止重复处理,不加这一句就第n次触发hooks的时候会重复执行n次
    hook.queue.length = 0;

    const setState = (action: any) => {
        console.log("setState调用")
        hook.queue.push(typeof action === 'function' ? action : () => action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        nextFiberReconcileWork = wipRoot;
        console.log("useState造成重新渲染")
        requestIdleCallback(workLoop);
    };

    currentFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}

const Dong = {
    createElement,
    render,
    useState
};

export default Dong;
```