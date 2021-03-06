const constants = require("../helpers/constants.js");

import React from 'react';
import axios from "axios";
import { withRouter } from "react-router-dom"

import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from "@material-ui/styles";
import withWidth from '@material-ui/core/withWidth';

import moment from "moment-timezone";
import compose from 'recompose/compose';

import Container from "../components/Container"
import ErrorPlaceHolder from "../components/ErrorPlaceholder"

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

class AlbumList extends React.Component {
    state = {
        connectionProblem: false,
        unknownYear: false,
        albums: undefined,
    }

    fetchAlbums = (year) => {
        axios.get(constants.API_URL + "/albums/" + year)
            .then((response) => {
                this.setState({
                    connectionProblem: false,
                    unknownYear: false,
                    albums: response.data.albums
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
                        unknownYear: true,
                        albums: undefined
                    });
                }
                else {
                    console.log("Unable to fetch albums: " + error);
                    this.setState({
                        connectionProblem: true,
                        unknownYear: false,
                        albums: undefined
                    });
                }

            });
    }

    openAlbum = (album) => {
        this.props.history.push("/" + this.props.match.params.year + "/" + album);
    }

    componentDidMount() {
        this.fetchAlbums(this.props.match.params.year);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.match.params.year != this.props.match.params.year) {
            this.fetchAlbums(this.props.match.params.year);
        }
    }

    render() {
        const classes = this.props.classes;

        var columns = 0;
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
            !this.state.unknownYear &&
            !this.state.albums
        ) {
            return (
                <div className={classes.center}>
                    <CircularProgress color="secondary" size={128}/>
                </div>
            )
        }
        else if (this.state.connectionProblem) {
            return (
                <ErrorPlaceHolder
                    message="Connection Problem"
                    connection={true}
                    retry={(event) => this.fetchAlbums(this.props.match.params.year)}
                />
            )
        }
        else if (this.state.unknownYear) {
            return (
                <ErrorPlaceHolder
                    message="Unknown Year"
                    goBack={true}
                />
            )
        }
        else {
            return (
                <Container>
                    <GridList
                        cellHeight={180}
                        cols={columns}
                    >
                        {this.state.albums.map((album) => {
                                var mom = moment.unix(album.time_start).tz("utc");
                                if (mom.year() != this.props.match.params.year) {
                                    album.date = mom.format("MMMM Do (YYYY?)");
                                }
                                else {
                                    album.date = mom.format("MMMM Do");
                                }

                                return (
                                    <GridListTile
                                        classes={{
                                            root: classes.gridTile,
                                            tile: classes.gridTileBackground
                                        }}
                                        key={album.album}
                                        onClick={() => this.openAlbum(album.album)}
                                    >
                                        <img src={`${constants.API_URL}/thumbnail/album/${this.props.match.params.year}/${album.album}`} />
                                        <GridListTileBar
                                            title={album.album}
                                            subtitle={
                                                <span>
                                                    {album.date}
                                                </span>
                                            }
                                        />
                                    </GridListTile>
                                )
                            }
                        )}
                    </GridList>
                </Container>
            )
        }
    }
}

export default compose(withStyles(styles), withWidth())(withRouter(AlbumList));
