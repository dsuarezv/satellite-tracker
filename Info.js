import React, { Component } from 'react';

class Info extends Component {
    render() {
        const p = this.props;
        const { selected, stations } = p;

        return (
            <div className='Info'>
                <h1>Satellite tracker</h1>
                <p>{selected && selected.name}</p>
                {stations && stations.length > 0 && (<p>Total objects: {stations.length}</p>)}
            </div>
        )
    }
}

export default Info;