import { useId, type ChangeEvent } from "react";
import { formatPhoneDisplay, extractLocalDigits, OPERATOR_CODES } from "../lib/phone";

type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
};

export function PhoneField({ value, onChange, error, autoComplete = "tel" }: PhoneFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : `${id}-hint`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(extractLocalDigits(event.target.value));
  }

  const display = formatPhoneDisplay(value);
  const operator = extractLocalDigits(value).slice(0, 2);

  return (
    <div className={`field ${error ? "field--invalid" : ""}`}>
      <label htmlFor={id}>Номер телефона</label>
      <div className="phone-input">
        <span className="phone-input__prefix" aria-hidden="true">
          +375
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder="44 757-40-25"
          value={display.replace(/^\+375\s?/, "")}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          maxLength={12}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="field__hint">
          Код страны 375, оператор{" "}
          {OPERATOR_CODES.map((code, index) => (
            <span key={code}>
              <strong className={operator === code ? "is-active" : undefined}>{code}</strong>
              {index < OPERATOR_CODES.length - 1 ? ", " : ""}
            </span>
          ))}
          , затем 7 цифр номера
        </p>
      )}
    </div>
  );
}
