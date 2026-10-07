import { $, n, out, bad } from "../standard.js";

/* BMI 计算器（中国成人标准）
 * 偏瘦 <18.5 / 正常 18.5–24 / 超重 24–28 / 肥胖 ≥28
 * 同时给出该身高的健康体重范围：18.5×身高² ～ 24×身高²
 */
export const calculate = () => {
  const h = n("height");
  const w = n("weight");
  if (h == null || w == null || h < 50 || h > 250 || w < 10 || w > 500)
    return bad("请输入有效的身高（50–250cm）与体重（10–500kg）");
  const m = h / 100;
  const bmi = w / (m * m);
  const level =
    bmi < 18.5 ? "偏瘦" : bmi < 24 ? "正常" : bmi < 28 ? "超重" : "肥胖";
  const lo = (18.5 * m * m).toFixed(1);
  const hi = (24 * m * m).toFixed(1);
  out(bmi.toFixed(1), `${level} · 你的健康体重范围 ${lo}–${hi} kg`);
};
