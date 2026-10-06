import { $, bad } from "../standard.js";

// 示例 chips：点击填入输入框（模块加载时绑定一次，避免行内 onclick）
document.querySelectorAll("[data-kin-example]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const input = $("kin-input");
    if (input) {
      input.value = chip.getAttribute("data-kin-example") || "";
      input.focus();
    }
  });
});

/* 亲戚关系计算器：把“爸爸的妈妈”这类称呼链换算成标准称谓。
 * 路径编码（相对“我”）：f父 m母 ob兄 yb弟 os姐 ys妹 h夫 w妻 s子 d女
 * 输入按“的”拆分后逐段转成路径并拼接，再整体查表还原为称谓。
 */
const TERM_PATH = {
  "我": "",
  "爸爸": "f", "父亲": "f", "爹": "f", "爸": "f",
  "妈妈": "m", "母亲": "m", "妈": "m",
  "哥哥": "ob", "弟弟": "yb", "姐姐": "os", "妹妹": "ys",
  "丈夫": "h", "老公": "h", "先生": "h",
  "妻子": "w", "老婆": "w", "太太": "w",
  "儿子": "s", "女儿": "d",
  "爷爷": "ff", "奶奶": "fm", "外公": "mf", "姥爷": "mf", "外婆": "mm", "姥姥": "mm",
  "孙子": "ss", "孙女": "sd", "外孙": "ds", "外孙女": "dd",
  "伯伯": "fob", "大伯": "fob", "叔叔": "fyb",
  "姑姑": "fos", "姑妈": "fos",
  "舅舅": "mob",
  "阿姨": "mos", "姨妈": "mos",
  "侄子": "obs", "侄女": "obd",
  "外甥": "oss", "外甥女": "osd",
  "岳父": "wf", "岳母": "wm", "公公": "hf", "婆婆": "hm",
};

const PATH_TERM = {
  "": "我（自己）",
  "f": "爸爸", "m": "妈妈",
  "ob": "哥哥", "yb": "弟弟", "os": "姐姐", "ys": "妹妹",
  "h": "丈夫", "w": "妻子",
  "s": "儿子", "d": "女儿",
  "ff": "爷爷", "fm": "奶奶", "mf": "外公", "mm": "外婆",
  "fff": "太爷爷", "ffm": "太奶奶", "fmf": "太爷爷", "fmm": "太奶奶",
  "mff": "太外公", "mfm": "太外婆", "mmf": "太外公", "mmm": "太外婆",
  "ss": "孙子", "sd": "孙女", "ds": "外孙", "dd": "外孙女",
  "sss": "曾孙", "ssd": "曾孙女", "sds": "曾外孙", "sdd": "曾外孙女",
  "dss": "曾外孙", "dsd": "曾外孙女", "dds": "曾外孙", "ddd": "曾外孙女",
  "fob": "伯伯", "fyb": "叔叔", "fos": "姑姑", "fys": "姑姑",
  "mob": "舅舅", "myb": "舅舅", "mos": "姨妈", "mys": "阿姨",
  "hf": "公公", "hm": "婆婆", "wf": "岳父", "wm": "岳母",
  "hob": "大伯子", "hyb": "小叔子", "hos": "大姑子", "hys": "小姑子",
  "wob": "大舅子", "wyb": "小舅子", "wos": "大姨子", "wys": "小姨子",
  "obs": "侄子", "obd": "侄女", "ybs": "侄子", "ybd": "侄女",
  "oss": "外甥", "osd": "外甥女", "yss": "外甥", "ysd": "外甥女",
};

export const calculate = () => {
  const raw = ($("kin-input")?.value || "").trim().replace(/[\s,，、;；]+/g, "");  const result = $("result");
  if (!raw) return bad("请输入亲戚关系，例如：爸爸的妈妈");
  if (raw.length > 200) return bad("输入过长，请控制在 200 字以内");
  const parts = raw.split("的").filter(Boolean);
  if (parts.length > 5) return bad("关系链太长，暂支持 5 层以内");
  let path = "";
  for (const p of parts) {
    const code = TERM_PATH[p];
    if (code == null) return bad(`不认识“${p}”，换个常见称呼试试`);
    path += code;
  }
  const term = PATH_TERM[path];
  result.replaceChildren();
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  if (term) {
    strong.textContent = `${raw} = ${term}`;
    span.textContent = "三代以内常见亲戚关系换算";
  } else {
    strong.textContent = "关系较远";
    span.textContent = "这层亲戚关系暂不支持换算，试试三代以内的常见称呼";
  }
  result.append(strong, span);
};
