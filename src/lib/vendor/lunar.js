/**
 * lunar.js — 紧凑型公历/农历换算（1900–2100），独立实现
 *
 * 农历数据表（每年：闰月 4bit + 闰月大小 1bit + 12 个月大小 12bit）由
 * MIT 授权的 lunar-javascript（6tail，https://github.com/6tail/lunar-javascript）
 * 逐年提取生成；节气采用经典 sTerm 天文公式；换算算法为独立实现。
 * 数据表已用原库做差分测试校验（见仓库外 NOTES）。
 *
 * 对外 API 与 lunar-javascript 的子集兼容（本站 lunar-calendar 工具所需部分）：
 *   Solar.fromYmd(y,m,d) -> { getLunar(), getFestivals(), getOtherFestivals(), getWeekInChinese() }
 *   Lunar.fromYmd(y,m,d) -> lunar（m 为负数表示闰月）
 *   LunarYear.fromYear(y) -> { getLeapMonth() }
 *   lunar -> { getJieQi(), getFestivals(), getOtherFestivals(), getMonthInChinese(),
 *              getDayInChinese(), getYearInGanZhi(), getYearShengXiao(), getSolar() }
 */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const DATA = [
  0x104bd, 0x4ae, 0xa57, 0xa54d, 0xd26, 0xd95, 0x9655, 0x56a, 0x9ad, 0x455d,
  0x4ae, 0xca5b, 0xa4d, 0xd25, 0xbd25, 0xb54, 0xd6a, 0x4ada, 0x95b, 0xf497,
  0x497, 0xa4b, 0xab4b, 0x6a5, 0x6d4, 0x9ab5, 0x2b6, 0x957, 0x452f, 0x497,
  0xc656, 0xd4a, 0xea5, 0xb6a9, 0x5ad, 0x2b6, 0x786e, 0x92e, 0xfc8d, 0xc95,
  0xd4a, 0xdd8a, 0xb55, 0x56a, 0x9a5b, 0x25d, 0x92d, 0x4d2b, 0xa95, 0xeb55,
  0x6ca, 0xb55, 0xb535, 0x4da, 0xa5b, 0x7457, 0x52b, 0x10a9a, 0xe95, 0x6aa,
  0xcaea, 0xab5, 0x4b6, 0x8aae, 0xa57, 0x526, 0x6f26, 0xd95, 0xe5b5, 0x56a,
  0x96d, 0xa4dd, 0x4ad, 0xa4d, 0x8d4d, 0xd25, 0x10d55, 0xb54, 0xb6a, 0xd95a,
  0x95b, 0x49b, 0x8a97, 0xa4b, 0x14b27, 0x6a5, 0x6d4, 0xcaf4, 0xab6, 0x957,
  0xa4af, 0x497, 0x64b, 0x674a, 0xea5, 0x106b5, 0x5ac, 0xab6, 0xa96d, 0x92e,
  0xc96, 0x8d95, 0xd4a, 0xda5, 0x4755, 0x56a, 0xeabb, 0x25d, 0x92d, 0xacab,
  0xa95, 0xb4a, 0x8baa, 0xad5, 0x1255d, 0x4ba, 0xa5b, 0xd517, 0x52b, 0xa93,
  0x8795, 0x6aa, 0xad5, 0x45b5, 0x4b6, 0xca6e, 0xa4e, 0xd26, 0xaea6, 0xd53,
  0x5aa, 0x676a, 0x96d, 0x164af, 0x4ad, 0xa4d, 0xdd0b, 0xd25, 0xd52, 0xadd4,
  0xb5a, 0x56d, 0x455b, 0x49b, 0xea57, 0xa4b, 0xaa5, 0xbb25, 0x6d2, 0xada,
  0x74b6, 0x937, 0x1049f, 0x497, 0x64b, 0xd68a, 0xea5, 0x6b2, 0x9a6c, 0xaae,
  0x92e, 0x6d2e, 0xc96, 0xed55, 0xd4a, 0xda5, 0xa5d5, 0x56a, 0xa6d, 0x855d,
  0x52d, 0x10a9b, 0xa95, 0xb4a, 0xcb6a, 0xad5, 0x55a, 0x8aba, 0xa5b, 0x52b,
  0x6b27, 0x693, 0xe733, 0x6aa, 0xad5, 0xb4b5, 0x4b6, 0xa57, 0x854e, 0xd16,
  0x10e96, 0xd52, 0xdaa, 0xd6aa, 0x56d, 0x4ae, 0x8a9d, 0xa2d, 0xd15, 0x4f25,
  0xd52
];
const DAY_MS = 86400000;
// 1900-01-31 为 1900 年正月初一（与原库一致的历元）
const EPOCH = Date.UTC(1900, 0, 31);

