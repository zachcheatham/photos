const constants = require("../helpers/constants.js");

import React from 'react';
import axios from "axios";
import { Route, withRouter } from "react-router-dom"

import Button from "material-ui/Button";
import { GridList, GridListTile, GridListTileBar } from "material-ui/GridList";
import { CircularProgress } from 'material-ui/Progress';
import { withStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import withWidth from 'material-ui/utils/withWidth';

import moment from "moment-timezone";
import compose from 'recompose/compose';

import Container from "../components/Container"
import ErrorPlaceHolder from "../components/ErrorPlaceholder"
import ThumbLength from "../components/ThumbLength"

import Media from "../pages/Media"

const styles = (theme) => ({
    center: {
        textAlign: "center"
    },
    gridTile: {
        cursor: "pointer"
    },
    gridTileBackground: {
        backgroundColor: "black",
    }
});

class Album extends React.Component {
    state = {
        connectionProblem: false,
        unknownAlbum: false,
        photos: undefined,
    }

    fetchPhotos = (year, album) => {
        axios.get(constants.API_URL + "/albums/" + year + "/" + album)
            .then((response) => {
                this.setState({
                    connectionProblem: false,
                    unknownAlbum: false,
                    photos: response.data.photos
                });
            })
            .catch((error) => {
                console.log(error);
                if (
                    error.response &&
                    error.response.data &&
                    (
                        error.response.data["error"] == "not_found" ||
                        error.response.data["error"] == "invalid_year"
                    )
                ) {
                    this.setState({
                        connectionProblem: false,
                        unknownAlbum: true,
                        photos: undefined
                    });
                }
                else {
                    console.log("Unable to fetch albums: " + error);
                    this.setState({
                        connectionProblem: true,
                        unknownAlbum: false,
                        photos: undefined
                    });
                }
            });
    }

    openPhoto = (photo) => {
        this.props.history.push(this.props.location.pathname + "/" + photo);
    }

    componentDidMount() {
        this.fetchPhotos(
            this.props.match.params.year,
            this.props.match.params.album
        );
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.match.params.year != this.props.match.params.year ||
            nextProps.match.params.album != this.props.match.params.album
        ) {
            this.fetchAlbums(
                nextProps.match.params.year,
                nextProps.match.params.album
            );
        }
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

        // TODO: Rearrange so we see <Photo> no matter the circumstance
        if (
            !this.state.connectionProblem &&
            !this.state.unknownAlbum &&
            !this.state.photos
        ) {
            return (
                <div className={classes.center}>
                    <CircularProgress color="accent" size={128}/>
                </div>
            )
        }
        else if (this.state.connectionProblem) {
            return (
                <ErrorPlaceHolder
                    message="Connection Problem"
                    connection={true}
                    retry={(event) => this.fetchAlbums(this.props.match.params.year, this.props.match.params.album)}
                />
            )
        }
        else if (this.state.unknownAlbum) {
            return (
                <ErrorPlaceHolder
                    message="Unknown Album"
                    goBack={true}
                />
            )
        }
        else {
            return (
                <Container>
                    <Typography type="display1" gutterBottom>{this.props.match.params.album}</Typography>
                    <GridList
                        cellHeight={cellHeight}
                        cols={columns}
                    >
                        {this.state.photos.map((photo) => {
                                return (
                                    <GridListTile
                                        classes={{
                                            root: classes.gridTile,
                                            tile: classes.gridTileBackground
                                        }}
                                        key={photo.filename}
                                        onClick={() => this.openPhoto(photo.filename)}
                                    >
                                        <img src={`${constants.API_URL}/thumbnail/${photo.filename}`}/>
                                        {photo.type == "video" ?
                                            <ThumbLength length={photo.length} />
                                        :
                                            ""
                                        }
                                    </GridListTile>
                                )
                            }
                        )}
                    </GridList>
                    <Media show={this.props.match.params.photo !== undefined} filename={this.props.match.params.photo}/>
                </Container>
            )
        }
    }
}

export default compose(withStyles(styles), withWidth())(withRouter(Album));
