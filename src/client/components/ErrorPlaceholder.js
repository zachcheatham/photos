import React from 'react';
import { withRouter } from "react-router-dom"

import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/styles";

import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import CloudOffIcon from "@material-ui/icons/CloudOff";

const styles = theme => ({
    error: {
        color: theme.palette.text.secondary,
    },
    centerContainer: theme.mixins.gutters({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        textAlign: "center",
    }),
    bigIcon: {
        height: 128,
        width: 128,
        marginBottom: theme.spacing(2)
    },
    button: {
        marginTop: theme.spacing(4)
    }
});

class ErrorPlaceHolder extends React.Component {
    goBack = () => {
        this.props.history.goBack();
    }

    render() {
        const classes = this.props.classes;
        return (
            <div className={`${classes.centerContainer} ${classes.error}`}>
                <div>
                    {this.props.connection ?
                        <CloudOffIcon className={classes.bigIcon}/>
                    :
                        <ErrorOutlineIcon className={classes.bigIcon}/>
                    }
                    <Typography variant="h5">
                        {this.props.message}
                    </Typography>
                    {this.props.goBack ?
                        <Button
                            raised
                            color="secondary"
                            className={classes.button}
                            onClick={this.goBack}
                        >
                            Go Back
                        </Button>
                    :
                        ""
                    }
                    {this.props.retry ?
                        <Button
                            raised
                            color="secondary"
                            className={classes.button}
                            onClick={this.props.retry}
                        >
                            Retry
                        </Button>
                    :
                        ""
                    }
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(withRouter(ErrorPlaceHolder));