function yearInfo(y) {
  const v = DATA[y - MIN_YEAR];
  return { leap: (v >> 13) & 0xf, leapBig: !!((v >> 12) & 1), bits: v & 0xfff };
}
function leapMonthOf(y) {
  return yearInfo(y).leap;
}
function monthLen(y, m, leap) {
  const i = yearInfo(y);
  if (leap) return i.leapBig ? 30 : 29;
  return (i.bits >> (12 - m)) & 1 ? 30 : 29;
}
function yearLen(y) {
  let d = 0;
  for (let m = 1; m <= 12; m++) d += monthLen(y, m, false);
  const i = yearInfo(y);
  if (i.leap) d += i.leapBig ? 30 : 29;
  return d;
}

function checkSolar(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) throw new Error('bad date');
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) throw new Error('bad date');
  const off = Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
  let max = 0;
  for (let yy = MIN_YEAR; yy <= MAX_YEAR; yy++) max += yearLen(yy);
  if (off < 0 || off >= max) throw new Error('out of range');
  return off;
}

function solarToLunar(y, m, d) {
  let offset = checkSolar(y, m, d);
  let ly = MIN_YEAR;
  while (true) {
    const yl = yearLen(ly);
    if (offset < yl) break;
    offset -= yl;
    ly++;
  }
  const leap = leapMonthOf(ly);
  let lm = 1;
  let isLeap = false;
  for (let mth = 1; mth <= 12; mth++) {
    const dm = monthLen(ly, mth, false);
    if (offset < dm) { lm = mth; break; }
    offset -= dm;
    if (mth === leap) {
      const dl = monthLen(ly, mth, true);
      if (offset < dl) { lm = mth; isLeap = true; break; }
      offset -= dl;
    }
  }
  return { year: ly, month: lm, day: offset + 1, leap: isLeap };
}

