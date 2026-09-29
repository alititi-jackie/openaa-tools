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
    if (!r.ok) {
      const error = new Error("HTTP " + r.status);
      error.status = r.status;
      throw error;
    }
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
export function queryError(error, kind) {
  if (error.name === "AbortError") return "查询超时，请稍后重试";
  if (error.status === 404 || error.message === "empty")
    return `没有找到该${kind}，请检查输入`;
  if (error.status === 429) return "查询过于频繁，请稍后重试";
  return "查询服务暂时不可用或网络连接失败，请稍后重试";
}
