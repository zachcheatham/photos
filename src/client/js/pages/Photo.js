const constants = require("../helpers/constants.js");

import React from 'react';
import { withRouter } from "react-router-dom"

import axios from "axios";
import { Map, Marker, TileLayer } from "react-leaflet";

import Avatar from "material-ui/Avatar";
import Grid from "material-ui/Grid";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader } from "material-ui/List";
import Modal from "material-ui/internal/Modal";
import { withStyles, createStyleSheet } from "material-ui/styles";
import TextField from "material-ui/TextField";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";

import CameraIcon from "material-ui-icons/Camera"
import CloseIcon from "material-ui-icons/Close"
import ImageIcon from "material-ui-icons/Image"
import InsertInvitationIcon from "material-ui-icons/InsertInvitation"
import LensIcon from "material-ui-icons/Lens"
import ModeEditIcon from "material-ui-icons/ModeEdit"
import LocationOnIcon from "material-ui-icons/LocationOn"

import moment from "moment-timezone";

import PhotoViewer from "../components/PhotoViewer.js";

const styleSheet = createStyleSheet((theme) => ({
    main: {
        width: "100%",
        display: "flex",
        minHeight: "100vh",
    },
    photoContainer: {
        flex: 1,
    },
    info: {
        backgroundColor: theme.palette.background.default,
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 360,
        overflowX: "hidden",
        overflowY: "auto",
        transition: "flex-basis ease 0.25s"
    },
    hiddenInfo: {
        extend: "info",
        flexBasis: 0,
    },
    infoInner: {
        width: 360
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
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    }),
    map: {
        width: 360,
        height: 360
    }
}));

var formatBytes = function(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
}

//TODO: Include make name in camera description when model doesn't include make
class Photo extends React.Component {
    state = {
        showInfo: false,
    }

    getPhotoInfo = (filename) => {
        axios.get(constants.API_URL + "/photos/" + filename)
            .then((response) => {
                this.setState({
                    info: response.data.photo
                })

                if (response.data.photo.latitude && !response.data.photo.geodecoded) {
                    this.geodecode(response.data.photo.latitude, response.data.photo.longitude);
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
                console.log(response)
                if (response.data.success) {
                    const info = this.state.info;
                    info["geodecoded"] = response.data.location;
                    this.setState({
                        info: info,
                    });
                }
            })
    }

    requestInfoToggle = () => {
        this.setState({showInfo: !this.state.showInfo});
    }

    requestBack = () => {
        this.props.history.goBack();
    }

    componentDidMount() {
        if (this.props.filename) {
            this.getPhotoInfo(this.props.filename);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.filename != this.props.filename) {
            this.setState({info: false});
            if (nextProps.filename) {
                this.getPhotoInfo(nextProps.filename);
            }
        }
    }

    render() {
        const classes = this.props.classes;

        const tsMoment = moment.unix(this.state.info ? this.state.info.timestamp : 0).tz("utc");

        return (
            <Modal
                show={this.props.show}
                disableBackdrop={true}
            >
                <div className={classes.main}>
                    <PhotoViewer
                        className={classes.photoContainer}
                        requestInfoToggle={this.requestInfoToggle}
                        requestBack={this.requestBack}
                        filename={this.props.filename}
                        info={this.state.info}
                    />
                    <div className={this.state.showInfo ? classes.info : classes.hiddenInfo}>
                        <div className={classes.infoInner}>
                            <div className={classes.appBar}>
                                <Toolbar>
                                    <Typography type="title" className={classes.flex}>
                                        Info
                                    </Typography>
                                    <IconButton onClick={this.requestInfoToggle}>
                                        <CloseIcon />
                                    </IconButton>
                                </Toolbar>
                            </div>
                            <div className={classes.infoContent}>
                                <TextField label="Description" fullWidth={true} helperText={this.state.editingDescription ? "Press Enter to Save!" : false}/>
                            </div>
                            <List subheader={<ListSubheader>Details</ListSubheader>}>
                                <ListItem>
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
                                    <ListItemSecondaryAction>
                                        <IconButton>
                                            <ModeEditIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <ImageIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        disableTypography={true}
                                        primary={
                                            <Typography type="subheading">
                                                {this.state.info ? this.state.info.filename : ""}
                                            </Typography>
                                        }
                                        secondary={
                                            <Grid container justify="space-between">
                                                <Grid item>
                                                    <Typography color="secondary" type="body1">
                                                        {this.state.info ? Math.round(this.state.info.width * this.state.info.height / 1000000) : ""}MP
                                                    </Typography>
                                                </Grid>
                                                <Grid item>
                                                    <Typography color="secondary" type="body1">
                                                        {this.state.info ? this.state.info.width + " × " + this.state.info.height : ""}
                                                    </Typography>
                                                </Grid>
                                                <Grid item>
                                                    <Typography color="secondary" type="body1">
                                                        {this.state.info ? formatBytes(this.state.info.filesize) : ""}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        }
                                    />
                                </ListItem>
                                {this.state.info && this.state.info.model ?
                                    <ListItem>
                                        <ListItemIcon>
                                            <CameraIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            disableTypography={true}
                                            primary={
                                                <Typography type="subheading">
                                                    {this.state.info ? this.state.info.model : ""}
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
                                                                <Typography color="secondary" type="body1">
                                                                    f/{this.state.info.fnumber}
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.exposure_time ?
                                                            <Grid item>
                                                                <Typography color="secondary" type="body1">
                                                                    1/{Math.round(1/this.state.info.exposure_time)}
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.focal_length ?
                                                            <Grid item>
                                                                <Typography color="secondary" type="body1">
                                                                    {this.state.info.focal_length}mm
                                                                </Typography>
                                                            </Grid>
                                                        : ""}
                                                        {this.state.info && this.state.info.iso ?
                                                            <Grid item>
                                                                <Typography color="secondary" type="body1">
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
                                {this.state.info && this.state.info.latitude ?
                                    <ListItem>
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

export default withStyles(styleSheet) (withRouter(Photo));
