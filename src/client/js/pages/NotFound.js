import React from 'react';
import { withRouter } from "react-router-dom"

import Button from "material-ui/Button";
import { withStyles, createStyleSheet } from "material-ui/styles";
import Typography from "material-ui/Typography"

import CloudOffIcon from "material-ui-icons/CloudOff";

import Container from "../components/Container"

const styleSheet = createStyleSheet((theme) => ({
    center: {
        textAlign: "center"
    },
    button: {
        marginTop: theme.spacing.unit * 2
    }
}));

class NotFound extends React.Component {
    goBack = () => {
        this.props.history.goBack();
    }

    render() {
        const classes = this.props.classes;

        return (
            <Container className={classes.center}>
                <Typography type="display3" gutterBottom>
                    Not Found
                </Typography>
                <Typography type="display1" color="inherit">
                    Are you lost?
                </Typography>
                <Button
                    raised
                    color="primary"
                    className={classes.button}
                    onClick={this.goBack}
                >
                    Go Back
                </Button>
            </Container>
        )
    }
}

export default withStyles(styleSheet)(withRouter(NotFound));
