import qrcode from "../lib/vendor/qrcode-generator.js";

const root = document.querySelector("[data-parking-qr]");
if (root && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const $ = (id) => document.getElementById(id);
  const copy = {
    zh: {
      intro:"免费生成专属挪车二维码。打印后放在车内，别人扫码即可联系你。",
      temporaryParking:"临时停靠，请多关照",
      phoneLabel:"你的联系电话", phoneHint:"只需输入美国 10 位电话号码，例如 212 555 0100；国家区号 +1 已默认添加。", showPhone:"在卡片上显示手机号",
      languageLabel:"挪车页面语言", generate:"生成我的挪车码", parkingTitle:"扫码联系车主",
      scanPrompt:"如需挪车，请扫码联系车主", noPhonePrinted:"二维码卡片不会直接印出你的电话号码。",
      downloadPng:"下载完整卡片 PNG", pdfSingle:"下载 PDF（A4 单张版）", pdfDouble:"下载 PDF（A4 双张版）", copyLink:"复制挪车链接",
      printHint:"PNG 和 PDF 都会包含完整卡片及 OpenAA 标志；建议下载后先用手机扫码测试。",
      howTitle:"怎么使用？", step1:"输入你的电话号码并生成二维码。", step2:"下载二维码，或打印 / 保存为 PDF。",
      step3:"把卡片放在车内容易看到的位置。", privacyTitle:"隐私说明",
      privacyText:"号码只写入二维码链接的 # 后面，由扫码者的浏览器读取；不会上传或保存到本工具服务器。但任何拿到二维码的人都可能读取号码，请只使用你愿意公开的联系电话。",
      contactTitle:"挪车联系", contactIntro:"如果这辆车挡住了你的通行，请礼貌联系车主。",
      call:"拨打电话", sms:"发送短信", contactPrivacy:"此页面从二维码链接中读取号码，不会把号码保存到服务器。",
      makeYourOwn:"免费制作我的挪车码", invalid:"请输入有效电话号码（至少 7 位数字）。",
      copySuccess:"挪车链接已复制。", copyFallback:"请复制此链接：", missing:"此二维码链接中没有有效电话号码。"
    },
    en: {
      intro:"Create a free parking QR code. Print it and place it inside your car so people can contact you.",
      temporaryParking:"Temporary parking. Thank you for your understanding.",
      phoneLabel:"Your phone number", phoneHint:"Enter only the 10-digit US number, e.g. 212 555 0100. The +1 country code is added automatically.", showPhone:"Print my phone number on the card",
      languageLabel:"Contact page language", generate:"Create my parking QR", parkingTitle:"Scan to contact driver",
      scanPrompt:"Need this car moved? Scan to contact the driver.", noPhonePrinted:"Your phone number is not printed directly on this card.",
      downloadPng:"Download full card PNG", pdfSingle:"Download PDF (A4, 1 card)", pdfDouble:"Download PDF (A4, 2 cards)", copyLink:"Copy parking link",
      printHint:"PNG and PDF include the complete card and OpenAA logo. Test the QR with your phone after downloading.",
      howTitle:"How it works", step1:"Enter your phone number and generate the QR code.", step2:"Download the QR or print / save it as a PDF.",
      step3:"Place the card somewhere visible inside your car.", privacyTitle:"Privacy",
      privacyText:"Your number is stored after the # in the QR link and read by the visitor’s browser. It is not uploaded to or stored on our server. Anyone with the QR may be able to read the number, so use a number you are comfortable sharing.",
      contactTitle:"Contact the driver", contactIntro:"If this vehicle is blocking your way, please contact the driver politely.",
      call:"Call / Llamar / 拨打电话", sms:"Text / Mensaje / 发送短信", contactPrivacy:"This page reads the number from the QR link and does not save it to a server.",
      makeYourOwn:"Create your free parking QR", invalid:"Enter a valid phone number with at least 7 digits.",
      copySuccess:"Parking link copied.", copyFallback:"Copy this link:", missing:"No valid phone number was found in this QR link."
    },
    es: {
      intro:"Crea gratis un código QR para estacionamiento. Imprímelo y colócalo dentro del auto para que puedan contactarte.",
      temporaryParking:"Estacionamiento temporal. Gracias por su comprensión.",
      phoneLabel:"Tu número de teléfono", phoneHint:"Introduce solo los 10 dígitos del número de EE. UU., por ejemplo 212 555 0100. El código +1 se añade automáticamente.", showPhone:"Imprimir mi número en la tarjeta",
      languageLabel:"Idioma de la página", generate:"Crear mi código QR", parkingTitle:"Escanea para contactar al conductor",
      scanPrompt:"¿Necesitas mover este auto? Escanea para contactar al conductor.", noPhonePrinted:"Tu número no se imprime directamente en esta tarjeta.",
      downloadPng:"Descargar tarjeta completa en PNG", pdfSingle:"Descargar PDF (A4, 1 tarjeta)", pdfDouble:"Descargar PDF (A4, 2 tarjetas)", copyLink:"Copiar enlace",
      printHint:"PNG y PDF incluyen la tarjeta completa y el logotipo OpenAA. Prueba el QR con tu teléfono después de descargarlo.",
      howTitle:"Cómo funciona", step1:"Introduce tu número y genera el código QR.", step2:"Descarga el QR o imprímelo / guárdalo como PDF.",
      step3:"Coloca la tarjeta en un lugar visible dentro del auto.", privacyTitle:"Privacidad",
      privacyText:"El número se incluye después del símbolo # en el enlace y lo lee el navegador del visitante. No se sube ni se guarda en nuestro servidor. Cualquier persona con el QR podría leer el número; usa solo uno que aceptes compartir.",
      contactTitle:"Contactar al conductor", contactIntro:"Si este vehículo bloquea tu paso, comunícate con el conductor con respeto.",
      call:"Llamar", sms:"Enviar mensaje", contactPrivacy:"Esta página lee el número del enlace QR y no lo guarda en un servidor.",
      makeYourOwn:"Crea tu propio QR gratis", invalid:"Introduce un número válido con al menos 7 dígitos.",
      copySuccess:"Enlace copiado.", copyFallback:"Copia este enlace:", missing:"Este enlace QR no contiene un número válido."
    }
  };
  const detectLanguage = () => {
    try {
      const saved = localStorage.getItem("openaa_parking_qr_lang");
      if (saved && copy[saved]) return saved;
    } catch {}
    const lang = (navigator.language || "").toLowerCase();
    return lang.startsWith("es") ? "es" : lang.startsWith("en") ? "en" : "zh";
  };
  let language = detectLanguage();
  const setLanguage = (next) => {
    language = copy[next] ? next : "zh";
    const dictionary = copy[language];
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (dictionary[key]) node.textContent = dictionary[key];
    });
    root.querySelectorAll("[data-parking-language-select]").forEach((select) => { select.value = language; });
    try { localStorage.setItem("openaa_parking_qr_lang", language); } catch {}
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  };
  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
  const formatUsInput = (value) => {
    let digits = digitsOnly(value);
    if (digits.startsWith("1") && digits.length === 11) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length > 6) return digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
    if (digits.length > 3) return digits.slice(0, 3) + " " + digits.slice(3);
    return digits;
  };
  const phoneForCreation = (value) => {
    const digits = digitsOnly(value);
    return /^\d{10}$/.test(digits) ? "+1" + digits : null;
  };
  const formatPhoneDisplay = (phone) => {
    const digits = digitsOnly(phone);
    if (digits.length === 11 && digits.startsWith("1")) {
      return "+1 " + digits.slice(1, 4) + " " + digits.slice(4, 7) + " " + digits.slice(7);
    }
    return phone;
  };
    const createQrSvg = (payload, size = 640) => {
    const qr = qrcode(0, "H");
    qr.addData(payload, "Byte");
    qr.make();
    const count = qr.getModuleCount();
    const margin = 4;
    const total = count + margin * 2;
    let path = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) path += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
    const center = total / 2;
    const logoSize = total * 0.205;
    const logoX = center - logoSize / 2;
    const logoY = center - logoSize / 2;
    const logoUrl = new URL("/assets/openaa-logo.png", window.location.origin).href;
    return { qr, count, margin, total, svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" role="img" aria-label="OpenAA parking contact QR code"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#111827"/><rect x="${logoX - total * 0.012}" y="${logoY - total * 0.012}" width="${logoSize + total * 0.024}" height="${logoSize + total * 0.024}" rx="${total * 0.035}" fill="#fff"/><image href="${logoUrl}" xlink:href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/></svg>` };
  };
  let currentPayload = "";
  let currentSvg = "";
  const error = $("parking-error");
  const showError = (message) => { error.textContent = message; error.hidden = false; };
  const create = () => {
    error.hidden = true;
    const phone = phoneForCreation($("parking-phone").value);
    if (!phone) { showError(copy[language].invalid); return; }
    const url = new URL("/tools/parking-qr/", window.location.origin);
    url.hash = "phone=" + encodeURIComponent(phone);
    currentPayload = url.href;
    try {
      const generated = createQrSvg(currentPayload);
      currentSvg = generated.svg;
      $("parking-qr-image").innerHTML = currentSvg;
      $("parking-preview").hidden = false;
      $("parking-preview").scrollIntoView({ behavior: "smooth", block: "nearest" });
      $("parking-print-card").hidden = true;
      updateCardPreview(currentPayload);
    } catch {
      showError("二维码生成失败，请刷新页面后重试。");
    }
  };
  const updateCardPreview = async (payload) => {
    try {
      const canvas = await renderCardCanvas();
      if (payload !== currentPayload) return;
      const img = $("parking-card-img");
      img.src = canvas.toDataURL("image/png");
      img.hidden = false;
    } catch {
      if (payload === currentPayload) $("parking-print-card").hidden = false;
    }
  };
  const showContact = () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const raw = params.get("phone") || "";
    const phone = /^\+1\d{10}$/.test(raw) ? raw : null;
    if (!phone) {
      $("parking-contact-number").textContent = copy[language].missing;
      $("parking-call").hidden = true;
      $("parking-sms").hidden = true;
    } else {
      const display = formatPhoneDisplay(phone);
      $("parking-contact-number").textContent = display;
      $("parking-call").href = "tel:" + phone;
      $("parking-sms").href = "sms:" + phone;
      $("parking-call").hidden = false;
      $("parking-sms").hidden = false;
    }
    $("parking-builder").hidden = true;
    $("parking-contact").hidden = false;
    document.body.classList.add("parking-contact-mode");
    document.title = "Parking Contact | OpenAA";
  };
  root.querySelectorAll("[data-parking-language-select]").forEach((select) => select.addEventListener("change", (event) => {
    setLanguage(event.target.value);
    if (window.location.hash.startsWith("#phone=")) showContact();
  }));
  $("parking-phone").addEventListener("input", (event) => {
    const input = event.target;
    const start = input.selectionStart;
    const before = input.value.slice(0, start);
    input.value = formatUsInput(input.value);
    const nextPosition = formatUsInput(before).length;
    input.setSelectionRange(nextPosition, nextPosition);
  });
  $("parking-generate").addEventListener("click", create);
  $("parking-show-phone").addEventListener("change", () => { if (currentSvg) updateCardPreview(currentPayload); });
  $("parking-phone").addEventListener("keydown", (event) => { if (event.key === "Enter") create(); });
  const renderCardCanvas = async () => {
    if (!currentSvg) throw new Error("Generate a QR code first.");
    const width = 1200;
    let phoneDisplay = "";
    if ($("parking-show-phone").checked) {
      const raw = new URLSearchParams(new URL(currentPayload).hash.slice(1)).get("phone") || "";
      if (/^\+1\d{10}$/.test(raw)) phoneDisplay = formatPhoneDisplay(raw);
    }
    const height = phoneDisplay ? 1480 : 1400;
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(16, 16, 1168, height - 32, 34); ctx.stroke();
    const fit = (text, weight, size, maxWidth) => {
      let s = size;
      ctx.font = weight + " " + s + "px Arial, sans-serif";
      while (s > 10 && ctx.measureText(text).width > maxWidth) { s -= 1; ctx.font = weight + " " + s + "px Arial, sans-serif"; }
      return weight + " " + s + "px Arial, sans-serif";
    };
    const wrapped = (text, y, font, maxWidth, lineHeight) => {
      ctx.font = font; ctx.fillStyle = "#0f172a"; ctx.textAlign = "center";
      let line = ""; const lines = [];
      for (const char of Array.from(text)) {
        if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; }
        else line += char;
      }
      if (line) lines.push(line);
      lines.forEach((value, i) => ctx.fillText(value, width / 2, y + i * lineHeight));
      return y + lines.length * lineHeight;
    };
    let y = 98;
    y = wrapped("Temporary parking. Thank you for your understanding.", y, fit("Temporary parking. Thank you for your understanding.", "700", 40, 1020), 1020, 56) + 18;
    y = wrapped("Estacionamiento temporal. Gracias por su comprensión.", y, fit("Estacionamiento temporal. Gracias por su comprensión.", "600", 34, 1020), 1020, 50) + 14;
    y = wrapped("临时停靠，请多关照", y, fit("临时停靠，请多关照", "700", 46, 1020), 1020, 58) + 30;
    const qrSize = 720, qrX = (width - qrSize) / 2, qrY = y;
    const cleanSvg = currentSvg.replace(/<image\b[^>]*\/>/g, "");
    const svgUrl = URL.createObjectURL(new Blob([cleanSvg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const qrImage = new Image();
      await new Promise((resolve, reject) => { qrImage.onload = resolve; qrImage.onerror = reject; qrImage.src = svgUrl; });
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    } finally { URL.revokeObjectURL(svgUrl); }
    const logo = new Image(); logo.src = new URL("/assets/openaa-logo.png", window.location.origin).href;
    await new Promise((resolve, reject) => { logo.onload = resolve; logo.onerror = reject; });
    const logoSize = 130;
    ctx.fillStyle = "#fff"; ctx.fillRect(width/2-logoSize/2-10, qrY+qrSize/2-logoSize/2-10, logoSize+20, logoSize+20);
    ctx.drawImage(logo, width/2-logoSize/2, qrY+qrSize/2-logoSize/2, logoSize, logoSize);
    y = qrY + qrSize + 54;
    if (phoneDisplay) {
      ctx.font = "700 46px Arial, sans-serif"; ctx.fillStyle = "#0f172a"; ctx.textAlign = "center";
      ctx.fillText(phoneDisplay, width / 2, y);
      y += 78;
    }
    y = wrapped("Need this car moved? Scan to contact the driver.", y, fit("Need this car moved? Scan to contact the driver.", "700", 38, 1040), 1040, 52) + 12;
    y = wrapped("¿Necesitas mover este auto? Escanea para contactar al conductor.", y, fit("¿Necesitas mover este auto? Escanea para contactar al conductor.", "600", 33, 1040), 1040, 48) + 12;
    y = wrapped("如需挪车，请扫码联系车主", y, fit("如需挪车，请扫码联系车主", "700", 44, 1040), 1040, 56) + 26;
    ctx.font = "600 28px Arial, sans-serif"; ctx.fillStyle = "#64748b"; ctx.textAlign = "center";
    ctx.fillText("OpenAA.com", width / 2, y + 16);
    return canvas;
  };
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("parking-download").addEventListener("click", async () => {
    try { (await renderCardCanvas()).toBlob(blob => { if (blob) downloadBlob(blob, "openaa-parking-card.png"); }, "image/png"); }
    catch { showError("卡片导出失败，请刷新页面后重试。"); }
  });
  const makePdf = async (copies) => {
    const originalCanvas = await renderCardCanvas();
    // The double-card PDF uses the complete original card rotated 90 degrees,
    // with two identical landscape cards stacked on a portrait A4 page.
    let canvas = originalCanvas;
    if (copies === 2) {
      canvas = document.createElement("canvas");
      canvas.width = originalCanvas.height;
      canvas.height = originalCanvas.width;
      const rotateCtx = canvas.getContext("2d");
      rotateCtx.fillStyle = "#fff";
      rotateCtx.fillRect(0, 0, canvas.width, canvas.height);
      rotateCtx.translate(canvas.width, 0);
      rotateCtx.rotate(Math.PI / 2);
      rotateCtx.drawImage(originalCanvas, 0, 0);
    }
    const imageWidth = canvas.width, imageHeight = canvas.height;
    const jpeg = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.94).split(",")[1]), c => c.charCodeAt(0));
    const pageW = 595.28, pageH = 841.89, margin = 30;
    let cardW, cardH, positions;
    if (copies === 1) {
      cardW = Math.min(pageW - 2 * margin, (pageH - 2 * margin) * imageWidth / imageHeight);
      cardH = cardW * imageHeight / imageWidth;
      positions = [{ x: (pageW - cardW) / 2, y: (pageH - cardH) / 2 }];
    } else {
      cardH = (pageH - 3 * margin) / 2;
      cardW = cardH * imageWidth / imageHeight;
      const x = (pageW - cardW) / 2;
      const halfGap = (pageH / 2 - cardH) / 2;
      positions = [{ x, y: pageH / 2 + halfGap }, { x, y: halfGap }];
    }
    const enc = new TextEncoder(), objects = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push("");
    objects.push("<< /Type /XObject /Subtype /Image /Width " + imageWidth + " /Height " + imageHeight + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n");
    const imageObjectId = 3;
    const draw = positions.map(p => "q\n" + cardW.toFixed(2) + " 0 0 " + cardH.toFixed(2) + " " + p.x.toFixed(2) + " " + p.y.toFixed(2) + " cm\n/Im0 Do\nQ").join("\n");
    const contentId = objects.length + 1;
    objects.push("<< /Length " + enc.encode(draw).length + " >>\nstream\n" + draw + "\nendstream");
    const pageId = objects.length + 1;
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageW + " " + pageH + "] /Resources << /XObject << /Im0 " + imageObjectId + " 0 R >> >> /Contents " + contentId + " 0 R >>");
    objects[1] = "<< /Type /Pages /Kids [" + pageId + " 0 R] /Count 1 >>";
    const chunks = [enc.encode("%PDF-1.4\n%OpenAA\n")], offsets = [0]; let total = chunks[0].length;
    objects.forEach((obj, i) => {
      offsets.push(total);
      let bytes;
      if (i + 1 === imageObjectId) {
        const head = enc.encode((i + 1) + " 0 obj\n" + obj), tail = enc.encode("\nendstream\nendobj\n");
        bytes = new Uint8Array(head.length + jpeg.length + tail.length);
        bytes.set(head); bytes.set(jpeg, head.length); bytes.set(tail, head.length + jpeg.length);
      } else bytes = enc.encode((i + 1) + " 0 obj\n" + obj + "\nendobj\n");
      chunks.push(bytes); total += bytes.length;
    });
    const xrefAt = total;
    let xref = "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    offsets.slice(1).forEach(n => xref += String(n).padStart(10, "0") + " 00000 n \n");
    xref += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefAt + "\n%%EOF";
    chunks.push(enc.encode(xref));
    downloadBlob(new Blob(chunks, { type: "application/pdf" }), copies === 1 ? "openaa-parking-card-a4-single.pdf" : "openaa-parking-card-a4-double.pdf");
  };
  $("parking-pdf-single").addEventListener("click", async () => { try { await makePdf(1); } catch { showError("PDF 导出失败，请刷新页面后重试。"); } });
  $("parking-pdf-double").addEventListener("click", async () => { try { await makePdf(2); } catch { showError("PDF 导出失败，请刷新页面后重试。"); } });
  $("parking-copy").addEventListener("click", async () => {
    if (!currentPayload) return;
    try {
      await navigator.clipboard.writeText(currentPayload);
      alert(copy[language].copySuccess);
    } catch {
      window.prompt(copy[language].copyFallback, currentPayload);
    }
  });
  setLanguage(language);
  const syncContactRoute = () => {
    if (window.location.hash.startsWith("#phone=")) showContact();
    else {
      $("parking-contact").hidden = true;
      $("parking-builder").hidden = false;
      document.body.classList.remove("parking-contact-mode");
      document.title = "扫码挪车码｜OpenAA";
    }
  };
  window.addEventListener("hashchange", syncContactRoute);
  if (window.location.hash.startsWith("#phone=")) showContact();
}
