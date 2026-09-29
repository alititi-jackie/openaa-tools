import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let m = n("miles"),
    g = n("mpg"),
    p = n("price");
  if (m == null || g == null || p == null || m < 0 || g <= 0 || p < 0)
    return bad("请输入有效里程、MPG 和油价");
  let gal = m / g;
  out(
    "$" + (gal * p).toFixed(2),
    "预计油费 · 约 " + gal.toFixed(2) + " gallon",
  );
};
