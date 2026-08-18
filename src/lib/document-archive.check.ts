import { archiveStorageKey } from "./document-archive.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(
  archiveStorageKey("+375291112233", "charter", "abc"),
  "+375291112233:charter:archive:abc",
  "archive key",
);

console.log("document-archive checks passed");
