import React from 'react';

import Modal from "material-ui/internal/Modal";
import { withStyles, createStyleSheet } from "material-ui/styles";
import Typography from "material-ui/Typography";

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
        flexBasis: "360px",
        overflow: "hidden",
        transition: "flex-basis ease 0.25s"
    },
    hiddenInfo: {
        extend: "info",
        flexBasis: 0,
    },
    innerInfo: theme.mixins.gutters({
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    })
}));

class Photo extends React.Component {
    state = {
        showInfo: false,
    }

    getPhotoInfo = () => {
        //TODO: PHOTO INFO
    }

    requestInfoToggle = () => {
        this.setState({showInfo: !this.state.showInfo});
    }

    render() {
        const classes = this.props.classes;

        return (
            <Modal
                show={this.props.show}
                disableBackdrop={true}
            >
                <div className={classes.main}>
                    <PhotoViewer
                        className={classes.photoContainer}
                        requestInfoToggle={this.requestInfoToggle}
                        filename={this.props.filename}
                    />
                    <div className={this.state.showInfo ? classes.info : classes.hiddenInfo}>
                        <div className={classes.innerInfo}>
                            <Typography type="title">Info</Typography>
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

export default withStyles(styleSheet) (Photo);
