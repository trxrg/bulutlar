import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import styles

const QuillEditor = () => {
  const [editorHtml, setEditorHtml] = useState('hello world!');
  const [quillInstance, setQuillInstance] = useState(null);

  // Handle adding a link
  const handleAddLink = () => {
    // const url = prompt('Enter the URL:');
    const url = 'google.com';
    if (!url) return;
    
    const range = quillInstance.getEditor().getSelection();
    if (range) {
      const href = url.startsWith('http') ? url : `http://${url}`;
      quillInstance.getEditor().format('link', href);
    }
  };

  // Handle getting HTML content
  const handleGetHtmlContent = () => {
    console.log(editorHtml);
    // Use editorHtml as needed (e.g., save to database, display, etc.)
  };

  // Quill toolbar configuration
  const toolbarOptions = {
    container: [
      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['link', 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'align': [] }],
      ['clean']                                         // remove formatting button
    ],
    handlers: {
      'link': handleAddLink
    }
  };

  return (
    <div className="mx-auto max-w-3xl mt-6 p-6 border rounded-lg shadow-lg">
      <div className="mb-4 flex items-center">
        <button
          className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
          onClick={handleAddLink}
        >
          Add Link
        </button>
        <button
          className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
          onClick={handleGetHtmlContent}
        >
          Get HTML Content
        </button>
      </div>
      <ReactQuill
        value={editorHtml}
        onChange={setEditorHtml}
        modules={{ toolbar: toolbarOptions }}
        formats={[
          'header', 'font', 'bold', 'italic', 'underline', 'strike', 'blockquote',
          'list', 'bullet', 'indent', 'script', 'link', 'image', 'color', 'align', 'size'
        ]}
        bounds={'.app'}
        placeholder="Write something amazing..."
        ref={(el) => setQuillInstance(el)}
      />
    </div>
  );
};

export default QuillEditor;
