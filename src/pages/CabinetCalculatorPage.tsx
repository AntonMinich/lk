import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { calculateLease, formatMoney, parseAmount } from "../lib/calculator";

export function CabinetCalculatorPage() {
  const navigate = useNavigate();
  const [price, setPrice] = useState("180000");
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [termMonths, setTermMonths] = useState("36");
  const [annualRatePercent, setAnnualRatePercent] = useState("12");

  const result = useMemo(() => {
    return calculateLease({
      price: parseAmount(price),
      downPaymentPercent: parseAmount(downPaymentPercent),
      termMonths: parseAmount(termMonths),
      annualRatePercent: parseAmount(annualRatePercent),
    });
  }, [price, downPaymentPercent, termMonths, annualRatePercent]);

  function applyToApplication() {
    if (!result) {
      return;
    }
    navigate("/cabinet/applications/new", {
      state: {
        amount: formatMoney(result.financeAmount),
        termMonths: String(Math.round(parseAmount(termMonths))),
      },
    });
  }

  return (
    <section className="admin-page">
      <PageHeader
        title="Калькулятор"
        subtitle="Предварительный аннуитетный расчёт. Не является офертой и договором лизинга."
      />
      <div className="calculator">
        <form className="auth-form calculator__form" onSubmit={(event) => event.preventDefault()}>
          <div className="field">
            <label htmlFor="calc-price">Стоимость предмета, BYN</label>
            <input
              id="calc-price"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="calc-down">Аванс, %</label>
            <input
              id="calc-down"
              type="number"
              min={0}
              max={99}
              step={0.1}
              value={downPaymentPercent}
              onChange={(event) => setDownPaymentPercent(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="calc-term">Срок, мес.</label>
            <input
              id="calc-term"
              type="number"
              min={1}
              step={1}
              value={termMonths}
              onChange={(event) => setTermMonths(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="calc-rate">Ставка, % годовых</label>
            <input
              id="calc-rate"
              type="number"
              min={0}
              step={0.1}
              value={annualRatePercent}
              onChange={(event) => setAnnualRatePercent(event.target.value)}
            />
          </div>
        </form>
        <div className="calculator__result">
          {result ? (
            <>
              <div className="calculator__stat">
                <span>Сумма финансирования</span>
                <strong>{formatMoney(result.financeAmount)}</strong>
              </div>
              <div className="calculator__stat">
                <span>Ежемесячный платёж</span>
                <strong>{formatMoney(result.monthlyPayment)}</strong>
              </div>
              <div className="calculator__stat">
                <span>Всего выплат</span>
                <strong>{formatMoney(result.totalPayment)}</strong>
              </div>
              <div className="calculator__stat">
                <span>Переплата</span>
                <strong>{formatMoney(result.overpay)}</strong>
              </div>
              <button type="button" className="primary-btn" onClick={applyToApplication}>
                Оформить заявку
              </button>
            </>
          ) : (
            <p className="admin-empty">Укажите стоимость, аванс меньше 100%, срок и ставку.</p>
          )}
        </div>
      </div>
    </section>
  );
}
