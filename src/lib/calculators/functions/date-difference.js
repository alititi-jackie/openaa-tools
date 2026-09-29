import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let a = $("start").value,
    b = $("end").value;
  if (!a || !b) return bad("请选择两个日期");
  const d = (x) => {
    const [y, m, day] = x.split("-").map(Number);
    return Date.UTC(y, m - 1, day);
  };
  out(Math.round(Math.abs(d(b) - d(a)) / 86400000) + " 天", "两个日期相差");
};