function lunarToSolar(y, leap, m, d) {
  if (!Number.isInteger(y) || y < MIN_YEAR || y > MAX_YEAR) throw new Error('bad lunar year');
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new Error('bad lunar month');
  const lp = leapMonthOf(y);
  if (leap && lp !== m) throw new Error('no leap month');
  const dm = monthLen(y, m, leap);
  if (!Number.isInteger(d) || d < 1 || d > dm) throw new Error('bad lunar day');
  let offset = 0;
  for (let yy = MIN_YEAR; yy < y; yy++) offset += yearLen(yy);
  for (let mm = 1; mm < m; mm++) {
    offset += monthLen(y, mm, false);
    if (mm === lp) offset += monthLen(y, mm, true);
  }
  if (leap) offset += monthLen(y, m, false);
  offset += d - 1;
  const t = new Date(EPOCH + offset * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/* ---------- 节气（逐年精确日期表，由原库提取，1 字符/节气） ---------- */
const JQ_NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const JQ_DAYS = '004C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F7F8H8H8H9H8G8G6E5D7F6E7F7F8H9H9H9H8G8G7E5D6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F6F8H8H8H9H8G8G6E5D7F6E7F7F8H9H9H9H8G8G7E5D6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F6F8H8H8H9H8G8G6E5D7F6E7F7F8H9H9H9H8G8G7E5D6E5D6E6F7G8G8G9H8F7F6D4C6E5E6F6F8G8H8G9H8G8F6E4C6E5E6F6F8H8H8H9H8G8G6E5D6F6E6F7F8H8H9H9H8G8G6E5D6E5D6E6F7G8G8G8H8F7F6D4C6E5E6E6F8G8H8G9H8G8F6E4C6E5E6F6F8H8H8H9H8G8F6E5D6F6E6F7F8H8H9H9H8G8G6E5D6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F8G8H8G9H8G7F6E4C6E5E6F6F8H8H8H9H8G8F6E5C6E6E6F7F8H8H9H9H8G8G6E5D6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F8G8H8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F7F8H8H9H9H8G8G6E5D6E5D6E6F7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F7F8H8H8H9H8G8G6E5D6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F6F8H8H8H9H8G8G6E5D6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F6F8H8H8H9H8G8G6E5D6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C6E6E6F6F8H8H8H9H8G8G6E5D6E5D5E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5E6F6F8G8H8G9H8G8F6E4C6E5E6F6F8H8H8H9H8G8G6E5D5E5D5E6E7G7G8G8G7F7F5D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F8G8H8G9H8G8F6E4C6E5E6F6F8H8H8H9H8G8G6E5D5E5D5E6E7G7G8G8G7F7F5D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F8G8H8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5D5D5D5E6E7G7G8G8G7F7F5D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C5D5D5E6E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C5D5D5E6E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C5D5D5E5E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8H9H8G8F6E5C5D5D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C6E5E6F6F8G8H8G9H8G8F6E5C5D4D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C6E5D6E6F7G8G8G8H8G7F6D4C6E5E6E6F8G8H8G9H8G8F6E5C5D4D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F8G8H8G9H8G8F6E4C5D4D5E5E7F7G7G8G7F7F5D4C5E5D5E6E7G7G8G8G7F7F5D4C6E5D6E6F7G8G8G8H8F7F6D4C6E5D6E6F7G8H8G9H8G7F6E4C5D4D5E5E7F7G7G8G7F7E5D4C5D5D5E6E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8H8F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E6E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C6E5D6E6F7G8G8G9H8G7F6E4C5D4D5E5E7F7G7F8G7F7E5D4B5D4D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C6E5D6E6F7G8G8G8H8G7F6E4C5D4D5D5E7F7G7F8G7F7E5D4B5D4D5E5E7F7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C6E5D6E6F7G8G8G8H8F7F6D4C5D4C5D5E7F7G7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7F5D4C5E5D5E6E7G7G8G8G7F7F5D4C6E5D6E6E7G8G8G8H8F7F6D4C5D4C5D5E6F7F7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7E5D4C5D5D5E6E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8H8F7F6D4C5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D6E6E7G8G8G8G7F7F6D4C5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C5D4C5D5E6F7F7F8G7F6E5D3B5D4D5D5E7F7G7F8G7F7E5D4B5D4D5E5E7G7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C5D4C5D5E6F7F7F7G7F6E5D3B5D4C5D5E7F7G7F8G7F7E5D4B5D4D5E5E7F7G7G8G7F7F5D4C6E5D5E6E7G7G8G8G7F7F6D4C5D4C5D5D6F7F7F7G7E6E5C3B5D4C5D5E6F7F7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7F5D4C5D5D5E6E7G7G7G8G7F7F5D4C5D4C5D5D6F7F7F7G7E6E5C3B5D4C5D5E6F7F7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7F5D4C5D5D5E5E7G7G7G8G7F7F5D4C5D4C5D5D6F7F7F7G7E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4C5D5D5E5E7G7G7G8G7F7F5D4C5D4C5D5D6F7F7F7F6E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C5D4C5D5D6F7F7F7F6E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C5D4C4D5D6F6F7F7F6E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5D5E7F7G7F8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F5D4C5D4C4D5D6F6F7F7F6E6E5C3B5D4C5D5E6F7F7F7G7F6E5D3B5D4D5D5E7F7G7F8G7F7E5D4B5D4D5E5E7F7G7G8G7F7F5D4C5D4C4D5D6F6F7F7F6E6E5C3B5D4C5D5E6F7F7F7G7F6E5D3B5D4C5D5E6F7G7F8G7F7E5D4B5D4D5E5E7F7G7G8G7F7F5D4C5D4C4D5D6F6F7F7F6E6E5C3B5D4C5D5D6F7F7F7G7E6E5D3B5D4C5D5E6F7F7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7F5D4C4C4C4D5D6F6F6F7F6E6E4C3B5D4C5D5D6F7F7F7G7E6E5C3B5D4C5D5E6F7F7F8G7F7E5D3B5D4D5E5E7F7G7G8G7F7F5D4C4C4C4D4D6F6F6F7F6E6E4C3B5D4C5D5D6F7F7F7G7E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4C4C4C4D4D6F6F6F7F6E6E4C3B5D4C5D5D6F7F7F7F6E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B4C4C4D4D6F6F6F7F6E6E4C3B5D4C5D5D6F6F7F7F6E6E5C3B5D4C5D5E6F7F7F8G7F6E5D3B5D4D5E5E7F7G7G8G7F7E5D4B5D5D5E5E7G7G7G8G7F7F';
function jieQi(y, m, d) {
  const base = (y - MIN_YEAR) * 24;
  for (let n = 0; n < 24; n++) {
    if (Math.floor(n / 2) + 1 !== m) continue;
    if (JQ_DAYS.charCodeAt(base + n) - 48 === d) return JQ_NAMES[n];
  }
  return '';
}

/* ---------- 节日 ---------- */
const LUNAR_FEST = {
  '1-1': ['春节'], '1-7': ['人日'], '1-15': ['元宵节'], '2-2': ['龙抬头'], '5-5': ['端午节'],
  '7-7': ['七夕节'], '7-15': ['中元节'], '8-15': ['中秋节'], '9-9': ['重阳节'], '10-1': ['寒衣节'],
  '12-8': ['腊八节'], '12-16': ['尾牙'], '12-23': ['小年'], '12-24': ['祭灶日'],
};
const SOLAR_FEST = {
  '1-1': ['元旦'], '2-14': ['情人节'], '3-8': ['妇女节'], '5-1': ['劳动节'],
  '6-1': ['儿童节'], '10-1': ['国庆节'], '12-25': ['圣诞节'],
};
const M_CN = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const D_CN = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const SX = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
const WEEK_CN = '日一二三四五六';

function makeLunar(y, m, d, leap) {
  return {
    getJieQi() {
      const s = lunarToSolar(y, leap, m, d);
      return jieQi(s.y, s.m, s.d);
    },
    getFestivals() {
      if (leap) return []; // 闰月不标节日（与原库一致）
      const f = (LUNAR_FEST[m + '-' + d] || []).slice();
      if (m === 12 && d === monthLen(y, 12, false)) f.push('除夕');
      return f;
    },
    getOtherFestivals() { return []; },
    getMonthInChinese() { return (leap ? '闰' : '') + M_CN[m - 1]; },
    getDayInChinese() { return D_CN[d - 1]; },
    getYearInGanZhi() { return GAN[(y - 4) % 10] + ZHI[(y - 4) % 12]; },
    getYearShengXiao() { return SX[(y - 4) % 12]; },
    getSolar() {
      const s = lunarToSolar(y, leap, m, d);
      return {
        getYear() { return s.y; },
        getMonth() { return s.m; },
        getDay() { return s.d; },
      };
    },
  };
}

const Solar = {
  fromYmd(y, m, d) {
    const L = solarToLunar(y, m, d);
    return {
      getLunar() { return makeLunar(L.year, L.month, L.day, L.leap); },
      getFestivals() { return SOLAR_FEST[m + '-' + d] || []; },
      getOtherFestivals() { return []; },
      getWeekInChinese() { return WEEK_CN[new Date(y, m - 1, d).getDay()]; },
    };
  },
};

const Lunar = {
  fromYmd(y, m, d) {
    const leap = m < 0;
    const mm = Math.abs(m);
    lunarToSolar(y, leap, mm, d); // 校验，非法抛错
    return makeLunar(y, mm, d, leap);
  },
};

const LunarYear = {
  fromYear(y) {
    if (!Number.isInteger(y) || y < MIN_YEAR || y > MAX_YEAR) throw new Error('bad year');
    return { getLeapMonth() { return leapMonthOf(y); } };
  },
};

export default { Solar, Lunar, LunarYear };
