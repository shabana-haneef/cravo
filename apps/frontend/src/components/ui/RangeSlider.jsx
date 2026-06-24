import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export const RangeSlider = ({ min, max, minVal, maxVal, onChange }) => {
  const minBound = Number(min) || 0;
  const maxBound = Number(max) || 1000;

  // Convert props to safe numbers
  let safeMin = Number(minVal);
  if (isNaN(safeMin)) safeMin = minBound;
  
  let safeMax = Number(maxVal);
  if (isNaN(safeMax)) safeMax = maxBound;

  const [value, setValue] = useState([safeMin, safeMax]);

  // Keep state synced with props if they change externally
  useEffect(() => {
    let newMin = Number(minVal);
    if (isNaN(newMin)) newMin = minBound;
    let newMax = Number(maxVal);
    if (isNaN(newMax)) newMax = maxBound;
    setValue([newMin, newMax]);
  }, [minVal, maxVal, minBound, maxBound]);

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const handleAfterChange = (newValue) => {
    if (onChange) {
      onChange({ min: newValue[0], max: newValue[1] });
    }
  };

  return (
    <div className="w-full px-2 py-4">
      <Slider
        range
        min={minBound}
        max={maxBound}
        value={value}
        onChange={handleChange}
        onChangeComplete={handleAfterChange}
        trackStyle={[{ backgroundColor: '#154D21', height: 6 }]}
        handleStyle={[
          {
            backgroundColor: '#154D21',
            borderColor: 'white',
            borderWidth: 2,
            height: 20,
            width: 20,
            marginTop: -7,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            opacity: 1,
          },
          {
            backgroundColor: '#154D21',
            borderColor: 'white',
            borderWidth: 2,
            height: 20,
            width: 20,
            marginTop: -7,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            opacity: 1,
          },
        ]}
        railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
      />
    </div>
  );
};
