// Minimal XLSX reader: unzips the workbook (stored or deflated entries) and
// resolves shared/inline strings and date-formatted serials, returning each
// sheet as rows of string | number | null. Deliberately small: it only needs
// to read ledger workbooks produced by Excel, ExcelJS or this site's writer.
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|lt|gt|amp|quot|apos);/g, (all, body) => {
    if (body === "lt") return "<";
    if (body === "gt") return ">";
    if (body === "amp") return "&";
    if (body === "quot") return '"';
    if (body === "apos") return "'";
    const code = body.startsWith("#x")
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : all;
  });
}
async function inflate(data) {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzip(bytes) {
  check(bytes.byteLength <= 16 * 1024 * 1024, "文件超过 16 MB");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.byteLength - 22;
  const floor = Math.max(0, bytes.byteLength - 65557);
  while (end >= floor && view.getUint32(end, true) !== 0x06054b50) end--;
  check(end >= floor, "无效的 Excel 文件");
  const count = view.getUint16(end + 10, true);
  check(count <= 512, "Excel 文件项目过多");
  let cursor = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map();
  let total = 0;
  for (let i = 0; i < count; i++) {
    check(
      cursor + 46 <= end && view.getUint32(cursor, true) === 0x02014b50,
      "Excel 文件结构无效",
    );
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const rawSize = view.getUint32(cursor + 24, true);
    total += rawSize;
    check(total <= 64 * 1024 * 1024, "Excel 解压后过大，请拆分导入");
    const nameLength = view.getUint16(cursor + 28, true);
    const name = decoder.decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLength),
    );
    const local = view.getUint32(cursor + 42, true);
    cursor +=
      46 +
      nameLength +
      view.getUint16(cursor + 30, true) +
      view.getUint16(cursor + 32, true);
    if (!name.startsWith("xl/") || name.endsWith("/")) continue;
    check(view.getUint32(local, true) === 0x04034b50, "Excel 文件结构无效");
    const start =
      local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    entries.set(name, method === 0 ? data : await inflate(data));
  }
  return entries;
}
function tagAttrs(tag) {
  const attrs = {};
  for (const m of tag.matchAll(/([\w:.-]+)="([^"]*)"/g))
    attrs[m[1]] = decodeEntities(m[2]);
  return attrs;
}
const BUILTIN_DATE_FMTS = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
  45, 46, 47, 50, 57,
]);
function dateStyleIndexes(stylesXml) {
  const result = new Set();
  if (!stylesXml) return result;
  const custom = new Map();
  for (const m of stylesXml.matchAll(/<numFmt[^>]*>/g)) {
    const attrs = tagAttrs(m[0]);
    if (attrs.numFmtId && attrs.formatCode)
      custom.set(Number(attrs.numFmtId), attrs.formatCode);
  }
  const block = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? "";
  const xfs = [...block.matchAll(/<xf[^>]*>/g)].map((m) => tagAttrs(m[0]));
  xfs.forEach((xf, i) => {
    const id = Number(xf.numFmtId ?? 0);
    const format = custom.get(id) ?? "";
    if (
      BUILTIN_DATE_FMTS.has(id) ||
      /y{2,4}/.test(format) ||
      /^[md][/\-.]/.test(format)
    )
      result.add(i);
  });
  return result;
}
function serialToDate(serial) {
  const days = Math.floor(serial);
  const adjusted = days > 59 ? days - 1 : days; // Excel's fake 1900-02-29
  const date = new Date(Date.UTC(1899, 11, 30) + adjusted * 86400000);
  return date.toISOString().slice(0, 10);
}
function parseSheet(xml, shared, dateStyles) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const body = rowMatch[1] ?? "";
    const cells = [];
    for (const cellMatch of body.matchAll(
      /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const attrs = tagAttrs(cellMatch[1]);
      const inner = cellMatch[2] ?? "";
      const ref = attrs.r ?? "";
      const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "";
      let col = 0;
      for (const ch of letters) col = col * 26 + (ch.charCodeAt(0) - 64);
      const index = letters ? col - 1 : cells.length;
      const rawV = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = null;
      if (attrs.t === "inlineStr" || inner.includes("<is>")) {
        value = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((m) => decodeEntities(m[1]))
          .join("");
      } else if (rawV != null) {
        if (attrs.t === "s") value = shared[Number(rawV)] ?? null;
        else if (attrs.t === "str" || attrs.t === "e") value = decodeEntities(rawV);
        else if (attrs.t === "b") value = rawV === "1" ? "TRUE" : "FALSE";
        else {
          const n = Number(rawV);
          value = Number.isFinite(n) ? n : rawV;
          if (
            typeof value === "number" &&
            attrs.s != null &&
            dateStyles.has(Number(attrs.s))
          )
            value = serialToDate(value);
        }
      }
      while (cells.length < index) cells.push(null);
      cells[index] = value;
    }
    rows.push(cells);
  }
  return rows;
}
export async function readXlsxSheets(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const entries = await unzip(bytes);
  const decoder = new TextDecoder();
  const read = (name) =>
    entries.has(name) ? decoder.decode(entries.get(name)) : "";
  const shared = [];
  for (const m of read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g))
    shared.push(
      [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((t) => decodeEntities(t[1]))
        .join(""),
    );
  const rels = new Map();
  for (const m of read("xl/_rels/workbook.xml.rels").matchAll(
    /<Relationship[^>]*>/g,
  )) {
    const attrs = tagAttrs(m[0]);
    if (attrs.Id && attrs.Target) rels.set(attrs.Id, attrs.Target);
  }
  const dateStyles = dateStyleIndexes(read("xl/styles.xml"));
  const sheets = new Map();
  for (const m of read("xl/workbook.xml").matchAll(/<sheet[^>]*>/g)) {
    const attrs = tagAttrs(m[0]);
    const target = rels.get(attrs["r:id"]);
    if (!attrs.name || !target) continue;
    const path = target.startsWith("xl/")
      ? target
      : "xl/" + target.replace(/^\//, "");
    sheets.set(decodeEntities(attrs.name), parseSheet(read(path), shared, dateStyles));
  }
  check(sheets.size > 0, "无效的 Excel 文件");
  return sheets;
}
