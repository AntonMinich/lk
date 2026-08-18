/** Допустимые коды операторов Беларуси для входа партнёра. */
export const OPERATOR_CODES = ["29", "33", "44"] as const;

export type OperatorCode = (typeof OPERATOR_CODES)[number];

export const COUNTRY_CODE = "375";
export const LOCAL_LENGTH = 9; // оператор (2) + номер (7)
export const OPERATOR_LENGTH = 2;
export const SUBSCRIBER_LENGTH = 7;

export const PHONE_MASK_SLOTS = [
  { kind: "digit", index: 0 },
  { kind: "digit", index: 1 },
  { kind: "sep", char: " " },
  { kind: "digit", index: 2 },
  { kind: "digit", index: 3 },
  { kind: "digit", index: 4 },
  { kind: "sep", char: "-" },
  { kind: "digit", index: 5 },
  { kind: "digit", index: 6 },
  { kind: "sep", char: "-" },
  { kind: "digit", index: 7 },
  { kind: "digit", index: 8 },
] as const;

export function isOperatorCode(value: string): value is OperatorCode {
  return (OPERATOR_CODES as readonly string[]).includes(value);
}

/** Оставляет только цифры из произвольной строки. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Нормализует ввод к 9 цифрам после кода страны:
 * принимает +375..., 375..., 80..., или локальные 9 цифр.
 */
export function extractLocalDigits(value: string): string {
  let digits = digitsOnly(value);

  if (digits.startsWith("80") && digits.length >= 11) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(COUNTRY_CODE.length);
  }

  return digits.slice(0, LOCAL_LENGTH);
}

/** Канонический вид: +375447574025 */
export function toCanonicalPhone(value: string): string {
  const local = extractLocalDigits(value);
  if (local.length !== LOCAL_LENGTH) {
    return "";
  }
  return `+${COUNTRY_CODE}${local}`;
}

/** Отображение: +375 44 757-40-25 */
export function formatPhoneDisplay(value: string): string {
  const local = extractLocalDigits(value);
  const operator = local.slice(0, OPERATOR_LENGTH);
  const number = local.slice(OPERATOR_LENGTH);

  let formattedNumber = number;
  if (number.length > 5) {
    formattedNumber = `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`;
  } else if (number.length > 3) {
    formattedNumber = `${number.slice(0, 3)}-${number.slice(3)}`;
  }

  if (local.length === 0) {
    return "+375";
  }
  if (local.length <= OPERATOR_LENGTH) {
    return `+375 ${operator}`;
  }
  return `+375 ${operator} ${formattedNumber}`;
}

/** Маска после +375: xx xxx-xx-xx, заполненные позиции заменяются цифрами. */
export function formatLocalMask(value: string): string {
  const local = extractLocalDigits(value);
  return PHONE_MASK_SLOTS.map((slot) => {
    if (slot.kind === "sep") {
      return slot.char;
    }
    return local[slot.index] ?? "x";
  }).join("");
}

export type PhoneValidation =
  | { ok: true; canonical: string }
  | { ok: false; message: string };

export function validatePartnerPhone(value: string): PhoneValidation {
  const local = extractLocalDigits(value);

  if (local.length === 0) {
    return { ok: false, message: "Укажите номер телефона" };
  }

  const operator = local.slice(0, OPERATOR_LENGTH);

  if (local.length >= OPERATOR_LENGTH && !isOperatorCode(operator)) {
    return {
      ok: false,
      message: "Код оператора должен быть 29, 33 или 44",
    };
  }

  if (local.length !== LOCAL_LENGTH) {
    return {
      ok: false,
      message: `После +375 нужно ${LOCAL_LENGTH} цифр: код оператора (${OPERATOR_LENGTH}) и номер (${SUBSCRIBER_LENGTH}). Сейчас введено: ${local.length}`,
    };
  }

  return { ok: true, canonical: `+${COUNTRY_CODE}${local}` };
}
