import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = n("value"),
    d = $("direction").value;
  if (v == null || v < 0) return bad("请输入有效面积");
  out(
    {
      ftm: v * 0.09290304,
      mft: v / 0.09290304,
      acrem: v * 4046.8564224,
      macre: v / 4046.8564224,
    }[d].toFixed(2),
    "换算结果",
  );
};
