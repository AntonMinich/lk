import {
  extractLocalDigits,
  formatPhoneDisplay,
  toCanonicalPhone,
  validatePartnerPhone,
} from "./phone.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(extractLocalDigits("+375447574025"), "447574025", "example number");
assertEqual(extractLocalDigits("375297574025"), "297574025", "operator 29");
assertEqual(extractLocalDigits("80447574025"), "447574025", "80 prefix");
assertEqual(toCanonicalPhone("44 757-40-25"), "+375447574025", "canonical");
assertEqual(formatPhoneDisplay("+375447574025"), "+375 44 757-40-25", "display");
assertEqual(validatePartnerPhone("+375337574025").ok, true, "operator 33");
assertEqual(validatePartnerPhone("+375257574025").ok, false, "bad operator");
assertEqual(validatePartnerPhone("+37544757").ok, false, "too short");

console.log("phone checks passed");
