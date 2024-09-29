//暴露接口给Babel,在vite.config文件里指定这个方法为处理器,避免手动的显示调用
function createElement(type: string, props: any, ...children: any[]): any {
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


let nextFiberReconcileWork: any = null;
let wipRoot: any = null;
let currentRoot: any = null; // 跟踪当前根节点
let deletions: any[] = [];

let currentFiber: any = null; // 当前工作的 fiber
let hookIndex = 0; // 用于追踪当前 hook 的索引

export function render(element: any, container: HTMLElement): void {
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
        alternate: currentRoot // 将 alternate 设置为 currentRoot
    };
    nextFiberReconcileWork = wipRoot;
}


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
    }
    //fiber节点都处理完了,就提交
    if (!nextFiberReconcileWork && wipRoot) {
        commitRoot();
    }
    //注册到空闲回调中
    requestIdleCallback(workLoop);
}

//注册到空闲回调
requestIdleCallback(workLoop);

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
            // 单个子元素，作为数组处理
            reconcileChildren(fiber, [child]);
        }
    } else {
        // 如果 fiber 不是函数式组件，就直接创建 DOM
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
            // 如果类型相同，则复用旧的 Fiber 节点，并更新属性
            //就假装做了diff吧,两科多叉树的完整比对还是别做了
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                return: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            };
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

        prevSibling = newFiber;
        index++;
    }
}

function commitRoot() {
    // 首先处理需要删除的节点
    deletions.forEach(commitWork);
    deletions = []; // 清空删除列表

    commitWork(wipRoot.child);
    currentRoot = wipRoot; // 在提交后更新 currentRoot
    wipRoot = null;
}


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
        // Find the next DOM sibling
        let nextDomSibling = getNextDomSibling(fiber);
        if (nextDomSibling && nextDomSibling.parentNode === domParent) {
            domParent.insertBefore(fiber.dom, nextDomSibling);
        } else {
            domParent.appendChild(fiber.dom);
        }
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
        return; // Stop further traversal
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}
function commitDeletion(fiber: any, domParent: any): void {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}


function getNextDomSibling(fiber: any): any {
    let sibling = fiber.sibling;
    while (sibling) {
        if (sibling.dom) {
            return sibling.dom;
        } else {
            const childDom = findNextDom(sibling);
            if (childDom) {
                return childDom;
            }
        }
        sibling = sibling.sibling;
    }
    return null;
}

function findNextDom(fiber: any): any {
    let child = fiber.child;
    while (child) {
        if (child.dom) {
            return child.dom;
        }
        const childDom = findNextDom(child);
        if (childDom) {
            return childDom;
        }
        child = child.sibling;
    }
    return null;
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

    // 处理队列中的所有动作
    hook.queue.forEach((action: (arg0: any) => any) => {
        //TODO:问题所在
        console.error('action', action);
        hook.state = action(hook.state);
    });


    const setState = (action: any) => {
        hook.queue.push(typeof action === 'function' ? action : () => action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        nextFiberReconcileWork = wipRoot;
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