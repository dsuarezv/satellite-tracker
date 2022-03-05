import React from 'react';
import './DateSlider.css';


const DateSlider = ({min, max, value, onChange, onRender}) => {
    return (
        <div className='DateSliderWrapper'>
            {onRender ? <span className='Value'>{onRender(value)}</span> : null}
            <input type="range" min={min} max={max} value={value} className="DateSlider" onChange={onChange} />
        </div>
    )
}

export default DateSlider;