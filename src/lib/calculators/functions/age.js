import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let s = $("birth").value;
  if (!s) return bad("请选择出生日期");
  let b = new Date(s + "T00:00:00"),
    now = new Date();
  if (b > now) return bad("出生日期不能晚于今天");
  let a = now.getFullYear() - b.getFullYear();
  if (
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  )
    a--;
  out(a + " 岁", "当前年龄");
};
