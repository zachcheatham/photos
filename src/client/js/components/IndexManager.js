const constants = require("../helpers/constants.js");

import React from 'react';
import axios from "axios";

import AppBar from "material-ui/AppBar";
import Button from "material-ui/Button";
import { grey, orange, red } from 'material-ui/colors';
import Dialog, {DialogContent} from 'material-ui/Dialog';
import IconButton from "material-ui/IconButton";
import { LinearProgress } from 'material-ui/Progress';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import withWidth from 'material-ui/utils/withWidth';
import { withStyles, createStyleSheet } from 'material-ui/styles';

import CachedIcon from "material-ui-icons/Cached";
import CheckIcon from "material-ui-icons/Check";
import CloseIcon from "material-ui-icons/Close";
import CloudOffIcon from "material-ui-icons/CloudOff";
import CompareArrowsIcon from "material-ui-icons/CompareArrows";

import moment from "moment";

import compose from 'recompose/compose';

const MODE_NOTHING = 0;
const MODE_PHOTOS = 1;
const MODE_VIDEOS = 2;
const MODE_CLEANING = 3;
const MODE_FINISHED = 4;

const styles = theme => ({
    appBar: {
        borderRadius: "2px 2px 0 0"
    },
    dialogContainer: {
        padding: theme.spacing.unit
    },
    flex: {
        flex: "1"
    },
    button: {
        margin: theme.spacing.unit,
    },
    floatright: {
        float: "right",
        verticalAlign: "middle"
    },
    netError: {
        color: theme.palette.error.A400,
        marginBottom: theme.spacing.unit
    },
    icon: {
        margin: theme.spacing.unit,
        verticalAlign: "middle"
    },
    statusIcon: {
        marginBottom: "-5px",
        height: "19px"
    },
    hidden: {
        display: "none"
    },
    errorsContainer: {
        display: "relative",
        height: "100px",
        overflowY: "scroll",
        overflowX: "auto",
        borderWidth: "1px",
        borderColor: grey[300],
        borderStyle: "solid"
    },
    errorLine: {
        '&:nth-child(even)': {
            backgroundColor: grey[100]
        }
    },
    errorError: {
        color: red[900]
    },
    errorWarning: {
        color: orange[900]
    }
});

class IndexManager extends React.Component {
    state = {
        connectionFailed: false,
        mode: MODE_NOTHING,
        photosStartTime: 0,
        photosStopTime: 0,
        videosStartTime: 0,
        videosStopTime: 0,
        readingDirectories: false,
        photosCompleted: false,
        photosTotal: 0,
        photosCompleted: 0,
        photosPercent: 0,
        videosTotal: 0,
        videosCompleted: 0,
        videosPercent: 0,
        errors: []
    }

    initiate = () => {
        axios.get(constants.API_URL + "/update-index")
            .then(() => {
                this.fetchStatus();
            })
            .catch(() => {
                this.fetchStatus();
            });
    }

    fetchStatus = () => {
        axios.get(constants.API_URL + "/update-index/status")
            .then((response) => {
                var photosP = 0;
                if (response.data.photos_total != 0) {
                    photosP = response.data.photos_completed / response.data.photos_total * 100;
                }

                var videosP = 0;
                if (response.data.videos_total != 0) {
                    videosP = response.data.videos_completed / response.data.videos_total * 100;
                }

                var photosTime = 0;
                if (response.data.mode == MODE_PHOTOS)
                    photosTime = Date.now() - response.data.photos_start_time * 1000;
                else
                    photosTime = (response.data.photos_stop_time - response.data.photos_start_time) * 1000;
                var photosTimeString = moment.utc(photosTime).format("HH:mm:ss");

                var videosTime = 0;
                if (response.data.mode == MODE_VIDEOS)
                    videosTime = Date.now() - response.data.videos_start_time * 1000;
                else
                    videosTime = (response.data.videos_stop_time - response.data.videos_start_time) * 1000;
                var videosTimeString = moment.utc(videosTime).format("HH:mm:ss");

                this.setState({
                    connectionFailed: false,
                    mode: response.data.mode,
                    readingDirectories: response.data.reading_directories,
                    photosCompleted: response.data.photos_completed,
                    photosTotal: response.data.photos_total,
                    photosTime: photosTimeString,
                    photosPercent: photosP,
                    videosCompleted: response.data.videos_completed,
                    videosTotal: response.data.videos_total,
                    videosTime: videosTimeString,
                    videosPercent: videosP,
                    errors: response.data.errors
                });

                if (response.data.mode != MODE_FINISHED && this.props.open) {
                    setTimeout(() => {
                        this.fetchStatus()
                    }, 1000);
                }
            })
            .catch((error) => {
                if (!error.response || typeof error.response.data.success === undefined) {
                    console.log("Unable to fetch indexer status: " + error.message);
                    this.setState({connectionFailed: true});
                }
                else {
                    if (error.response.data.error == "no_activity") {
                        this.setState({
                            connectionFailed: false,
                            mode: MODE_NOTHING,
                            photosStartTime: 0,
                            photosStopTime: 0,
                            videosStartTime: 0,
                            videosStopTime: 0,
                            readingDirectories: false,
                            photosCompleted: false,
                            photosTotal: 0,
                            photosCompleted: 0,
                            photosPercent: 0,
                            videosTotal: 0,
                            videosCompleted: 0,
                            videosPercent: 0,
                            errors: []
                        });
                    }
                }
            });
    };

