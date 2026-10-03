(function(){
 const get=n=>document.querySelector(`input[name="${n}"]:checked`)?.value||"";
 const result=document.getElementById("ridResult");
 function render(){
  const citizen=get("citizen"),fly=get("fly"),border=get("border"),status=get("status");
  if(!citizen||!fly||!border||!status){result.innerHTML="<strong>请先完成上面 4 个选择。</strong>";return;}
  let type="Standard",title="Standard 可能已经够用",body="如果你主要就是开车，而且不需要直接用这张驾照 / ID 做联邦 REAL ID 用途，Standard 通常可以满足驾驶需要。",next='<a href="/usa/dmv/document-checker.html">查看材料清单 →</a>';
  if(border==="yes"&&citizen==="yes"){
   type="Enhanced";title="更适合：Enhanced";body="你是美国公民，而且有特定陆路 / 海路跨境返美需求。Enhanced 包含 REAL ID 用途，并增加符合条件的加拿大、墨西哥及部分加勒比地区陆路 / 海路返美功能；额外费用为 $30。";next='<a href="/usa/dmv/document-checker.html">查看 Enhanced 材料 →</a>';
  }else if(border==="yes"&&citizen==="no"){
   type=status==="yes"?"REAL ID":"Standard";title=status==="yes"?"Enhanced 不适用；优先考虑 REAL ID":"Enhanced 不适用；先考虑 Standard";body="Enhanced 只提供给符合条件的美国公民。非美国公民不能因为有跨境需求而选择 Enhanced；国际和边境旅行应另外准备符合要求的旅行证件。";next=status==="yes"?'<a href="/usa/dmv/real-id-checker.html">检查 REAL ID 条件 →</a>':'<a href="/usa/dmv/document-checker.html">查看 Standard 材料 →</a>';
  }else if(fly==="yes"){
   if(status==="yes"){type="REAL ID";title="更适合：REAL ID";body="你希望直接使用纽约驾照 / ID 坐美国国内飞机，又没有 Enhanced 的跨境需求。REAL ID 通常是最实用的选择，而且纽约 DMV 不收额外 REAL ID 升级费。";next='<a href="/usa/dmv/real-id-checker.html">检查 REAL ID 条件 →</a>';}else if(status==="unsure"){type="REAL ID?";title="先确认是否符合 REAL ID 条件";body="你的使用需求更适合 REAL ID，但你还不确定 lawful status 文件是否符合。先检查 REAL ID 条件，再决定是否办理。";next='<a href="/usa/dmv/real-id-checker.html">检查 REAL ID 条件 →</a>';}else{title="目前先考虑 Standard";body="你想直接用驾照坐国内飞机，但目前不能证明符合 REAL ID 要求的身份 / lawful status。Standard 可以用于普通驾驶；乘机时需要使用 TSA 接受的其它身份证件。";next='<a href="/usa/dmv/document-checker.html">查看 Standard 材料 →</a>';}
  }else if((fly==="alt"||fly==="no")&&border==="no"){
   title="Standard 可能已经够用";body=fly==="alt"?"你已有护照或其它 TSA 接受证件，又没有 Enhanced 的跨境需求。如果主要用途是开车，通常没有必要只为了国内乘机而升级 REAL ID。":"如果主要就是开车，也没有国内乘机或 Enhanced 跨境用途，Standard 通常已经够用。";
  }
  const note=type==="Standard"&&fly==="alt"?"<p>注意：Standard 本身不是机场可接受的 REAL ID-compliant 州证件；乘机时请携带 TSA 接受的替代证件。</p>":"";
  result.innerHTML=`<span class="rid-result-label">建议</span><strong>${title}</strong><p>${body}</p>${note}<div class="rid-next">${next}</div>`;
 }
 document.getElementById("ridChoose")?.addEventListener("click",render);
})();