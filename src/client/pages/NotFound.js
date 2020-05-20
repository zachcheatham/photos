import React from 'react';
import { withRouter } from "react-router-dom"

import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/styles";
import Typography from "@material-ui/core/Typography"

import Container from "../components/Container"

const styles = (theme) => ({
    center: {
        textAlign: "center"
    },
    button: {
        marginTop: theme.spacing(2)
    }
});

class NotFound extends React.Component {
    goBack = () => {
        this.props.history.goBack();
    }

    render() {
        const classes = this.props.classes;

        return (
            <Container className={classes.center}>
                <Typography variant="h6" gutterBottom>
                    Not Found
                </Typography>
                <Typography variant="h4" color="inherit">
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

export default withStyles(styles)(withRouter(NotFound));
