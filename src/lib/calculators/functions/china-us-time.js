import { $, out, bad } from "../standard.js";
import { resolveLocalTime } from "../../zoned-time.js";
export const calculate = () => {
  const value = $("localtime").value;
  if (!value) return bad("请选择美国当地日期和时间");
  const zone = {
    ET: "America/New_York",
    CT: "America/Chicago",
    MT: "America/Denver",
    PT: "America/Los_Angeles",
  }[$("zone").value];
  const candidates = resolveLocalTime(value, zone);
  if (!candidates.length)
    return bad(
      "该当地时间不存在或日期无效。夏令时开始时会跳过一小时，请重新选择。",
    );
  const format = (timeZone) =>
    new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  if (candidates.length > 1)
    return out(
      "该当地时间出现两次",
      "夏令时结束时重复一小时；中国北京时间分别为 " +
        candidates
          .map((t) => format("Asia/Shanghai").format(new Date(t)))
          .join(" 或 ") +
        "，请向预约方确认具体时刻。",
    );
  out(
    format(zone).format(new Date(candidates[0])),
    "中国北京时间 " + format("Asia/Shanghai").format(new Date(candidates[0])),
  );
};
