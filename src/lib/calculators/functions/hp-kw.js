import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效功率");
  out(
    (d === "hp-kw" ? v * 0.745699872 : v / 0.745699872).toFixed(2),
    "换算结果",
  );
};
