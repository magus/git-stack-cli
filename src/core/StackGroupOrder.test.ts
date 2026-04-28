import { test, expect } from "bun:test";

import * as StackGroupOrder from "~/core/StackGroupOrder";

test("orders a stack base-to-tip from tip-to-base input", () => {
  const output = StackGroupOrder.base_to_tip([
    { id: "local-launch-hacks", base: "prompt-drift" },
    { id: "prompt-drift", base: "computer-tool-training" },
    { id: "computer-tool-training", base: "master" },
  ]);

  expect(output.map((group) => group.id)).toEqual([
    "computer-tool-training",
    "prompt-drift",
    "local-launch-hacks",
  ]);
});

test("keeps a stack base-to-tip from base-to-tip input", () => {
  const output = StackGroupOrder.base_to_tip([
    { id: "computer-tool-training", base: "master" },
    { id: "prompt-drift", base: "computer-tool-training" },
    { id: "local-launch-hacks", base: "prompt-drift" },
  ]);

  expect(output.map((group) => group.id)).toEqual([
    "computer-tool-training",
    "prompt-drift",
    "local-launch-hacks",
  ]);
});

test("does not drop groups when base links are incomplete", () => {
  const output = StackGroupOrder.base_to_tip([
    { id: "top", base: "middle" },
    { id: "detached", base: "master" },
  ]);

  expect(new Set(output.map((group) => group.id))).toEqual(new Set(["detached", "top"]));
});
