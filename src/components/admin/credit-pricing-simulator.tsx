"use client";

import { useMemo, useState } from "react";

type Props = {
  initialMarginMultiplier: number;
  initialUsdPerCredit: number;
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export function CreditPricingSimulator({
  initialMarginMultiplier,
  initialUsdPerCredit,
}: Props) {
  const [providerCost, setProviderCost] = useState(0.0165);
  const [marginMultiplier, setMarginMultiplier] = useState(
    initialMarginMultiplier,
  );
  const [usdPerCredit, setUsdPerCredit] = useState(initialUsdPerCredit);

  const result = useMemo(() => {
    const safeCost = positiveOrZero(providerCost);
    const safeMultiplier = positiveOrZero(marginMultiplier);
    const safeCreditValue = positiveOrZero(usdPerCredit);
    const billableCost = safeCost * safeMultiplier;
    const credits =
      safeCost > 0 && safeMultiplier > 0 && safeCreditValue > 0
        ? Math.max(1, Math.ceil(billableCost / safeCreditValue))
        : 0;
    const chargedValue = credits * safeCreditValue;
    return { billableCost, credits, chargedValue };
  }, [providerCost, marginMultiplier, usdPerCredit]);

  return (
    <section className="rounded-lg border border-rule bg-paper p-5">
      <div className="mb-4">
        <h2 className="font-serif text-2xl">Fictional price simulator</h2>
        <p className="mt-1 text-sm text-muted">
          Explore the conversion before saving a configuration. This calculator
          never changes balances or settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SimulatorInput
          label="Provider cost (USD)"
          value={providerCost}
          min={0}
          step={0.0001}
          onChange={setProviderCost}
        />
        <SimulatorInput
          label="Margin multiplier"
          value={marginMultiplier}
          min={0.01}
          step={0.01}
          onChange={setMarginMultiplier}
        />
        <SimulatorInput
          label="USD per credit"
          value={usdPerCredit}
          min={0.000001}
          step={0.001}
          onChange={setUsdPerCredit}
        />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Billable cost" value={USD.format(result.billableCost)} />
        <Result
          label="Credits charged"
          value={result.credits.toLocaleString("en-US")}
        />
        <Result
          label="Rounded charge value"
          value={USD.format(result.chargedValue)}
        />
      </dl>

      <p className="mt-4 text-xs text-muted">
        Formula: ceil(provider cost × multiplier ÷ USD per credit). Credits are
        whole numbers, so the result is always rounded up.
      </p>
    </section>
  );
}

function SimulatorInput({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-rule bg-background px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-rule bg-background px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function positiveOrZero(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
