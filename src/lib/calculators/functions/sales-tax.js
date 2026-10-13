import { $, n, out, bad } from "../standard.js";

// 2026年美国各州销售税州级基准税率（%），来源：Tax Foundation
// 注意：同一州内各县市可能加收地方税，实际税率以结账为准
const STATE_RATES = [
  ["AL", "阿拉巴马 Alabama", 4],
  ["AK", "阿拉斯加 Alaska", 0],
  ["AZ", "亚利桑那 Arizona", 5.6],
  ["AR", "阿肯色 Arkansas", 6.5],
  ["CA", "加利福尼亚 California", 7.25],
  ["CO", "科罗拉多 Colorado", 2.9],
  ["CT", "康涅狄格 Connecticut", 6.35],
  ["DE", "特拉华 Delaware", 0],
  ["DC", "华盛顿特区 DC", 6],
  ["FL", "佛罗里达 Florida", 6],
  ["GA", "佐治亚 Georgia", 4],
  ["HI", "夏威夷 Hawaii", 4],
  ["ID", "爱达荷 Idaho", 6],
  ["IL", "伊利诺伊 Illinois", 6.25],
  ["IN", "印第安纳 Indiana", 7],
  ["IA", "爱荷华 Iowa", 6],
  ["KS", "堪萨斯 Kansas", 6.5],
  ["KY", "肯塔基 Kentucky", 6],
  ["LA", "路易斯安那 Louisiana", 5],
  ["ME", "缅因 Maine", 5.5],
  ["MD", "马里兰 Maryland", 6],
  ["MA", "马萨诸塞 Massachusetts", 6.25],
  ["MI", "密歇根 Michigan", 6],
  ["MN", "明尼苏达 Minnesota", 6.875],
  ["MS", "密西西比 Mississippi", 7],
  ["MO", "密苏里 Missouri", 4.225],
  ["MT", "蒙大拿 Montana", 0],
  ["NE", "内布拉斯加 Nebraska", 5.5],
  ["NV", "内华达 Nevada", 6.85],
  ["NH", "新罕布什尔 New Hampshire", 0],
  ["NJ", "新泽西 New Jersey", 6.625],
  ["NM", "新墨西哥 New Mexico", 5],
  ["NY", "纽约 New York", 4],
  ["NC", "北卡罗来纳 North Carolina", 4.75],
  ["ND", "北达科他 North Dakota", 5],
  ["OH", "俄亥俄 Ohio", 5.75],
  ["OK", "俄克拉荷马 Oklahoma", 4.5],
  ["OR", "俄勒冈 Oregon", 0],
  ["PA", "宾夕法尼亚 Pennsylvania", 6],
  ["RI", "罗得岛 Rhode Island", 7],
  ["SC", "南卡罗来纳 South Carolina", 6],
  ["SD", "南达科他 South Dakota", 4.2],
  ["TN", "田纳西 Tennessee", 7],
  ["TX", "得克萨斯 Texas", 6.25],
  ["UT", "犹他 Utah", 5.95],
  ["VT", "佛蒙特 Vermont", 6],
  ["VA", "弗吉尼亚 Virginia", 5.3],
  ["WA", "华盛顿 Washington", 6.5],
  ["WV", "西弗吉尼亚 West Virginia", 6],
  ["WI", "威斯康星 Wisconsin", 5],
  ["WY", "怀俄明 Wyoming", 4],
];

function initStateDropdown() {
  const sel = $("state");
  const taxInput = $("tax");
  const note = $("rate-note");
  if (!sel || !taxInput) return;
  STATE_RATES.forEach(([code, name, rate]) => {
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
      note.textContent =
        rate === 0
          ? "该州无州级销售税（部分地区可能有地方税）。"
          : `已填入${rate}%州级基准税率；同一州内各县市实际税率可能更高，可手动调整。`;
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
