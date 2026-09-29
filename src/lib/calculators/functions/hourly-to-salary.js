import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let h = n("hourly"),
    w = n("hours"),
    y = n("weeks");
  if (
    h == null ||
    w == null ||
    y == null ||
    h < 0 ||
    w < 0 ||
    w > 168 ||
    y < 1 ||
    y > 52
  )
    return bad("请检查时薪、每周工时和工作周数");
  let a = h * w * y;
  out("$" + a.toFixed(2), "估算年薪税前 · 月薪约 $" + (a / 12).toFixed(2));
};
