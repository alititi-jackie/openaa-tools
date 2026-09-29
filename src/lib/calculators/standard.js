export const $ = (id) => document.getElementById(id);
export const n = (id) => {
  const raw = $(id)?.value;
  if (raw == null || String(raw).trim() === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
};
export const out = (v, l) => {
  const e = $("result");
  if (!e) return;
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = String(v);
  span.textContent = String(l);
  e.replaceChildren(strong, span);
};
export const bad = (m) => out("⚠️", m);
export function loan(p, d, r, t, isYears) {
  let price = n(p),
    down = n(d),
    rate = n(r),
    term = n(t);
  if (
    price == null ||
    down == null ||
    rate == null ||
    term == null ||
    price < 0 ||
    down < 0 ||
    down > price ||
    rate < 0 ||
    rate > 100 ||
    term < 1
  )
    return bad("请检查输入数值");
  let principal = price - down,
    months = isYears ? term * 12 : term,
    rr = rate / 1200,
    m = rr
      ? (principal * rr * Math.pow(1 + rr, months)) /
        (Math.pow(1 + rr, months) - 1)
      : principal / months;
  out("$" + m.toFixed(2), "预计每月 · 贷款本金 $" + principal.toFixed(2));
}
