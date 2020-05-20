import React from 'react';
import { withStyles } from "@material-ui/styles";

const styles = theme => ({
    container: theme.mixins.gutters({
        paddingTop: theme.spacing(11),
        flex: 1,
    })
});

class Container extends React.Component {
    render() {
        const classes = this.props.classes;
        return (
            <div className={classes.container}>
                {this.props.children}
            </div>
        );
    }
}

export default withStyles(styles)(Container);
