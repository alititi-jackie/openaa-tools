import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let a = n("amount"),
    r = n("rate"),
    dir = $("direction").value;
  if (a == null || r == null || a < 0 || r <= 0)
    return bad("请输入有效金额和汇率");
  let v = dir === "USD-CNY" ? a * r : a / r;
  out(
    (dir === "USD-CNY" ? "¥" : "$") + v.toFixed(2),
    "换算结果 · 1 USD = " + r.toFixed(4) + " CNY",
  );
};
