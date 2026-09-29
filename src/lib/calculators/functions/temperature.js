import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null) return bad("请输入温度");
  out(
    (d === "F-C" ? ((v - 32) * 5) / 9 : (v * 9) / 5 + 32).toFixed(2) + "°",
    "换算结果",
  );
};
