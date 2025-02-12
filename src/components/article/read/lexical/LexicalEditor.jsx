import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, $getSelection } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkNode, $createLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createImageNode, ImageNode } from './ImageNode'; // Custom Image Node

const theme = {
  // Define your theme here
};

const initialConfig = {
  namespace: 'MyEditor',
  theme,
  onError: (error) => {
    console.error(error);
  },
  nodes: [LinkNode, ImageNode], // Register LinkNode and ImageNode
};

const InitializeWithHTMLPlugin = ({ htmlString }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlString, 'text/html');
      const nodes = $generateNodesFromDOM(dom);
      const root = $getRoot();
      nodes.forEach((node) => root.append(node));
    });
  }, [editor, htmlString]);

  return null;
};

const Toolbar = () => {
  const [editor] = useLexicalComposerContext();

  const applyHighlight = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.formatText('highlight');
      }
    });
  };

  const applySuperscript = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.formatText('superscript');
      }
    });
  };

  const applySubscript = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.formatText('subscript');
      }
    });
  };

  const insertLink = () => {
    const url = prompt('Enter the URL');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          const imageNode = $createImageNode(url);
          selection.insertNodes([imageNode]);
        }
      });
    }
  };

  return (
    <div>
      <button onClick={applyHighlight}>Highlight</button>
      <button onClick={applySuperscript}>Superscript</button>
      <button onClick={applySubscript}>Subscript</button>
      <button onClick={insertLink}>Insert Link</button>
      <button onClick={insertImage}>Insert Image</button>
    </div>
  );
};

const LexicalEditor = ({ initialHTML }) => {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Toolbar />
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<div className="editor-placeholder">Enter some text...</div>}
      />
      <HistoryPlugin />
      <LinkPlugin />
      <OnChangePlugin onChange={(editorState) => console.log(editorState)} />
      <InitializeWithHTMLPlugin htmlString={initialHTML} />
    </LexicalComposer>
  );
};

export default LexicalEditor;