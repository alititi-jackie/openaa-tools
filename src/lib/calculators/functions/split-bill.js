import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let b = n("bill"),
    p = n("people"),
    t = n("tip");
  if (b == null || p == null || t == null || b < 0 || p < 1 || t < 0 || t > 100)
    return bad("请输入有效数值");
  let total = b * (1 + t / 100);
  out(
    "$" + (total / p).toFixed(2),
    "每人应付 · 小费 $" +
      ((b * t) / 100).toFixed(2) +
      " · 总计 $" +
      total.toFixed(2),
  );
};
