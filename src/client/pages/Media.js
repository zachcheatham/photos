const constants = require("../helpers/constants.js");

import React from 'react';
import { withRouter } from "react-router-dom"

import axios from "axios";
import { Map, Marker, TileLayer } from "react-leaflet";

import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Modal from "@material-ui/core/Modal";
import CircularProgress from "@material-ui/core/CircularProgress";
import { withStyles } from "@material-ui/styles";
import TextField from "@material-ui/core/TextField";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import CameraIcon from "@material-ui/icons/Camera"
import CloseIcon from "@material-ui/icons/Close"
import ImageIcon from "@material-ui/icons/Image"
import InsertInvitationIcon from "@material-ui/icons/InsertInvitation"
import LocationOnIcon from "@material-ui/icons/LocationOn"
import VideocamIcon from "@material-ui/icons/Videocam"
import VolumeUpIcon from "@material-ui/icons/VolumeUp"

import moment from "moment-timezone";

import PhotoViewer from "../components/PhotoViewer.js";
import VideoViewer from "../components/VideoViewer.js";

const styles = (theme) => ({
    main: {
        width: "100%",
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "black",
    },
    mainLoading: {
        alignItems: "center",
        justifyContent: "center",
    },
    mediaContainer: {
        flex: 1,
    },
    info: {
        backgroundColor: theme.palette.background.default,
        overflowX: "hidden",
        overflowY: "auto",
    },
    [theme.breakpoints.up("sm")]: {
        info: {
            transition: "flex-basis ease 0.25s",
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: 360,
        },
        hiddenInfo: {
            flexBasis: 0,
        },
        infoInner: {
            width: 360
        },
        map: {
            width: 360,
            height: 360
        }
    },
    [theme.breakpoints.down("sm")]: {
        info: {
            transition: "top ease 0.25s",
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 2,
        },
        hiddenInfo: {
            top: "100vh"
        },
        infoInner: {
            width: "100wh",
            height: "100wh",
        },
        map: {
            width: "100%",
            height: 360
        }
    },
    appBar: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "none",
    },
    flex: {
        flex: 1
    },
    infoContent: theme.mixins.gutters({
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    }),
    listPadding: theme.mixins.gutters({}),
    iconAdjustment: {
        right: theme.spacing(2) + 4,
    },
});

var formatBytes = function(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
}

var formatBits = function(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 0;
    var units = ['b', 'kb', 'mb', 'gb', 'tb', 'pb'],
        number = Math.floor(Math.log(bytes) / Math.log(1000));
    return (bytes / Math.pow(1000, Math.floor(number))).toFixed(precision) + units[number];
}

var gcd = function(a, b) {
    return (b == 0) ? a : gcd(b, a%b);
}

var calculateAspect = function(w, h) {
    const r = gcd(w, h);
    return w / r + ":" + h / r;
}

var makeInModel = function(make, model) {
    if (make && model) {
        const makeWords = make.split(" ");
        for (var i = 0; i < makeWords.length; i++) {
            if (model.includes(makeWords[i])) {
                return true;
            }
        }
    }
    return false;
}

class Media extends React.Component {
    state = {
        showInfo: false,
        type: false,
    }

    getMediaInfo = (filename) => {
        axios.get(constants.API_URL + "/info/" + filename)
            .then((response) => {
                if (!makeInModel(response.data.info.make, response.data.info.model)) {
                    response.data.info["show_make"] = true;
                }

                if (response.data.info.comment == null) {
                    response.data.info.comment = "";
                }

                const type = response.data.info.type;
                response.data.info.type = undefined;

                this.setState({
                    type: type,
                    info: response.data.info
                });

                if (response.data.info.latitude && !response.data.info.geodecoded) {
                    this.geodecode(response.data.info.latitude, response.data.info.longitude);
                }
            })
            .catch((error) => {
                // TODO: set some error variables
                console.log(error);
            });
    }

    geodecode = (latitude, longitude) => {
        axios.get(constants.API_URL + "/geodecode/" + latitude + "," + longitude)
            .then((response) => {
                if (response.data.success) {
                    const info = this.state.info;
                    info["geodecoded"] = response.data.location;
                    this.setState({
                        info: info,
                    });
                }
            });
    }

