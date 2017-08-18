import React from 'react';
import { withStyles, createStyleSheet } from 'material-ui/styles';

const styleSheet = createStyleSheet(theme => ({
    container: theme.mixins.gutters({
        paddingTop: theme.spacing.unit * 11,
        flex: 1,
    })
}));

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

export default withStyles(styleSheet)(Container);
