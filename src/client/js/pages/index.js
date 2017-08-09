import React from 'react';

import withRoot from '../components/withRoot';
import IndexManager from "../components/IndexManager"
import PhotosAppBar from "../components/PhotosAppBar"

class Index extends React.Component {
    state = {
        indexManagerOpen: false,
    };

    requestIndexManagerOpen = () => {
        this.setState({indexManagerOpen: true});
    }

    requestIndexManagerClose = () => {
        this.setState({indexManagerOpen: false});
    }

    render() {
        const classes = this.props.classes;

        return (
            <div>
                <PhotosAppBar
                    requestIndexManagerOpen={this.requestIndexManagerOpen}
                />
                <IndexManager
                    open={this.state.indexManagerOpen}
                    onRequestClose={this.requestIndexManagerClose}
                />
            </div>
        );
    }
}

export default withRoot(Index);
