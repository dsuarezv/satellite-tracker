import React, { Component } from 'react';
import SearchResults from './SearchResults';
import SearchBox from './SearchBox';

class Search extends Component {

    state = { 
        searchText: ''
    }

    handleSearchChanged = (val) => {
        this.setState({searchText: val});
    }

    render() {
        const { stations, onResultClick } = this.props;

        return (
            <div className='Search'>
                <SearchBox value={this.state.searchText} onChange={this.handleSearchChanged} />
                <SearchResults stations={stations} searchText={this.state.searchText} onResultClick={onResultClick} />
            </div>
        )
    }
}

export default Search;