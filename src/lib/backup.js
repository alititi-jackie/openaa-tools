const MAX_RECORDS = 10000;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function normalizeBackup(data, kind) {
  const rows = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(rows) || rows.length > MAX_RECORDS)
    throw new Error("记录必须是数组，最多可保存 10000 条。");
  if (!["expense", "fx"].includes(kind)) throw new Error("未知的记录类型。");
  const ids = new Set();
  return rows.map((r, index) => {
    const fail = () => {
      throw new Error(`第 ${index + 1} 条记录格式不正确，未导入任何数据。`);
    };
    if (!r || typeof r !== "object" || Array.isArray(r) || !validDate(r.date))
      return fail();
    const id = r.id == null ? crypto.randomUUID() : String(r.id);
    if (
      !id ||
      id.length > 200 ||
      ids.has(id) ||
      (r.note != null && typeof r.note !== "string") ||
      (r.note?.length || 0) > 10000
    )
      return fail();
    ids.add(id);
    const base = {
      id,
      date: r.date,
      note: r.note || "",
      createdAt:
        typeof r.createdAt === "string"
          ? r.createdAt
          : new Date().toISOString(),
    };
    const number = (v) =>
      typeof v === "number" || (typeof v === "string" && v.trim())
        ? Number(v)
        : NaN;
    if (kind === "expense") {
      const amount = number(r.amount);
      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        !["现金", "银行卡"].includes(r.payment) ||
        !["购物", "餐饮", "交通", "房屋", "账单", "其它"].includes(r.category)
      )
        return fail();
      return { ...base, amount, payment: r.payment, category: r.category };
    }
    const usd = number(r.usd),
      rate = number(r.rate);
    if (
      !Number.isFinite(usd) ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isFinite(usd * rate)
    )
      return fail();
    return {
      ...base,
      usd,
      rate,
      type: r.type === "subtract" || usd < 0 ? "subtract" : "add",
    };
  });
}
export function recordKind(key) {
  return key === "openaa_expense_records_v1"
    ? "expense"
    : key === "openaa_usd_rmb_records_v1"
      ? "fx"
      : null;
}
// Save, merge and export use the same normalized envelope and byte limit.
export function serializeBackup(rows, kind) {
  const records = normalizeBackup(rows, kind);
  const text = JSON.stringify({
    app:
      kind === "expense"
        ? "OpenAA Expense Records"
        : "OpenAA USD RMB Rate Records",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  });
  if (new Blob([text]).size > MAX_BACKUP_BYTES)
    throw new Error("数据超过 5 MB，请先导出备份并整理记录后再保存。");
  return text;
}
export async function readBackupFile(file, kind) {
  if (file.size > MAX_BACKUP_BYTES) throw new Error("备份文件不能超过 5 MB。");
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("文件不是有效的 JSON 备份。");
  }
  return normalizeBackup(data, kind);
}
// Retain a single pre-import snapshot. A failed snapshot write prevents replacement.
export function saveImportedRecords(key, rows) {
  const kind = recordKind(key);
  const serialized = kind
    ? JSON.stringify(JSON.parse(serializeBackup(rows, kind)).records)
    : JSON.stringify(rows);
  const original = localStorage.getItem(key);
  const snapshotKey = key + "_before_import";
  const previousSnapshot = localStorage.getItem(snapshotKey);
  localStorage.setItem(snapshotKey, original ?? "[]");
  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    try {
      if (previousSnapshot === null) localStorage.removeItem(snapshotKey);
      else localStorage.setItem(snapshotKey, previousSnapshot);
    } catch {
      /* Preserve the original records even if snapshot rollback fails. */
    }
    throw error;
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("records-imported"));
}
export function clearRecords(key) {
  // Remove the recovery copy first; never announce success on a storage failure.
  localStorage.removeItem(key + "_before_import");
  localStorage.removeItem(key);
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("records-imported"));
}
