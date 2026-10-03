// NY ID-44 (2/26), Green Light Law. Checks documents, not exam/age eligibility.
export function checkEligibility(a) {
  const lawful = ["citizen", "green", "passport", "ead"].includes(a.identity);
  const citizenProof = a.citizen === "yes" && a.identity === "citizen";
  const consistent =
    !(a.citizen === "no" && a.identity === "citizen") &&
    !(a.citizen === "yes" && ["green", "passport", "ead"].includes(a.identity));
  const result = {};
  for (const type of ["Standard", "REAL ID", "Enhanced"]) {
    const federal = type !== "Standard",
      enhanced = type === "Enhanced",
      missing = [],
      met = [],
      blocked = [];
    const check = (ok, yes, no) => (ok ? met.push(yes) : missing.push(no));
    check(
      a.sixpoints === "yes",
      "已核对 ≥6 Points 姓名证明",
      a.sixpoints === "no"
        ? "姓名证明不足6分"
        : "尚未确认6 Points（不同证件可用文件不同，须按本类型重新核对）",
    );
    check(a.dob === "yes", "有合格出生日期证明", "缺出生日期证明或未确认");
    if (enhanced) {
      if (a.citizen === "no")
        blocked.push("Enhanced 仅限美国公民，非美国公民不适用");
      else
        check(
          citizenProof,
          "有美国公民身份证明",
          "需确认美国公民资格并提供公民身份证明",
        );
    } else if (federal || a.purpose === "id")
      check(
        lawful,
        "有相应公民身份 / lawful status 文件",
        "缺 citizenship / 合格 lawful status 文件（只有 EAD 或护照不能直接满足）",
      );
    else met.push("普通非商业驾照 / Permit 不以 lawful status 为条件");
    if (!consistent) missing.push("公民身份和所选文件矛盾，需重新核对");
    const ssnOk = enhanced
      ? ["card", "alternative"].includes(a.ssn)
      : type === "REAL ID"
        ? ["card", "number", "alternative", "ineligible"].includes(a.ssn)
        : ["card", "number", "alternative", "never", "ineligible"].includes(
            a.ssn,
          );
    check(
      ssnOk,
      "已选择适用 Social Security 路径",
      enhanced
        ? "缺原始社安卡；有有效纽约照片证件时可按 ID-44 用显示完整 SSN 的指定税务文件替代；SSN 数字或无资格信不能代替"
        : "需核对 Social Security 路径；REAL ID 的无资格信须30天内并带相应 DHS 文件",
    );
    const needed = federal ? 2 : a.purpose === "id" ? 0 : 1,
      have = Number(a.residency);
    check(
      have >= needed,
      needed
        ? `纽约地址证明已达 ${needed} 份`
        : "Standard Non-Driver ID 无居住证明要求",
      `还缺${Math.max(0, needed - have)}份纽约地址证明`,
    );
    check(
      a.documents === "yes",
      "已核对原件、有效期、全名 / 改名链及必要英译",
      "还需核对原件 / 签发机构认证件、文件有效期、全名、改名连接证明与认证英文翻译",
    );
    result[type] = {
      state: blocked.length
        ? "ineligible"
        : missing.length
          ? "missing"
          : "ready",
      met,
      missing,
      blocked,
    };
  }
  return result;
}
