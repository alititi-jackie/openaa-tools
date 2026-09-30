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
];
const CATEGORY_LABELS = {
  景点: "景点",
  购物: "购物商场",
  品牌店: "品牌直营店",
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
      (activeCategory === "all" || x.category === activeCategory) &&
      (!q ||
        x.name.toLowerCase().includes(q) ||
        x.note.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q)),
  );
  count.textContent =
    activeCategory === "all"
      ? `${items.length} 个地点`
      : `${CATEGORY_LABELS[activeCategory]} · ${items.length} 个`;
  list.innerHTML = items.length
    ? items
        .map(
          (x) =>
            `<article class="nyc-card" role="link" tabindex="0" data-map="${esc(x.address)}"><div class="nyc-card-inner"><div class="nyc-title-row"><div class="nyc-name">${esc(x.name)}</div><button class="nyc-copy" type="button" data-copy="${esc(x.address)}">复制</button></div><div class="nyc-note">${esc(x.note)}</div><div class="nyc-address">${esc(x.address)}</div><span class="nyc-category">${esc(CATEGORY_LABELS[x.category] || x.category)}</span></div></article>`,
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
  const card = e.target.closest(".nyc-card[data-map]");
  if (card) openMap(card.dataset.map);
});
list.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".nyc-card[data-map]");
  if (!card || e.target.closest("[data-copy]")) return;
  e.preventDefault();
  openMap(card.dataset.map);
});
search.addEventListener("input", render);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
render();
