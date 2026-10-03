import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const catalog = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
function element(value = "") {
  return {
    value: String(value),
    innerHTML: "",
    textContent: "",
    dataset: {},
    style: {},
    children: [],
    addEventListener(type, fn) {
      this["on" + type] = fn;
    },
    setAttribute() {},
    appendChild(x) {
      this.children.push(x);
    },
    replaceChildren(...children) {
      this.children = children;
      this.innerHTML = children.map((x) => x.textContent).join(" ");
    },
    querySelector(sel) {
      return sel === "strong" ? this.strong : sel === "span" ? this.span : null;
    },
  };
}
async function run(_code, tool, values, advanced = false) {
  const elements = {};
  for (const [id, value] of Object.entries(values))
    elements[id] = element(value);
  const result = element();
  result.strong = element();
  result.span = element();
  elements.result = result;
  globalThis.document = {
    getElementById: (id) => elements[id] || null,
    createElement: () => element(),
  };
  const entry = catalog.find(
    (x) =>
      x.calculator === tool &&
      (advanced
        ? [
            "takehome",
            "overtime",
            "compound",
            "savings",
            "credit",
            "retire",
            "rentbuy",
            "carcost",
            "zip",
          ].includes(tool) || x.id === "area-code"
        : x.id !== "area-code"),
  );
  const { calculate } = await import(
    "../src/lib/calculators/functions/" + entry.id + ".js"
  );
  await calculate();
  return advanced
    ? { value: result.strong.textContent, label: result.span.textContent }
    : { html: result.innerHTML };
}
const standardCode = null,
  advancedCode = null;
const includes = (actual, text, name) =>
  assert.ok(
    actual.includes(text),
    name + " expected " + text + " but got " + actual,
  );

const standard = [
  ["tip", { bill: 100, people: 2, tip: 20 }, "$60.00"],
  ["salary", { annual: 60000 }, "$5000.00"],
  ["hourly", { hourly: 25, hours: 40, weeks: 52 }, "$52000.00"],
  ["split", { bill: 100, people: 2, tip: 20 }, "$60.00"],
  ["tax", { price: 100, tax: 8.875 }, "$108.88"],
  ["discount", { price: 100, discount: 20 }, "$80.00"],
  ["currency", { amount: 100, rate: 7, direction: "USD-CNY" }, "¥700.00"],
  ["temp", { value: 32, direction: "F-C" }, "0.00°"],
  ["weight", { value: 10, direction: "lbkg" }, "4.54"],
  ["length", { value: 10, direction: "incm" }, "25.40"],
  ["distance", { value: 10, direction: "mi-km" }, "16.09"],
  ["area", { value: 100, direction: "ftm" }, "9.29"],
  ["volume", { value: 1, direction: "gl" }, "3.79"],
  ["mpg", { value: 30 }, "7.84"],
  ["gas", { miles: 300, mpg: 30, price: 3.5 }, "$35.00"],
  ["car", { price: 30000, down: 5000, rate: 6, months: 60 }, "$483.32"],
  [
    "mortgage",
    { price: 500000, down: 100000, rate: 6.5, years: 30 },
    "$2528.27",
  ],
  ["psi", { value: 35, direction: "psi-bar" }, "2.41"],
  ["hp", { value: 10, direction: "hp-kw" }, "7.46"],
];
for (const [tool, input, expected] of standard)
  includes((await run(standardCode, tool, input)).html, expected, tool);

const advanced = [
  [
    "takehome",
    { annual: 0, k401: 0, health: 0, status: "single", state: 0 },
    "$0.00",
  ],
  ["overtime", { rate: 20, hours: 40, ot: 10 }, "$1,100.00"],
  [
    "compound",
    { principal: 1000, contribution: 100, rate: 0, years: 1, freq: 12 },
    "$2,200.00",
  ],
  ["savings", { principal: 1000, apy: 0, years: 2, freq: 12 }, "$1,000.00"],
  ["credit", { balance: 1000, apr: 0, payment: 100 }, "10 个月"],
  [
    "retire",
    { salary: 60000, contribution: 6, match: 3, rate: 0, years: 1 },
    "$5,400.00",
  ],
  [
    "carcost",
    {
      payment: 500,
      miles: 12000,
      mpg: 25,
      gas: 3.5,
      insurance: 1800,
      maintenance: 1200,
      other: 50,
    },
    "$940.00",
  ],
];
for (const [tool, input, expected] of advanced)
  assert.equal(
    (await run(advancedCode, tool, input, true)).value,
    expected,
    tool,
  );

assert.equal(catalog.length, 41, "all original tools are registered");
assert.equal(new Set(catalog.map((x) => x.id)).size, catalog.length);
assert.equal(new Set(catalog.map((x) => x.path)).size, catalog.length);
for (const item of catalog)
  assert.ok(fs.existsSync("src/features/" + item.id + ".html"));

const dmvCode = fs.readFileSync("src/features/dmv-document-checker.js", "utf8");
const dmvResult = {
  className: "",
  innerHTML: "",
  scrollIntoView() {},
};
const docType = { value: "standard", checked: true };
const checkButton = {
  attributes: {},
  setAttribute(name, value) { this.attributes[name] = value; },
  addEventListener(type, fn) {
    this["on" + type] = fn;
  },
};
const dmvDocument = {
  getElementById: (id) => (id === "dmvResult" ? dmvResult : null),
  querySelector: (selector) => {
    if (selector === 'input[name="docType"]:checked') return docType;
    if (selector === "[data-action=checkDmvDocs]") return checkButton;
    return null;
  },
};
vm.runInNewContext(dmvCode, { document: dmvDocument });
assert.equal(typeof checkButton.onclick, "function", "DMV checklist wires the generate button");
assert.equal(checkButton.attributes["data-ready"], "true", "DMV initialization completes before interaction");
checkButton.onclick();
includes(dmvResult.innerHTML, "Standard 材料清单", "DMV document checker");
includes(dmvResult.innerHTML, "6 Points", "DMV document checker");
includes(dmvResult.innerHTML, "纽约地址证明：至少 1 份", "DMV document checker");

console.log(
  "Calculator tests passed: 27 result cases, catalog integrity, and DMV checklist.",
);

for (const app of ["expense-record", "usd-rmb"]) {
  const html = fs.readFileSync("src/features/" + app + ".html", "utf8");
  const js = fs.readFileSync("src/features/" + app + ".js", "utf8");
  assert.match(html, /data-share/, app + " uses shared share control");
  assert.match(
    js,
    /openaa_(expense|usd_rmb)_records_v1/,
    app + " preserves storage key",
  );
}
includes(
  (await run(null, "tip", { bill: "", tip: 20, people: 2 })).html,
  "请输入",
  "empty bill is not zero",
);