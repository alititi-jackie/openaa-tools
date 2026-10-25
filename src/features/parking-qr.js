import qrcode from "../lib/vendor/qrcode-generator.js";

const root = document.querySelector("[data-parking-qr]");
if (root && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const $ = (id) => document.getElementById(id);
  const copy = {
    zh: {
      intro:"免费生成专属挪车二维码。打印后放在车内，别人扫码即可联系你。",
      temporaryParking:"临时停靠，请多关照",
      phoneLabel:"你的联系电话", phoneHint:"只需输入美国 10 位电话号码，例如 212 555 0100；国家区号 +1 已默认添加。",
      languageLabel:"挪车页面语言", generate:"生成我的挪车码", parkingTitle:"扫码联系车主",
      scanPrompt:"如需挪车，请扫码联系车主", noPhonePrinted:"二维码卡片不会直接印出你的电话号码。",
      downloadPng:"下载二维码 PNG", printPdf:"打印 / 保存为 PDF", copyLink:"复制挪车链接",
      printHint:"打印时可在系统打印窗口选择“保存为 PDF”。建议先用手机实际扫码测试，再打印使用。",
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
      phoneLabel:"Your phone number", phoneHint:"Enter only the 10-digit US number, e.g. 212 555 0100. The +1 country code is added automatically.",
      languageLabel:"Contact page language", generate:"Create my parking QR", parkingTitle:"Scan to contact driver",
      scanPrompt:"Need this car moved? Scan to contact the driver.", noPhonePrinted:"Your phone number is not printed directly on this card.",
      downloadPng:"Download QR as PNG", printPdf:"Print / Save as PDF", copyLink:"Copy parking link",
      printHint:"Choose “Save as PDF” in your print dialog. Test the QR with your phone before printing.",
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
      phoneLabel:"Tu número de teléfono", phoneHint:"Introduce solo los 10 dígitos del número de EE. UU., por ejemplo 212 555 0100. El código +1 se añade automáticamente.",
      languageLabel:"Idioma de la página", generate:"Crear mi código QR", parkingTitle:"Escanea para contactar al conductor",
      scanPrompt:"¿Necesitas mover este auto? Escanea para contactar al conductor.", noPhonePrinted:"Tu número no se imprime directamente en esta tarjeta.",
      downloadPng:"Descargar QR en PNG", printPdf:"Imprimir / Guardar como PDF", copyLink:"Copiar enlace",
      printHint:"En la ventana de impresión, elige “Guardar como PDF”. Prueba el QR con tu teléfono antes de imprimirlo.",
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
  const cleanPhone = (value) => {
    const normalized = String(value || "").trim().replace(/[\s().-]/g, "");
    if (!/^\+?\d{7,15}$/.test(normalized)) return null;
    return normalized;
  };
  const phoneForCreation = (value) => {
    const digits = digitsOnly(value);
    const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    return /^\d{10}$/.test(national) ? "+1" + national : null;
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
    const plateRadius = total * 0.115;
    const logoRadius = total * 0.088;
    const logoTextSize = total * 0.125;
    return { qr, count, margin, total, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" role="img" aria-label="OpenAA parking contact QR code"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#111827"/><circle cx="${center}" cy="${center}" r="${plateRadius}" fill="#fff"/><circle cx="${center}" cy="${center}" r="${logoRadius}" fill="#111"/><text x="${center}" y="${center + logoTextSize * 0.34}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${logoTextSize}" font-weight="900" letter-spacing="-1" fill="#fff">AA</text></svg>` };
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
    } catch {
      showError("二维码生成失败，请刷新页面后重试。");
    }
  };
  const showContact = () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const raw = params.get("phone") || "";
    const phone = cleanPhone(raw);
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
  $("parking-phone").addEventListener("keydown", (event) => { if (event.key === "Enter") create(); });
  $("parking-download").addEventListener("click", () => {
    if (!currentSvg) return;
    const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 1200, 1200);
      ctx.drawImage(img, 0, 0, 1200, 1200);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        const pngUrl = URL.createObjectURL(png);
        a.href = pngUrl; a.download = "openaa-parking-qr.png"; a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  });
  $("parking-print").addEventListener("click", () => {
    if (!currentSvg) create();
    if (currentSvg) window.print();
  });
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
