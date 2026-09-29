import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效距离");
  out((d === "mi-km" ? v * 1.609344 : v / 1.609344).toFixed(2), "换算结果");
};
