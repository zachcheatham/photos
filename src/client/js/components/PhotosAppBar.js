const constants = require("../helpers/constants.js");

import React from "react";
import { withRouter } from "react-router-dom"

import axios from "axios";

import AppBar from "material-ui/AppBar";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemText } from "material-ui/List";
import Menu, {MenuItem} from "material-ui/Menu"
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import { withStyles } from "material-ui/styles";

import KeyboardArrowDownIcon from "material-ui-icons/KeyboardArrowDown";
import MoreVertIcon from "material-ui-icons/MoreVert";
import PhotoIcon from "material-ui-icons/Photo";

const styles = theme => ({
    icon: {
        margin: theme.spacing.unit
    },
    flex: {
        flex: 1
    },
    netError: {
        color: theme.palette.error.A400,
        marginBottom: theme.spacing.unit
    },
    selector: {
        padding: 0,
        flex: "none"
    }
});

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

    switchYear = (event, year) => {
        this.requestYearsMenuClose();
        if (year == 0)
            this.props.history.push("/");
        else
            this.props.history.push("/" + year);
    }

    getRoutedYear = (pathname) => {
        var parts = pathname.split("/");
        if (parts.length < 2 || parts[1].length < 1) {
            return 0;
        }
        else {
            return parseInt(parts[1]);
        }
    }

    componentDidMount() {
        this.fetchYears();
        this.state.selectedYear = this.getRoutedYear(this.props.location.pathname);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname != this.props.location.pathname) {
            this.state.selectedYear = this.getRoutedYear(nextProps.location.pathname);
        }
    }

    render() {
        const classes = this.props.classes;
        return (
            <AppBar position="fixed">
                <Toolbar>
                    <PhotoIcon className={classes.icon} />
                    <List className={classes.selector}>
                        <ListItem
                            button
                            aria-haspopup="true"
                            aria-label="Choose Year"
                            onClick={this.requestYearsMenuOpen}
                        >
                            <ListItemText
                                disableTypography
                                primary={
                                    <Typography
                                        type="title"
                                        color="inherit"
                                    >
                                        {this.state.selectedYear == 0 ? "Overview" : this.state.selectedYear}
                                    </Typography>
                                }
                                />
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

                    {this.state.years.slice(0).reverse().map((year, index) =>
                        <MenuItem
                            key={year.year}
                            selected={this.state.selectedYear == year.year}
                            onClick={event => this.switchYear(event, year.year)}
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

export default withStyles(styles)(withRouter(PhotosAppBar));
