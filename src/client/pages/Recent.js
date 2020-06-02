const constants = require("../helpers/constants.js");

import React from 'react';
import axios from "axios";
import compose from 'recompose/compose';
import { withRouter } from "react-router-dom"

import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import { withStyles } from "@material-ui/styles";
import withWidth from '@material-ui/core/withWidth';
import { CircularProgress } from '@material-ui/core';

import Container from "../components/Container"
import ErrorPlaceholder from '../components/ErrorPlaceholder';
import ThumbLength from "../components/ThumbLength"


import Media from "./Media"

const styles = (theme) => ({
    center: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        textAlign: "center",
    },
    gridTile: {
        cursor: "pointer"
    },
    gridTileBackground: {
        backgroundColor: "black",
    }
});

class Overview extends React.Component {
    state = {
        connectionProblem: false,
        photos: null,
        photo: null
    }

    fetchPhotos = () => {
        axios.get(constants.API_URL + "/recent")
            .then((response) => {
                this.setState({
                    connectionProblem: false,
                    photos: response.data.photos
                });
            })
            .catch((error) => {
                console.log("Unable to fetch recents: " + error);
                this.setState({
                    connectionProblem: true,
                    photos: null
                });
            });
    }

    openPhoto = (photo) => {
        this.props.history.push("/" + photo);
        //this.setState({"photo": photo})
    }

    componentDidMount() {
        this.fetchPhotos();
    }

    render() {
        const classes = this.props.classes;

        var columns = 0;
        var cellHeight = 180
        switch (this.props.width) {
            default:
            case "xs":
                columns = 2;
                break;
            case "sm":
                columns = 2;
                break;
            case "md":
                columns = 4;
                break;
            case "lg":
                columns = 5;
                break;
            case "xl":
                columns = 7;
        }

        if (
            !this.state.connectionProblem &&
            !this.state.photos
        ) {
            return (
                <div className={classes.center}>
                    <CircularProgress color="secondary" size={128} />
                </div>
            )
        }
        else if (this.state.connectionProblem) {
            return (
                <ErrorPlaceholder
                    message="Conenction Problem"
                    connection={true}
                    retry={() => this.fetchPhotos()} />
            )
        }
        else {
            return (
                <Container>
                    <GridList
                        cellHeight={cellHeight}
                        cols={columns}>

                        {this.state.photos.map((photo) => {
                            return (
                                <GridListTile
                                    classes={{
                                        root: classes.gridTile,
                                        tile: classes.gridTileBackground
                                    }}
                                    key={photo.filename}
                                    onClick={() => this.openPhoto(photo.filename)}>

                                    <img src={`${constants.API_URL}/thumbnail/${photo.filename}`} />
                                    {photo.type == "video" ?
                                        <ThumbLength length={photo.length} />
                                        : ""}

                                </GridListTile>
                            )
                        })}

                    </GridList>
                    <Media
                        show={this.props.match.params.file !== undefined}
                        filename={this.props.match.params.file} />
                </Container>
            )
        }
    }
}

export default compose(withStyles(styles), withWidth())(withRouter(Overview));
