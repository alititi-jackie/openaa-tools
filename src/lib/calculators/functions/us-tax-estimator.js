import { $, n, out, bad } from "../standard.js";

/* 美国联邦所得税估算器（2026 税年）
 * 数据：IRS IR-2025-103 / Revenue Procedure 2025-32
 * 标准扣除额：single/mfs $16,100；mfj $32,200；hoh $24,150
 * 假设：采用标准扣除额；收入为普通收入（ordinary income）；不含州税、
 * 抵免(credit)、逐项扣除、65岁/失明额外扣除、自雇税。结果仅供参考。
 */
const BRACKETS = {
  // [本档上限, 税率]
  single: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
  mfj: [
    [24800, 0.1],
    [100800, 0.12],
    [211400, 0.22],
    [403550, 0.24],
    [512450, 0.32],
    [768700, 0.35],
    [Infinity, 0.37],
  ],
  mfs: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [384350, 0.35],
    [Infinity, 0.37],
  ],
  hoh: [
    [17700, 0.1],
    [67450, 0.12],
    [105700, 0.22],
    [201750, 0.24],
    [256200, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
};
const STD_DED = { single: 16100, mfj: 32200, mfs: 16100, hoh: 24150 };

const fmt = (v) =>
  "$" +
  Math.round(v).toLocaleString("en-US");

export const calculate = () => {
  const income = n("income");
  const status = $("status")?.value;
  if (income == null || income < 0 || income > 100000000)
    return bad("请输入有效的年收入");
  if (!BRACKETS[status]) return bad("请选择报税身份");

  const taxable = Math.max(0, income - STD_DED[status]);
  let tax = 0;
  let prev = 0;
  let marginal = 0;
  for (const [cap, rate] of BRACKETS[status]) {
    if (taxable <= prev) break;
    const inBracket = Math.min(taxable, cap) - prev;
    tax += inBracket * rate;
    if (taxable <= cap) marginal = rate;
    prev = cap;
  }
  if (taxable === 0) marginal = 0;
  const effective = income > 0 ? (tax / income) * 100 : 0;

  let label = `边际税率 ${(marginal * 100).toFixed(0)}% · 实际税率 ${effective.toFixed(1)}% · 应税收入 ${fmt(taxable)}`;
  const withheld = n("withheld");
  if (withheld != null) {
    if (withheld < 0 || withheld > 100000000)
      return bad("已预扣税额无效");
    const diff = withheld - tax;
    label +=
      diff >= 0
        ? ` · 预计退税 ${fmt(diff)}`
        : ` · 预计补税 ${fmt(-diff)}`;
  }
  out(fmt(tax), label);
};