    saveDescription = (description) => {
        axios.post(
            constants.API_URL + "/edit/description/" + this.props.filename,
            {
                "description": description
            }
        );
    }

    requestInfoToggle = () => {
        this.setState({showInfo: !this.state.showInfo});
    }

    requestBack = () => {
        this.props.history.goBack();
    }

    descriptionChanged = (event) => {
        if (this.saveDescriptionTimeout) {
            clearTimeout(this.saveDescriptionTimeout);
        }

        const val = event.target.value;
        this.saveDescriptionTimeout = setTimeout(() => {
            this.saveDescription(val);
            this.saveDescriptionTimeout = undefined;
        }, 3000);

        this.state.info.comment = val;
        this.setState({info: this.state.info});
    }

    componentDidMount() {
        if (this.props.filename) {
            this.getMediaInfo(this.props.filename);
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.filename != this.props.filename) {
            this.setState({
                info: false,
                type: false
            });

            if (this.props.filename) {
                this.getMediaInfo(this.props.filename);
            }
        }

        if (prevProps.show && !this.props.show) {
            this.setState({
                showInfo: false
            })
        }
    }

    render() {
        const classes = this.props.classes;

        const tsMoment = moment.unix(this.state.info ? this.state.info.timestamp : 0).tz("utc");

        return (
            <Modal
                open={this.props.show}
            >
                <div className={`${classes.main} ${!this.state.type ? classes.mainLoading : ""}`}>
                    {this.state.type == "photo" ?
                        <PhotoViewer
                            className={classes.mediaContainer}
                            requestInfoToggle={this.requestInfoToggle}
                            requestBack={this.requestBack}
                            filename={this.props.filename}
                            info={this.state.info}
                        />
                    : this.state.type == "video" ?
                        <VideoViewer
                            className={classes.mediaContainer}
                            requestInfoToggle={this.requestInfoToggle}
                            requestBack={this.requestBack}
                            filename={this.props.filename}
                            info={this.state.info}
                        />
                    :
                        <CircularProgress color="secondary" size={50} />
                    }

                    <div className={`${classes.info} ${this.state.showInfo ? "" : classes.hiddenInfo}`}>
                        <div className={classes.infoInner}>
                            <div className={classes.appBar}>
                                <Toolbar>
                                    <Typography variant="h6" className={classes.flex}>
                                        Info
                                    </Typography>
                                    <IconButton onClick={this.requestInfoToggle}>
                                        <CloseIcon />
                                    </IconButton>
                                </Toolbar>
                            </div>
                            <div className={classes.infoContent}>
                                <TextField
                                    label="Description"
                                    fullWidth={true}
                                    value={this.state.info ? this.state.info.comment : ""}
                                    onChange={this.descriptionChanged}/>
                            </div>
                            <List
                                subheader={
                                    <ListSubheader
                                        className={classes.listPadding}
                                    >
                                        Details
                                    </ListSubheader>
                                }
                            >
                                <ListItem className={classes.listPadding}>
                                    <ListItemIcon>
                                        <InsertInvitationIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            tsMoment.year() == moment().year() ?
                                                tsMoment.format("MMMM D")
                                            :
                                                tsMoment.format("MMMM D, YYYY")
                                        }
                                        secondary={tsMoment.format("dddd, h:mm A")}
                                        />
                                    {/*
                                    BUG https://github.com/callemall/material-ui/issues/4787 DateTimePicker not supported
                                    <ListItemSecondaryAction className={classes.iconAdjustment}>
                                        <IconButton>480p 60fps h264
                                            <ModeEditIcon />79
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                    */}
                                </ListItem>
                                <ListItem className={classes.listPadding}>
                                    <ListItemIcon>
                                        <ImageIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        disableTypography={true}
                                        primary={
                                            <Typography variant="subtitle1">
                                                {this.props.filename}
                                            </Typography>
                                        }
                                        secondary={
                                            <Grid container justify="space-between">
                                                <Grid item>
                                                    <Typography color="textSecondary" variant="body2">
                                                        {this.state.info ? Math.round(this.state.info.width * this.state.info.height / 1000000) : ""}MP
                                                    </Typography>
                                                </Grid>
                                                <Grid item>
                                                    <Typography color="textSecondary" variant="body2">
                                                        {this.state.info ? this.state.info.width + " × " + this.state.info.height : ""}
                                                    </Typography>
                                                </Grid>
                                                <Grid item>
                                                    <Typography color="textSecondary" variant="body2">
                                                        {this.state.info ? formatBytes(this.state.info.filesize) : ""}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        }
                                    />
                                </ListItem>
                                {this.state.info && this.state.info.model ?
                                    <ListItem className={classes.listPadding}>
                                        <ListItemIcon>
                                            <CameraIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            disableTypography={true}
                                            primary={
                                                <Typography variant="subtitle1">
                                                    {this.state.info.show_make ? this.state.info.make + " " + this.state.info.model : this.state.info.model}
                                                </Typography>
                                            }
                                            secondary={
                                                (
                                                    this.state.info.fnumber ||
                                                    this.state.info.exposure_time ||
                                                    this.state.info.focal_length ||
                                                    this.state.info.iso
                                                ) ?
                                                    <Grid container justify="space-between">
                                                        {this.state.info && this.state.info.fnumber ?
                                                            <Grid item>
                                                                <Typography color="textSecondary" variant="body2">
                                                                    f/{this.state.info.fnumber}
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.exposure_time ?
                                                            <Grid item>
                                                                <Typography color="textSecondary" variant="body2">
                                                                    1/{Math.round(1/this.state.info.exposure_time)}
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.focal_length ?
                                                            <Grid item>
                                                                <Typography color="textSecondary" variant="body2">
                                                                    {this.state.info.focal_length}mm
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.iso ?
                                                            <Grid item>
                                                                <Typography color="textSecondary" variant="body2">
                                                                    ISO{this.state.info.iso}
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                    </Grid>
                                                : false
                                            }
                                        />
                                    </ListItem>
                                : ""}
                                {this.state.info && this.state.info.video_codec ?
                                    <ListItem className={classes.listPadding}>
                                        <ListItemIcon>
                                            <VideocamIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            disableTypography={true}
                                            primary={
                                                <Typography>
                                                    {this.state.info.video_codec}
                                                </Typography>
                                            }
                                            secondary={
                                                <Grid container justify="space-between">
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {this.state.info.height}{this.state.info.scanning_method.toLowerCase()}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {Math.round(this.state.info.framerate)}fps
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {calculateAspect(this.state.info.width, this.state.info.height)}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            }
                                        />
                                    </ListItem>
                                : ""}
                                {this.state.info && this.state.info.audio_codec ?
                                    <ListItem className={classes.listPadding}>
                                        <ListItemIcon>
                                            <VolumeUpIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            disableTypography={true}
                                            primary={
                                                <Typography variant="subtitle1">
                                                    {this.state.info.audio_codec}
                                                </Typography>
                                            }
                                            secondary={
                                                <Grid container justify="space-between">
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {formatBits(this.state.info.audio_bitrate)}ps&nbsp;
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {this.state.info.audio_sample_rate}hz
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {this.state.info.audio_channel_layout.charAt(0).toUpperCase() + this.state.info.audio_channel_layout.substr(1)}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            }
                                        />
                                    </ListItem>
                                : ""}
                                {this.state.info && this.state.info.latitude ?
                                    <ListItem className={classes.listPadding}>
                                        <ListItemIcon>
                                            <LocationOnIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={this.state.info.geodecoded ? this.state.info.geodecoded : "Locating..."}
                                            secondary={(Math.round(this.state.info.latitude * 1000) / 1000) + ", " + (Math.round(this.state.info.longitude * 1000) / 1000)}
                                        />
                                    </ListItem>
                                : ""}
                            </List>
                            {this.state.info && this.state.info.latitude ?
                                <Map
                                    className={classes.map}
                                    center={[this.state.info.latitude, this.state.info.longitude]}
                                    zoom={16}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Marker position={[this.state.info.latitude, this.state.info.longitude]} />
                                </Map>
                            : ""}
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

export default withStyles(styles) (withRouter(Media));
