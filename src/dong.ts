declare namespace JSX {
    interface IntrinsicElements {
        div: any;
        h1: any;
        p: any;
        ul: any;
        li: any;
        span: any;
    }
}



function createElement(type: string, props: any, ...children: any[]): any {
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

//工作循环
function workLoop(deadline: IdleDeadline): void {
    //是否让出
    let shouldYield = false;
    //当存在下一个work并且允许继续运行
    while (nextFiberReconcileWork && !shouldYield) {
        nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
        //当空闲时间耗尽
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextFiberReconcileWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function render(element: any, container: HTMLElement): void {

    wipRoot = {
        dom: container,
        props: {
            children: [element],
        }
    };
    nextFiberReconcileWork = wipRoot;
}

function performNextWork(fiber: any): any {
    //协调
    reconcile(fiber);

    //返回指向下一个的fiber
    if (fiber.child) {
        return fiber.child;
    }

    //如果没有子节点,就找兄弟节点
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        //没有兄弟节点就回溯到父节点 继续找兄弟节点
        nextFiber = nextFiber.return;
    }
    //当回溯到根节点的时候,说明已经遍历完成
    return null;
}

//协调
function reconcile(fiber: any): void {
    //如果fiber节点不存在dom,比如说还没有遍历到这个节点或者第一次渲染
    if (!fiber.dom) {
        console.log(fiber)
        //给他创建一份
        fiber.dom = createDom(fiber);
    }
    //协调子元素
    reconcileChildren(fiber, fiber.props.children);
}

//协调子元素
function reconcileChildren(wipFiber: any, elements: any[]): void {
    let index = 0;
    let prevSibling: any = null;
    //进行循环遍历
    while (index < elements.length) {
        //遍历子元素,获取元素
        const element = elements[index];
        //创建一个新的fiber节点
        const newFiber: any = {
            type: element.type,
            props: element.props,
            dom: null,
            return: wipFiber, //前驱指针
            effectTag: "PLACEMENT",
        };

        if (index === 0) {
            //第一个元素,配置子元素
            wipFiber.child = newFiber;
        } else {
            //配置兄弟元素,这一点其实非常重要,在常规深搜中是不能感知同层级兄弟节点的
            prevSibling.sibling = newFiber;
        }
        //配置下一个
        prevSibling = newFiber;
        index++;
    }
}

function commitRoot(): void {
    commitWork(wipRoot.child);
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
        domParent.appendChild(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

//创建真实DOM
function createDom(fiber: any): HTMLElement | Text {
    //判断一下类型,如果文本就创建文本节点
    const dom =
        fiber.type == "TEXT_ELEMENT"
            ? document.createTextNode(fiber.props.nodeValue)
            : document.createElement(fiber.type);

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



const Dong = {
    createElement,
    render,
};

export default Dong;
