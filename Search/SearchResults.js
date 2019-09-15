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
            {results.map(result => <SearchResult key={result.name} result={result} onClick={onResultClick} />)}
        </div>
    )
}


const SearchResult = ({result, onClick}) => {
    return (
        <div className='Result' onClick={e => onClick(result)}>
            <p>{result.name}</p>
        </div>
    )
}


export default SearchResults;