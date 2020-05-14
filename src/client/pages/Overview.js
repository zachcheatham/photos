import React from 'react';

import { GridList, GridListTile } from 'material-ui/GridList';
import Paper from "material-ui/Paper";
import { withStyles, createStyleSheet } from 'material-ui/styles';
import Typography from "material-ui/Typography";

import Container from "../components/Container"

const styles = (theme) => ({
    paddedPaper: theme.mixins.gutters({
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
        marginBottom: theme.spacing.unit * 2
    })
});

class Overview extends React.Component {
    render() {
        const classes = this.props.classes;

        return (
            <Container>
                <Typography type="display1" gutterBottom>
                    Statistics
                </Typography>
                <Paper className={classes.paddedPaper}>
                    <Typography type="body1">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec laoreet massa hendrerit pulvinar rutrum. Cras congue feugiat ante, eget imperdiet neque rhoncus at. Phasellus eget ultricies quam. Pellentesque orci felis, auctor blandit lobortis viverra, interdum non risus. Fusce auctor rutrum quam, vel suscipit leo porta ac. Morbi commodo placerat lacus. In vehicula mollis elit. Quisque eu consectetur nibh. Duis posuere, metus ac sodales hendrerit, lorem elit tincidunt est, id dapibus nibh lorem in diam. Aliquam erat volutpat. Maecenas ullamcorper felis quis sagittis congue. Pellentesque sollicitudin sagittis vulputate. Sed varius metus sed nulla efficitur, a bibendum nisl imperdiet. Proin in tincidunt sapien.

                        Aliquam vel aliquam nunc, non molestie nulla. Aliquam vel pretium nisl, ut posuere risus. Curabitur posuere augue ut nisl sagittis luctus. Aliquam eget sem ac metus vulputate aliquet. Quisque rutrum maximus mi dapibus ultrices. Nunc luctus neque quis dui molestie malesuada. Vivamus varius, dui et rhoncus pellentesque, ante nisi volutpat est, mollis cursus elit arcu sed risus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
                    </Typography>
                </Paper>
                <Typography type="display1" gutterBottom>
                    Recent
                </Typography>
                <GridList cellHeight={180}>
                    <GridListTile key="Demo">
                        <img src="https://athlonecommunityradio.ie/wp-content/uploads/2017/04/placeholder.png" alt="placeholder" />
                    </GridListTile>
                    <GridListTile key="Demo1">
                        <img src="https://athlonecommunityradio.ie/wp-content/uploads/2017/04/placeholder.png" alt="placeholder" />
                    </GridListTile>
                    <GridListTile key="Demo2">
                        <img src="https://athlonecommunityradio.ie/wp-content/uploads/2017/04/placeholder.png" alt="placeholder" />
                    </GridListTile>
                </GridList>
            </Container>
        )
    }
}

export default withStyles(styles)(Overview);
