// Spreadsheet writer adapted from openaa-tools/src/features/expense-record.js.
function escapeXml(value) {
  return String(value ?? "").replace(
    /[<>&"']/g,
    (ch) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[ch],
  );
}
function utf8Bytes(str) {
  return new TextEncoder().encode(str);
}
const EXPENSE_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = EXPENSE_CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function writeU16(arr, value) {
  arr.push(value & 255, (value >>> 8) & 255);
}
function writeU32(arr, value) {
  arr.push(
    value & 255,
    (value >>> 8) & 255,
    (value >>> 16) & 255,
    (value >>> 24) & 255,
  );
}
function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}
function makeZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach((file) => {
    const nameBytes = utf8Bytes(file.name);
    const dataBytes = utf8Bytes(file.content);
    const crc = crc32(dataBytes);
    const local = [];
    writeU32(local, 0x04034b50);
    writeU16(local, 20);
    writeU16(local, 0x0800);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU32(local, crc);
    writeU32(local, dataBytes.length);
    writeU32(local, dataBytes.length);
    writeU16(local, nameBytes.length);
    writeU16(local, 0);
    const localBytes = concatBytes([
      new Uint8Array(local),
      nameBytes,
      dataBytes,
    ]);
    localParts.push(localBytes);
    const central = [];
    writeU32(central, 0x02014b50);
    writeU16(central, 20);
    writeU16(central, 20);
    writeU16(central, 0x0800);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, crc);
    writeU32(central, dataBytes.length);
    writeU32(central, dataBytes.length);
    writeU16(central, nameBytes.length);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, 0);
    writeU32(central, offset);
    centralParts.push(concatBytes([new Uint8Array(central), nameBytes]));
    offset += localBytes.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = [];
  writeU32(end, 0x06054b50);
  writeU16(end, 0);
  writeU16(end, 0);
  writeU16(end, files.length);
  writeU16(end, files.length);
  writeU32(end, centralSize);
  writeU32(end, offset);
  writeU16(end, 0);
  return concatBytes([...localParts, ...centralParts, new Uint8Array(end)]);
}
function excelCol(index) {
  let col = "";
  index += 1;
  while (index > 0) {
    const mod = (index - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    index = Math.floor((index - mod) / 26);
  }
  return col;
}
function cellXml(cell, r, c) {
  const obj =
    cell && typeof cell === "object" && !Array.isArray(cell)
      ? cell
      : { v: cell };
  const v = obj.v ?? "";
  const style = obj.s ? ' s="' + obj.s + '"' : "";
  const ref = excelCol(c) + r;
  const isNumber = typeof v === "number" && isFinite(v);
  if (v === "") return '<c r="' + ref + '"' + style + "/>";
  return (
    '<c r="' +
    ref +
    '"' +
    style +
    ' t="' +
    (isNumber ? "n" : "inlineStr") +
    '">' +
    (isNumber ? "<v>" + v + "</v>" : "<is><t>" + escapeXml(v) + "</t></is>") +
    "</c>"
  );
}
function sheetXmlAdvanced(rows) {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<cols><col min="1" max="1" width="15" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="24" customWidth="1"/></cols>' +
    "<sheetData>" +
    rows
      .map(
        (row, rIdx) =>
          '<row r="' +
          (rIdx + 1) +
          '">' +
          row.map((cell, cIdx) => cellXml(cell, rIdx + 1, cIdx)).join("") +
          "</row>",
      )
      .join("") +
    "</sheetData></worksheet>"
  );
}
function xlsxStylesXml() {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="16"/><name val="Calibri"/><color rgb="FF1D4ED8"/></font><font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF334155"/></font><font><b/><sz val="15"/><name val="Calibri"/><color rgb="FFDC2626"/></font></fonts>' +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="right"/></xf></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>"
  );
}
export function makeWorkbook(sheets) {
  const ns = "http://schemas.openxmlformats.org";
  const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.";
  const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const parts = sheets.map(([name, rows], i) => ({
    name,
    rows,
    id: i + 1,
    path: "worksheets/sheet" + (i + 1) + ".xml",
  }));
  function relationships(items) {
    return (
      header +
      '<Relationships xmlns="' +
      ns +
      '/package/2006/relationships">' +
      items
        .map(
          ([id, type, path]) =>
            '<Relationship Id="rId' +
            id +
            '" Type="' +
            ns +
            "/officeDocument/2006/relationships/" +
            type +
            '" Target="' +
            path +
            '"/>',
        )
        .join("") +
      "</Relationships>"
    );
  }
  const types = [
    ["workbook.xml", "sheet.main"],
    ["styles.xml", "styles"],
    ...parts.map((p) => [p.path, "worksheet"]),
  ];
  const files = [
    {
      name: "[Content_Types].xml",
      content:
        header +
        '<Types xmlns="' +
        ns +
        '/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        types
          .map(
            ([path, type]) =>
              '<Override PartName="/xl/' +
              path +
              '" ContentType="' +
              mime +
              type +
              '+xml"/>',
          )
          .join("") +
        "</Types>",
    },
    {
      name: "_rels/.rels",
      content: relationships([[1, "officeDocument", "xl/workbook.xml"]]),
    },
    {
      name: "xl/workbook.xml",
      content:
        header +
        '<workbook xmlns="' +
        ns +
        '/spreadsheetml/2006/main" xmlns:r="' +
        ns +
        '/officeDocument/2006/relationships"><sheets>' +
        parts
          .map(
            (p) =>
              '<sheet name="' +
              escapeXml(p.name) +
              '" sheetId="' +
              p.id +
              '" r:id="rId' +
              p.id +
              '"/>',
          )
          .join("") +
        "</sheets></workbook>",
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: relationships([
        ...parts.map((p) => [p.id, "worksheet", p.path]),
        [parts.length + 1, "styles", "styles.xml"],
      ]),
    },
    { name: "xl/styles.xml", content: xlsxStylesXml() },
    ...parts.map((p) => ({
      name: "xl/" + p.path,
      content: sheetXmlAdvanced(p.rows),
    })),
  ];
  return new Blob([makeZip(files)], { type: mime + "sheet" });
}
