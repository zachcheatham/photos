const constants = require("../helpers/constants.js");

import React from 'react';
import axios from "axios";

import AppBar from "material-ui/AppBar";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemText } from 'material-ui/List';
import Menu, {MenuItem} from 'material-ui/Menu'
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import { withStyles, createStyleSheet } from 'material-ui/styles';

import KeyboardArrowDownIcon from "material-ui-icons/KeyboardArrowDown";
import MoreVertIcon from "material-ui-icons/MoreVert";
import PhotoIcon from "material-ui-icons/Photo";

const styleSheet = createStyleSheet(theme => ({
    icon: {
        margin: theme.spacing.unit
    },
    flex: {
        flex: 1
    },
    noFlex: {
        flex: "none"
    },
    netError: {
        color: theme.palette.error.A400,
        marginBottom: theme.spacing.unit
    }
}));

class PhotosAppBar extends React.Component {
    state = {
        menuAnchor: undefined,
        menuOpen: false,
        yearsMenuAnchor: undefined,
        yearsMenuOpen: false,
        years: [],
        selectedYear: 0,
    };

    requestYearsMenuOpen = event => {
        this.setState({yearsMenuOpen: true, yearsMenuAnchor: event.currentTarget});
    };

    requestYearsMenuClose = event => {
        this.setState({yearsMenuOpen: false});
    }

    requestMenuOpen = event => {
        this.setState({menuOpen: true, menuAnchor: event.currentTarget});
    };

    requestMenuClose = () => {
        this.setState({menuOpen: false});
    }

    requestIndexManagerOpen = () => {
        this.requestMenuClose();
        this.props.requestIndexManagerOpen();
    }

    fetchYears = () => {
        axios.get(constants.API_URL + "/years")
            .then((response) => {
                this.setState({
                    years: response.data.years
                })
            })
            .catch((error) => {
                console.log(error);
            });
    }

    componentDidMount() {
        this.fetchYears();
    }

    render() {
        const classes = this.props.classes;

        return (
            <AppBar position="static">
            <AppBar position="fixed">
                <Toolbar>
                    <PhotoIcon className={classes.icon} />
                    <List className={classes.noFlex}>
                        <ListItem
                            button
                            aria-haspopup="true"
                            aria-label="Choose Year"
                            onClick={this.requestYearsMenuOpen}
                        >
                            <ListItemText primary="Overview" />
                            <KeyboardArrowDownIcon />
                        </ListItem>
                    </List>
                    <span className={classes.flex}></span>
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
                    id="years-menu"
                    anchorEl={this.state.yearsMenuAnchor}
                    open={this.state.yearsMenuOpen}
                    onRequestClose={this.requestYearsMenuClose}
                >
                    <MenuItem
                        key={0}
                        selected={this.state.selectedYear == 0}
                        onClick={event => this.switchYear(event, 0)}
                    >
                        Overview
                    </MenuItem>

                    {this.state.years.reverse().map((year, index) =>
                        <MenuItem
                            key={index}
                            selected={this.state.selectedYear == year.year}
                            onClick={event => this.switchYear(year.year, 0)}
                        >
                            {year.year}
                        </MenuItem>
                    )}
                </Menu>
                <Menu
                    id="app-menu"
                    anchorEl={this.state.menuAnchor}
                    open={this.state.menuOpen}
                    onRequestClose={this.requestMenuClose}
                >
                    <MenuItem onClick={this.requestIndexManagerOpen}>Update Indexes</MenuItem>
                </Menu>
            </AppBar>
        );
    }
}

export default withStyles(styleSheet)(PhotosAppBar);
