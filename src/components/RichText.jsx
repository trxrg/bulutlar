import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const RichText = React.forwardRef(({text, readOnly, onTextChange}, ref) => {
  const [editorHtml, setEditorHtml] = useState(text);

  const handleChange = (html) => {
    setEditorHtml(html);
    onTextChange(html);
  };

  const reset = () => {
    setEditorHtml('');
  }

  React.useImperativeHandle(ref, () => ({
    reset
  }));

  return (
    <div>
      <ReactQuill
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        readOnly={readOnly}
        className="bg-white"
        modules={{ toolbar: !readOnly }}
      />
      {/* <div>
        <h2>Preview</h2>
        <div dangerouslySetInnerHTML={{ __html: editorHtml }} />
      </div> */}
    </div>
  );
});

export default RichText;
