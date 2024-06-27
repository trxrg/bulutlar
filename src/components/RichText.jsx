import React, { useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const RichText = React.forwardRef(({ text, onTextChange }, ref) => {
  const [editorHtml, setEditorHtml] = useState(text);

  const handleChange = (html) => {
    setEditorHtml(html);
    onTextChange(html);
  };

  try {
    const Link = Quill.import('formats/link');
    Link.sanitize = function (url) {
      return url;
    }
  } catch (e) {
    console.log(e);
  }

  const reset = () => {
    // setEditorHtml('');
  }

  React.useImperativeHandle(ref, () => ({
    reset
  }));

  const customSanitizer = (url) => {
    return url;
  }

  const formats = [
    'bold', 'italic', 'underline', 'link',
  ];

  return (
    <div>
      <ReactQuill
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        readOnly={false}
        className="bg-white"
        // style={{border: '20px !important', padding: '20px'}}
        modules={{ toolbar: true }}
        // formats={formats}
        // sanitize={customSanitizer}
      />
      {/* <div>
        <h2>Preview</h2>
        <div dangerouslySetInnerHTML={{ __html: editorHtml }} />
      </div> */}
    </div>
  );
});

export default RichText;
