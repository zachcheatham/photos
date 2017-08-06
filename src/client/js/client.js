import React from "react";
import ReactDom from "react-dom";
import HashRouter from "react-router-dom/HashRouter";
import {AsyncComponentProvider} from "react-async-component";

import Root from "./pages/Root";

const App = () => (
    <AsyncComponentProvider>
        <HashRouter>
            <Root />
        </HashRouter>
    </AsyncComponentProvider>
);

ReactDom.render(<App />, document.getElementById("root"));
