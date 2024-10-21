import React from 'react';
// import { getCurrentWindow } from '@electron/remote';
import './CustomTitleBar.css';

const CustomTitleBar = () => {
  const handleMinimize = () => {
    // getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    // const window = getCurrentWindow();
    // if (window.isMaximized()) {
    //   window.unmaximize();
    // } else {
    //   window.maximize();
    // }
  };

  const handleClose = () => {
    // getCurrentWindow().close();
  };

  return (
    <div className="title-bar">
      <div className="title">My Electron App</div>
      <div className="window-controls">
        <button onClick={handleMinimize}>_</button>
        <button onClick={handleMaximize}>[]</button>
        <button onClick={handleClose}>X</button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
