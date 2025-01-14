import { test, expect } from "bun:test";

import * as gh from "./gh";

test("logged in as", () => {
  const username = gh.auth_status("  ✓ Logged in to github.com as magus (keyring)\n");

  expect(username).toBe("magus");
});

test("logged in without as", () => {
  const username = gh.auth_status("✓ Logged in to github.com account xoxohorses (keyring)");

  expect(username).toBe("xoxohorses");
});

test("returns null when no match is found", () => {
  const username = gh.auth_status("this should not match anything");
  expect(username).toBe(null);
});
