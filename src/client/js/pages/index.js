import React from 'react';

import AppBar from "material-ui/AppBar";
import IconButton from "material-ui/IconButton";
import Menu, {MenuItem} from 'material-ui/Menu'
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import { withStyles, createStyleSheet } from 'material-ui/styles';

import MoreVertIcon from "material-ui-icons/MoreVert";
import PhotoIcon from "material-ui-icons/Photo";

import withRoot from '../components/withRoot';
import IndexManager from "../components/IndexManager"

const styleSheet = createStyleSheet(theme => ({
    icon: {
        margin: theme.spacing.unit
    },
    flex: {
        flex: 1
    }
}));

class Index extends React.Component {
    state = {
        menuAnchor: undefined,
        menuOpen: false,
        indexManagerOpen: false,
    };

    requestMenuOpen = event => {
        this.setState({menuOpen: true, menuAnchor: event.currentTarget});
    };

    requestMenuClose = () => {
        this.setState({menuOpen: false});
    }

    requestIndexManagerOpen = () => {
        this.setState({indexManagerOpen: true});
        this.requestMenuClose();
    }

    requestIndexManagerClose = () => {
        this.setState({indexManagerOpen: false});
    }
    
    render() {
        const classes = this.props.classes;

        return (
            <div>
                <AppBar position="static">
                    <Toolbar>
                        <PhotoIcon className={classes.icon} />
                        <Typography type="title" color="inherit" className={classes.flex}>
                            Photos
                        </Typography>
                        <IconButton
                            color="inherit"
                            aria-label="App Menu"
                            aria-owns={this.state.open ? "app-menu" : null}
                            aria-haspopup="true"
                            onClick={this.requestMenuOpen}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Toolbar>
                    <Menu
                        id="app-menu"
                        anchorEl={this.state.menuAnchor}
                        open={this.state.menuOpen}
                        onRequestClose={this.requestMenuClose}
                    >
                        <MenuItem onClick={this.requestIndexManagerOpen}>Update Indexes</MenuItem>
                    </Menu>
                </AppBar>

                <IndexManager
                    open={this.state.indexManagerOpen}
                    onRequestClose={this.requestIndexManagerClose}
                />
            </div>
        );
    }
}

export default withRoot(withStyles(styleSheet)(Index));
