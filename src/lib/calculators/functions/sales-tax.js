import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let p = n("price"),
    t = n("tax");
  if (p == null || t == null || p < 0 || t < 0 || t > 100)
    return bad("请输入有效价格和税率");
  out(
    "$" + (p * (1 + t / 100)).toFixed(2),
    "含税价格 · 税额 $" + ((p * t) / 100).toFixed(2),
  );
};
