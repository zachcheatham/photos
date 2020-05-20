import React, { Suspense, lazy } from "react";
import {BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { ThemeProvider, withStyles } from "@material-ui/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import theme from "../../config/theme";

import IndexManager from "../../components/IndexManager";
import PhotosAppBar from "../../components/PhotosAppBar";

const AlbumList = lazy(() => import("../../pages/AlbumList"));
const Album = lazy(() => import("../../pages/Album"));
const NotFound = lazy(() => import("../../pages/NotFound"));
const Overview = lazy(() => import("../../pages/Overview"));

import styles from "./styles"

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
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className={classes.root}>
                    <Router>
                        
                        <PhotosAppBar
                            requestIndexManagerOpen={this.requestIndexManagerOpen}
                        />

                        <Suspense fallback={<span>Loading...</span>}>
                            <Switch>
                                <Route exact path="/" component={Overview} />
                                <Route exact path="/:year" component={AlbumList} />
                                <Route exact path="/:year/:album/:photo?" component={Album} />
                                <Route exact path="*" component={NotFound} />
                            </Switch>
                        </Suspense>

                        <IndexManager
                            open={this.state.indexManagerOpen}
                            onClose={this.requestIndexManagerClose}
                        />
                            
                    </Router>
                </div>
            </ThemeProvider>
        );
    }
}

export default withStyles(styles)(Index);
