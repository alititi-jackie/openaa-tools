import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v <= 0) return bad("请输入有效鞋码");
  out(
    (d === "cn-us" ? v - 33.5 : v + 33.5).toFixed(1),
    "参考鞋码 · 品牌尺码表优先",
  );
};
