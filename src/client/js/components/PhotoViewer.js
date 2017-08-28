const constants = require("../helpers/constants.js");
import React from 'react';

import ResizeAware from "react-resize-aware";

import AppBar from "material-ui/AppBar";
import IconButton from "material-ui/IconButton";
import { withStyles, createStyleSheet } from "material-ui/styles";
import Toolbar from "material-ui/Toolbar";

import ArrowBackIcon from "material-ui-icons/ArrowBack";
import FileDownloadIcon from "material-ui-icons/FileDownload";
import InfoIcon from "material-ui-icons/Info";
import MoreVertIcon from "material-ui-icons/MoreVert";
import RotateRightIcon from "material-ui-icons/RotateRight";
import ZoomOutIcon from "material-ui-icons/ZoomOut";

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
    imageContainer: {
        //border: "1px solid red",
        position: "absolute",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        visibility: "hidden"
    }
}));

class PhotoViewer extends React.Component {
    hideToolbarTimeout = undefined

    state = {
        inactive: false,
        imageLoaded: false,
        zoomed: false,
    }

    componentDidMount() {
        this.hideToolbarTimeout = setTimeout(() => {
            this.setState({inactive: true})
        }, 3000);

        this.reset();

        if (this.refs.image.complete) {
            this.onImageLoaded({target: this.refs.image});
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((!this.props.info && nextProps.info) || (this.props.info.filename != nextProps.info.filename)) {
            this.photoMetrics.rotation = nextProps.info.rotation;

            if (this.state.imageLoaded) {
                this.rotateImage(this.photoMetrics.rotation, false, false);
                this.layoutImage();

                setTimeout(() => {
                    this.refs.image.style["visibility"] = "visible";
                    this.setDisableTransitions(false);
                }, 1);
            }
        }
    }

    componentWillUnmount() {
        if (this.hideToolbarTimeout) {
            clearTimeout(this.hideToolbarTimeout);
        }

        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
    }

    onResize = () => {
        if (this.state.imageLoaded && this.props.info) {
            if (this.transitionTimeout) {
                clearTimeout(this.transitionTimeout);
            }

            this.setDisableTransitions(true);
            this.layoutImage();

            this.transitionTimeout = setTimeout(() => {
                this.setDisableTransitions(false);
            }, 500);
        }
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

        if (this.mouseDown && this.state.zoomed) {
            this.photoMetrics.x += (event.pageX - this.prevMouseX);
            this.photoMetrics.y += (event.pageY - this.prevMouseY);

            // TODO: Prevent taking image off screen
            this.refs.imageContainer.style["left"] = this.photoMetrics.x + "px";
            this.refs.imageContainer.style["top"] = this.photoMetrics.y + "px";

            this.prevMouseX = event.pageX;
            this.prevMouseY = event.pageY;
        }
    }

    onContainerMouseDown = (event) => {
        if (this.state.zoomed) {
            this.setDisableTransitions(true);

            this.prevMouseX = event.pageX;
            this.prevMouseY = event.pageY;

            this.mouseDown = true;
            event.preventDefault();
        }
    }

    onContainerMouseUp = (event) => {
        if (this.mouseDown) {
            this.mouseDown = false;
            this.prevMouseX = false;
            this.prevMouseY = false;

            this.setDisableTransitions(false);
        }
    }

    onImageLoaded = (event) => {
        this.photoMetrics.originalWidth = event.target.naturalWidth;
        this.photoMetrics.originalHeight = event.target.naturalHeight;

        this.setState({imageLoaded: true});

        if (this.props.info) {
            this.rotateImage(this.photoMetrics.rotation, false, false);
            this.layoutImage();

            setTimeout(() => {
                this.refs.image.style["visibility"] = "visible";
                this.setDisableTransitions(false);
            }, 1);
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

    reset = () => {
        this.photoMetrics = {
            originalWidth: 0,
            originalHeight: 0,
            aspect: 0,
            rotation: 0,
            rotatedHeight: 0,
            rotatedWidth: 0,
            scaleWidth: 0,
            scaleHeight: 0,
            scaledHeight: 0,
            scaledWidth: 0,
            scaledRotatedHeight: 0,
            scaledRotatedWidth: 0,
            zoom: 1,
            x: 0,
            y: 0
        }

        this.state.imageLoaded = undefined;
        this.state.inactive = undefined;
        this.state.zoomed = undefined;

        const container = this.refs.imageContainer;
        const image = this.refs.image;

        container.style["width"] = this.photoMetrics.scaledRotatedWidth + "px";
        container.style["height"] = this.photoMetrics.scaledRotatedHeight + "px";
        container.style["left"] = this.photoMetrics.x + "px";
        container.style["top"] = this.photoMetrics.y + "px";
        container.style["transition"] = "";

        image.style["width"] = this.photoMetrics.scaledWidth + "px";
        image.style["height"] = this.photoMetrics.scaledHeight + "px";
        image.style["transform"] = `rotate(${this.photoMetrics.rotation}deg)`;
        image.style["transition"] = "";
    }

    layoutImage = () => {
        const root = this.refs.root.container;
        const container = this.refs.imageContainer;
        const image = this.refs.image;

        // Scale image to window
        if (root.clientWidth / this.photoMetrics.aspect <= root.clientHeight) {
            this.photoMetrics.scaledRotatedWidth = root.clientWidth;
            this.photoMetrics.scaledRotatedHeight = root.clientWidth / this.photoMetrics.aspect;
        }
        else {
            this.photoMetrics.scaledRotatedWidth = root.clientHeight * this.photoMetrics.aspect;
            this.photoMetrics.scaledRotatedHeight = root.clientHeight;
        }

        // Adjust for zoom
        if (this.photoMetrics.zoom > 1.0) {
            this.photoMetrics.scaledRotatedWidth *= this.photoMetrics.zoom;
            this.photoMetrics.scaledRotatedHeight *= this.photoMetrics.zoom;
        }

        this.photoMetrics.scaleWidth = this.photoMetrics.scaledRotatedWidth / this.photoMetrics.rotatedWidth;
        this.photoMetrics.scaleHeight = this.photoMetrics.scaledRotatedHeight / this.photoMetrics.rotatedHeight;

        // Calculate inner image dimensions to fit in the box
        if (this.photoMetrics.rotation == 0) {
            this.photoMetrics.scaledWidth = this.photoMetrics.scaledRotatedWidth;
            this.photoMetrics.scaledHeight = this.photoMetrics.scaledRotatedHeight;
        }
        else {
            // TODO: If you want rotation to be compat with anything other than 90 deg rotations, this has to be updated
            this.photoMetrics.scaledWidth = this.photoMetrics.originalWidth * this.photoMetrics.scaleWidth;
            this.photoMetrics.scaledHeight = this.photoMetrics.originalHeight * this.photoMetrics.scaleHeight;
        }

        if (this.photoMetrics.zoom == 1.0) {
            // Center
            this.photoMetrics.x = (root.clientWidth / 2 - this.photoMetrics.scaledRotatedWidth / 2);
            this.photoMetrics.y = (root.clientHeight / 2 - this.photoMetrics.scaledRotatedHeight / 2);
        }

        container.style["width"] = this.photoMetrics.scaledRotatedWidth + "px";
        container.style["height"] = this.photoMetrics.scaledRotatedHeight + "px";
        container.style["left"] = this.photoMetrics.x + "px";
        container.style["top"] = this.photoMetrics.y + "px";

        image.style["width"] = this.photoMetrics.scaledWidth + "px";
        image.style["height"] = this.photoMetrics.scaledHeight + "px";
        image.style["transform"] = `rotate(${this.photoMetrics.rotation}deg)`;
    }

    rotateImage = (deg, layout=true, save=true) => {
        if (deg >= 360)
            deg = 0;
        //else
            //deg = Math.round(deg / 90) * 90;

        this.photoMetrics.rotation = deg;

        if (deg == 0) {
            this.photoMetrics.rotatedWidth = this.photoMetrics.originalWidth;
            this.photoMetrics.rotatedHeight = this.photoMetrics.originalHeight;
        }
        else {
            const rad = deg * Math.PI / 180;
            this.photoMetrics.rotatedWidth = Math.abs(this.photoMetrics.originalWidth * Math.cos(rad)) + Math.abs(this.photoMetrics.originalHeight * Math.sin(rad));
            this.photoMetrics.rotatedHeight = Math.abs(this.photoMetrics.originalWidth * Math.sin(rad)) + Math.abs(this.photoMetrics.originalHeight * Math.cos(rad));        }

        this.photoMetrics.aspect = this.photoMetrics.rotatedWidth / this.photoMetrics.rotatedHeight;

        if (layout) {
            this.layoutImage();
        }

        if (save) {
            // TODO: Send rotation to api
        }
    }

    zoomImage = (zoom, event=false, ) => {
        if (zoom < 1.0) {
            zoom = 1.0;
        }

        const lastZoom = this.photoMetrics.zoom;

        if (this.photoMetrics.zoom != zoom) {
            this.setState({zoomed: (zoom > 1)})
        }

        if (zoom > 1) {
            const magnitude = zoom / lastZoom;

            const scaledWidth = this.photoMetrics.scaledWidth * magnitude;
            const scaledHeight = this.photoMetrics.scaledHeight * magnitude;

            if (
                scaledWidth > this.photoMetrics.originalWidth ||
                scaledHeight > this.photoMetrics.originalHeight
            ) {
                return;
            }

            this.photoMetrics.zoom = zoom;
            this.photoMetrics.scaledWidth = scaledWidth;
            this.photoMetrics.scaledHeight = scaledHeight;
            this.photoMetrics.scaledRotatedWidth *= magnitude;
            this.photoMetrics.scaledRotatedHeight *= magnitude;

            const container = this.refs.imageContainer;
            const image = this.refs.image;

            container.style["width"] = this.photoMetrics.scaledRotatedWidth + "px";
            container.style["height"] = this.photoMetrics.scaledRotatedHeight + "px";
            image.style["width"] = this.photoMetrics.scaledWidth + "px";
            image.style["height"] = this.photoMetrics.scaledHeight + "px";

            var x = 0;
            var y = 0;
            var px = 0;
            var py = 0;

            if (event) {
                px = event.nativeEvent.pageX;
                py = event.nativeEvent.pageY;

                x = px - this.photoMetrics.x;
                y = py - this.photoMetrics.y;
            }
            else {
                const root = this.refs.root.container;

                x = container.clientWidth / 2;
                y = container.clientHeight / 2;
                px = root.clientWidth / 2;
                py = root.clientHeight / 2;
            }

            this.photoMetrics.x = px - (x * magnitude);
            this.photoMetrics.y = py - (y * magnitude);

            container.style["left"] = this.photoMetrics.x + "px";
            container.style["top"] = this.photoMetrics.y + "px";
        }
        else {
            this.photoMetrics.zoom = zoom;
            this.layoutImage();
        }
    }

    setDisableTransitions = (disabled) => {
        if (disabled) {
            this.refs.image.style["transition"] = "";
            this.refs.imageContainer.style["transition"] = "";
        }
        else {
            this.refs.image.style["transition"] = "all 0.1s linear, transform 0.5s ease";
            this.refs.imageContainer.style["transition"] = "all 0.1s linear";
        }
    }

    render() {
        const classes = this.props.classes;

        return (
            <ResizeAware
                onlyEvent
                onResize={this.onResize}
                ref="root"
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
                        {this.state.imageLoaded && this.props.info ?
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
                        {this.props.info ?
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

                <div
                    className={classes.imageContainer}
                    onWheel={this.onWheel}
                    onMouseDown={this.onContainerMouseDown}
                    onMouseUp={this.onContainerMouseUp}
                    ref="imageContainer"
                >
                    {this.props.filename && this.props.filename.length > 0 ?
                        <img
                            className={classes.image}
                            ref="image"
                            onLoad={this.onImageLoaded}
                            src={`${constants.API_URL}/media/${this.props.filename}`}
                        />
                    :
                        ""
                    }
                </div>
            </ResizeAware>
        )
    }
}

export default withStyles(styleSheet) (PhotoViewer);
