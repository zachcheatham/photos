const constants = require("../helpers/constants.js");

import React from "react";
import axios from "axios";

import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import { grey, orange, red } from "@material-ui/core/colors";
import Dialog, {DialogContent} from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";
import LinearProgress from "@material-ui/core/LinearProgress";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import withWidth from "@material-ui/core/withWidth";
import { withStyles, createStyleSheet } from "@material-ui/styles";

import CachedIcon from "@material-ui/icons/Cached";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import CloudOffIcon from "@material-ui/icons/CloudOff";
import CompareArrowsIcon from "@material-ui/icons/CompareArrows";

import moment from "moment";

import compose from "recompose/compose";

const STAGE_NONE=0;
const STAGE_INDEX=1;
const STAGE_PROCESS=2;
const STAGE_STATS_CACHE=3;
const STAGE_COMPLETE=4;

const styles = theme => ({
    appBar: {
        borderRadius: "2px 2px 0 0"
    },
    dialogContainer: {
        padding: theme.spacing(1)
    },
    flex: {
        flex: "1"
    },
    button: {
        margin: theme.spacing(1),
    },
    floatright: {
        float: "right",
        verticalAlign: "middle"
    },
    netError: {
        color: theme.palette.error.A400,
        marginBottom: theme.spacing(1)
    },
    icon: {
        margin: theme.spacing(1),
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
        stage: STAGE_NONE,
        completed: 0,
        total: 0,
        time: "",
        percent: 0,
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
                var percent = 0;
                if (response.data.total_files != 0) {
                    percent = response.data.completed_files / response.data.total_files * 100;
                }

                var timePassed = 0;
                if (response.data.stage != STAGE_NONE && response.data.stage != STAGE_COMPLETE)
                    timePassed = Date.now() - response.data.start_time * 1000;
                else if (response.data.stage == STAGE_COMPLETE)
                    timePassed = (response.data.stop_time - response.data.start_time) * 1000;

                var timeString = moment.utc(timePassed).format("HH:mm:ss");

                this.setState({
                    connectionFailed: false,
                    stage: response.data.stage,
                    completed: response.data.completed_files,
                    total: response.data.total_files,
                    time: timeString,
                    percent: percent,
                    errors: response.data.errors
                });

                if (response.data.stage != STAGE_COMPLETE && this.props.open) {
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
                            stage: STAGE_NONE,
                            completed: 0,
                            total: 0,
                            time: 0,
                            percent: 0,
                            errors: []
                        });
                    }
                }
            });
    };

    componentDidUpdate(prevProps) {
        if (this.props.open && !prevProps.open) {
            this.fetchStatus();
        }
    }

    render() {
        const classes = this.props.classes;

        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
                fullScreen={this.props.width == "xs"}
            >
                <AppBar className={classes.appBar} position="static" color="default">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="Close Index Manager"
                            onClick={this.props.onClose}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.flex}>
                            Index Manager
                        </Typography>
                        <Button
                            edge="end"
                            color="secondary"
                            disabled={this.state.connectionFailed || (this.state.stage != STAGE_COMPLETE && this.state.stage != STAGE_NONE)}
                            className={classes.button}
                            onClick={this.initiate}
                        >
                            {(this.state.stage != STAGE_COMPLETE && this.state.stage) ? "Running..." : "Start"}
                        </Button>
                    </Toolbar>
                </AppBar>
                <div className={classes.dialogContainer}>
                    <Typography className={`${classes.netError}  ${this.state.connectionFailed ? "" : classes.hidden}`}>
                        <CloudOffIcon className={classes.icon} />
                        Connection Failed
                    </Typography>
                    <Typography color="inherit" gutterBottom>
                        {this.state.stage == STAGE_INDEX ? <span><CompareArrowsIcon className={classes.statusIcon} /> Finding files... </span> : ""}
                        {this.state.stage == STAGE_STATS_CACHE ? <span><CompareArrowsIcon className={classes.statusIcon} /> Updating statistics... </span> : ""}
                        {this.state.stage == STAGE_PROCESS ? <span><CachedIcon className={classes.statusIcon} /> Processing media... </span> : ""}
                        {this.state.stage == STAGE_COMPLETE ? <span><CheckIcon className={classes.statusIcon} /> Completed. </span> : ""}
                        ({this.state.completed} / {this.state.total})
                        <span className={(this.state.stage >= STAGE_PROCESS) ? classes.floatright : classes.hidden}>
                            {this.state.time}
                        </span>
                    </Typography>
                    <LinearProgress color="secondary" variant="determinate" value={this.state.percent} />
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
                    <Typography variant="subtitle2">It is safe to close this window.</Typography>
                </div>
            </Dialog>
        );
    }
}

export default compose(withStyles(styles), withWidth())(IndexManager);
