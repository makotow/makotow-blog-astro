import type { Element, Root, RootContent } from "hast";

const WRAPPER_CLASS = "table-scroll";

function isElement(node: RootContent | Root): node is Element {
  return node.type === "element";
}

function isWrapper(node: Element) {
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes(WRAPPER_CLASS);
}

function wrapTables(parent: Root | Element) {
  parent.children = parent.children.map(child => {
    if (!isElement(child)) return child;
    if (child.tagName === "table") {
      return {
        type: "element",
        tagName: "div",
        properties: { className: [WRAPPER_CLASS], tabIndex: 0 },
        children: [child],
      } satisfies Element;
    }
    if (!isWrapper(child)) wrapTables(child);
    return child;
  });
}

/**
 * Wraps every Markdown table in a horizontally scrollable container so wide
 * tables scroll inside the article instead of squeezing columns on mobile.
 * `tabindex="0"` keeps the scroll area reachable from the keyboard.
 */
export default function rehypeTableScroll() {
  return (tree: Root) => {
    wrapTables(tree);
  };
}
