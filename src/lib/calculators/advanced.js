import {
  federal2026,
  standardDeduction2026,
  additionalMedicareThreshold2026,
  SOCIAL_SECURITY_WAGE_BASE_2026,
} from "../../data/rules/tax-2026.js";
export {
  federal2026,
  standardDeduction2026,
  additionalMedicareThreshold2026,
  SOCIAL_SECURITY_WAGE_BASE_2026,
};
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
  e.setAttribute("aria-live", "polite");
  let strong = e.querySelector("strong"),
    span = e.querySelector("span");
  if (!strong) {
    strong = document.createElement("strong");
    e.appendChild(strong);
  }
  if (!span) {
    span = document.createElement("span");
    e.appendChild(span);
  }
  strong.textContent = String(v);
  span.textContent = String(l);
};
export const bad = (m) => out("⚠️", m);
export const money = (v) =>
  "$" +
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function fedTax(x, status) {
  let tax = 0,
    last = 0;
  for (const [top, r] of federal2026[status]) {
    const part = Math.min(x, top) - last;
    if (part > 0) tax += part * r;
    if (x <= top) break;
    last = top;
  }
  return tax;
}
export async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
