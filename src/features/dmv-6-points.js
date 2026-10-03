(function () {
  const docs = [
    { id:"foreign-passport", step:"identity", name:"中国/外国护照 + 合格美国移民文件", points:4, type:"foreign-passport", note:"4 分" },
    { id:"green-card", step:"identity", name:"有效绿卡 I-551", points:3, type:"green-card", note:"3 分" },
    { id:"ead", step:"identity", name:"有效工卡 EAD", points:3, type:"ead", note:"3 分" },
    { id:"us-passport", step:"identity", name:"有效美国护照 / Passport Card", points:4, type:"us-passport", note:"4 分" },
    { id:"foreign-dl", step:"identity", name:"外国照片驾照", points:4, type:"foreign-dl", note:"4 分；须符合 ID-44 有效期条件" },
    { id:"out-state-id", step:"identity", name:"外州/加拿大照片驾照、Permit 或 ID", points:4, type:"out-state-id", note:"4 分；须符合 ID-44 有效期条件" },
    { id:"ny-id", step:"identity", name:"纽约州照片驾照 / Permit / Non-Driver ID", points:6, type:"ny-id", note:"6 分；须符合 ID-44 有效期条件" },

    { id:"bank", step:"address", name:"银行账单 / 银行记录", points:1, type:"bank-record", source:"financial", note:"1 分；须显示当前纽约地址" },
    { id:"paystub", step:"address", name:"电脑打印工资单 Pay Stub", points:1, type:"paystub", note:"1 分；须符合地址要求" },
    { id:"utility", step:"address", name:"水电煤 / 网络等 Utility Bill", points:1, type:"utility", note:"1 分；须显示当前纽约地址" },
    { id:"w2", step:"address", name:"W-2", points:1, type:"w2", note:"1 分；须符合 ID-44 条件" },
    { id:"ny-vehicle", step:"address", name:"纽约州车辆 Registration / Title", points:2, type:"ny-vehicle", note:"2 分；须符合地址要求" },
    { id:"school", step:"address", name:"合格美国学校文件", points:2, type:"school", note:"2 分；须符合 ID-44 条件" },
    { id:"ssa1099", step:"address", name:"SSA-1099", points:1, type:"ssa1099", note:"1 分；须符合地址要求" },

    { id:"ssn-card", step:"extra", name:"Social Security Card 社安卡", points:2, type:"ssn-card", note:"2 分" },
    { id:"medicaid-photo", step:"extra", name:"纽约州白卡 / Medicaid 卡（有照片）", points:3, type:"medicaid", note:"3 分" },
    { id:"medicaid-no-photo", step:"extra", name:"纽约州白卡 / Medicaid 卡（无照片）", points:2, type:"medicaid", note:"2 分" },
    { id:"debit", step:"extra", name:"ATM / Debit Card 银行卡", points:1, type:"debit", source:"financial", note:"1 分；须符合姓名/签名要求" },
    { id:"credit", step:"extra", name:"美国主要信用卡", points:1, type:"credit", source:"financial", note:"1 分" },
    { id:"health", step:"extra", name:"美国医保卡 / Prescription Card", points:1, type:"health", note:"1 分" },
    { id:"employee", step:"extra", name:"美国 Employee ID 员工证", points:1, type:"employee", note:"1 分" }
  ];

  const $ = (id) => document.getElementById(id);
  const selected = () => [...document.querySelectorAll('.dmv-doc input:checked')].map(i => docs.find(d => d.id === i.dataset.id)).filter(Boolean);

  function render(step, target) {
    $(target).innerHTML = docs.filter(d => d.step === step).map(d => `<label class="dmv-doc"><input type="checkbox" data-id="${d.id}"><div class="dmv-doc-main"><div class="dmv-doc-title">${d.name}</div><div class="dmv-doc-meta"><span class="dmv-pill points">${d.note}</span></div></div></label>`).join('');
  }

  render('identity','identityDocs'); render('address','addressDocs'); render('extra','extraDocs');

  function counted(list) {
    const map = new Map();
    list.forEach(d => { const old = map.get(d.type); if (!old || d.points > old.points) map.set(d.type,d); });
    return [...map.values()];
  }

  function lockStep(stepId, listId, lockId, locked) {
    const step = $(stepId); const list = $(listId); const lock = $(lockId);
    step.style.opacity = locked ? '.55' : '1';
    list.style.pointerEvents = locked ? 'none' : 'auto';
    list.querySelectorAll('input').forEach(i => { i.disabled = locked; if (locked) i.checked = false; });
    lock.textContent = locked ? '🔒' : '';
  }

  function update() {
    let all = selected();
    const hasIdentity = all.some(d => d.step === 'identity');
    lockStep('addressStep','addressDocs','addressLock',!hasIdentity);
    all = selected();
    const hasAddress = all.some(d => d.step === 'address');
    lockStep('extraStep','extraDocs','extraLock',!hasIdentity || !hasAddress);
    all = selected();

    const valid = counted(all);
    const score = valid.reduce((n,d) => n + d.points,0);
    const enoughPoints = score >= 6;
    const hasExtra = all.some(d => d.step === 'extra');
    const cautious = hasIdentity && hasAddress && enoughPoints && !hasExtra;
    const complete = hasIdentity && hasAddress && enoughPoints && hasExtra;
    const financial = valid.filter(d => d.source === 'financial').length;

    $('dmvScore').textContent = score;
    $('dmvProgress').style.width = Math.min(100, Math.round(score / 6 * 100)) + '%';
    $('dmvStatus').className = 'dmv-status ' + (complete ? 'ok' : 'warn');
    if (!hasIdentity) $('dmvStatus').textContent = '先选择身份证明';
    else if (!hasAddress) $('dmvStatus').textContent = '还缺地址证明';
    else if (!enoughPoints) $('dmvStatus').textContent = `还差 ${6-score} 分`;
    else if (!hasExtra) $('dmvStatus').textContent = '已达 6 分，建议再选一项';
    else $('dmvStatus').textContent = '主要文件基本齐全';

    if (!hasIdentity) $('dmvResultText').textContent = '第一步必须先有一份合格身份证明。';
    else if (!hasAddress) $('dmvResultText').textContent = '身份证明已选择，现在请选择一份符合要求的纽约州地址证明。';
    else if (!enoughPoints) $('dmvResultText').textContent = `身份和地址证明已选择，目前 ${score}/6 分，再补 ${6-score} 分。`;
    else if (!hasExtra) $('dmvResultText').textContent = '你目前选择的身份证明和地址证明积分已达到 6 Points，但仅凭这些文件是否足够仍可能需要 DMV 现场核验。建议在第 ③ 项再选择至少一份你实际拥有的加分证明，以免现场被要求补材料。';
    else $('dmvResultText').textContent = '身份证明、纽约地址证明和其它加分证明均已选择，6 Points 已达到。请按 DMV 原件要求准备材料。';

    const rows = [
      `<div class="dmv-summary-item"><strong>身份证明：</strong>${hasIdentity?'✓ 已选择':'✕ 未选择'}</div>`,
      `<div class="dmv-summary-item"><strong>纽约地址：</strong>${hasAddress?'✓ 1/1':'✕ 0/1'}</div>`,
      `<div class="dmv-summary-item"><strong>6 Points：</strong>${score}/6 ${enoughPoints?'✓':''}</div>`,
      `<div class="dmv-summary-item"><strong>其它加分证明：</strong>${hasExtra?'✓ 已选择':'— 未选择'}</div>`
    ];
    if (cautious) rows.push('<div class="dmv-summary-item">⚠️ 已达到 6 Points，但目前没有选择第 ③ 项的其它加分证明。为减少 DMV 现场要求补材料的风险，建议再准备至少 1 份符合要求的独立证明。</div>');
    if (financial > 1) rows.push('<div class="dmv-summary-item">⚠️ 如果银行账单、银行卡或信用卡来自同一家金融机构，请不要把它们当成多份不同来源的证明。</div>');
    if (all.some(d=>d.id==='foreign-passport')) rows.push('<div class="dmv-summary-item">⚠️ 外国护照的 4 分以同时具备 ID-44 要求的合格美国移民文件为前提。</div>');
    if (complete) rows.push('<div class="dmv-summary-item"><strong>结果：</strong>✓ 主要文件基本准备齐全。最终是否接受以纽约 DMV 审核为准。</div>');
    $('dmvSummary').innerHTML = rows.join('');
  }

  document.addEventListener('change', e => { if (e.target.matches('.dmv-doc input')) update(); });
  $('resetDmvCalc')?.addEventListener('click', () => { document.querySelectorAll('.dmv-doc input').forEach(i=>i.checked=false); update(); window.scrollTo({top:0,behavior:'smooth'}); });
  update();
})();