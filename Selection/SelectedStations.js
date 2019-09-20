import React from 'react';
import { StationCard } from '../Search/SearchResults';

export default function({selected, onRemoveStation, onRemoveAll, onStationClick}) {
    if (!selected || selected.length === 0) return null;

    return (
        <div className='Selected'>
            <h2>Selected</h2>
            <p className='SmallButton' onClick={onRemoveAll}>Clear all</p>
            {selected.map((station, i) => {
                return <StationCard 
                    station={station} 
                    key={station.name + i} 
                    onRemoveClick={onRemoveStation}
                    onClick={onStationClick}
                />
            })}
        </div>
    )
}