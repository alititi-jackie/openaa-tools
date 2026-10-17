const PLACES = [
  {
    category: "景点",
    name: "中央公园 Central Park",
    note: "纽约最著名的大型城市公园，适合散步、拍照和休闲。",
    address: "Columbus Circle, New York, NY 10019",
  },
  {
    category: "景点",
    name: "时代广场 Times Square",
    note: "纽约最热闹的地标之一，大屏广告、商店和夜景集中。",
    address: "Times Square, New York, NY 10036",
  },
  {
    category: "景点",
    name: "自由女神 / Battery Park",
    note: "前往自由女神游船常用出发区域，也可在海边看自由女神。",
    address: "Battery Park, New York, NY 10004",
  },
  {
    category: "景点",
    name: "华尔街铜牛 Charging Bull",
    note: "华尔街著名铜牛雕像，游客常去的拍照地标。",
    address: "Bowling Green, New York, NY 10004",
  },
  {
    category: "景点",
    name: "世贸中心 / 9·11 纪念馆",
    note: "世贸中心和 9·11 纪念区域，可一起参观 Oculus。",
    address: "180 Greenwich St, New York, NY 10007",
  },
  {
    category: "景点",
    name: "布鲁克林大桥 Brooklyn Bridge",
    note: "纽约经典地标，可步行过桥看曼哈顿和布鲁克林景色。",
    address: "Brooklyn Bridge, New York, NY 10038",
  },
  {
    category: "景点",
    name: "DUMBO 经典拍照点",
    note: "布鲁克林热门拍照地点，可看到曼哈顿大桥经典街景。",
    address: "Washington St & Water St, Brooklyn, NY 11201",
  },
  {
    category: "景点",
    name: "法拉盛草原可乐娜公园",
    note: "皇后区大型公园，著名地标是大地球仪 Unisphere。",
    address: "Flushing Meadows Corona Park, Queens, NY 11368",
  },
  {
    category: "景点",
    name: "罗斯福岛 Roosevelt Island",
    note: "位于东河中的小岛，可坐缆车欣赏曼哈顿景色。",
    address: "Roosevelt Island, New York, NY 10044",
  },
  {
    category: "景点",
    name: "康尼岛 Coney Island",
    note: "布鲁克林海边休闲区，有木板路、海滩和游乐设施。",
    address: "Coney Island Boardwalk, Brooklyn, NY 11224",
  },
  {
    category: "购物",
    name: "American Dream 美国梦购物中心",
    note: "新泽西大型综合购物中心，购物、餐饮和室内娱乐集中。",
    address: "1 American Dream Way, East Rutherford, NJ 07073",
  },
  {
    category: "购物",
    name: "Roosevelt Field 罗斯福购物中心",
    note: "长岛大型室内购物中心，品牌和百货店很多。",
    address: "630 Old Country Rd, Garden City, NY 11530",
  },
  {
    category: "购物",
    name: "Queens Center 皇后中心商场",
    note: "皇后区常去的大型购物中心，交通方便、品牌较齐全。",
    address: "90-15 Queens Blvd, Elmhurst, NY 11373",
  },
  {
    category: "购物",
    name: "The Shops at Hudson Yards 哈德逊园区商场",
    note: "曼哈顿西侧较新的购物中心，可和 Vessel、High Line 一起游览。",
    address: "20 Hudson Yards, New York, NY 10001",
  },
  {
    category: "购物",
    name: "Westfield World Trade Center 世贸购物中心",
    note: "位于 Oculus 交通枢纽内，可与世贸中心和 9·11 景点一起逛。",
    address: "185 Greenwich St, New York, NY 10007",
  },
  {
    category: "购物",
    name: "Woodbury Common 名牌折扣村",
    note: "纽约周边最热门的名牌 Outlet 之一，适合买品牌折扣商品。",
    address: "498 Red Apple Ct, Central Valley, NY 10917",
  },
  {
    category: "购物",
    name: "Jersey Gardens 泽西花园奥特莱斯",
    note: "新泽西大型 Outlet，距离纽约市相对较近，适合集中购物。",
    address: "651 Kapkowski Rd, Elizabeth, NJ 07201",
  },
  {
    category: "品牌店",
    name: "Gucci Fifth Avenue 古驰第五大道店",
    note: "Gucci 古驰纽约第五大道品牌旗舰店。",
    address: "725 Fifth Ave, New York, NY 10022",
  },
  {
    category: "品牌店",
    name: "Tiffany & Co. The Landmark 蒂芙尼旗舰店",
    note: "Tiffany 蒂芙尼纽约著名旗舰店，位于第五大道。",
    address: "727 Fifth Ave, New York, NY 10022",
  },
  {
    category: "品牌店",
    name: "Cartier Fifth Avenue Mansion 卡地亚",
    note: "Cartier 卡地亚第五大道精品店，纽约经典奢侈品牌门店。",
    address: "653 Fifth Ave, New York, NY 10022",
  },
  {
    category: "品牌店",
    name: "Hermès Madison Avenue 爱马仕",
    note: "Hermès 爱马仕麦迪逊大道精品店。",
    address: "706 Madison Ave, New York, NY 10065",
  },
  {
    category: "品牌店",
    name: "Prada Fifth Avenue 普拉达",
    note: "Prada 普拉达第五大道品牌店。",
    address: "724 Fifth Ave, New York, NY 10019",
  },
  {
    category: "品牌店",
    name: "CHANEL 57th Street 香奈儿",
    note: "CHANEL 香奈儿纽约 57 街精品店。",
    address: "15 E 57th St, New York, NY 10022",
  },
  {
    category: "实用",
    name: "7大道地铁口",
    note: "布鲁克林 7 大道与 62 街附近地铁入口。",
    address: "Seventh Avenue & 62nd Street Brooklyn, NY 11220",
  },
  {
    category: "实用",
    name: "36街地铁口",
    note: "布鲁克林 36 街与第四大道附近地铁入口。",
    address: "36th Street & Fourth Avenue Brooklyn, NY 11232",
  },
  {
    category: "实用",
    name: "36街 Costco 好市多",
    note: "布鲁克林 36 街附近 Costco 大型会员制超市。",
    address: "976 3rd Ave Brooklyn, NY 11232",
  },

  {
    category: "购物",
    name: "Macy's Herald Square 梅西百货旗舰店",
    note: "纽约著名百货旗舰店，位于 Herald Square；建议出发前查看官方营业时间。",
    address: "151 W 34th St, New York, NY 10001",
    officialUrl: "https://www.macys.com/stores/ny/newyork/herald-square_3.html",
    aliases: ["梅西百货", "Macy's", "Macy’s", "Herald Square"],
  },
  {
    category: "品牌店",
    name: "Apple Fifth Avenue 苹果第五大道旗舰店",
    note: "苹果官方直营零售店，标志性的玻璃立方体入口；官方页面提供营业时间和店内服务。",
    address: "767 Fifth Ave, New York, NY 10153",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/fifthavenue/",
    aliases: ["苹果", "Apple Store", "第五大道苹果店"],
  },
  {
    category: "品牌店",
    name: "Apple Grand Central 苹果中央车站店",
    note: "位于 Grand Central Terminal 内的苹果官方零售店。",
    address: "45 Grand Central Terminal, New York, NY 10017",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "Grand Central Apple"],
  },
  {
    category: "品牌店",
    name: "Apple SoHo 苹果苏活区店",
    note: "位于 Prince Street 的苹果官方零售店。",
    address: "103 Prince St, New York, NY 10012",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "SoHo Apple"],
  },
  {
    category: "品牌店",
    name: "Apple World Trade Center 苹果世贸中心店",
    note: "位于 Oculus / Westfield World Trade Center 区域的苹果官方零售店。",
    address: "185 Greenwich St, New York, NY 10007",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "WTC Apple", "Oculus Apple"],
  },
  {
    category: "品牌店",
    name: "Apple West 14th Street 苹果西14街店",
    note: "曼哈顿 Meatpacking District 附近的苹果官方零售店。",
    address: "401 W 14th St, New York, NY 10014",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "West 14th Apple"],
  },
  {
    category: "品牌店",
    name: "Apple Upper West Side 苹果上西区店",
    note: "位于 Broadway 的苹果官方零售店。",
    address: "1981 Broadway, New York, NY 10023",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "Upper West Side Apple"],
  },
  {
    category: "品牌店",
    name: "Apple Upper East Side 苹果上东区店",
    note: "位于 Madison Avenue 的苹果官方零售店。",
    address: "940 Madison Ave, New York, NY 10021",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "Upper East Side Apple"],
  },
  {
    category: "品牌店",
    name: "Apple Downtown Brooklyn 苹果布鲁克林市中心店",
    note: "布鲁克林 Downtown 区域的苹果官方零售店。",
    address: "123 Flatbush Ave, Brooklyn, NY 11217",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "Brooklyn Apple"],
  },
  {
    category: "品牌店",
    name: "Apple Williamsburg 苹果威廉斯堡店",
    note: "位于 Bedford Avenue 的苹果官方零售店。",
    address: "247 Bedford Ave, Brooklyn, NY 11211",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/storelist/",
    aliases: ["苹果", "Williamsburg Apple"],
  },
  {
    category: "品牌店",
    name: "Apple Roosevelt Field 苹果罗斯福购物中心店",
    note: "苹果官方零售店，位于长岛 Garden City 的 Roosevelt Field 商场。",
    address: "630 Old Country Rd, Garden City, NY 11530",
    storeType: "Apple 官方零售店",
    officialUrl: "https://www.apple.com/retail/rooseveltfield/",
    aliases: ["苹果", "Apple Store", "Roosevelt Field Apple"],
  },
  {
    category: "品牌店",
    name: "Samsung Experience Store Queens Center 三星皇后中心体验店",
    note: "三星官方体验店，位于 Queens Center 商场一层，靠近 Zara 和 Shake Shack。",
    address: "90-15 Queens Blvd, Space 1060, Elmhurst, NY 11373",
    storeType: "Samsung 官方体验店",
    officialUrl: "https://www.samsung.com/us/samsung-experience-store/queens-center/",
    aliases: ["三星", "Samsung", "Queens Center Samsung"],
  },
  {
    category: "品牌店",
    name: "Samsung Experience Store Roosevelt Field 三星罗斯福购物中心体验店",
    note: "三星官方体验店，位于长岛 Garden City 的 Roosevelt Field 商场二层。",
    address: "630 Old Country Rd, Garden City, NY 11530",
    storeType: "Samsung 官方体验店",
    officialUrl: "https://www.samsung.com/us/store/",
    aliases: ["三星", "Samsung", "Roosevelt Field Samsung"],
  },
  {
    category: "购物",
    name: "Bloomingdale's 布鲁明戴尔百货",
    note: "曼哈顿知名百货公司，位于 Lexington Avenue 与 59 街附近。",
    address: "1000 Third Ave, New York, NY 10022",
    aliases: ["Bloomingdale's", "布鲁明戴尔"],
  },
  {
    category: "购物",
    name: "Saks Fifth Avenue 萨克斯第五大道百货",
    note: "第五大道知名高端百货，位于 Rockefeller Center 对面一带。",
    address: "611 Fifth Ave, New York, NY 10022",
    aliases: ["Saks", "萨克斯百货"],
  },
  {
    category: "购物",
    name: "Bergdorf Goodman 伯格多夫古德曼百货",
    note: "第五大道奢侈品百货，位于 Central Park 南侧。",
    address: "754 Fifth Ave, New York, NY 10019",
    aliases: ["Bergdorf Goodman", "伯格多夫"],
  },
  {
    category: "购物",
    name: "Nintendo NY 任天堂纽约店",
    note: "Rockefeller Center 内的任天堂官方品牌零售店。",
    address: "10 Rockefeller Plaza, New York, NY 10020",
    aliases: ["Nintendo", "任天堂"],
  },
  {
    category: "购物",
    name: "LEGO Store Rockefeller Center 乐高洛克菲勒中心店",
    note: "洛克菲勒中心附近的乐高品牌店。",
    address: "620 Fifth Ave, New York, NY 10020",
    aliases: ["LEGO", "乐高"],
  },
  {
    category: "购物",
    name: "Nike House of Innovation 耐克第五大道旗舰店",
    note: "耐克第五大道大型品牌零售店；营业和楼层服务以官方信息为准。",
    address: "650 Fifth Ave, New York, NY 10019",
    aliases: ["Nike", "耐克"],
  },
  {
    category: "景点",
    name: "帝国大厦 Empire State Building",
    note: "纽约经典摩天大楼观景地标，观景台入场通常需要购票。",
    address: "20 W 34th St, New York, NY 10001",
    aliases: ["Empire State", "帝国大厦"],
  },
  {
    category: "景点",
    name: "洛克菲勒中心 Rockefeller Center",
    note: "曼哈顿中城地标，包含 Top of the Rock、广场及季节性活动。",
    address: "45 Rockefeller Plaza, New York, NY 10111",
    aliases: ["Rockefeller Center", "洛克菲勒中心"],
  },
  {
    category: "景点",
    name: "中央车站 Grand Central Terminal",
    note: "纽约历史悠久的交通地标，主大厅和室内建筑值得参观。",
    address: "89 E 42nd St, New York, NY 10017",
    aliases: ["Grand Central", "中央车站"],
  },
  {
    category: "景点",
    name: "纽约公共图书馆主馆 NYPL",
    note: "第五大道与 42 街附近的标志性公共图书馆建筑。",
    address: "476 Fifth Ave, New York, NY 10018",
    aliases: ["New York Public Library", "NYPL", "纽约图书馆"],
  },
  {
    category: "景点",
    name: "布莱恩特公园 Bryant Park",
    note: "位于纽约公共图书馆后方，适合休息、散步及季节性活动。",
    address: "Bryant Park, New York, NY 10018",
    aliases: ["Bryant Park", "布莱恩特公园"],
  },
  {
    category: "景点",
    name: "高线公园 The High Line",
    note: "由旧高架铁路改造的城市空中公园；入口分布在多个街口。",
    address: "820 Washington St, New York, NY 10014",
    aliases: ["High Line", "高线公园"],
  },
  {
    category: "景点",
    name: "Vessel 哈德逊园区 Vessel",
    note: "Hudson Yards 的标志性建筑，参观规则和开放情况请以官方信息为准。",
    address: "20 Hudson Yards, New York, NY 10001",
    aliases: ["Vessel", "Hudson Yards"],
  },
  {
    category: "景点",
    name: "Edge NYC 哈德逊园区观景台",
    note: "位于 30 Hudson Yards 的高空观景台，建议提前查看票务和入场时间。",
    address: "30 Hudson Yards, New York, NY 10001",
    aliases: ["Edge", "Edge NYC", "观景台"],
  },
  {
    category: "景点",
    name: "现代艺术博物馆 MoMA",
    note: "纽约重要现代与当代艺术博物馆，入场安排请查看官网。",
    address: "11 W 53rd St, New York, NY 10019",
    aliases: ["MoMA", "现代艺术博物馆"],
  },
  {
    category: "景点",
    name: "大都会艺术博物馆 The Met",
    note: "位于第五大道博物馆大道的世界知名艺术博物馆。",
    address: "1000 Fifth Ave, New York, NY 10028",
    aliases: ["The Met", "Metropolitan Museum", "大都会博物馆"],
  },
  {
    category: "景点",
    name: "美国自然历史博物馆 AMNH",
    note: "位于 Central Park 西侧，适合家庭和自然科学主题参观。",
    address: "200 Central Park West, New York, NY 10024",
    aliases: ["American Museum of Natural History", "自然历史博物馆"],
  },
  {
    category: "景点",
    name: "布鲁克林博物馆 Brooklyn Museum",
    note: "布鲁克林大型艺术博物馆，靠近 Prospect Park 和植物园。",
    address: "200 Eastern Pkwy, Brooklyn, NY 11238",
    aliases: ["Brooklyn Museum", "布鲁克林博物馆"],
  },
  {
    category: "景点",
    name: "布鲁克林植物园 Brooklyn Botanic Garden",
    note: "布鲁克林植物园，季节性花期和入园安排以官网为准。",
    address: "990 Washington Ave, Brooklyn, NY 11225",
    aliases: ["Brooklyn Botanic Garden", "植物园"],
  },
  {
    category: "购物",
    name: "Chelsea Market 切尔西市场",
    note: "室内食品市场和购物空间，适合与 High Line 一起安排。",
    address: "75 Ninth Ave, New York, NY 10011",
    aliases: ["Chelsea Market", "切尔西市场"],
  },
  {
    category: "景点",
    name: "Staten Island Ferry Whitehall Terminal 史泰登岛渡轮码头",
    note: "前往免费史泰登岛渡轮的曼哈顿出发码头；出行前查看渡轮服务公告。",
    address: "4 Whitehall St, New York, NY 10004",
    aliases: ["Staten Island Ferry", "史泰登岛渡轮"],
  },
  {
    category: "景点",
    name: "One World Observatory 世贸中心观景台",
    note: "位于 One World Trade Center 内的观景台，建议查看官网购票信息。",
    address: "117 West St, New York, NY 10007",
    aliases: ["One World", "世贸中心观景台"],
  },
  {
    category: "实用",
    name: "法拉盛缅街地铁站 Flushing–Main Street",
    note: "7 号线终点站，步行可到缅街、罗斯福大道及法拉盛华人商业区。",
    address: "41-42 Main St, Flushing, NY 11355",
    aliases: ["法拉盛地铁", "缅街地铁", "Flushing Main Street", "7号线", "7 train"],
  },
  {
    category: "实用",
    name: "布鲁克林八大道地铁站 8 Av",
    note: "N 号线车站，方便前往日落公园八大道华人商业街。",
    address: "8th Ave & 62nd St, Brooklyn, NY 11220",
    aliases: ["八大道地铁", "布鲁克林八大道", "8 Avenue station", "N train"],
  },
  {
    category: "实用",
    name: "曼哈顿华埠 Canal Street 地铁站",
    note: "华埠及周边购物区域常用交通点；Canal Street 有多个不同线路站点，导航到 Broadway 交界附近。",
    address: "Canal St & Broadway, New York, NY 10013",
    aliases: ["唐人街地铁", "曼哈顿唐人街", "华埠地铁", "Canal Street subway"],
  },
  {
    category: "实用",
    name: "曼哈顿华埠 Grand Street 地铁站",
    note: "服务华埠东侧及下东城周边，适合前往 Grand Street 一带。",
    address: "Grand St & Chrystie St, New York, NY 10002",
    aliases: ["Grand Street subway", "唐人街东边地铁"],
  },
  {
    category: "实用",
    name: "曼哈顿华埠 East Broadway 地铁站",
    note: "方便前往华埠东部、East Broadway 和下东城一带。",
    address: "East Broadway & Rutgers St, New York, NY 10002",
    aliases: ["East Broadway subway", "东百老汇地铁"],
  },
];
const CATEGORY_LABELS = {
  景点: "景点",
  购物: "购物商场",
  品牌店: "品牌门店",
  实用: "实用地点",
};
const list = document.getElementById("placeList"),
  search = document.getElementById("searchInput"),
  count = document.getElementById("countText"),
  categoryTabs = document.getElementById("categoryTabs");
