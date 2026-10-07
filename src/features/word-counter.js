import { $ } from "../lib/calculators/standard.js";

/* 字数统计（Pattern B，自包含 module）
 * 输入即时统计：中文字数 / 英文单词数 / 英文字母数 /
 * 总字符数（含/不含空格）/ 段落数 / 行数。
 * 定义：中文字数按 CJK 统一表意文字字符计；英文单词按字母连写（含连字符/撇号）计；
 * 段落按空行分隔的非空文本块计；行数按换行符计。
 * 全程本地处理，不上传。
 */

if ($("wc-input")) {
  const input = $("wc-input");
  const CN_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;
  const WORD_RE = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;
  const LETTER_RE = /[A-Za-z]/g;

  const count = (text, re) => {
    re.lastIndex = 0;
    let c = 0;
    while (re.exec(text)) c++;
    return c;
  };

  const update = () => {
    const text = input.value;
    $("wc-cn").textContent = count(text, CN_RE);
    $("wc-words").textContent = count(text, WORD_RE);
    $("wc-letters").textContent = count(text, LETTER_RE);
    $("wc-with-space").textContent = text.length;
    $("wc-no-space").textContent = text.replace(/\s/g, "").length;
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim() !== "").length;
    $("wc-paragraphs").textContent = paragraphs;
    $("wc-lines").textContent = text ? text.split("\n").length : 0;
  };

  input.addEventListener("input", update);
  update();
}
