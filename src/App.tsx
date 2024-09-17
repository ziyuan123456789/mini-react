import Dong from './dong';
function Welcome() {
    return <h1>Hello</h1>;
}

const App = (
    <div id="app">
        <h1 onClick={() => {console.log(1)} }>Hello, JSX with Custom Dong Renderer</h1>
        <p>This is a paragraph rendered by the custom Dong renderer.</p>
        <ul>
            <li>Item 1 </li>
            <li>Item 2</li>
        </ul>
    </div>
);
console.log(JSON.stringify(Welcome, null, 4));

const root = document.getElementById("root");
if (root) {
    Dong.render(App, root);
}





