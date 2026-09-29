import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let p = n("price"),
    d = n("discount");
  if (p == null || d == null || p < 0 || d < 0 || d > 100)
    return bad("请输入有效原价和折扣");
  out(
    "$" + (p * (1 - d / 100)).toFixed(2),
    "折后价格 · 节省 $" + ((p * d) / 100).toFixed(2),
  );
};
