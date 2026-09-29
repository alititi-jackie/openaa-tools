export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function readRecords(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error("Invalid records");
    return rows;
  } catch (error) {
    alert(
      "无法读取本地记录，请先备份浏览器数据。为避免覆盖原数据，本次操作已停止。",
    );
    throw error;
  }
}
export function writeRecords(key, rows) {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch (error) {
    alert(
      "保存失败：浏览器存储不可用或空间不足。请先导出备份，不要清理现有数据。",
    );
    throw error;
  }
}
