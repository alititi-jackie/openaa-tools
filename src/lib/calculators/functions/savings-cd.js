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
    r = n("apy"),
    y = n("years"),
    f = n("freq") || 12;
  if (p == null || r == null || y == null || p < 0 || r < 0 || y < 0 || f < 1)
    return bad("请输入有效数值");
  const v = p * Math.pow(1 + r / 100 / f, y * f);
  out(money(v), "到期余额 · 预计利息 " + money(v - p));
};
