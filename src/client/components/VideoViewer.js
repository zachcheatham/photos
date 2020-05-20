const constants = require("../helpers/constants.js");
import React from 'react';

import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import { withStyles } from "@material-ui/styles";
import Toolbar from "@material-ui/core/Toolbar";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import GetAppIcon from "@material-ui/icons/GetApp";
import Forward10Icon from "@material-ui/icons/Forward10";
import InfoIcon from "@material-ui/icons/Info";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import Replay10Icon from "@material-ui/icons/Replay10";

const styles = (theme) => ({
    main: {
        backgroundColor: "black",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    flex: {
        flex: 1
    },
    appBar: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        color: "white",
        opacity: 1,
        visibility: "visible",
        transition: "opacity linear 0.1s, visibility linear 0.1s",
        zIndex: 1
    },
    appBarBottom: {
        top: "inherit",
        bottom: 0,
    },
    toolbarBottom: {
        justifyContent: "center"
    },
    appBarHidden: {
        opacity: 0,
        visibility: "hidden",
        transition: "opacity linear 0.5s, visibility linear 0.5s",
    },
    video: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%"
    },
});

class VideoViewer extends React.Component {
    state = {
        inactive: false,
        videoLoaded: false,
        videoLoading: true,
        videoPlaying: false,
    }

    playVideo = (ignoreState=false) => {
        if (this.state.videoLoaded || ignoreState) {
            this.refs.video.play();
        }
    }

    pauseVideo = () => {
        if (this.state.videoLoaded) {
            this.refs.video.pause();
        }
    }

    rewindVideo = () => {
        if (this.state.videoLoaded) {
            if (this.refs.video.currentTime < 10) {
                this.refs.video.currentTime = 0;
            }
            else {
                this.refs.video.currentTime -= 10;
            }
        }
    }

    forwardVideo = () => {
        if (this.state.videoLoaded) {
            var time = this.refs.video.currentTime + 10;
            if (time < this.refs.video.duration) {
                this.refs.video.currentTime = time;
            }
        }
    }

    onVideoCanPlay = (event) => {
        console.log("videoCanPlay");

        this.setState({videoLoaded: true, videoLoading: false});
    }

    onVideoPlay = (event) => {
        console.log("play");
        this.setState({videoPlaying: true});
    }

    onVideoPause = (event) => {
        console.log("pause");
        this.setState({videoPlaying: false});
    }

    onVideoSeeking = (event) => {
        console.log("seeking");
        this.setState({videoLoading: true});
    }

    onVideoWaiting = (event) => {
        console.log("waiting");
        this.setState({videoLoading: true});
    }

    onVideoError = (event) => {
        console.log("error");
        console.log(event);
    }

    onWindowMouseMove = (event) => {
        if (this.hideToolbarTimeout) {
            clearTimeout(this.hideToolbarTimeout);
        }

        this.hideToolbarTimeout = setTimeout(() => {
            this.setState({inactive: true})
            this.hideToolbarTimeout = undefined;
        }, 3000);

        if (this.state.inactive) {
            this.setState({inactive: false});
        }
    }

    componentDidMount() {
        this.hideToolbarTimeout = setTimeout(() => {
            this.setState({inactive: true})
        }, 3000);
    }

    componentWillUnmount() {
        if (this.hideToolbarTimeout) {
            clearTimeout(this.hideToolbarTimeout);
        }
    }

    render() {
        const classes = this.props.classes;

        return (
            <div
                className={`${this.props.className} ${classes.main}`}
                onMouseMove={this.onWindowMouseMove}
            >
                <div
                    className={`${classes.appBar} ${this.state.inactive ? classes.appBarHidden : ""}`}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            onClick={this.props.requestBack}
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        <span className={classes.flex}></span>

                        <IconButton color="inherit">
                            <GetAppIcon />
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={this.props.requestInfoToggle}
                        >
                            <InfoIcon />
                        </IconButton>
                    </Toolbar>
                </div>
                <video
                    autoPlay={true}
                    ref="video"
                    className={classes.video}
                    onCanPlay={this.onVideoCanPlay}
                    onPlay={this.onVideoPlay}
                    onPause={this.onVideoPause}
                    onSeeking={this.onVideoSeeking}
                    onWaiting={this.onVideoWaiting}
                    onError={this.onVideoError}
                >
                    <source src={`${constants.API_URL}/media/${this.props.filename}`} />
                </video>
                {this.state.videoLoading ?
                    <CircularProgress color="secondary" size={50} />
                :
                    ""
                }
                <div
                    className={`${classes.appBar} ${classes.appBarBottom} ${this.state.inactive || !this.state.videoLoaded ? classes.appBarHidden : ""}`}
                >
                    <Toolbar className={classes.toolbarBottom}>
                        <IconButton
                            color="inherit"
                            onClick={this.rewindVideo}
                        >
                            <Replay10Icon />
                        </IconButton>
                        <span>
                            {this.state.videoPlaying ?
                                <IconButton
                                    color="inherit"
                                    onClick={this.pauseVideo}
                                >
                                    <PauseIcon />
                                </IconButton>
                            :
                                <IconButton
                                    color="inherit"
                                    onClick={this.playVideo}
                                >
                                    <PlayArrowIcon />
                                </IconButton>
                            }
                        </span>
                        <IconButton
                            color="inherit"
                            onClick={this.forwardVideo}
                        >
                            <Forward10Icon />
                        </IconButton>
                    </Toolbar>
                </div>
            </div>
        )
    }
}

export default withStyles(styles) (VideoViewer);
