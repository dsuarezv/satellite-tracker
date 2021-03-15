import React from 'react';

const Highlights = ({query}) => {
    if (!query) return null;

    return (
        <div className='Highlights'>
            <p className='Hint'>Highlighting in orange satellites with name matching</p>
            <p className='Highlight'>{query}</p>
        </div>
    )
}

export default Highlights;