import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value");
  if (v == null || v <= 0) return bad("请输入大于 0 的数值");
  out((235.214583 / v).toFixed(2), "换算结果");
};
