import React from "react";

import Divider from "material-ui/Divider";
import { withStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";

const styles = theme => ({
    container: theme.mixins.gutters({
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2
    }),
    footDivider: {
        marginBottom: theme.spacing.unit
    }
});

class Container extends React.Component {
    render() {
        const classes = this.props.classes;
        return (
            <div className={classes.container}>
                <Divider className={classes.footDivider}/>
                <Typography type="caption">Zach Cheatham</Typography>
            </div>
        );
    }
}

export default withStyles(styles)(Container);
