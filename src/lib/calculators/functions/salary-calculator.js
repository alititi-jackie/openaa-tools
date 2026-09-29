import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let a = n("annual");
  if (a == null || a < 0) return bad("请输入有效年薪");
  out("$" + (a / 12).toFixed(2), "月薪税前 · 周薪约 $" + (a / 52).toFixed(2));
};
