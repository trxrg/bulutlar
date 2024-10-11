import React from 'react';

const CustomLink = (props) => {
  const { contentState, entityKey, children } = props;
  const { url } = contentState.getEntity(entityKey).getData();
  
  console.log('in custom link');
  
  const handleClick = (e) => {
    
    console.log('link clicked with url: ' + url);
    e.preventDefault();
    window.open(url, '_blank'); // Open link in a new tab
  };
  
  return (
    <a href={url} onClick={handleClick}>
      {children}
    </a>
  );
};

export default CustomLink;
