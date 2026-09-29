import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let b = n("bill"),
    p = n("people"),
    t = n("tip");
  if (b == null || p == null || t == null || b < 0 || p < 1 || t < 0 || t > 100)
    return bad("请输入有效的账单金额、人数和小费比例");
  let x = (b * t) / 100;
  out(
    "$" + ((b + x) / p).toFixed(2),
    "每人应付 · 小费 $" + x.toFixed(2) + " · 总额 $" + (b + x).toFixed(2),
  );
};
