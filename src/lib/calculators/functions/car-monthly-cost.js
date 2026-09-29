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
  const payment = n("payment"),
    miles = n("miles"),
    mpg = n("mpg"),
    gas = n("gas"),
    insurance = n("insurance"),
    maint = n("maintenance"),
    other = n("other");
  if (
    [payment, miles, mpg, gas, insurance, maint, other].some(
      (v) => v == null,
    ) ||
    payment < 0 ||
    miles < 0 ||
    mpg <= 0 ||
    gas < 0 ||
    insurance < 0 ||
    maint < 0 ||
    other < 0
  )
    return bad("请检查汽车费用输入");
  const fuel = ((miles / mpg) * gas) / 12,
    total = payment + fuel + insurance / 12 + maint / 12 + other;
  out(
    money(total),
    "预计每月总成本 · 油费 " +
      money(fuel) +
      " · 保险 " +
      money(insurance / 12) +
      " · 保养 " +
      money(maint / 12),
  );
};
