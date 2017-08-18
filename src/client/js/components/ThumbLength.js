import React from "react";

require("moment-duration-format");
import moment from "moment";

import { withStyles, createStyleSheet } from "material-ui/styles";
import Typography from "material-ui/Typography";

const styleSheet = createStyleSheet(theme => ({
    root: {
        position: "absolute",
        bottom: theme.spacing.unit,
        right: theme.spacing.unit,
        padding: "2px 8px",
        color: "#fff",
        background: "rgba(0,0,0,0.4)",
        fontFamily: theme.typography.fontFamily,
        fontSize: 16,
        borderRadius: 3
    }
}));

class ThumbLength extends React.Component {
    render() {
        const classes = this.props.classes;
        var time;
        if (this.props.length < 60)
            time = moment.duration(this.props.length, "seconds").format("00:ss", {trim: false});
        else
            time = moment.duration(this.props.length, "seconds").format("hh:mm:ss");

        return (
            <span className={classes.root}>
                {time}
            </span>
        );
    }
}

export default withStyles(styleSheet)(ThumbLength);
