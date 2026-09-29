import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效重量");
  out(
    {
      lbkg: v * 0.45359237,
      kglb: v / 0.45359237,
      ozg: v * 28.349523125,
      gzo: v / 28.349523125,
    }[d].toFixed(2),
    "换算结果",
  );
};
