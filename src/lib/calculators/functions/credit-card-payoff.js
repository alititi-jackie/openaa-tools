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
  const b = n("balance"),
    r = n("apr"),
    pay = n("payment");
  if (b == null || r == null || pay == null || b <= 0 || r < 0 || pay <= 0)
    return bad("请输入有效余额、APR 和月供");
  const i = r / 1200;
  if (i > 0 && pay <= b * i) return bad("月供必须高于首月利息，否则无法还清");
  const months = i
    ? Math.ceil(-Math.log(1 - (b * i) / pay) / Math.log(1 + i))
    : Math.ceil(b / pay);
  let balance = b,
    interest = 0;
  for (let m = 0; m < months; m++) {
    const monthInterest = i ? balance * i : 0;
    const principal = Math.min(balance, pay - monthInterest);
    interest += monthInterest;
    balance = Math.max(0, balance - principal);
  }
  out(
    months + " 个月",
    "预计还清 · 约 " +
      Math.ceil(months / 12) +
      " 年 · 总利息 " +
      money(interest),
  );
};
