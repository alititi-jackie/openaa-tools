export const FX_FIELDS = ["usd", "rate", "cny"];

export function roundFx(value, decimals) {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** decimals;
  const adjusted =
    Math.abs(value) + Number.EPSILON * Math.max(1, Math.abs(value));
  return Math.sign(value) * (Math.round(adjusted * factor) / factor);
}

export function calculateFxTarget(target, values) {
  const parsed = Object.fromEntries(
    FX_FIELDS.map((field) => [
      field,
      values[field] === "" || values[field] == null
        ? NaN
        : Number(values[field]),
    ]),
  );
  const { usd, rate, cny } = parsed;
  let result;
  let decimals;
  if (target === "cny" && Number.isFinite(usd) && Number.isFinite(rate)) {
    result = usd * rate;
    decimals = 2;
  } else if (
    target === "rate" &&
    Number.isFinite(usd) &&
    Number.isFinite(cny) &&
    usd > 0
  ) {
    result = cny / usd;
    decimals = 3;
  } else if (
    target === "usd" &&
    Number.isFinite(rate) &&
    Number.isFinite(cny) &&
    rate > 0
  ) {
    result = cny / rate;
    decimals = 2;
  } else {
    return null;
  }
  if (!Number.isFinite(result) || result < 0) return null;
  const rounded = roundFx(result, decimals);
  return Number.isFinite(rounded) ? rounded.toFixed(decimals) : null;
}

export function fxRoundingDifference(values) {
  const { usd, rate, cny } = values;
  if ([usd, rate, cny].some((value) => value === "" || value == null)) return 0;
  const difference = Math.abs(Number(usd) * Number(rate) - Number(cny));
  return Number.isFinite(difference) ? roundFx(difference, 2) : 0;
}
