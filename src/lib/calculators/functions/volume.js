import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效容量");
  out(
    {
      gl: v * 3.785411784,
      lg: v / 3.785411784,
      ql: v * 0.946352946,
      lq: v / 0.946352946,
    }[d].toFixed(2),
    "换算结果",
  );
};
