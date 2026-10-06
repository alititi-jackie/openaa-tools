import qrcode from "../../vendor/qrcode-generator.js";
import { $, bad } from "../standard.js";

/* 二维码生成器：输入文字/链接 ->  canvas 绘制 -> 真 PNG 下载
 * QR 矩阵由 vendored 的 qrcode-generator（MIT）计算，PNG 由 canvas 导出。
 */
export const calculate = () => {
  const text = ($("qr-text")?.value || "").trim();
  const result = $("result");
  if (!text) return bad("请输入要生成二维码的文字或链接");
  if (text.length > 1200) return bad("内容过长，请控制在 1200 字以内");
  try {
    const qr = qrcode(0, "M"); // 0 = 自动选择版本
    qr.addData(text);
    qr.make();
    const target = Math.max(240, Math.min(1200, Number($("qr-size")?.value) || 600));
    const count = qr.getModuleCount();
    const margin = 4;
    const scale = Math.max(2, Math.floor(target / (count + margin * 2)));
    const px = (count + margin * 2) * scale;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
    const url = canvas.toDataURL("image/png");
    result.replaceChildren();
    const img = document.createElement("img");
    img.src = url;
    img.alt = "生成的二维码";
    const show = Math.min(px, 300);
    img.width = show;
    img.height = show;
    img.style.cssText =
      "image-rendering:pixelated;border:1px solid #e5e7eb;border-radius:12px;background:#fff;display:block;margin:0 auto";
    const dl = document.createElement("a");
    dl.href = url;
    dl.download = "qrcode.png";
    dl.className = "btn";
    dl.style.cssText = "display:inline-block;margin-top:14px;text-decoration:none";
    dl.textContent = "下载 PNG 图片";
    const wrap = document.createElement("div");
    wrap.style.textAlign = "center";
    wrap.append(img, dl);
    const tip = document.createElement("p");
    tip.className = "note";
    tip.style.marginTop = "10px";
    tip.textContent = "长按/右键图片也可以另存。二维码在本地生成，内容不会上传。";
    wrap.append(tip);
    result.append(wrap);
  } catch {
    bad("生成失败，请缩短内容后重试");
  }
};
