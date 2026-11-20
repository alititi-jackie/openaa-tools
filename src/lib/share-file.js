import { showFeedback } from "./feedback.js";

export async function shareFileOrDownload(fileBlob, name, title, download) {
  if (/micromessenger/i.test(navigator.userAgent)) {
    download(fileBlob, name);
    showFeedback("微信内已尝试下载文件");
    alert(
      "微信内置浏览器通常不能直接分享文件。请检查下载结果，再到微信聊天中选择文件发送；也可以在 Safari 或 Chrome 打开本页操作。",
    );
    return;
  }

  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([fileBlob], name, { type: fileBlob.type });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title, files: [file] });
          return;
        } catch (error) {
          if (error?.name === "AbortError") return; // User cancelled sharing.
          showFeedback("直接分享失败，请改用下载文件");
          alert("当前浏览器分享文件失败，请点击“下载”后再发送文件。");
          return;
        }
      }
    } catch {
      // File sharing or canShare is unsupported: use the download fallback.
    }
  }

  download(fileBlob, name);
  showFeedback("当前浏览器不支持直接分享，已尝试下载文件");
}
