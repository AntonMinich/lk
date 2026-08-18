import { useId, useState, type ChangeEvent } from "react";
import { extractLocalDigits, LOCAL_LENGTH } from "../lib/phone";

type PhoneFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
};

const MASK = "xx xxx-xx-xx";

export function PhoneField({
  label = "Номер телефона",
  value,
  onChange,
  onBlur,
  error,
  autoComplete = "tel",
}: PhoneFieldProps) {
  const id = useId();
  const local = extractLocalDigits(value);
  const [focused, setFocused] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(extractLocalDigits(event.target.value));
  }

  let digitIndex = 0;

  return (
    <div className={`field ${error ? "field--invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="phone-input">
        <span className="phone-input__prefix">+375</span>
        <div className="phone-input__body">
          <div className="phone-input__mask" aria-hidden="true">
            {MASK.split("").map((char, index) => {
              if (char === "x") {
                const current = digitIndex;
                const digit = local[current];
                digitIndex += 1;
                return (
                  <span key={index} className="phone-input__slot">
                    {focused && current === local.length ? (
                      <span className="phone-input__caret" />
                    ) : null}
                    <span className={digit ? "phone-input__digit" : "phone-input__x"}>
                      {digit ?? "x"}
                    </span>
                  </span>
                );
              }
              if (char === " ") {
                return <span key={index} className="phone-input__space" />;
              }
              return (
                <span key={index} className="phone-input__punct">
                  {char}
                </span>
              );
            })}
            {focused && local.length === LOCAL_LENGTH ? (
              <span className="phone-input__caret" />
            ) : null}
          </div>
          <input
            id={id}
            className="phone-input__control"
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            value={local}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            maxLength={16}
          />
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
