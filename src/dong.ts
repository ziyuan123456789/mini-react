//暴露接口给Babel,在vite.config文件里指定这个方法为处理器,避免手动的显示调用
//在function App() 中 return里的内容每一个节点都会调用一次这个方法
function createElement(type: string, props: any, ...children: any[]): any {
    console.log("createElement生成的原始虚拟DOM如下")
    if (type == undefined) {
        console.error("ERROR")
    }
    const filter = children
        .flat()
        .filter(child => child != null && typeof child !== 'boolean');
    console.log({
        type,
        props: {
            ...props,
            children: filter.map(child =>
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
            children: filter.map(child =>
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
    console.log("render阶段结束,生成的wipRoot如下")
    console.log(wipRoot)
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
            console.warn("空闲时间耗尽，生成虚拟 DOM 被打断，等待下次调度以便从上次中断的地方继续");
        }
    }
    if (nextFiberReconcileWork) {
        requestIdleCallback(workLoop);
    }
    //fiber节点都处理完了,就提交
    if (!nextFiberReconcileWork && wipRoot) {
        commitRoot();
    }
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
                    if (Array.isArray(value1[0])) {
                        console.error(value1[0])
                    }

                    if (!Array.isArray(value1[0])) {
                        return value1[0].props.nodeValue === value2[0].props.nodeValue;
                    }

                }
            }
        } else {
            //对于监听器进行特殊处理,即使方法体一致但是函数内存地址也不一样,所以用===就造成次次更新
            if (key.startsWith('on') && typeof value1 === 'function' && typeof value2 === 'function') {
                return value1 === value2;
            }
            if (!deepEqual(value1, value2)) {
                return false;
            }
        }
    }

    return true;
}

const deepEqual = (obj1: any, obj2: any) => {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
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
                console.warn("节点与上一课fiber树不一致,需要进行节点更新,更新的fiber如下")

                newFiber = {
                    type: oldFiber.type,
                    props: element.props,
                    dom: oldFiber.dom,
                    return: wipFiber,
                    alternate: oldFiber,
                    effectTag: "UPDATE",
                };
                // alert("节点与上一课fiber树不一致,需要进行节点更新：" + JSON.stringify(newFiber.props));

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
    // 提交渲染工作，更新 DOM
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
    runEffects(currentRoot.child);
}

function runEffects(fiber: { hooks: any[]; child: any; sibling: any; }) {
    if (!fiber) return;

    if (fiber.hooks) {
        fiber.hooks.forEach((hook) => {
            if (hook.effect && hook.hasEffect) {
                if (hook.cleanup) {
                    hook.cleanup();
                }
                hook.cleanup = hook.effect();
                hook.hasEffect = false;
            }
        });
    }

    runEffects(fiber.child);
    runEffects(fiber.sibling);
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
        domParent.classList.add("fade-in-border");
        setTimeout(() => {
            domParent.classList.remove("fade-in-border");
        }, 3000);
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
    else if (key === 'className') {
        dom.setAttribute('class', value);
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
    //useref
    else if (key === 'ref' && typeof value === 'object') {
        value.current = dom;
    }
    // 5. 检查属性是否是普通属性
    else if (isPlainAttr(key, value)) {
        // 如果是普通属性，使用 setAttribute 将属性和值设置到 DOM 元素上
        dom.setAttribute(key, value);
    }
};
function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any) {
    if (dom instanceof Text) {
        if (prevProps.nodeValue !== nextProps.nodeValue) {
            dom.nodeValue = nextProps.nodeValue;
        }
        return;
    }

    Object.entries(prevProps)
        .filter(([key, value]) => isEventListenerAttr(key, value))
        .forEach(([name, value]) => {
            const eventType = name.toLowerCase().substring(2);
            dom.removeEventListener(eventType, value as EventListener);
        });


    Object.entries(nextProps)
        .filter(([key, value]) => isEventListenerAttr(key, value))
        .forEach(([name, value]) => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, value as EventListener);
        });

    // 移除旧的属性
    Object.keys(prevProps)
        .filter((key) => isPlainAttr(key, prevProps[key]))
        .forEach((name) => {
            if (!(name in nextProps)) {
                dom.removeAttribute(name);
            }
        });

    Object.keys(nextProps)
        .filter((key) => isPlainAttr(key, nextProps[key]))
        .forEach((name) => {
            if (prevProps[name] !== nextProps[name]) {
                dom.setAttribute(name, nextProps[name]);
            }
        });

    if (prevProps.style) {
        Object.keys(prevProps.style).forEach((key) => {
            if (!nextProps.style || !(key in nextProps.style)) {
                (dom as HTMLElement).style[key as any] = "";
            }
        });
    }

    if (nextProps.style) {
        Object.keys(nextProps.style).forEach((key) => {
            if (!prevProps.style || prevProps.style[key] !== nextProps.style[key]) {
                (dom as HTMLElement).style[key as any] = nextProps.style[key];
            }
        });
    }

    (dom as HTMLElement).classList.add("fade-in-border");
    setTimeout(() => {
        (dom as HTMLElement).classList.remove("fade-in-border");
    }, 3000);

}


