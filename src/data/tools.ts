import catalog from "./tools.json";
export type Tool = (typeof catalog)[number];
export const tools: Tool[] = catalog;
export const categories = [
  { id: "usa", name: "美国生活", icon: "🇺🇸" },
  { id: "life", name: "日常生活", icon: "🏠" },
  { id: "image", name: "图片工具", icon: "🖼️" },
  { id: "dmv", name: "DMV 与证件", icon: "🪪" },
  { id: "auto", name: "汽车出行", icon: "🚗" },
  { id: "convert", name: "单位换算", icon: "📏" },
  { id: "finance", name: "工资与理财", icon: "💰" },
] as const;
export const MAX_RELATED = 8;
export const MIN_RELATED = 6;

/**
 * 跨类相关度映射：tool id -> 按相关度排序的关联 tool id 列表。
 * 规则：
 * - 同主题工具优先（如 mortgage<->rent-vs-buy 都是住房决策，car-payment<->gas-cost 都是用车成本）
 * - 资金流转相关（发工资->报税->花钱：salary-calculator->take-home-pay->sales-tax->tip-calculator）
 * - 单位换算内部互链（convert 类工具天然相关）
 * - DMV 四件套互链
 * - 美国生活场景串联（china-us-time<->usd-rmb<->currency 跨境场景）
 */
const CROSS_LINKS: Record<string, string[]> = {
  // finance
  "401k-calculator": ["compound-interest", "savings-cd", "take-home-pay", "salary-calculator", "credit-card-payoff"],
  "compound-interest": ["401k-calculator", "savings-cd", "mortgage", "credit-card-payoff", "rent-vs-buy"],
  "credit-card-payoff": ["compound-interest", "expense-record", "split-bill", "savings-cd", "mortgage"],
  currency: ["usd-rmb", "china-us-time", "sales-tax", "expense-record", "nyc-attractions"],
  "hourly-to-salary": ["salary-calculator", "take-home-pay", "overtime-pay", "401k-calculator"],
  "overtime-pay": ["hourly-to-salary", "salary-calculator", "take-home-pay"],
  "salary-calculator": ["us-tax-estimator", "take-home-pay", "hourly-to-salary", "overtime-pay", "sales-tax", "401k-calculator"],
  "sales-tax": ["tip-calculator", "split-bill", "discount", "currency"],
  "savings-cd": ["compound-interest", "401k-calculator", "mortgage", "credit-card-payoff"],
  "split-bill": ["tip-calculator", "sales-tax", "discount", "expense-record"],
  "take-home-pay": ["us-tax-estimator", "salary-calculator", "hourly-to-salary", "sales-tax", "overtime-pay"],
  "tip-calculator": ["split-bill", "sales-tax", "discount", "expense-record"],
  // life
  age: ["date-difference", "china-us-time"],
  "date-difference": ["age", "china-us-time"],
  discount: ["sales-tax", "tip-calculator", "split-bill", "currency"],
  kinship: ["age", "date-difference", "china-us-time"],
  "mattress-size": ["length", "area", "shoe-size"],
  mortgage: ["rent-vs-buy", "mortgage-prepay", "compound-interest", "savings-cd", "credit-card-payoff", "401k-calculator", "expense-record"],
  "mortgage-prepay": ["mortgage", "compound-interest", "credit-card-payoff", "rent-vs-buy", "savings-cd"],
  "qr-generator": ["qr-decoder", "nyc-attractions", "area-code", "zip-code", "expense-record"],  "rent-vs-buy": ["mortgage", "compound-interest", "savings-cd", "expense-record", "credit-card-payoff"],
  "shoe-size": ["clothing-size", "length", "mattress-size"],
  // image
  "image-compressor": ["image-converter", "qr-generator", "qr-decoder", "word-counter"],
  "image-converter": ["image-compressor", "qr-generator", "qr-decoder"],
  // usa
  "us-holidays": ["china-us-time", "date-difference", "countdown", "lunar-calendar", "nyc-attractions"],
  // life
  "lunar-calendar": ["date-difference", "china-us-time", "us-holidays", "countdown", "age"],
  "qr-decoder": ["qr-generator", "image-compressor", "image-converter"],
  "gpa-calculator": ["word-counter", "countdown", "date-difference"],
  "password-generator": ["random-picker", "qr-generator", "word-counter"],
  "random-picker": ["password-generator", "discount", "split-bill", "word-counter"],
  "bmi-calculator": ["age", "weight", "length"],
  "word-counter": ["chinese-converter", "gpa-calculator", "random-picker"],
  "chinese-converter": ["word-counter", "kinship", "lunar-calendar"],
  countdown: ["date-difference", "us-holidays", "china-us-time", "gpa-calculator"],
  "clothing-size": ["shoe-size", "mattress-size", "length"],
  // finance
  "us-tax-estimator": ["take-home-pay", "salary-calculator", "hourly-to-salary", "overtime-pay", "401k-calculator", "expense-record"],
  // convert
  area: ["length", "distance", "volume", "weight", "mattress-size"],
  distance: ["mpg", "gas-cost", "length", "area", "nyc-attractions"],
  "hp-kw": ["weight", "volume", "mpg"],
  length: ["area", "weight", "shoe-size", "mattress-size", "volume"],
  "psi-bar": ["volume", "weight", "temperature"],
  temperature: ["volume", "weight", "length"],
  volume: ["weight", "mpg", "distance", "length"],
  weight: ["volume", "length", "mpg"],
  // usa
  "area-code": ["zip-code", "nyc-attractions", "china-us-time"],
  "china-us-time": ["date-difference", "usd-rmb", "currency", "age"],
  "expense-record": ["split-bill", "usd-rmb", "sales-tax", "credit-card-payoff"],
  "nyc-attractions": ["zip-code", "area-code", "distance", "gas-cost"],
  "usd-rmb": ["currency", "china-us-time", "expense-record", "sales-tax"],
  "zip-code": ["area-code", "nyc-attractions", "distance"],
  // auto
  "car-monthly-cost": ["car-payment", "gas-cost", "mpg", "expense-record"],
  "car-payment": ["car-monthly-cost", "gas-cost", "mpg", "compound-interest", "credit-card-payoff"],
  "gas-cost": ["mpg", "car-monthly-cost", "car-payment", "distance", "expense-record"],
  mpg: ["gas-cost", "distance", "volume", "car-monthly-cost"],
  // dmv
  "6-points-calculator": ["real-id-checker", "document-checker", "real-id-vs-standard-vs-enhanced"],
  "real-id-checker": ["6-points-calculator", "document-checker", "real-id-vs-standard-vs-enhanced"],
  "real-id-vs-standard-vs-enhanced": ["real-id-checker", "document-checker", "6-points-calculator"],
  "document-checker": ["6-points-calculator", "real-id-checker", "real-id-vs-standard-vs-enhanced"],
};

