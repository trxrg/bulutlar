import { DecoratorNode } from 'lexical';

export class ImageNode extends DecoratorNode {
  __src;

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__key);
  }

  constructor(src, key) {
    super(key);
    this.__src = src;
  }

  createDOM(config) {
    const img = document.createElement('img');
    img.src = this.__src;
    return img;
  }

  updateDOM(prevNode, dom) {
    if (prevNode.__src !== this.__src) {
      dom.src = this.__src;
    }
    return false;
  }
}

export const $createImageNode = (src) => {
  return new ImageNode(src);
};

// export default ImageNode;