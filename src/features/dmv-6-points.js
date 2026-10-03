(function () {
  // NY DMV ID-44 (2/26): Proof of Name must total 6+ points.
  // DMV accepts only one proof per source or type.
  const docs = [
    { id: "foreign-passport", section: "main", name: "中国/外国护照 + 符合要求的美国移民文件", points: 4, proofType: "foreign-passport", res: false, note: "例如有效 Visa + I-94，或有效 I-551 标注；仅护照本身不能直接按 4 分计算" },
    { id: "ssn", section: "main", name: "Social Security 社安号 / 社安卡", points: 2, proofType: "ssn", res: false, note: "Proof of Name 2 分" },
    { id: "medicaid-photo", section: "main", name: "纽约州白卡 / Medicaid 卡（有照片）", points: 3, proofType: "medicaid", res: false, note: "有照片 3 分；白卡只能选一种" },
    { id: "medicaid-no-photo", section: "main", name: "纽约州白卡 / Medicaid 卡（无照片）", points: 2, proofType: "medicaid", res: false, note: "无照片 2 分；白卡只能选一种" },
    { id: "bank", section: "main", name: "美国银行账单 / 银行记录", points: 1, proofType: "bank-record", sourceFamily: "financial", res: true, note: "1 分；显示当前纽约地址时可作地址证明" },
    { id: "atm", section: "main", name: "美国 ATM / Debit Card 银行卡", points: 1, proofType: "debit-card", sourceFamily: "financial", res: false, note: "需预印姓名及签名" },
    { id: "health", section: "main", name: "美国医保卡 / Prescription Card", points: 1, proofType: "health-insurance", res: false, note: "1 分" },
    { id: "paystub", section: "main", name: "美国电脑打印工资单 Pay Stub", points: 1, proofType: "paystub", res: true, note: "需有姓名；符合地址条件时可作地址证明" },
    { id: "utility", section: "main", name: "美国水电煤 / 网络等 Utility Bill", points: 1, proofType: "utility", res: true, note: "需有姓名和当前纽约地址" },
    { id: "w2", section: "more", name: "W-2", points: 1, proofType: "w2", res: true, note: "需显示 SSN；符合地址条件时可作地址证明" },
    { id: "green-card", section: "more", name: "有效绿卡 Permanent Resident Card (I-551)", points: 3, proofType: "green-card", res: false, note: "3 分" },
    { id: "ead", section: "more", name: "有效工卡 Employment Authorization Card", points: 3, proofType: "ead", res: false, note: "3 分" },
    { id: "us-passport", section: "more", name: "有效美国护照 / Passport Card", points: 4, proofType: "us-passport", res: false, note: "4 分；Passport 与 Passport Card 属同一类型，只计一份" },
    { id: "foreign-dl", section: "more", name: "外国照片驾照", points: 4, proofType: "foreign-driver-license", res: false, note: "有效或过期不超过 2 年" },
    { id: "out-state-id", section: "more", name: "外州/加拿大照片驾照、Permit 或 ID", points: 4, proofType: "out-state-id", res: false, note: "有效或过期不超过 2 年；同类只计一份" },
    { id: "ny-dmv-id", section: "more", name: "纽约州照片驾照 / Permit / Non-Driver ID", points: 6, proofType: "ny-dmv-id", res: false, note: "有效或过期不超过 2 年；同类只计一份" },
    { id: "ny-title", section: "more", name: "纽约州车辆产权证 / Registration", points: 2, proofType: "ny-vehicle-record", res: true, note: "2 分；符合地址条件时可作地址证明" },
    { id: "school-photo", section: "more", name: "美国高中/大学照片学生证 + 成绩单", points: 2, proofType: "school-record", res: true, note: "2 分；须符合 ID-44 条件" },
    { id: "credit-card", section: "more", name: "有效美国主要信用卡", points: 1, proofType: "credit-card", sourceFamily: "financial", res: false, note: "1 分；多张信用卡仍只属于一种证明" },
    { id: "employee-id", section: "more", name: "美国 Employee ID 员工证", points: 1, proofType: "employee-id", res: false, note: "1 分" },
    { id: "ssa1099", section: "more", name: "SSA-1099", points: 1, proofType: "ssa1099", res: true, note: "1 分；符合地址条件时可作地址证明" }
  ];

  function render(section, elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = docs.filter((d) => d.section === section).map((d) =>
      `<label class="dmv-doc"><input type="checkbox" data-id="${d.id}"><div class="dmv-doc-main"><div class="dmv-doc-title">${d.name}</div><div class="dmv-doc-meta"><span class="dmv-pill points">${d.points} 分</span>${d.res ? '<span class="dmv-pill res">可作地址证明*</span>' : ''}<span class="dmv-pill">${d.note}</span></div></div></label>`
    ).join("");
  }

  render("main", "sectionMain");
  render("more", "sectionMore");

  const scoreEl = document.getElementById("dmvScore");
  const statusEl = document.getElementById("dmvStatus");
  const progressEl = document.getElementById("dmvProgress");
  const textEl = document.getElementById("dmvResultText");
  const summaryEl = document.getElementById("dmvSummary");

  function getCountedProofs(checked) {
    const byType = new Map();
    checked.forEach((doc) => {
      const key = doc.proofType || doc.id;
      const existing = byType.get(key);
      if (!existing || doc.points > existing.points) byType.set(key, doc);
    });
    return [...byType.values()];
  }

  function update() {
    const checked = [...document.querySelectorAll(".dmv-doc input:checked")]
      .map((i) => docs.find((d) => d.id === i.dataset.id)).filter(Boolean);
    const counted = getCountedProofs(checked);
    const score = counted.reduce((sum, d) => sum + d.points, 0);
    const rawScore = checked.reduce((sum, d) => sum + d.points, 0);
    const duplicatePoints = rawScore - score;
    const ok = score >= 6;
    const resCount = counted.filter((d) => d.res).length;
    const financialCount = counted.filter((d) => d.sourceFamily === "financial").length;

    scoreEl.textContent = score;
    progressEl.style.width = Math.min(100, Math.round((score / 6) * 100)) + "%";
    statusEl.className = "dmv-status " + (ok ? "ok" : "warn");
    statusEl.textContent = ok ? "已达到 6 分" : `还差 ${6 - score} 分`;

    if (!checked.length) textEl.textContent = "选择你现在手上有的文件，我们帮你计算。";
    else if (!ok) textEl.textContent = `目前有效计分 ${score} 分，还差 ${6 - score} 分。`;
    else textEl.textContent = `目前有效计分 ${score} 分，Proof of Name 已达到 6 Points。去 DMV 前还要确认出生日期、SSN、纽约地址及所申请证件的其他要求。`;

    const warnings = [];
    if (duplicatePoints > 0) warnings.push(`你选择的文件原始合计为 ${rawScore} 分，其中 ${duplicatePoints} 分属于同一种证明的重复选择，已自动不重复计分。`);
    if (financialCount > 1) warnings.push("你选择了多种金融机构证明。DMV 不接受来自同一来源的多份证明；如果银行账单、银行卡或信用卡来自同一家机构，请只按其中一份准备。由于网页不知道发卡/开户机构，这部分需你确认。");
    if (checked.some((d) => d.id === "foreign-passport")) warnings.push("外国护照按 4 分计算的前提是同时具备 ID-44 要求的美国移民文件；只有中国/外国护照本身不能直接算 4 分。");
    if (resCount) warnings.push("地址证明必须显示你当前纽约州地址；P.O. Box 不接受，电子账单要打印。Standard 通常需 1 份，REAL ID / Enhanced 通常需 2 份。");

    summaryEl.innerHTML = [
      `<div class="dmv-summary-item"><strong>有效积分：</strong>${score} / 6 分 ${ok ? "✓" : ""}</div>`,
      `<div class="dmv-summary-item"><strong>已选择：</strong>${checked.length ? checked.map((d) => d.name.split(" / ")[0]).join("、") : "暂无"}</div>`,
      ...warnings.map((w) => `<div class="dmv-summary-item">⚠️ ${w}</div>`),
      `<div class="dmv-summary-item"><strong>最后一步：</strong>DMV 只接受每种类型/每个来源的一份证明；至少一份 Proof of Name 必须带有你的签名。最终以纽约 DMV ID-44 / Document Guide 审核为准。</div>`
    ].join("");
  }

  document.addEventListener("change", (e) => { if (e.target.matches(".dmv-doc input")) update(); });
  const reset = document.getElementById("resetDmvCalc");
  if (reset) reset.addEventListener("click", () => {
    document.querySelectorAll(".dmv-doc input").forEach((i) => (i.checked = false));
    update();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  update();
})();
