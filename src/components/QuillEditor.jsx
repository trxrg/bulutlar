import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import styles

const LimitedToolbarOptions = [
  [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
  ['link'],
];

const modules = {
  toolbar: LimitedToolbarOptions,
};

const formats = [
  'header', 'font', 'link'
];

const QuillEditor = ({ content }) => {
  const [editorHtml, setEditorHtml] = useState(content);

  const handleEditorChange = (html) => {
    // Only update the editor content if it contains valid links
    if (isValidContent(html)) {
      setEditorHtml(html);
    }
  };

  const isValidContent = (html) => {
    // Example: Validate that html contains only allowed tags and attributes
    // This function should be customized based on your specific requirements
    // For simplicity, assuming only links are allowed here
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const links = tempDiv.getElementsByTagName('a');
    return links.length > 0; // Ensure at least one link is present
  };

  return (
    <div>
      <ReactQuill
        theme="snow"
        modules={modules}
        formats={formats}
        value={editorHtml}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default QuillEditor;
