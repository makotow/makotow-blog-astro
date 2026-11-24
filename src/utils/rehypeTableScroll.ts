import type { Element, Root, RootContent } from "hast";

const WRAPPER_CLASS = "table-scroll";
const SCROLL_WRAPPER_CLASSES = new Set([WRAPPER_CLASS, "overflow-x-auto"]);

function isElement(node: RootContent | Root): node is Element {
  return node.type === "element";
}

function isWrapper(node: Element) {
  const className: unknown = node.properties?.className;
  const classes: string[] = Array.isArray(className)
    ? className.map(String)
    : typeof className === "string"
      ? className.split(/\s+/)
      : [];
  return classes.some(cls => SCROLL_WRAPPER_CLASSES.has(cls));
}

function wrapTables(parent: Root | Element) {
  parent.children = parent.children.map(child => {
    if (!isElement(child)) return child;
    if (child.tagName === "table") {
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [WRAPPER_CLASS],
          role: "region",
          ariaLabel: "スクロール可能な表",
          tabIndex: 0,
        },
        children: [child],
      } satisfies Element;
    }
    if (!isWrapper(child)) wrapTables(child);
    return child;
  });
}

/**
 * Wraps every Markdown table in an accessible, horizontally scrollable
 * container (`role="region"`, `aria-label`, `tabindex="0"`) so wide tables
 * scroll inside the article instead of squeezing columns on mobile.
 */
export default function rehypeTableScroll() {
  return (tree: Root) => {
    wrapTables(tree);
  };
}
