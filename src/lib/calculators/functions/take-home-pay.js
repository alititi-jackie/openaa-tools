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
  const a = n("annual"),
    k = n("k401") || 0,
    h = n("health") || 0,
    s = $("status")?.value || "single",
    st = n("state") || 0;
  if (
    a == null ||
    a < 0 ||
    k < 0 ||
    h < 0 ||
    st < 0 ||
    st > 20 ||
    !standardDeduction2026[s]
  )
    return bad("请输入有效收入、扣除项目和报税身份");
  const pretax401 = Math.min(a, k),
    taxable = Math.max(0, a - pretax401 - standardDeduction2026[s]),
    fed = fedTax(taxable, s),
    socialSecurity = Math.min(a, SOCIAL_SECURITY_WAGE_BASE_2026) * 0.062,
    medicare = a * 0.0145,
    additionalMedicare =
      Math.max(0, a - additionalMedicareThreshold2026[s]) * 0.009,
    fica = socialSecurity + medicare + additionalMedicare,
    stateTax = (taxable * st) / 100,
    net = a - fed - fica - stateTax - pretax401 - h;
  out(
    money(net / 12),
    "估算税后月收入 · 年收入 " +
      money(net) +
      " · 联邦税 " +
      money(fed) +
      " · FICA " +
      money(fica),
  );
};
