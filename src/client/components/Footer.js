import React from "react";

import Divider from "@material-ui/core/Divider";
import { withStyles } from "@material-ui/styles";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    container: theme.mixins.gutters({
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    }),
    footDivider: {
        marginBottom: theme.spacing(1)
    }
});

class Container extends React.Component {
    render() {
        const classes = this.props.classes;
        return (
            <div className={classes.container}>
                <Divider className={classes.footDivider}/>
                <Typography variant="subtitle2">Zach Cheatham</Typography>
            </div>
        );
    }
}

export default withStyles(styles)(Container);
