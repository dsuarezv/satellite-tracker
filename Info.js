import React, { Component } from 'react';
import SelectedStations from './Selection/SelectedStations';

class Info extends Component {
    render() {
        const p = this.props;
        const { selected, stations } = p;

        return (
            <div className='Info'>
                <h1>Satellite tracker</h1>
                {stations && stations.length > 0 && (<p>Total objects: {stations.length}</p>)}
            </div>
        )
    }
}

export default Info;