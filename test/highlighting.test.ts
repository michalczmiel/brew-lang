import { test, expect } from "vitest";

import { shouldPreventAutocomplete } from "../src/highlighting.js";

// Cases that should allow autocomplete
test.each([
  "",
  "  ",
  "dose",
  "temperature",
  "method",
  "m",
  "met",
  "temp",
  "d",
  "20.5 ",
  "86..90 ",
  "0:30 ",
  "duration 0:30 ",
  "at 0:30 ",
  "at 0:30\n  ",
  "at 0:00\n  p",
])("should allow autocomplete for '%s'", (input) => {
  expect(shouldPreventAutocomplete(input)).toBe(false);
});

// Cases that should prevent autocomplete
test.each([
  "20.",
  "20.5",
  "dose 20.",
  "temperature 95.",
  "pour 100.2",
  "86..",
  "temperature 86..",
  "95..",
  "0:",
  "0:3",
  "2:",
  "duration 0:",
  "at 0:",
  "# This is a comment",
  "dose 20 # comment",
  "# ",
  "temperature 95\n# brewing notes",
  "method ",
  "temperature ",
  "dose ",
  "water ",
  "at ",
  "pour ",
  "duration ",
  "method v",
  "temperature 9",
  "dose 2",
  "water 30",
  "pour 10",
  "dose 20",
  "dose 20.5",
  "dose 20 ",
  "dose 20 g",
  "water 300",
  "water 300.5",
  "water 300 ",
  "water 300 ml",
  "temperature 95",
  "temperature 95.5",
  "temperature 86..90",
  "temperature 95 ",
  "temperature 86..90 ",
  "temperature 95 celsius",
  "method v60",
  "method origami",
  "method french_press",
  "method v60 ",
  "method origami filter",
  "dose 20\n",
  "temperature 95\nwater 300\n",
  "method v60\ndose 20\n",
  "dose 20\ntemp",
  "at 0:00\n  pour ",
  "at 0:30\n  duration ",
])("should prevent autocomplete for '%s'", (input) => {
  expect(shouldPreventAutocomplete(input)).toBe(true);
});

test("should handle multiline content correctly", () => {
  const multilineContent = `dose 20
temperature 95
water `;
  expect(shouldPreventAutocomplete(multilineContent)).toBe(true);
});