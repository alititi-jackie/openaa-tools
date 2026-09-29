import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let v = $("localtime").value;
  if (!v) return bad("请选择美国当地日期和时间");
  const z = {
    ET: "America/New_York",
    CT: "America/Chicago",
    MT: "America/Denver",
    PT: "America/Los_Angeles",
  }[$("zone").value];
  const [date, time] = v.split("T"),
    [Y, M, D] = date.split("-").map(Number),
    [h, m] = time.split(":").map(Number);
  let guess = Date.UTC(Y, M - 1, D, h, m);
  for (let i = 0; i < 3; i++) {
    let f = new Intl.DateTimeFormat("en-US", {
      timeZone: z,
      timeZoneName: "longOffset",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(guess));
    let tz = f.find((x) => x.type === "timeZoneName")?.value || "GMT";
    let mm = tz.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    let off = mm
      ? (Number(mm[2]) + Number(mm[3] || 0) / 60) * (mm[1] === "-" ? -1 : 1)
      : 0;
    guess = Date.UTC(Y, M - 1, D, h, m) - off * 3600000;
  }
  let d = new Date(guess);
  let cn = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  out(
    new Intl.DateTimeFormat("zh-CN", {
      timeZone: z,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d),
    "中国北京时间 " + cn,
  );
};
