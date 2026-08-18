import {
  partnerDocumentLabel,
  sanitizePartnerDocuments,
  validateEmail,
  validateUnp,
} from "./partner-docs.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(validateUnp("").ok, false, "empty unp");
assertEqual(validateUnp("12345678").ok, false, "short unp");
assertEqual(validateUnp("123456789").ok, true, "valid unp");
assertEqual(validateUnp("12-345-678-9").ok, true, "unp strips non-digits");

const unp = validateUnp("12-345-678-9");
if (!unp.ok || unp.value !== "123456789") {
  throw new Error("unp must keep 9 digits");
}

assertEqual(validateEmail("").ok, false, "empty email");
assertEqual(validateEmail("not-an-email").ok, false, "bad email");
assertEqual(validateEmail(" partner@example.by ").ok, true, "valid email");

assertEqual(
  partnerDocumentLabel("agreement"),
  "Подписанное Соглашение о сотрудничестве",
  "agreement label",
);
assertEqual(partnerDocumentLabel("unknown"), "unknown", "unknown document key");

const docs = sanitizePartnerDocuments([
  { key: "agreement", fileName: "dogovor.pdf", size: 1200, mime: "application/pdf" },
  { key: "skip-me", fileName: "x.pdf", size: 1, mime: "application/pdf" },
  { key: "charter", fileName: "  ustav.pdf  ", size: "2048", mime: "" },
]);
assertEqual(docs.length, 2, "sanitize keeps known documents");
assertEqual(docs[0]?.fileName, "dogovor.pdf", "agreement name");
assertEqual(docs[1]?.key, "charter", "charter kept");
assertEqual(docs[1]?.mime, "application/octet-stream", "empty mime fallback");

console.log("partner-docs checks passed");
