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
  const s = n("salary"),
    c = n("contribution"),
    m = n("match"),
    r = n("rate"),
    y = n("years");
  if (
    s == null ||
    c == null ||
    m == null ||
    r == null ||
    y == null ||
    s < 0 ||
    c < 0 ||
    m < 0 ||
    r < 0 ||
    y < 0
  )
    return bad("请输入有效数值");
  const own = (s * c) / 100,
    employer = (s * Math.min(c, m)) / 100,
    monthly = (own + employer) / 12,
    i = r / 1200,
    months = y * 12,
    total =
      i === 0
        ? monthly * months
        : monthly * ((Math.pow(1 + i, months) - 1) / i);
  out(
    money(total),
    "预计退休账户余额 · 每年本人 " +
      money(own) +
      " · 公司匹配 " +
      money(employer),
  );
};
