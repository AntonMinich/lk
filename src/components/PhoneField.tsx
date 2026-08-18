import { useId, useState, type ChangeEvent, Fragment } from "react";
import { extractLocalDigits, OPERATOR_CODES, PHONE_MASK_SLOTS } from "../lib/phone";

type PhoneFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
};

export function PhoneField({
  label = "Номер телефона",
  value,
  onChange,
  onBlur,
  error,
  autoComplete = "tel",
}: PhoneFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : `${id}-hint`;
  const local = extractLocalDigits(value);
  const [focused, setFocused] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(extractLocalDigits(event.target.value));
  }

  return (
    <div className={`field ${error ? "field--invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="phone-input">
        <span className="phone-input__prefix">+375</span>
        <div className="phone-input__body">
          <div className="phone-input__mask" aria-hidden="true">
            {PHONE_MASK_SLOTS.map((slot, slotIndex) => {
              const caret =
                focused && slot.kind === "digit" && slot.index === local.length ? (
                  <span className="phone-input__caret" />
                ) : null;

              if (slot.kind === "sep") {
                return (
                  <Fragment key={`sep-${slotIndex}`}>
                    <span className="phone-input__sep">{slot.char}</span>
                  </Fragment>
                );
              }

              const digit = local[slot.index];
              return (
                <Fragment key={`d-${slot.index}`}>
                  {caret}
                  <span className={digit ? "phone-input__digit" : "phone-input__x"}>
                    {digit ?? "x"}
                  </span>
                </Fragment>
              );
            })}
            {focused && local.length === 9 ? <span className="phone-input__caret" /> : null}
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
            aria-describedby={describedBy}
            maxLength={16}
          />
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="field__hint">
          +375, затем оператор {OPERATOR_CODES.join(", ")} и 7 цифр номера
        </p>
      )}
    </div>
  );
}
