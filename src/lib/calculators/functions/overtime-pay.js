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
  const r = n("rate"),
    h = n("hours"),
    o = n("ot");
  if (r == null || h == null || o == null || r < 0 || h < 0 || o < 0)
    return bad("请输入有效时薪和工时");
  const regular = h * r,
    ot = o * r * 1.5,
    total = regular + ot;
  out(
    money(total),
    "本周税前工资 · 正常工资 " + money(regular) + " · 加班工资 " + money(ot),
  );
};
