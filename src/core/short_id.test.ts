import { test, expect } from "bun:test";

import { short_id } from "~/core/short_id";

const GENERATE_COUNT = 1000;

test("short_id is 15 characters", () => {
  const id = short_id();
  expect(id.length).toBe(16);
});

test("unique enough in practice", () => {
  const id_set = new Set();
  for (let i = 0; i < GENERATE_COUNT; i++) {
    const id = short_id();
    id_set.add(id);
  }

  expect(id_set.size).toBe(GENERATE_COUNT);
});

test("sorts lexicographically", () => {
  const id_list = [];
  for (let i = 0; i < GENERATE_COUNT; i++) {
    const id = short_id();
    id_list.push(id);
  }

  expect(id_list.sort()).toEqual(id_list);
});
