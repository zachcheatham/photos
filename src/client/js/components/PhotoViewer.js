const constants = require("../helpers/constants.js");
import React from 'react';

import AppBar from "material-ui/AppBar";
import IconButton from "material-ui/IconButton";
import { withStyles, createStyleSheet } from "material-ui/styles";
import Toolbar from "material-ui/Toolbar";

import ArrowBackIcon from "material-ui-icons/ArrowBack"
import FileDownloadIcon from "material-ui-icons/FileDownload"
import InfoIcon from "material-ui-icons/Info"
import MoreVertIcon from "material-ui-icons/MoreVert"
import RotateRightIcon from "material-ui-icons/RotateRight"
import ZoomOutIcon from "material-ui-icons/ZoomOut"

const styleSheet = createStyleSheet((theme) => ({
    main: {
        backgroundColor: "black",
        position: "relative",
        overflow: "hidden",
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
    appBarHidden: {
        opacity: 0,
        visibility: "hidden",
        transition: "opacity linear 0.5s, visibility linear 0.5s",
    },
    image: {
        visibility: "hidden",
        position: "relative",
    }
}));

class PhotoViewer extends React.Component {
    hideToolbarTimeout = undefined

    state = {
        inactive: false,
        imageLoaded: false,
        infoLoaded: true, //TODO: change to false after writing net code
        zoomed: false,
    }

    componentDidMount() {
        this.hideToolbarTimeout = setTimeout(() => {
            this.setState({inactive: true})
        }, 3000);
    }

    onWindowMouseMove = () => {
        if (this.hideToolbarTimeout) {
            clearTimeout(this.hideToolbarTimeout);
        }

        this.hideToolbarTimeout = setTimeout(() => {
            this.setState({inactive: true})
        }, 3000);

        this.setState({inactive: false})
    }

    photoMetrics = {
        originalWidth: 0,
        originalHeight: 0,
        rotation: 0,
        rotatedWidthFactor: 0,
        rotatedHeightFactor: 0,
        aspectRatio: 0,
        zoom: 1.0,
    }

    onImageLoaded = (event) => {
        this.photoMetrics.originalWidth = event.target.width;
        this.photoMetrics.originalHeight = event.target.height;

        // Calculate rotation size
        this.rotateImage(this.photoMetrics.rotation);

        // Zoom image to fit in window
        this.zoomImage(this.photoMetrics.zoom);

        this.setState({imageLoaded: true});

        if (this.state.infoLoaded) {
            const element = this.refs.image;
            element.style["visibility"] = "visible";
            //element.style["transition"] = "all 0.5s ease";
        }
    }

    onWheel = (event) => {
        if (event.deltaY < 0) {
            this.zoomImage(
                this.photoMetrics.zoom + 0.1,
                event,
            );
        }
        else {
            this.zoomImage(
                this.photoMetrics.zoom - 0.1,
                event,
            );
        }
    }

    rotateImage = (deg, save=true) => {
        if (deg >= 360)
            deg = 0;

        this.photoMetrics.rotation = deg;

        const element = this.refs.image;
        var rotatedWidth;
        var rotatedHeight;

        if (deg == 0) {
            rotatedWidth = this.photoMetrics.originalWidth;
            rotatedHeight = this.photoMetrics.originalHeight;

            if (this.photoMetrics.zoom == 1) {
                element.style["transform"] = "translateY(-50%) translateX(-50%)";
            }
            else {
                element.style["transform"] = undefined;
            }
        }
        else {
            const rad = deg * Math.PI / 180;
            rotatedWidth = Math.abs(this.photoMetrics.originalWidth * Math.cos(rad)) + Math.abs(this.photoMetrics.originalHeight * Math.sin(rad));
            rotatedHeight = Math.abs(this.photoMetrics.originalWidth * Math.sin(rad)) + Math.abs(this.photoMetrics.originalHeight * Math.cos(rad));

            if (this.photoMetrics.zoom == 1) {
                element.style["transform"] = "translateY(-50%) translateX(-50%) rotate(" + deg + "deg)";
            }
            else {
                element.style["transform"] = "rotate(" + deg + "deg)";
            }
        }

        this.photoMetrics.rotatedWidthFactor = rotatedWidth / this.photoMetrics.originalWidth;
        this.photoMetrics.rotatedHeightFactor = rotatedHeight / this.photoMetrics.originalHeight;
        this.photoMetrics.aspectRatio = rotatedWidth / rotatedHeight;

        // Update max width/height
        element.style["max-width"] = (100 * this.photoMetrics.zoom * this.photoMetrics.rotatedHeightFactor) + "%";
        element.style["max-height"] = (100 * this.photoMetrics.zoom * this.photoMetrics.rotatedWidthFactor) + "%";

        if (save) {
            // TODO: Send rotation to api
        }
    }

    zoomImage = (zoom, event=false) => {
        if (zoom < 1.0) {
            zoom = 1.0;
        }

        const element = this.refs.image;

        if (zoom == 1.0) {
            element.style["position"] = "relative";
            element.style["max-width"] = (100 * this.photoMetrics.rotatedHeightFactor) + "%";
            element.style["max-height"] = (100 * this.photoMetrics.rotatedWidthFactor) + "%";
            element.style["top"] = "50%";
            element.style["left"] = "50%";

            if (this.photoMetrics.rotation != 0) {
                element.style["transform"] = "translateY(-50%) translateX(-50%) rotate(" + this.photoMetrics.rotation + "deg)";
            }
            else {
                element.style["transform"] = "translateY(-50%) translateX(-50%)";
            }

            this.photoMetrics.width = 0;
            this.photoMetrics.height = 0;
        }
        else {
            const zoomFactor = zoom / this.photoMetrics.zoom;

            var x = event.nativeEvent.offsetX;
            var y = event.nativeEvent.offsetY;
            var w = element.width;
            var h = element.height;
            var rw = w;
            var rh = h;

            if (this.photoMetrics.rotation > -1) {
                const rad = this.photoMetrics.rotation * Math.PI / 180;
                const sin = Math.sin(rad);
                const cos = Math.cos(rad);

                rw = Math.abs(w * cos) + Math.abs(h * sin);
                rh = Math.abs(w * sin) + Math.abs(h * cos);

                const ox = rw / 2;
                const oy = rh / 2;

                const cx = cos * (x - ox) - sin * (y - oy) + ox;
                const cy = sin * (x - ox) + cos * (y - oy) + oy

                x = cx;
                y = cy;
            }

            var fL = (w - rw) / 4;
            console.log(fL);

            element.style["position"] = "absolute";
            element.style["left"] = (event.pageX - x + fL) + "px";
            //element.style["top"] = (event.pageY - y) - ((w - h) / 2) + "px";
            element.style["max-width"] = (100 * this.photoMetrics.rotatedHeightFactor) + "%";
            element.style["max-height"] = (100 * this.photoMetrics.rotatedWidthFactor) + "%";

            if (this.photoMetrics.rotation != 0) {
                element.style["transform"] = `
                    rotate(${this.photoMetrics.rotation}deg)`;
            }
            else {
                element.style["transform"] = "";
            }
        }

        if (this.photoMetrics.zoom != zoom) {
            this.setState({zoomed: (zoom > 1)})
        }
        this.photoMetrics.zoom = zoom;
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

                        {this.state.zoomed ?
                            <IconButton
                                color="inherit"
                                onClick={() => this.zoomImage(1)}
                            >
                                <ZoomOutIcon />
                            </IconButton>
                        :
                            ""
                        }
                        {this.state.imageLoaded && this.state.infoLoaded ?
                            <IconButton
                                color="inherit"
                                onClick={() => this.rotateImage(this.photoMetrics.rotation + 90, true)}
                            >
                                <RotateRightIcon />
                            </IconButton>
                        :
                            ""
                        }
                        <IconButton color="inherit">
                            <FileDownloadIcon />
                        </IconButton>
                        {this.state.infoLoaded ?
                            <IconButton
                                color="inherit"
                                onClick={this.props.requestInfoToggle}
                            >
                                <InfoIcon />
                            </IconButton>
                        :
                            ""
                        }
                    </Toolbar>
                </div>

                {this.props.filename && this.props.filename.length > 0 ?
                    <img
                        className={classes.image}
                        ref="image"
                        onLoad={this.onImageLoaded}
                        onWheel={this.onWheel}
                        src={`${constants.API_URL}/media/${this.props.filename}`}
                    />
                :
                    ""
                }
            </div>
        )
    }
}

export default withStyles(styleSheet) (PhotoViewer);