    componentWillReceiveProps(nextProps) {
        if (!this.props.open && nextProps.open) {
            this.fetchStatus();
        }
    }

    render() {
        const classes = this.props.classes;

        return (
            <Dialog
                open={this.props.open}
                onRequestClose={this.props.onRequestClose}
                fullScreen={this.props.width == "xs"}
            >
                <AppBar className={classes.appBar} position="static" color="default">
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="Close Index Manager"
                            onClick={this.props.onRequestClose}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography type="title" color="inherit" className={classes.flex}>
                            Index Manager
                        </Typography>
                        <Button
                            color="accent"
                            disabled={this.state.connectionFailed || (this.state.mode != MODE_FINISHED && this.state.mode != MODE_NOTHING)}
                            className={classes.button}
                            onClick={this.initiate}
                        >
                            {(this.state.mode != MODE_FINISHED && this.state.mode) ? "Running..." : "Start"}
                        </Button>
                    </Toolbar>
                </AppBar>
                <div className={classes.dialogContainer}>
                    <Typography className={`${classes.netError}  ${this.state.connectionFailed ? "" : classes.hidden}`}>
                        <CloudOffIcon className={classes.icon} />
                        Connection Failed
                    </Typography>
                    <Typography color="inherit" gutterBottom>
                        {this.state.readingDirectories && this.state.mode == MODE_PHOTOS ? <CompareArrowsIcon className={classes.statusIcon} /> : ""}
                        {!this.state.readingDirectories && this.state.mode == MODE_PHOTOS ? <CachedIcon className={classes.statusIcon} /> : ""}
                        {this.state.mode > MODE_PHOTOS ? <CheckIcon className={classes.statusIcon} /> : ""}
                        Photos ({this.state.photosCompleted} / {this.state.photosTotal})
                        <span className={(this.state.mode >= MODE_PHOTOS) ? classes.floatright : classes.hidden}>
                            {this.state.photosTime}
                        </span>
                    </Typography>
                    <LinearProgress color="accent" mode="determinate" value={this.state.photosPercent} />
                    <br />
                    <Typography color="inherit" gutterBottom>
                        {this.state.readingDirectories && this.state.mode == MODE_VIDEOS ? <CompareArrowsIcon className={classes.statusIcon} /> : ""}
                        {!this.state.readingDirectories && this.state.mode == MODE_VIDEOS ? <CachedIcon className={classes.statusIcon} /> : ""}
                        {this.state.mode > MODE_VIDEOS ? <CheckIcon className={classes.statusIcon} /> : ""}
                        Videos ({this.state.videosCompleted} / {this.state.videosTotal})
                        <span className={(this.state.mode >= MODE_VIDEOS) ? classes.floatright : classes.hidden}>
                            {this.state.videosTime}
                        </span>
                    </Typography>
                    <LinearProgress color="accent" mode="determinate" value={this.state.videosPercent} />
                    <br />
                    <Typography color="inherit">Errors</Typography>
                    <div className={classes.errorsContainer}>
                        {this.state.errors.map(function(error, index) {
                            return (
                                <Typography key={index}
                                    className={`${classes.errorLine}  ${error.t == "e" ? classes.errorError : classes.errorWarning}`}
                                >
                                    {error.m}
                                </Typography>
                            );
                        })}
                    </div>
                    <br />
                    <Typography type="caption">It is safe to close this window.</Typography>
                </div>
            </Dialog>
        );
    }
}

export default compose(withStyles(styles), withWidth())(IndexManager);
