import { $, bad } from "../lib/calculators/standard.js";

/* 密码生成器（Pattern B，自包含 module）
 * 随机源：crypto.getRandomValues（系统级 CSPRNG），拒绝采样消除取模偏差。
 * 纯本地生成：不写 localStorage、不发网络请求。
 */

if ($("pg-generate")) {
  const lenInput = $("pg-len");
  const lenVal = $("pg-len-val");
  const strengthBox = $("pg-strength");
  const strengthLabel = $("pg-strength-label");
  const strengthFill = $("pg-strength-fill");
  const resultEl = $("result");

  const SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digit: "0123456789",
    symbol: "!@#$%^&*()-_=+[]{};:,.<>?/~|\"",
  };
  const AMBIGUOUS = new Set(["0", "O", "1", "l", "I"]);

  // [0, max) 均匀随机整数，拒绝采样避免 modulo bias
  const randInt = (max) => {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  };

  const buildPool = () => {
    let pool = "";
    if ($("pg-upper").checked) pool += SETS.upper;
    if ($("pg-lower").checked) pool += SETS.lower;
    if ($("pg-digit").checked) pool += SETS.digit;
    if ($("pg-symbol").checked) pool += SETS.symbol;
    if ($("pg-no-ambiguous").checked)
      pool = [...pool].filter((c) => !AMBIGUOUS.has(c)).join("");
    return pool;
  };

  // 强度：熵 bits = 长度 × log2(字符集大小)
  const showStrength = (len, poolSize) => {
    const bits = Math.round(len * Math.log2(poolSize));
    let level, color, width;
    if (bits < 50) {
      level = "弱";
      color = "#dc2626";
      width = "30%";
    } else if (bits < 80) {
      level = "中";
      color = "#d97706";
      width = "60%";
    } else {
      level = "强";
      color = "#16a34a";
      width = "100%";
    }
    strengthLabel.textContent = `强度：${level}（约 ${bits} bit 熵）`;
    strengthFill.style.width = width;
    strengthFill.style.background = color;
    strengthBox.hidden = false;
  };

  const renderPassword = (pwd) => {
    resultEl.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = pwd;
    const span = document.createElement("span");
    span.textContent = "点击复制密码";
    resultEl.append(strong, span);
  };

  const generate = () => {
    const len = Number(lenInput.value);
    const pool = buildPool();
    if (!pool) return bad("至少选择一种字符");
    let pwd = "";
    for (let i = 0; i < len; i++) pwd += pool[randInt(pool.length)];
    renderPassword(pwd);
    showStrength(len, pool.length);
  };

  lenInput.addEventListener("input", () => {
    lenVal.textContent = lenInput.value;
  });

  $("pg-generate").addEventListener("click", generate);

  // 点击结果复制
  resultEl.addEventListener("click", async () => {
    const pwd = resultEl.querySelector("strong");
    if (!pwd || !pwd.textContent || pwd.textContent === "—") return;
    const text = pwd.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API 不可用时降级
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const tip = resultEl.querySelector(".copied-tip");
    if (tip) tip.remove();
    const el = document.createElement("span");
    el.className = "copied-tip";
    el.textContent = " ✓ 已复制到剪贴板";
    resultEl.append(el);
    setTimeout(() => el.remove(), 1800);
  });

  generate(); // 首屏直接生成一个，免一次点击
}