//useState实现
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
        console.log("调用useState造成重新渲染")
        while (nextFiberReconcileWork ) {
            //执行下一个work,因为前驱指针和兄弟指针的存在,所以可以随时恢复之前的进度,在正常的DFS中走到一个节点是无法一下子找到兄弟节点的
            nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
        }
        //fiber节点都处理完了,就提交
        if (!nextFiberReconcileWork && wipRoot) {
            commitRoot();
        }
    };

    currentFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}


// useEffect 实现
export function useEffect(callback: Function, deps?: any[]) {
    const oldHook =
        currentFiber.alternate && currentFiber.alternate.hooks
            ? currentFiber.alternate.hooks[hookIndex]
            : null;

    let hasChangedDeps;
    if (!oldHook) {
        hasChangedDeps = true;
    } else {
        hasChangedDeps = deps ? deps.some((dep, i) => !Object.is(dep, oldHook.deps[i])) : true;
    }

    const hook = {
        deps,
        effect: callback,
        cleanup: oldHook ? oldHook.cleanup : null,
        hasEffect: hasChangedDeps,
    };

    currentFiber.hooks.push(hook);
    hookIndex++;
}

// useMemo 实现
export function useMemo(callback: Function, deps?: any[]) {
    const oldHook =
        currentFiber.alternate && currentFiber.alternate.hooks
            ? currentFiber.alternate.hooks[hookIndex]
            : null;

    let hasChangedDeps = false;
    let memoizedValue;

    if (!oldHook) {
        hasChangedDeps = true;
    } else {
        if (deps) {
            hasChangedDeps = deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
        } else {
            hasChangedDeps = true;
        }
    }

    if (hasChangedDeps) {
        memoizedValue = callback();
    } else {
        memoizedValue = oldHook.memoizedValue;
    }

    const hook = {
        memoizedValue: memoizedValue,
        deps: deps,
    };

    currentFiber.hooks.push(hook);
    hookIndex++;
    return memoizedValue;
}


// useCallback 实现
export function useCallBack(callback: Function, deps?: any[]) {
    const oldHook =
        currentFiber.alternate && currentFiber.alternate.hooks
            ? currentFiber.alternate.hooks[hookIndex]
            : null;

    let hasChangedDeps;

    if (!oldHook) {
        hasChangedDeps = true;
    } else {
        if (deps) {
            hasChangedDeps = deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
        } else {
            hasChangedDeps = true;
        }
    }

    const hook = {
        callback: hasChangedDeps ? callback : oldHook.callback,
        deps: deps,
    };

    currentFiber.hooks.push(hook);
    hookIndex++;

    return hook.callback;
}


// useAware 实现,他不是一个hook
export function useAware() {
    const seen = new Set();

    function replacer(key: any, value: any) {
        if (key === 'dom' || key === 'alternate') {
            return '[忽略]';
        }
        if (key === 'props' && typeof value === 'object' && value !== null) {
            const filteredProps = {};
            Object.keys(value).forEach((propKey) => {
                if (propKey === 'children' || typeof value[propKey] !== 'function') {
                    // @ts-ignore
                    filteredProps[propKey] = value[propKey];
                }
            });
            return filteredProps;
        }
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[循环引用]';
            }
            seen.add(value);
        }
        return value;
    }
    return  [JSON.stringify(wipRoot, replacer, 2), wipRoot];
}


export function useRef(initialValue: any) {
    const oldHook =
        currentFiber.alternate && currentFiber.alternate.hooks
            ? currentFiber.alternate.hooks[hookIndex]
            : null;


    const hook = oldHook || {current: initialValue};

    currentFiber.hooks.push(hook);
    hookIndex++;

    return hook;
}






const Dong = {
    createElement,
    render,
    useState,
    useEffect,
    useAware,
    useCallBack,
    useRef,
    useMemo
};

if (typeof window !== 'undefined') {
    (window as any).Dong = Dong;
}
export default Dong;
