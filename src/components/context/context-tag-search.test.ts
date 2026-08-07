import assert from "node:assert/strict";
import test from "node:test";
import { googleSearchUrl } from "./context-tag-search";

test("builds an encoded Google search URL for a context tag", () => {
  assert.equal(
    googleSearchUrl("  Política econômica & inflação "),
    "https://www.google.com/search?q=Pol%C3%ADtica%20econ%C3%B4mica%20%26%20infla%C3%A7%C3%A3o",
  );
});
