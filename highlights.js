import React from 'react';

const Highlights = ({query, total}) => {
    if (!query) return null;

    return (
        <div className='Highlights'>
            <p className='Hint'>Highlighting in orange satellites with name matching</p>
            <p className='Highlight'>{query}</p>
            <p className='Hint'>{total} satellites</p>
        </div>
    )
}

export default Highlights;