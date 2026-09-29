import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效压力");
  out(
    (d === "psi-bar" ? v * 0.0689475729 : v / 0.0689475729).toFixed(2),
    "换算结果",
  );
};
