import { $, n, bad } from "../lib/calculators/standard.js";

/* 随机抽奖 / 分组（Pattern B，自包含 module）
 * 三种模式：随机数 / 名单抽奖 / 随机分组。
 * 随机源：crypto.getRandomValues（系统级 CSPRNG），拒绝采样 + Fisher-Yates 洗牌。
 * 名单只在本地内存中处理，不保存、不上传。
 */

if ($("rp-go")) {
  const modeSel = $("rp-mode");
  const panels = {
    number: $("rp-panel-number"),
    draw: $("rp-panel-draw"),
    group: $("rp-panel-group"),
  };
  const resultEl = $("result");

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

  // Fisher-Yates 洗牌（crypto 随机源），返回新数组
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const parseNames = (id) => {
    const raw = $(id).value.split("\n");
    const names = [];
    const seen = new Set();
    for (const line of raw) {
      const name = line.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
    return names;
  };

  const render = (title, bodyEl) => {
    resultEl.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    resultEl.append(strong);
    if (bodyEl) resultEl.append(bodyEl);
  };

  const chips = (items) => {
    const div = document.createElement("div");
    div.className = "rp-chips";
    for (const item of items) {
      const s = document.createElement("span");
      s.className = "rp-chip";
      s.textContent = item;
      div.append(s);
    }
    return div;
  };

  const doNumber = () => {
    const min = n("rp-min");
    const max = n("rp-max");
    const count = n("rp-count");
    const repeat = $("rp-repeat").checked;
    if (min == null || max == null || count == null)
      return bad("请填写最小值、最大值和个数");
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max)
      return bad("最小值不能大于最大值，请输入整数范围");
    if (!Number.isInteger(count) || count < 1)
      return bad("个数至少为 1");
    if (count > 1000) return bad("个数太多，最多一次抽 1000 个");
    const range = max - min + 1;
    if (!repeat && count > range)
      return bad(`不允许重复时，个数不能超过 ${range}（${min}～${max} 共 ${range} 个数）`);

    const picked = [];
    if (repeat) {
      for (let i = 0; i < count; i++) picked.push(String(min + randInt(range)));
    } else {
      const pool = shuffle(
        Array.from({ length: range }, (_, i) => String(min + i)),
      );
      picked.push(...pool.slice(0, count));
    }
    const wrap = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = `范围 ${min}～${max}${repeat ? "（可重复）" : "（不重复）"}`;
    wrap.append(span, chips(picked));
    render(`🎲 ${count} 个随机数`, wrap);
  };

  const doDraw = () => {
    const names = parseNames("rp-names");
    const count = n("rp-draw-count");
    if (names.length === 0) return bad("请先在文本框里输入名单，每行一个名字");
    if (count == null || !Number.isInteger(count) || count < 1)
      return bad("抽取人数至少为 1");
    if (count > names.length)
      return bad(`抽取人数（${count}）超过了名单人数（${names.length}）`);
    const winners = shuffle(names).slice(0, count);
    const wrap = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = `从 ${names.length} 人中抽出 ${count} 位`;
    wrap.append(span, chips(winners));
    render("🏆 中奖名单", wrap);
  };

  const doGroup = () => {
    const names = parseNames("rp-gnames");
    const mode = $("rp-group-mode").value;
    const k = n("rp-group-n");
    if (names.length === 0) return bad("请先在文本框里输入名单，每行一个名字");
    if (k == null || !Number.isInteger(k) || k < 1)
      return bad("组数 / 每组人数至少为 1");
    if (k > names.length)
      return bad(`分组数量（${k}）超过了名单人数（${names.length}）`);

    const shuffled = shuffle(names);
    let groupCount, label;
    if (mode === "count") {
      groupCount = k;
      label = `共 ${names.length} 人，分成 ${groupCount} 组`;
    } else {
      groupCount = Math.ceil(names.length / k);
      label = `共 ${names.length} 人，每组约 ${k} 人，分成 ${groupCount} 组`;
    }
    // 轮流发牌：人数自动均匀分配，各组最多差 1 人
    const groups = Array.from({ length: groupCount }, () => []);
    shuffled.forEach((name, i) => groups[i % groupCount].push(name));

    const wrap = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = label;
    wrap.append(span);
    groups.forEach((g, i) => {
      const div = document.createElement("div");
      div.className = "rp-group";
      const h = document.createElement("h4");
      h.textContent = `第 ${i + 1} 组（${g.length} 人）`;
      const ul = document.createElement("ul");
      for (const name of g) {
        const li = document.createElement("li");
        li.textContent = name;
        ul.append(li);
      }
      div.append(h, ul);
      wrap.append(div);
    });
    render("👥 分组结果", wrap);
  };

  const go = () => {
    const mode = modeSel.value;
    if (mode === "number") doNumber();
    else if (mode === "draw") doDraw();
    else doGroup();
  };

  modeSel.addEventListener("change", () => {
    for (const [key, panel] of Object.entries(panels))
      panel.hidden = key !== modeSel.value;
  });
  $("rp-go").addEventListener("click", go);
}
