import React from "react";
import {Route, Switch} from "react-router-dom";

import Home from "./home"

export default class Layout extends React.Component {
    navigate() {
        //this.props.history.pushState(null, "/");
    }

    render() {
        return (
            <div>
                <Route exact path="/" component={Home} />
            </div>
        );
    }
}
