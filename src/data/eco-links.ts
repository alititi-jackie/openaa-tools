/* OpenAA 生态深链映射：按工具 id / 分类匹配一张场景卡片。
 * 约束：只允许 openaa.com、dmv.openaa.com、numbermobi.com，禁止 toolku.com。 */
export interface EcoLink {
  url: string;
  label: string;
  title: string;
  description: string;
}

const OPENAA = "https://openaa.com";
const DMV = "https://dmv.openaa.com";
const NUMBERMOBI = "https://numbermobi.com";

const utm = (campaign: string) =>
  `?utm_source=tools.openaa.com&utm_medium=referral&utm_campaign=${campaign}`;

interface Rule {
  ids?: string[];
  categories?: string[];
  link: Omit<EcoLink, "url"> & { url: string };
}

const RULES: Rule[] = [
  {
    ids: ["mortgage", "rent-vs-buy"],
    link: {
      url: `${OPENAA}/housing`,
      label: "查看华人房屋",
      title: "预算有数了，再看看合适的房屋",
      description: "到 OpenAA 查看美国华人租房、售房和求租信息。",
    },
  },
  {
    ids: ["car-payment", "car-monthly-cost", "gas-cost", "mpg"],
    link: {
      url: `${OPENAA}/marketplace`,
      label: "查看二手车",
      title: "费用算好了，再看看二手车信息",
      description: "到 OpenAA 浏览美国华人发布的车辆与二手信息。",
    },
  },
  {
    ids: ["tip-calculator", "split-bill"],
    link: {
      url: `${OPENAA}/services`,
      label: "查找本地服务",
      title: "还需要本地生活服务？",
      description: "到 OpenAA 查找餐饮、维修及其他美国华人本地服务。",
    },
  },
  {
    ids: ["discount", "shoe-size", "mattress-size"],
    link: {
      url: `${OPENAA}/marketplace`,
      label: "查看二手与闲置",
      title: "需要购买或处理闲置物品？",
      description: "OpenAA 有美国华人二手与闲置信息，可以顺便看看。",
    },
  },
  {
    ids: ["area-code"],
    link: {
      url: NUMBERMOBI,
      label: "看看手机靓号",
      title: "喜欢这个区号？",
      description: "NumberMobi 有美国手机靓号，三连号、四连号随便挑。",
    },
  },
  {
    ids: ["zip-code"],
    link: {
      url: `${OPENAA}/directory`,
      label: "查找附近商家",
      title: "查完地区，再看看附近华人商家",
      description: "OpenAA 商家目录可以继续查找附近的华人商家和服务。",
    },
  },
  {
    ids: ["currency", "usd-rmb"],
    link: {
      url: `${OPENAA}/news`,
      label: "看看新闻",
      title: "汇率查好了，看看相关新闻",
      description: "到 OpenAA 看看美国华人新闻和财经动态。",
    },
  },
  {
    categories: ["finance"],
    link: {
      url: `${OPENAA}/jobs`,
      label: "查看附近招聘",
      title: "算完收入，下一步可以看看工作机会",
      description: "OpenAA 汇集美国华人招聘与求职信息，方便继续比较职位和收入。",
    },
  },
  {
    categories: ["dmv"],
    link: {
      url: DMV,
      label: "开始中文题库练习",
      title: "材料确认后，去刷 DMV 中文题库",
      description:
        "dmv.openaa.com 有各州 DMV 中文题库、模拟考试和错题本，考前练一遍更稳。",
    },
  },
  {
    categories: ["auto"],
    link: {
      url: `${OPENAA}/marketplace`,
      label: "查看二手车",
      title: "费用算好了，再看看二手车信息",
      description: "到 OpenAA 浏览美国华人发布的车辆与二手信息。",
    },
  },
];

const DEFAULT_LINK: Omit<EcoLink, "url"> & { url: string } = {
  url: OPENAA,
  label: "看看 OpenAA",
  title: "还要处理其他美国生活事务？",
  description: "OpenAA 汇集招聘、房屋、二手、DMV 和本地服务。",
};

/* nyc-attractions 的 fragment 里已有手写生态链，不再叠加卡片 */
const EXCLUDE = new Set(["nyc-attractions"]);

export function ecoLinkFor(tool: { id: string; category: string }): EcoLink | null {
  if (EXCLUDE.has(tool.id)) return null;
  const rule =
    RULES.find((r) => r.ids?.includes(tool.id)) ??
    RULES.find((r) => r.categories?.includes(tool.category));
  const link = rule?.link ?? DEFAULT_LINK;
  return { ...link, url: link.url + utm(tool.id) };
}

/* DMV 攻略页底部：统一链到题库站首页（slug 前缀不全是州，不做州级深链） */
export function guideEcoLink(slug: string): EcoLink {
  return {
    url: `${DMV}/${utm(slug)}`,
    label: "去刷 DMV 中文题库",
    title: "攻略看完了，去做一次模拟考试",
    description:
      "到 dmv.openaa.com 选择你的州，刷中文题库、做模拟考试，考前检验一下。",
  };
}

/* 首页生态入口 */
export function homeEcoLinks(): EcoLink[] {
  const links: Array<Omit<EcoLink, "url"> & { url: string }> = [
    { url: `${OPENAA}/jobs`, label: "找工作", title: "", description: "" },
    { url: `${OPENAA}/housing`, label: "找房屋", title: "", description: "" },
    { url: `${OPENAA}/marketplace`, label: "二手市场", title: "", description: "" },
    { url: `${OPENAA}/services`, label: "本地服务", title: "", description: "" },
    { url: `${OPENAA}/news`, label: "华人新闻", title: "", description: "" },
    { url: DMV, label: "DMV 中文题库", title: "", description: "" },
    { url: NUMBERMOBI, label: "美国手机靓号", title: "", description: "" },
  ];
  return links.map((l) => ({ ...l, url: l.url + utm("home") }));
}
