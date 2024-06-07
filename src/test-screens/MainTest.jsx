import React, { useState } from "react";

function MainTest() {
  const [paneWidths, setPaneWidths] = useState({
    leftPaneWidth: "50%",
    rightPaneWidth: "50%"
  });
  const [isLeftPaneCollapsed, setIsLeftPaneCollapsed] = useState(false);
  const [isRightPaneCollapsed, setIsRightPaneCollapsed] = useState(false);

  const handleResize = (event) => {
    const { offsetX } = event.nativeEvent;
    const totalWidth = window.innerWidth;
    const newLeftPaneWidth = `${(offsetX / totalWidth) * 100}%`;
    const newRightPaneWidth = `${100 - (offsetX / totalWidth) * 100}%`;
    setPaneWidths({
      leftPaneWidth: newLeftPaneWidth,
      rightPaneWidth: newRightPaneWidth
    });
  };

  const handleCollapse = (pane) => {
    if (pane === "left") {
      setIsLeftPaneCollapsed(!isLeftPaneCollapsed);
      if (!isLeftPaneCollapsed) {
        setPaneWidths({
          leftPaneWidth: "0%",
          rightPaneWidth: "100%"
        });
      } else {
        setPaneWidths({
          leftPaneWidth: "50%",
          rightPaneWidth: "50%"
        });
      }
    } else {
      setIsRightPaneCollapsed(!isRightPaneCollapsed);
      if (!isRightPaneCollapsed) {
        setPaneWidths({
          leftPaneWidth: "100%",
          rightPaneWidth: "0%"
        });
      } else {
        setPaneWidths({
          leftPaneWidth: "50%",
          rightPaneWidth: "50%"
        });
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`pane ${isLeftPaneCollapsed ? "hidden" : ""} bg-gray-200`}
        style={{ width: paneWidths.leftPaneWidth }}
      >
        <button onClick={() => handleCollapse("left")} className="mb-4">Collapse Left</button>
        <div className="content">
          Left Pane
        </div>
      </div>
      <div className="resizable-pane relative" onMouseDown={handleResize}>
        <div
          className="border-r border-gray-800 h-full absolute left-1/2"
          style={{ transform: "translateX(-50%)", cursor: "col-resize" }}
        />
        {isLeftPaneCollapsed && (
          <button onClick={() => handleCollapse("left")} className="absolute top-1/2 right-1 transform -translate-y-1/2">Restore</button>
        )}
        {isRightPaneCollapsed && (
          <button onClick={() => handleCollapse("right")} className="absolute top-1/2 left-1 transform -translate-y-1/2">Restore</button>
        )}
      </div>
      <div
        className={`pane ${isRightPaneCollapsed ? "hidden" : ""} bg-gray-200`}
        style={{ width: paneWidths.rightPaneWidth }}
      >
        <button onClick={() => handleCollapse("right")} className="mb-4">Collapse Right</button>
        <div className="content">
          Right Pane
        </div>
      </div>
    </div>
  );
}

export default MainTest;
