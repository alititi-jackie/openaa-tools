import { $, n, bad } from "../standard.js";

/* 房贷提前还款计算器：等额本息，按剩余本金/剩余年限模拟，
 * 对比“按原计划还”与“每月多还一笔”的总利息与还清时间。
 */
const money = (v) =>
  "$" +
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const calculate = () => {
  const balance = n("balance");
  const rate = n("rate");
  const years = n("years");
  const extra = n("extra");
  const result = $("result");
  if (
    balance == null || rate == null || years == null || extra == null ||
    balance <= 0 || rate < 0 || rate > 100 || years <= 0 || years > 50 || extra < 0
  )
    return bad("请检查输入数值");

  const r = rate / 1200;
  const totalMonths = Math.round(years * 12);
  const basePay = r > 0
    ? (balance * r) / (1 - Math.pow(1 + r, -totalMonths))
    : balance / totalMonths;
  const baseInterest = basePay * totalMonths - balance;

  // 逐月模拟：每月还 basePay + extra
  const pay = basePay + extra;
  let bal = balance;
  let months = 0;
  let interest = 0;
  while (bal > 0.005 && months < 1200) {
    const im = bal * r;
    interest += im;
    bal += im;
    bal -= Math.min(pay, bal);
    months++;
  }
  const savedInterest = Math.max(0, baseInterest - interest);
  const savedMonths = Math.max(0, totalMonths - months);

  const line = (label, value) => {
    const p = document.createElement("p");
    p.style.margin = "6px 0";
    const b = document.createElement("strong");
    b.textContent = label + " ";
    p.append(b, document.createTextNode(value));
    return p;
  };
  result.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = `节省利息 ${money(savedInterest)}`;
  const span = document.createElement("span");
  const y = Math.floor(savedMonths / 12);
  const m = savedMonths % 12;
  span.textContent =
    savedMonths > 0
      ? `提前 ${savedMonths} 个月还清${y > 0 ? `（约 ${y} 年${m > 0 ? ` ${m} 个月` : ""}）` : ""}`
      : extra > 0
        ? "已按最短时间还清"
        : "每月多还金额为 0，与原计划一致";
  result.append(strong, span);
  result.append(
    line("原月供：", money(basePay)),
    line("多还后月供：", money(pay)),
    line("原总利息：", money(baseInterest)),
    line("多还后总利息：", money(interest)),
    line("实际还款期数：", `${months} 个月（原 ${totalMonths} 个月）`),
  );
};
