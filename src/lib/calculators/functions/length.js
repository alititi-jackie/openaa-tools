import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效长度");
  out(
    { incm: v * 2.54, cmin: v / 2.54, ftm: v * 0.3048, mft: v / 0.3048 }[
      d
    ].toFixed(2),
    "换算结果",
  );
};
