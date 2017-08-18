import React from 'react';

import {Route, Switch} from "react-router-dom";
import BrowserRouter from "react-router-dom/BrowserRouter";

import { withStyles, createStyleSheet } from 'material-ui/styles';

import Footer from "../components/Footer"
import IndexManager from "../components/IndexManager"
import PhotosAppBar from "../components/PhotosAppBar"
import withRoot from '../components/withRoot';

import AlbumList from "../pages/AlbumList";
const styleSheet = createStyleSheet((theme) => ({
    flexRoot: {
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column"
    }
}));

class Index extends React.Component {
    state = {
        indexManagerOpen: false,
    };

    requestIndexManagerOpen = () => {
        this.setState({indexManagerOpen: true});
    }

    requestIndexManagerClose = () => {
        this.setState({indexManagerOpen: false});
    }

    render() {
        const classes = this.props.classes;

        return (
            <BrowserRouter>
                <div className={classes.flexRoot}>
                    <PhotosAppBar
                        requestIndexManagerOpen={this.requestIndexManagerOpen}
                    />
                    <Switch>
                        <Route exact path="/:year" component={AlbumList} />
                    </Switch>
                    <Footer />

                    <IndexManager
                        open={this.state.indexManagerOpen}
                        onRequestClose={this.requestIndexManagerClose}
                    />
                </div>
            </BrowserRouter>
        );
    }
}

export default withRoot(withStyles(styleSheet)(Index));
