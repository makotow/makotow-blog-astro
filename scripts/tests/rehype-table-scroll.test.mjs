import assert from "node:assert/strict";
import test from "node:test";

import rehypeTableScroll from "../../src/utils/rehypeTableScroll.ts";

test("wraps top-level and nested table nodes in div.table-scroll with tabindex", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "table",
        properties: {},
        children: [
          { type: "element", tagName: "tbody", properties: {}, children: [] },
        ],
      },
      {
        type: "element",
        tagName: "section",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "table",
            properties: {},
            children: [],
          },
        ],
      },
    ],
  };

  rehypeTableScroll()(tree);

  assert.equal(tree.children[0].tagName, "div");
  assert.deepEqual(tree.children[0].properties, {
    className: ["table-scroll"],
    tabIndex: 0,
  });
  assert.equal(tree.children[0].children[0].tagName, "table");

  const nestedSection = tree.children[1];
  assert.equal(nestedSection.children[0].tagName, "div");
  assert.deepEqual(nestedSection.children[0].properties, {
    className: ["table-scroll"],
    tabIndex: 0,
  });
  assert.equal(nestedSection.children[0].children[0].tagName, "table");
});

test("does not double-wrap tables already inside div.table-scroll", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"], tabIndex: 0 },
        children: [
          {
            type: "element",
            tagName: "table",
            properties: {},
            children: [],
          },
        ],
      },
    ],
  };

  rehypeTableScroll()(tree);

  assert.equal(tree.children[0].tagName, "div");
  assert.equal(tree.children[0].children[0].tagName, "table");
});

test("leaves non-table elements untouched", () => {
  const paragraph = {
    type: "element",
    tagName: "p",
    properties: {},
    children: [{ type: "text", value: "hello" }],
  };
  const tree = {
    type: "root",
    children: [paragraph],
  };

  rehypeTableScroll()(tree);

  assert.equal(tree.children.length, 1);
  assert.equal(tree.children[0], paragraph);
});
