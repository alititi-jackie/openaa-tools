import catalog from "./tools.json";
export type Tool = (typeof catalog)[number];
export const tools: Tool[] = catalog;
export const categories = [
  { id: "finance", name: "工资与理财", icon: "💰" },
  { id: "life", name: "日常生活", icon: "🏠" },
  { id: "convert", name: "单位换算", icon: "📏" },
  { id: "auto", name: "汽车出行", icon: "🚗" },
  { id: "dmv", name: "DMV 与证件", icon: "🪪" },
  { id: "usa", name: "美国生活", icon: "🇺🇸" },
] as const;
export function relatedTools(tool: Tool) {
  return tools
    .filter((t) => t.id !== tool.id && t.category === tool.category)
    .slice(0, 3);
}
