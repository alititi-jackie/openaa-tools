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
  const rent = n("rent"),
    price = n("price"),
    down = n("down"),
    rate = n("rate"),
    years = n("years"),
    tax = n("tax"),
    ins = n("insurance"),
    maint = n("maintenance"),
    rise = n("rentRise");
  if (
    [rent, price, down, rate, years, tax, ins, maint, rise].some(
      (v) => v == null,
    ) ||
    rent < 0 ||
    price < 0 ||
    down < 0 ||
    down > price ||
    rate < 0 ||
    years < 1 ||
    tax < 0 ||
    ins < 0 ||
    maint < 0 ||
    rise < -100
  )
    return bad("请检查输入数值");
  const m = rate / 1200,
    months = years * 12,
    principal = price - down,
    pmt = m
      ? (principal * m * Math.pow(1 + m, months)) /
        (Math.pow(1 + m, months) - 1)
      : principal / months;
  let rentTotal = 0,
    r = rent;
  for (let y = 0; y < years; y++) {
    rentTotal += r * 12;
    r *= 1 + rise / 100;
  }
  const owner =
    pmt * months +
    ((price * tax) / 100) * years +
    ins * years +
    ((price * maint) / 100) * years;
  out(
    money(rentTotal),
    "长期租金约 " +
      money(rentTotal) +
      " · 买房持有成本约 " +
      money(owner) +
      " · 未计房屋升值/交易成本",
  );
};
