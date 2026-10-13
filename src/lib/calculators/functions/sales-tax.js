import { $, n, out, bad } from "../standard.js";

// 2026年美国主要城市综合销售税率（%），含州、县、市及地方附加税
// 数据来源：Tax Foundation、各州税务部门；仅供参考，实际以结账为准
const CITY_RATES = [
  ["NYC", "纽约市 New York City", 8.875],
  ["LA", "洛杉矶 Los Angeles", 10.25],
  ["SF", "旧金山 San Francisco", 8.625],
  ["CHI", "芝加哥 Chicago", 10.5],
  ["HOU", "休斯顿 Houston", 8.25],
  ["SEA", "西雅图 Seattle", 10.55],
  ["BOS", "波士顿 Boston", 6.25],
  ["PHL", "费城 Philadelphia", 8],
  ["DAL", "达拉斯 Dallas", 8.25],
  ["AUS", "奥斯汀 Austin", 8.25],
  ["SD", "圣地亚哥 San Diego", 7.75],
  ["LV", "拉斯维加斯 Las Vegas", 8.375],
  ["PHX", "凤凰城 Phoenix", 9.1],
  ["DEN", "丹佛 Denver", 9.15],
  ["MIA", "迈阿密 Miami", 7],
];

function initStateDropdown() {
  const sel = $("state");
  const taxInput = $("tax");
  const note = $("rate-note");
  if (!sel || !taxInput) return;
  CITY_RATES.forEach(([code, name, rate]) => {
    const opt = document.createElement("option");
    opt.value = String(rate);
    opt.textContent = `${name}（${rate}%）`;
    opt.dataset.code = code;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    if (sel.value === "") return;
    taxInput.value = sel.value;
    const rate = Number(sel.value);
    if (note) {
      note.textContent = `已填入${rate}%综合税率（含州、县、市及地方附加税），可手动调整。`;
    }
  });
}

initStateDropdown();

export const calculate = () => {
  let p = n("price"),
    t = n("tax");
  if (p == null || t == null || p < 0 || t < 0 || t > 100)
    return bad("请输入有效价格和税率");
  out(
    "$" + (p * (1 + t / 100)).toFixed(2),
    "含税价格 · 税额 $" + ((p * t) / 100).toFixed(2),
  );
};
