import {
  $,
  n,
  out,
  bad,
  money,
  federal2026,
  standardDeduction2026,
  additionalMedicareThreshold2026,
  SOCIAL_SECURITY_WAGE_BASE_2026,
  fedTax,
  fetchJson,
} from "../advanced.js";
export const calculate = () => {
  const p = n("principal"),
    c = n("contribution"),
    r = n("rate"),
    y = n("years"),
    f = n("freq") || 12;
  if (
    p == null ||
    c == null ||
    r == null ||
    y == null ||
    p < 0 ||
    c < 0 ||
    r < 0 ||
    y < 0 ||
    f < 1
  )
    return bad("请输入有效数值");
  const periods = Math.round(y * f),
    i = r / 100 / f,
    v =
      i === 0
        ? p + c * periods
        : p * Math.pow(1 + i, periods) +
          c * ((Math.pow(1 + i, periods) - 1) / i);
  out(
    money(v),
    "预计最终金额 · 本金及投入 " +
      money(p + c * periods) +
      " · 利息约 " +
      money(v - p - c * periods),
  );
};
