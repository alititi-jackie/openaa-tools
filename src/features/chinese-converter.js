/* 简繁拼音转换（Pattern B 自包含模块）
 * 繁 -> 简：vendored opencc-js t2cn（MIT + Apache-2.0 数据），词组级转换
 * 简 -> 繁：S2T 单字对照表（源自 OpenCC STCharacters.txt，Apache-2.0）+
 *          S2T_PHRASES 高频词组补丁（人工整理，优先按词组匹配）
 * 拼音：PINYIN 单字对照表（源自 pinyin-pro dict1，MIT），多音字取最常用读音
 * 全程本地，无网络请求。
 */
import OpenCC from "../lib/vendor/opencc-t2cn.js";
import { S2T, S2T_PHRASES, CHAR_FIX } from "../lib/vendor/s2t-data.js";
import { PINYIN } from "../lib/vendor/pinyin-data.js";

(function initChineseConverter() {
  const input = document.getElementById("cc-input");
  const simpEl = document.getElementById("cc-simp");
  const tradEl = document.getElementById("cc-trad");
  const pinyinEl = document.getElementById("cc-pinyin");
  const countEl = document.getElementById("cc-count");
  if (!input || !simpEl || !tradEl || !pinyinEl) return;

  const t2s = OpenCC.Converter({ from: "tw", to: "cn" });
  const PHRASE_KEYS = Object.keys(S2T_PHRASES).sort(
    (a, b) => b.length - a.length,
  );

  // 声调符号 -> 无声调字母
  const TONE_MAP = {
    ā: "a", á: "a", ǎ: "a", à: "a",
    ē: "e", é: "e", ě: "e", è: "e", ê: "e",
    ī: "i", í: "i", ǐ: "i", ì: "i",
    ō: "o", ó: "o", ǒ: "o", ò: "o",
    ū: "u", ú: "u", ǔ: "u", ù: "u",
    ǖ: "ü", ǘ: "ü", ǚ: "ü", ǜ: "ü",
    ń: "n", ň: "n", ǹ: "n", "ḿ": "m",
  };
  const stripTones = (s) =>
    s.replace(/[āáǎàēéěèêīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]/g, (ch) => TONE_MAP[ch] || ch);

  let toneMode = "marks";
  let lastText = "";

  // 简 -> 繁：先按高频词组匹配，再逐字查表
  function toTraditional(text) {
    let out = "";
    let i = 0;
    while (i < text.length) {
      let hit = null;
      for (const k of PHRASE_KEYS) {
        if (text.startsWith(k, i)) {
          hit = k;
          break;
        }
      }
      if (hit) {
        out += S2T_PHRASES[hit];
        i += hit.length;
      } else {
        const ch = text[i];
        out += CHAR_FIX[ch] || S2T[ch] || ch;
        i += 1;
      }
    }
    return out;
  }

  const PUNCT_RE = /^[\p{P}\p{S}]$/u;

  function toPinyin(text) {
    const parts = [];
    let latin = "";
    const flushLatin = () => {
      if (latin) {
        parts.push(latin);
        latin = "";
      }
    };
    for (const ch of text) {
      const py = PINYIN[ch];
      if (py) {
        flushLatin();
        parts.push(toneMode === "marks" ? py : stripTones(py));
      } else if (/[A-Za-z0-9]/.test(ch)) {
        latin += ch;
      } else {
        flushLatin();
        parts.push(ch === "\n" ? "\n" : /\s/.test(ch) ? " " : ch);
      }
    }
    flushLatin();
    let out = "";
    for (const p of parts) {
      if (p === "\n" || p === " ") {
        out += p;
      } else if (
        out === "" ||
        out.endsWith("\n") ||
        out.endsWith(" ") ||
        PUNCT_RE.test(p)
      ) {
        out += p;
      } else {
        out += " " + p;
      }
    }
    return out
      .replace(/ {2,}/g, " ")
      .replace(/ \n/g, "\n")
      .trim();
  }

  function render() {
    const text = input.value;
    if (text === lastText) return;
    lastText = text;
    if (!text.trim()) {
      simpEl.textContent = "";
      tradEl.textContent = "";
      pinyinEl.textContent = "";
      countEl.textContent = "";
      return;
    }
    let simp = text;
    try {
      simp = t2s(text);
    } catch {
      simp = text; // 降级：原样输出
    }
    simpEl.textContent = simp;
    tradEl.textContent = toTraditional(text);
    pinyinEl.textContent = toPinyin(text);
    const hanzi = (text.match(/[一-鿿]/g) || []).length;
    countEl.textContent = `共 ${text.length} 字符（含 ${hanzi} 个汉字）`;
  }

  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
  });

  document.querySelectorAll(".cc-tone").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cc-tone").forEach((b) =>
        b.classList.remove("is-active"),
      );
      btn.classList.add("is-active");
      toneMode = btn.dataset.tone;
      lastText = ""; // 强制重渲染
      render();
    });
  });
})();