/** 兜底热门工具：当前 2 步都没凑够 6 个时按此顺序补足 */
const POPULAR_FALLBACK = [
  "mortgage",
  "salary-calculator",
  "tip-calculator",
  "currency",
  "take-home-pay",
  "compound-interest",
  "sales-tax",
  "china-us-time",
];

const toolById = new Map(tools.map((t) => [t.id, t]));

export function relatedTools(tool: Tool) {
  const picked: Tool[] = [];
  const seen = new Set<string>([tool.id]);
  const add = (id: string) => {
    if (seen.has(id)) return;
    const t = toolById.get(id);
    if (!t) return;
    seen.add(id);
    picked.push(t);
  };
  const cross = CROSS_LINKS[tool.id] ?? [];
  // 1) 同类：先取"跨类映射里出现过的同类"（人工标定的强相关），再按目录顺序补足，最多 4 个
  const orderedSame: string[] = [];
  for (const id of cross) {
    const t = toolById.get(id);
    if (t && t.category === tool.category && !orderedSame.includes(id))
      orderedSame.push(id);
  }
  for (const t of tools) {
    if (
      t.category === tool.category &&
      t.id !== tool.id &&
      !orderedSame.includes(t.id)
    )
      orderedSame.push(t.id);
  }
  for (const id of orderedSame.slice(0, 4)) add(id);
  // 2) 跨类映射补足到 8 个
  for (const id of cross) {
    if (picked.length >= MAX_RELATED) break;
    add(id);
  }
  // 3) 兜底：热门工具补足到至少 6 个
  for (const id of POPULAR_FALLBACK) {
    if (picked.length >= MIN_RELATED) break;
    add(id);
  }
  return picked;
}
