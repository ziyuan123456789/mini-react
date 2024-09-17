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
        _fromCustomRenderer: true, // 特殊标记，证明是自定义的 createElement 编译的
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
        _fromCustomRenderer: true,
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

let nextFiberReconcileWork: any = null;
let wipRoot: any = null;

function workLoop(deadline: IdleDeadline): void {
    let shouldYield = false;
    while (nextFiberReconcileWork && !shouldYield) {
        nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
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
    reconcile(fiber);

    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.return;
    }
    return null;
}

function reconcile(fiber: any): void {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber: any, elements: any[]): void {
    let index = 0;
    let prevSibling: any = null;

    while (index < elements.length) {
        const element = elements[index];
        const newFiber: any = {
            type: element.type,
            props: element.props,
            dom: null,
            return: wipFiber,
            effectTag: "PLACEMENT",
        };

        if (index === 0) {
            wipFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

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

function createDom(fiber: any): HTMLElement | Text {
    const dom =
        fiber.type == "TEXT_ELEMENT"
            ? document.createTextNode(fiber.props.nodeValue)
            : document.createElement(fiber.type);

    for (const prop in fiber.props) {
        setAttribute(dom, prop, fiber.props[prop]);
    }

    return dom;
}

function isEventListenerAttr(key: string, value: any): boolean {
    return typeof value == 'function' && key.startsWith('on');
}

function isStyleAttr(key: string, value: any): boolean {
    return key == 'style' && typeof value == 'object';
}

function isPlainAttr(_key: string, value: any): boolean {
    return typeof value != 'object' && typeof value != 'function';
}

const setAttribute = (dom: HTMLElement, key: string, value: any): void => {
    if (key === 'children') {
        return;
    }

    if (key === 'nodeValue') {
        dom.textContent = value;
    } else if (isEventListenerAttr(key, value)) {
        const eventType = key.slice(2).toLowerCase();
        dom.addEventListener(eventType, value);
    } else if (isStyleAttr(key, value)) {
        Object.assign(dom.style, value);
    } else if (isPlainAttr(key, value)) {
        dom.setAttribute(key, value);
    }
};


const Dong = {
    createElement,
    render,
};

export default Dong;
