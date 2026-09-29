import {
  $,
  n,
  out,
  bad,
  money,
  federal2026,
  standardDeduction2026,
  additionalMedicareThreshold2026,
  SOCIAL_SECURITY_WAGE_BASE_2026,
  fedTax,
  fetchJson,
  queryError,
} from "../advanced.js";
export const calculate = async () => {
  const a = ($("areaCode")?.value || "").replace(/\D/g, "").slice(0, 3);
  if (a.length !== 3) return bad("请输入 3 位电话区号");
  out("查询中…", "正在查询美国电话区号");
  try {
    const d = await fetchJson(
        "https://areacode.fyi/api/v1/area-code/" + encodeURIComponent(a),
      ),
      x = d?.data || d || {},
      cities = Array.isArray(x.cities) ? x.cities.slice(0, 6).map(String) : [];
    if (!x.region && !x.state && !cities.length) throw new Error("empty");
    out(
      String(x.region || x.state || "已找到"),
      "区号 " + a + " · " + (cities.join("、") || "地区信息"),
    );
  } catch (e) {
    bad(queryError(e, "区号"));
  }
};
