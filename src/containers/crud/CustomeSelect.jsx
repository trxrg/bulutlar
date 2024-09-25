import React from 'react';
import Select, { components } from 'react-select';

const options = [
  { value: 'red', label: 'Red', color: '#ffdddd' },
  { value: 'green', label: 'Green', color: '#ddffdd' },
  { value: 'blue', label: 'Blue', color: '#ddddff' },
];

const CustomOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full p-2">
        <span style={{ color: props.data.color }}>{props.data.label}</span>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the dropdown from closing
            alert(`Button clicked for ${props.data.label}`);
          }}
          className="ml-2 px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Action
        </button>
      </div>
    </components.Option>
  );
};

const customStyles = {
  control: (base) => ({
    ...base,
    border: '1px solid #ccc',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid #007bff',
    },
  }),
  option: (base, state) => {
    const backgroundColor = state.isFocused ? '#e2e8f0' : state.data.color;
    const color = state.isSelected ? '#fff' : '#333';

    return {
      ...base,
      backgroundColor,
      color,
    };
  },
  singleValue: (base, state) => ({
    ...base,
    color: state.data.color || '#333',
  }),
};

const CustomSelect = () => {
  const handleChange = (selectedOption) => {
    console.log('Selected color:', selectedOption);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Select
        options={options}
        onChange={handleChange}
        components={{ Option: CustomOption }} // Use the custom option
        className="react-select"
        classNamePrefix="select"
        styles={customStyles}
        placeholder="Choose a color..."
      />
    </div>
  );
};

export default CustomSelect;
