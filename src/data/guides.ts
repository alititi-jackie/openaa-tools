import data from "./seo-guides.json";
const toolGuidesModules = import.meta.glob("./tool-guides/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Guide[]>;
const toolGuidesData: Guide[] = Object.values(toolGuidesModules).flat();
export type Guide = {
  slug: string;
  title: string;
  description: string;
  toolIds: string[];
  intro: string;
  sections: { heading: string; html: string }[];
  faq: { question: string; answer: string }[];
  reviewed: string;
  path?: string;
  scope?: string;
  sources?: { name: string; url: string }[];
};
const dmvSources = [
  {
    name: "纽约 DMV ID-44（2/26）：积分、身份、SSN、住址和原件规则",
    url: "https://dmv.ny.gov/forms/id44.pdf",
  },
  {
    name: "DMV Document Guide：个人文件核对",
    url: "https://dmv.ny.gov/DocumentGuide",
  },
  {
    name: "纽约 DMV Green Light Law：普通非商业驾照规则",
    url: "https://dmv.ny.gov/driver-license/driver-licenses-and-the-green-light-law",
  },
  {
    name: "纽约 DMV REAL ID / Enhanced：资格、用途与费用",
    url: "https://dmv.ny.gov/driver-license/enhanced-or-real-id",
  },
  {
    name: "TSA：机场接受的身份证件",
    url: "https://www.tsa.gov/travel/security-screening/identification",
  },
  {
    name: "DHS：Enhanced 的陆路 / 海路边境用途",
    url: "https://www.dhs.gov/enhanced-drivers-licenses-what-are-they",
  },
  {
    name: "CBP：美国公民国际旅行文件",
    url: "https://www.help.cbp.gov/s/article/Article-1467?language=en_US",
  },
];
export const dmvGuides: Guide[] = data.map((g) => ({
  ...g,
  path: `/usa/dmv/${g.slug}/`,
  sources: dmvSources,
  scope:
    "本文聚焦纽约普通非商业驾照 / Learner Permit材料。Non-Driver ID、商业驾照、未成年人、续证和特殊移民文件可能另有要求。具体文件由 DMV最终核验，出行规则由相关机构确认。",
}));
export const toolGuides: Guide[] = toolGuidesData.map((g) => ({
  ...g,
  path: `/tools/${g.toolIds[0]}/${g.slug}/`,
  sources: g.sources ?? [],
  scope:
    "本文为中文整理的生活指南，数字为估算或区间，具体以官方最新公布为准。",
}));
export const guides: Guide[] = [...dmvGuides, ...toolGuides];
export const guideBySlug = (slug: string) =>
  guides.find((g) => g.slug === slug);
export const guidesForTool = (id: string) =>
  guides.filter((g) => g.toolIds.includes(id));