let activeCategory = "all";
function esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
function mapUrl(a) {
  const q = encodeURIComponent(a);
  if (/Android/i.test(navigator.userAgent)) return `geo:0,0?q=${q}`;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent))
    return `https://maps.apple.com/?q=${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function openMap(address) {
  const u = mapUrl(address);
  u.startsWith("geo:")
    ? (location.href = u)
    : window.open(u, "_blank", "noopener,noreferrer");
}
async function copyText(v) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(v);
      return true;
    }
  } catch (e) {}
  const t = document.createElement("textarea");
  t.value = v;
  t.style.position = "fixed";
  t.style.top = "-9999px";
  document.body.appendChild(t);
  t.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {}
  t.remove();
  return ok;
}
function render() {
  const q = search.value.trim().toLowerCase();
  const items = PLACES.filter(
    (x) =>
      // 主页面仅显示 Apple 与 Samsung 的代表门店；完整分店集中在品牌门店页。
      (!x.name.startsWith("Apple ") || x.name.includes("Fifth Avenue")) &&
      (!x.name.startsWith("Samsung ") || x.name.includes("Queens Center")) &&
      (activeCategory === "all" || x.category === activeCategory) &&
      (!q ||
        x.name.toLowerCase().includes(q) ||
        x.note.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q) ||
        (x.storeType || "").toLowerCase().includes(q) ||
        (x.aliases || []).some((alias) => alias.toLowerCase().includes(q))),
  );
  count.textContent =
    activeCategory === "all"
      ? `${items.length} 个地点`
      : `${CATEGORY_LABELS[activeCategory]} · ${items.length} 个`;
  list.innerHTML = items.length
    ? items
        .map(
          (x) =>
            `<article class="nyc-card"><div class="nyc-card-inner"><div class="nyc-title-row"><div class="nyc-name">${esc(x.name)}</div><span class="nyc-category">${esc(CATEGORY_LABELS[x.category] || x.category)}</span></div><div class="nyc-address">${esc(x.address)}</div><div class="nyc-note">${esc(x.note)}</div><div class="nyc-card-actions"><button class="nyc-btn primary nyc-map" type="button" data-map-address="${esc(x.address)}">地图导航</button><button class="nyc-btn nyc-copy" type="button" data-copy="${esc(x.address)}" aria-label="复制${esc(x.name)}地址">复制地址</button>${x.name.startsWith("Apple ") ? `<a class="nyc-btn nyc-other-stores" href="/usa/brand-stores/#apple-stores">其它苹果店 ↗</a>` : ""}${x.name.startsWith("Samsung ") ? `<a class="nyc-btn nyc-other-stores" href="/usa/brand-stores/#samsung-stores">其它三星店 ↗</a>` : ""}${x.officialUrl ? `<a class="nyc-btn nyc-official" href="${esc(x.officialUrl)}" target="_blank" rel="noopener noreferrer">官方信息 ↗</a>` : ""}</div></div></article>`,
        )
        .join("")
    : '<div class="nyc-empty">没有找到相关地点</div>';
}
categoryTabs.addEventListener("click", (e) => {
  const b = e.target.closest("[data-category]");
  if (!b) return;
  activeCategory = b.dataset.category;
  categoryTabs
    .querySelectorAll(".nyc-tab")
    .forEach((x) => x.classList.toggle("active", x === b));
  render();
});
list.addEventListener("click", async (e) => {
  const c = e.target.closest("[data-copy]");
  if (c) {
    e.preventDefault();
    e.stopPropagation();
    const old = c.textContent;
    c.textContent = (await copyText(c.dataset.copy)) ? "已复制" : "复制失败";
    setTimeout(() => (c.textContent = old), 1400);
    return;
  }
  const mapButton = e.target.closest("[data-map-address]");
  if (mapButton) openMap(mapButton.dataset.mapAddress);
});
search.addEventListener("input", render);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
render();
