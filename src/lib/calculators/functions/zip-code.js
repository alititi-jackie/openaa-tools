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
  const z = ($("zip")?.value || "").trim();
  if (!/^\d{5}$/.test(z)) return bad("请输入 5 位 ZIP Code");
  out("查询中…", "正在查询 ZIP Code");
  try {
    const d = await fetchJson(
        "https://api.zippopotam.us/us/" + encodeURIComponent(z),
      ),
      p = Array.isArray(d.places) ? d.places : [];
    if (!p.length) throw new Error("empty");
    const names = p.map((x) => String(x["place name"] || "")).filter(Boolean);
    out(
      names[0] + ", " + String(p[0]["state abbreviation"] || ""),
      "ZIP " + z + " · " + names.join("、"),
    );
  } catch (e) {
    bad(queryError(e, " ZIP Code"));
  }
};
