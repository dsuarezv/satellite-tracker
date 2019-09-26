import React, { Component } from 'react';

const MaxSearchResults = 20;

const filterResults = (stations, searchText) => {
    if (!stations) return null;
    if (!searchText || searchText === '') return null;

    const regex = new RegExp(searchText, 'i');

    return stations.filter(station => regex.test(station.name)).slice(0, MaxSearchResults);
}

    
const SearchResults = ({stations, searchText, onResultClick}) => {
    const results = filterResults(stations, searchText);
    if (!results) return null;

    return (
        <div className='ResultsWrapper'>
            {results.map((result, i) => <StationCard key={result.name + i} station={result} onClick={onResultClick} />)}
        </div>
    )
}


export const StationCard = ({station, onClick, onRemoveClick, className}) => {
    return (
        <div className={'Result ' + (className || '')} onClick={e => onClick && onClick(station)}>
            <p>
                {station.name} 
                {onRemoveClick && <span className='RemoveButton' onClick={e => onRemoveClick(station)}>x</span>}
            </p>
        </div>
    )
}


export default SearchResults;