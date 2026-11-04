(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORAGE = { history: "nio_whatsapp_history_v1", templates: "nio_whatsapp_templates_v1", theme: "nio_whatsapp_theme_v1" };
  const defaults = [
    {id:"Instalação", text:"Olá, sou técnico da NIO, entrando em contato referente à instalação. Tem alguém no local para me receber agora? Estou aqui em frente à sua residência."},
    {id:"Reparo", text:"Olá, sou técnico da NIO, entrando em contato referente ao reparo. Tem alguém no local para me receber agora? Estou aqui em frente à sua residência."},
    {id:"Ausente", text:"Olá! Sou técnico da NIO e estive no endereço para realizar o atendimento, mas não consegui contato no local. Por favor, informe um melhor horário para retorno."},
    {id:"Agendamento", text:"Olá! Sou técnico da NIO. Gostaria de confirmar o melhor horário para realizar seu atendimento. Qual período é mais conveniente?" },
    {id:"Finalização", text:"Olá! Sou técnico da NIO. Seu atendimento foi concluído. Agradeço pela atenção e fico à disposição."},
    {id:"Retorno", text:"Olá! Sou técnico da NIO. Estou entrando em contato para combinar o retorno do atendimento. Qual o melhor horário para você?"}
  ];
  let history = load(STORAGE.history, []);
  let templates = load(STORAGE.templates, defaults);
  let selectedType = "";
  let deferredInstall = null;

  function load(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? structuredClone(fallback); }
    catch { return structuredClone(fallback); }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function toast(message) {
    $("toastText").textContent = message;
    if (window.bootstrap) bootstrap.Toast.getOrCreateInstance($("appToast"), {delay:2600}).show();
    else alert(message);
  }
  function digits(value) { return String(value || "").replace(/\D/g, ""); }
  function normalizePhone(value) {
    let n = digits(value);
    if (n.startsWith("55") && n.length >= 12) n = n.slice(2);
    return n;
  }
  function validPhone(value) {
    const n = normalizePhone(value);
    return n.length === 10 || n.length === 11;
  }
  function waLink(phone, message) {
    const n = normalizePhone(phone);
    return `https://wa.me/55${n}${message ? "?text=" + encodeURIComponent(message) : ""}`;
  }
function personalizeMessage(message, name) {
    const customerName = String(name || "").trim();
    let text = String(message || "").trim();

    if (!customerName) {
        return text;
    }

    // Remove a saudação inicial, caso exista
    text = text.replace(/^olá\s*[!,]?\s*/i, "");

    // Evita começar a frase seguinte com letra maiúscula
    if (text.length > 0) {
        text = text.charAt(0).toLowerCase() + text.slice(1);
    }

    return `Olá, ${customerName}, ${text}`;
}
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function currentMessageType() {
    const match = templates.find(t => t.text.trim() === $("message").value.trim());
    return match?.id || selectedType || "Personalizada";
  }
  function renderTemplates() {
    $("templateButtons").innerHTML = templates.map(t => `
      <div class="col-6"><button type="button" class="btn template-btn ${selectedType===t.id?'active':''}" data-template="${escapeHtml(t.id)}">
        <i class="bi bi-chat-square-text me-1"></i>${escapeHtml(t.id)}<small>Usar mensagem pronta</small></button></div>`).join("");
    $("templateEditor").innerHTML = templates.map((t,i) => `
      <div class="mb-3"><label class="form-label fw-semibold">${escapeHtml(t.id)}</label>
      <textarea class="form-control template-edit" rows="3" data-index="${i}">${escapeHtml(t.text)}</textarea></div>`).join("");
  }
  function renderHistory() {
    const search = $("historySearch").value.toLowerCase();
    const filter = $("historyFilter").value;
    const rows = history.filter(h => (!filter || h.type === filter) &&
      (`${h.name} ${h.phone} ${h.type}`.toLowerCase().includes(search)))
      .sort((a,b) => b.createdAt-a.createdAt);
    $("historyBody").innerHTML = rows.length ? rows.map(h => `
      <tr><td><div class="fw-semibold">${escapeHtml(h.name || "Sem nome")}</div><small class="muted">${escapeHtml(h.phone)}</small></td>
      <td><span class="pill">${escapeHtml(h.type)}</span></td><td><small>${new Date(h.createdAt).toLocaleDateString("pt-BR")}<br>${new Date(h.createdAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</small></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-nio" title="Reabrir conversa" data-action="open" data-id="${h.id}"><i class="bi bi-whatsapp"></i></button>
        <button class="btn btn-sm btn-outline-secondary" title="Excluir" data-action="delete" data-id="${h.id}"><i class="bi bi-trash"></i></button>
      </td></tr>`).join("") : `<tr><td colspan="4"><div class="empty-state"><i class="bi bi-inbox"></i>Nenhum atendimento encontrado.</div></td></tr>`;
    updateStats();
  }
  function updateStats() {
    const now = new Date();
    const monthCount = history.filter(h => { const d=new Date(h.createdAt); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).length;
    $("statTotal").textContent = history.length;
    $("statInstall").textContent = history.filter(h=>h.type==="Instalação").length;
    $("statRepair").textContent = history.filter(h=>h.type==="Reparo").length;
    $("statMonth").textContent = monthCount;
    const counts = templates.map(t=>({name:t.id,count:history.filter(h=>h.type===t.id).length}));
    const max = Math.max(1,...counts.map(x=>x.count));
    $("reportBars").innerHTML = counts.map(x=>`<div class="mb-3"><div class="d-flex justify-content-between small mb-1"><span>${escapeHtml(x.name)}</span><strong>${x.count}</strong></div><div class="progress" style="height:9px"><div class="progress-bar" role="progressbar" style="width:${x.count/max*100}%;background:#128c7e" aria-valuenow="${x.count}" aria-valuemin="0" aria-valuemax="${max}"></div></div></div>`).join("");
    $("reportTotal").textContent = history.length;
  }
  function refreshFilter() {
    const old = $("historyFilter").value;
    $("historyFilter").innerHTML = `<option value="">Todos os tipos</option>` + templates.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.id)}</option>`).join("");
    $("historyFilter").value = old;
  }
  function record(phone, name, message, type) {
    history.push({id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())), phone:normalizePhone(phone), name:name.trim(), message, type, createdAt:Date.now()});
    save(STORAGE.history,history); renderHistory();
  }
  function validate() {
    if (!validPhone($("phone").value)) { toast("Informe um telefone brasileiro válido com DDD."); $("phone").focus(); return false; }
    if (!$("message").value.trim()) { toast("Digite uma mensagem ou escolha um modelo."); $("message").focus(); return false; }
    return true;
  }
function createLink() {
    if (!validPhone($("phone").value)) {
        toast("Informe um telefone válido com DDD.");
        return null;
    }

    const message = personalizeMessage(
        $("message").value.trim(),
        $("customer").value
    );

    if (!message) {
        toast("Digite uma mensagem.");
        return null;
    }

    return waLink($("phone").value, message);
}

  $("templateButtons").addEventListener("click", e => {
    const btn=e.target.closest("[data-template]"); if(!btn)return;
    const t=templates.find(x=>x.id===btn.dataset.template); if(!t)return;
    selectedType=t.id; $("message").value=t.text; updateCharCount(); renderTemplates();
  });
  $("message").addEventListener("input", updateCharCount);
  function updateCharCount(){ $("charCount").textContent=`${$("message").value.length} caracteres`; }
  $("phone").addEventListener("input", e => {
    let n=digits(e.target.value).slice(0,11);
    if(n.length>2) n=`(${n.slice(0,2)}) ${n.slice(2)}`;
    if(n.length>10) n=n.slice(0,10)+"-"+n.slice(10);
    else if(n.length>9) n=n.slice(0,9)+"-"+n.slice(9);
    e.target.value=n;
  });
$("openWhatsApp").addEventListener("click", () => {
    if (!validPhone($("phone").value)) {
        toast("Informe um telefone válido com DDD.");
        $("phone").focus();
        return;
    }

    if (!$("message").value.trim()) {
        toast("Escolha uma mensagem ou digite uma.");
        return;
    }

    const message = personalizeMessage(
        $("message").value.trim(),
        $("customer").value
    );

    const link = waLink($("phone").value, message);

    record(
        $("phone").value,
        $("customer").value,
        message,
        currentMessageType()
    );

    window.open(link, "_blank", "noopener");
});
  $("makeLink").addEventListener("click", () => {
    const link=createLink(); if(!link)return;
    $("generatedLink").value=link; $("linkArea").hidden=false; $("qrArea").hidden=true; $("copyFeedback").textContent="";
  });
  $("copyLink").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("generatedLink").value); $("copyFeedback").textContent="Link copiado!"; }
    catch { $("generatedLink").select(); document.execCommand("copy"); $("copyFeedback").textContent="Copie o link selecionado."; }
  });
  $("showQr").addEventListener("click", async () => {
    const link=$("generatedLink").value; if(!link)return;
    $("qrArea").hidden=false;
    if(!window.QRCode){ $("qrArea").insertAdjacentHTML("beforeend",'<div class="small text-danger">Biblioteca de QR Code indisponível. Conecte-se à internet e tente novamente.</div>'); return; }
    try { await QRCode.toCanvas($("qrCanvas"),link,{width:220,margin:2,errorCorrectionLevel:"M"}); }
    catch { toast("Não foi possível gerar o QR Code."); }
  });
  $("clearForm").addEventListener("click", () => {
    $("contactForm").reset(); selectedType=""; $("linkArea").hidden=true; $("qrArea").hidden=true; updateCharCount(); renderTemplates();
  });
  $("saveTemplates").addEventListener("click", () => {
    document.querySelectorAll(".template-edit").forEach(el=>{templates[Number(el.dataset.index)].text=el.value.trim();});
    save(STORAGE.templates,templates); renderTemplates(); toast("Mensagens salvas neste dispositivo.");
  });
  $("resetTemplates").addEventListener("click", () => {
    if(!confirm("Restaurar as mensagens originais?"))return;
    templates=structuredClone(defaults); save(STORAGE.templates,templates); renderTemplates(); refreshFilter(); updateStats(); toast("Mensagens originais restauradas.");
  });
  $("historySearch").addEventListener("input",renderHistory);
  $("historyFilter").addEventListener("change",renderHistory);
  $("historyBody").addEventListener("click",e=>{
    const btn=e.target.closest("[data-action]"); if(!btn)return;
    const item=history.find(h=>h.id===btn.dataset.id); if(!item)return;
    if(btn.dataset.action==="open"){window.open(waLink(item.phone,item.message),"_blank","noopener");}
    if(btn.dataset.action==="delete" && confirm("Excluir este atendimento do histórico?")){history=history.filter(h=>h.id!==item.id);save(STORAGE.history,history);renderHistory();toast("Atendimento excluído.");}
  });
  $("exportCsv").addEventListener("click",()=>{
    const header=["Data","Nome","Telefone","Tipo","Mensagem"];
    const lines=history.map(h=>[new Date(h.createdAt).toLocaleString("pt-BR"),h.name,h.phone,h.type,h.message]);
    const csv=[header,...lines].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
    download("\uFEFF"+csv,"historico-atendimentos-nio.csv","text/csv;charset=utf-8");
  });
  $("backupBtn").addEventListener("click",()=>download(JSON.stringify({version:1,exportedAt:new Date().toISOString(),history,templates},null,2),"backup-atendimento-nio.json","application/json"));
  $("restoreFile").addEventListener("change",async e=>{
    const file=e.target.files[0]; if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.history)||!Array.isArray(data.templates))throw new Error("Formato inválido");
      if(!confirm("A restauração substituirá o histórico e as mensagens atuais. Continuar?"))return;
      history=data.history;templates=data.templates;save(STORAGE.history,history);save(STORAGE.templates,templates);
      renderTemplates();refreshFilter();renderHistory();toast("Backup restaurado.");
    }catch{toast("Não foi possível restaurar: arquivo inválido.");}
    e.target.value="";
  });
  function download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
  $("themeBtn").addEventListener("click",()=>{
    document.body.classList.toggle("dark");localStorage.setItem(STORAGE.theme,document.body.classList.contains("dark")?"dark":"light");
    $("themeBtn").innerHTML=document.body.classList.contains("dark")?'<i class="bi bi-sun"></i>':'<i class="bi bi-moon-stars"></i>';
  });
  if(localStorage.getItem(STORAGE.theme)==="dark"){$("themeBtn").click();}
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  renderTemplates();refreshFilter();renderHistory();updateCharCount();
})();