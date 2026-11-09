const money = (n) => n == null || n === "" ? "não informado" :
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const val = (v) => (v === null || v === undefined || v === "") ? "não informado" : v;
const fmtDate = (iso) => {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(iso)) + " (America/Sao_Paulo)";
  } catch { return iso; }
};

const STORAGE_KEY = "casas-escolhas-v1";
let casas = [];
let escolhas = {}; // id -> "sim" | "nao"

function loadEscolhas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    escolhas = raw ? JSON.parse(raw) : {};
    if (!escolhas || typeof escolhas !== "object") escolhas = {};
  } catch {
    escolhas = {};
  }
}

function saveEscolhas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(escolhas));
}

function getEscolha(id) {
  return escolhas[id] || null;
}

function setEscolha(id, value) {
  const cur = getEscolha(id);
  if (value && cur === value) delete escolhas[id]; // toggle off
  else if (value) escolhas[id] = value;
  else delete escolhas[id];
  saveEscolhas();
  render();
}

function escolhaCounts(pool) {
  let sim = 0, nao = 0, pend = 0;
  for (const c of pool) {
    const e = getEscolha(c.id);
    if (e === "sim") sim++;
    else if (e === "nao") nao++;
    else pend++;
  }
  return { sim, nao, pend };
}

function escolhaButtons(id) {
  const e = getEscolha(id);
  return `<div class="vote" role="group" aria-label="Minha escolha">
    <button type="button" class="vote-btn sim${e === "sim" ? " on" : ""}" data-id="${id}" data-vote="sim" aria-pressed="${e === "sim"}">Sim</button>
    <button type="button" class="vote-btn nao${e === "nao" ? " on" : ""}" data-id="${id}" data-vote="nao" aria-pressed="${e === "nao"}">Não</button>
  </div>`;
}

function flashMsg(text, ms = 2800) {
  const el = document.getElementById("escolhaMsg");
  el.hidden = false;
  el.textContent = text;
  clearTimeout(flashMsg._t);
  flashMsg._t = setTimeout(() => { el.hidden = true; }, ms);
}

async function boot() {
  loadEscolhas();
  const res = await fetch("./data.json", { cache: "no-store" });
  const data = await res.json();
  casas = data.casas || [];
  document.getElementById("atualizado").textContent = fmtDate(data.atualizado_em);
  renderStats(casas);
  ["cidade", "veredito", "minQuartos", "marFilter", "sort", "escolhaFilter", "viewMode"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      if (id === "viewMode" && document.getElementById("viewMode").value === "ranking") {
        document.getElementById("sort").value = "ranking";
      }
      render();
    });
  });
  document.getElementById("maxTotal").addEventListener("input", render);
  document.getElementById("reset").addEventListener("click", () => {
    document.getElementById("cidade").value = "";
    document.getElementById("veredito").value = "";
    document.getElementById("maxTotal").value = "";
    document.getElementById("minQuartos").value = "";
    document.getElementById("sort").value = "ranking";
    document.getElementById("marFilter").value = "";
    document.getElementById("viewMode").value = "ranking";
    document.getElementById("escolhaFilter").value = "hide_nao";
    render();
  });
  document.getElementById("exportEscolhas").addEventListener("click", exportEscolhas);
  document.getElementById("importEscolhas").addEventListener("click", importEscolhas);
  document.getElementById("clearEscolhas").addEventListener("click", () => {
    if (!confirm("Limpar todas as suas escolhas Sim/Não neste aparelho?")) return;
    escolhas = {};
    saveEscolhas();
    render();
    flashMsg("Escolhas limpas.");
  });
  document.body.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".vote-btn");
    if (!btn) return;
    setEscolha(btn.dataset.id, btn.dataset.vote);
  });
  render();
}

function renderStats(list) {
  const ativos = list.filter(c => c.status === "ativo");
  const visitar = ativos.filter(c => c.veredito === "visitar");
  const barata = [...visitar].sort((a,b) => (a.total_estimado||9e9)-(b.total_estimado||9e9))[0];
  document.getElementById("statTotal").textContent = ativos.length;
  document.getElementById("statGar").textContent = ativos.filter(c => c.cidade === "Garopaba").length;
  document.getElementById("statPic").textContent = ativos.filter(c => c.cidade === "Balneário Piçarras").length;
  document.getElementById("statPdl").textContent = ativos.filter(c => c.cidade.startsWith("Pontal")).length;
  document.getElementById("statIta").textContent = ativos.filter(c => c.cidade.startsWith("Itapoá")).length;
  document.getElementById("statBest").textContent = barata
    ? `${money(barata.total_estimado)} · ${barata.bairro}`
    : "—";
}

function filtered() {
  const cidade = document.getElementById("cidade").value;
  const veredito = document.getElementById("veredito").value;
  const maxTotal = Number(document.getElementById("maxTotal").value || Infinity);
  const minQuartos = Number(document.getElementById("minQuartos").value || 0);
  const marFilter = document.getElementById("marFilter").value;
  const escolhaFilter = document.getElementById("escolhaFilter").value;
  const sort = document.getElementById("sort").value;
  let list = casas.filter(c => c.status === "ativo");
  if (cidade) list = list.filter(c => c.cidade === cidade);
  if (veredito) list = list.filter(c => c.veredito === veredito);
  list = list.filter(c => (c.total_estimado ?? Infinity) <= maxTotal);
  list = list.filter(c => (c.quartos ?? 0) >= minQuartos || minQuartos === 0);
  if (marFilter === "com") list = list.filter(c => !!c.distancia_mar);
  if (marFilter === "sem") list = list.filter(c => !c.distancia_mar);
  if (marFilter === "500") list = list.filter(c => c.distancia_mar_metros != null && c.distancia_mar_metros <= 500);
  if (marFilter === "1000") list = list.filter(c => c.distancia_mar_metros != null && c.distancia_mar_metros <= 1000);
  if (escolhaFilter === "sim") list = list.filter(c => getEscolha(c.id) === "sim");
  if (escolhaFilter === "nao") list = list.filter(c => getEscolha(c.id) === "nao");
  if (escolhaFilter === "pendente") list = list.filter(c => !getEscolha(c.id));
  if (escolhaFilter === "hide_nao") list = list.filter(c => getEscolha(c.id) !== "nao");
  list.sort((a,b) => {
    if (sort === "total") return (a.total_estimado||9e9) - (b.total_estimado||9e9);
    if (sort === "nota" || sort === "ranking") {
      const ns = (b.nota_qualidade||0) - (a.nota_qualidade||0);
      if (ns) return ns;
      const order = {visitar:0, talvez:1, pular:2};
      const vs = (order[a.veredito]??9) - (order[b.veredito]??9);
      if (vs) return vs;
      return (a.total_estimado||9e9) - (b.total_estimado||9e9);
    }
    if (sort === "mar") {
      const am = a.distancia_mar_metros, bm = b.distancia_mar_metros;
      if (am == null && bm == null) return 0;
      if (am == null) return 1;
      if (bm == null) return -1;
      return am - bm;
    }
    const ca = (a.nota_qualidade||0) / Math.max(a.total_estimado||1,1);
    const cb = (b.nota_qualidade||0) / Math.max(b.total_estimado||1,1);
    return cb - ca;
  });
  return list;
}

function rankRow(c, pos) {
  const muted = c.veredito === "pular" ? " muted" : "";
  const dist = c.distancia_mar ? c.distancia_mar : "não informada";
  const razao = c.razao || (c.analise || "").split(/(?<=[.!?])\s+/)[0] || c.titulo;
  const marked = getEscolha(c.id);
  const markClass = marked === "sim" ? " marked-sim" : marked === "nao" ? " marked-nao" : "";
  return `<article class="rank-row${muted}${markClass}" data-house-id="${c.id}">
    <div class="rank-pos">#${pos}</div>
    <div class="rank-score"><strong>${c.nota_qualidade}</strong><span>/10</span></div>
    <div class="rank-main">
      <div class="rank-top">
        <span class="badge ${c.veredito}">${c.veredito}</span>
        <span class="rank-place">${c.cidade} · ${val(c.bairro)}</span>
      </div>
      <div class="rank-title">${c.titulo}</div>
      <div class="rank-meta">${money(c.total_estimado)} · ${val(c.quartos)} q · 🌊 ${dist}</div>
      <div class="rank-reason">${razao}</div>
      ${escolhaButtons(c.id)}
    </div>
    <div class="rank-actions">
      <a href="${c.url}" target="_blank" rel="noopener">Anúncio</a>
    </div>
  </article>`;
}

function card(c) {
  const foto = c.foto
    ? `<img src="${c.foto}" alt="${c.titulo}" loading="lazy">`
    : `<div class="ph">Sem foto</div>`;
  const pros = (c.pros||[]).map(p => `<li>${p}</li>`).join("") || "<li>não informado</li>";
  const cons = (c.contras||[]).map(p => `<li>${p}</li>`).join("") || "<li>não informado</li>";
  const taxas = c.taxas || {};
  const taxaBits = [
    taxas.condo != null ? `cond. ${money(taxas.condo)}` : null,
    taxas.iptu != null ? `IPTU ${money(taxas.iptu)}` : null,
    taxas.lixo != null ? `lixo ${money(taxas.lixo)}` : null
  ].filter(Boolean).join(" · ") || "taxas: não informado";
  const marked = getEscolha(c.id);
  const markClass = marked === "sim" ? " marked-sim" : marked === "nao" ? " marked-nao" : "";
  return `<article class="card${markClass}" data-house-id="${c.id}">
    ${foto}
    <div class="body">
      <div class="meta">
        <div>
          <div class="city">${c.cidade} · ${val(c.bairro)} · ${val(c.fonte)}</div>
          <h2>${c.titulo}</h2>
        </div>
        <span class="badge ${c.veredito}">${c.veredito}</span>
      </div>
      <div class="sea ${c.distancia_mar ? 'has' : 'missing'}">${c.distancia_mar ? `🌊 ${c.distancia_mar}` : '🌊 Distância do mar: não informada'}</div>
      ${escolhaButtons(c.id)}
      <div class="nums">
        <div><strong>${money(c.total_estimado)}</strong><span>total est.</span></div>
        <div><strong>${val(c.quartos)} q</strong><span>${val(c.banheiros)} banheiros</span></div>
        <div><strong>${val(c.nota_qualidade)}</strong><span>nota QoL</span></div>
      </div>
      <div class="note">Aluguel ${money(c.aluguel)} · ${taxaBits}<br>
      Anual: ${val(c.anual)} · Disp.: ${val(c.disponibilidade)} · Pets: ${val(c.pets)} · Mobiliado: ${val(c.mobiliado)} · Área: ${c.area_m2 ? c.area_m2+" m²" : "não informado"}</div>
      <p class="analise">${val(c.analise)}</p>
      <div>
        <strong>Prós</strong>
        <ul class="list pros">${pros}</ul>
      </div>
      <div>
        <strong>Contras</strong>
        <ul class="list cons">${cons}</ul>
      </div>
      <div class="actions">
        <a href="${c.url}" target="_blank" rel="noopener">Ver anúncio original</a>
        <span class="note">visto ${val(c.visto_em)}</span>
      </div>
    </div>
  </article>`;
}

function updateEscolhaUI() {
  const ativos = casas.filter(c => c.status === "ativo");
  const { sim, nao, pend } = escolhaCounts(ativos);
  document.getElementById("escolhaCounters").textContent =
    `Sim ${sim} · Não ${nao} · Pendentes ${pend}`;
}

function render() {
  const list = filtered();
  document.getElementById("count").textContent = `${list.length} casa(s)`;
  updateEscolhaUI();
  const view = document.getElementById("viewMode").value;
  const rankingEl = document.getElementById("ranking");
  const gridEl = document.getElementById("grid");
  if (view === "ranking") {
    rankingEl.hidden = false;
    gridEl.hidden = true;
    rankingEl.innerHTML = list.length
      ? `<div class="ranking-head"><h2>Ranking geral</h2><p class="note">Ordenado por nota (maior → menor). Empate: visitar → talvez → pular, depois menor total. Use Sim/Não para filtrar.</p></div>` +
        list.map((c,i) => rankRow(c, i+1)).join("")
      : `<div class="empty">Nenhuma casa com esses filtros.</div>`;
    gridEl.innerHTML = "";
  } else {
    rankingEl.hidden = true;
    gridEl.hidden = false;
    rankingEl.innerHTML = "";
    gridEl.innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="empty">Nenhuma casa com esses filtros.</div>`;
  }
}

async function exportEscolhas() {
  const simIds = Object.keys(escolhas).filter((id) => escolhas[id] === "sim");
  const byId = Object.fromEntries(casas.map((c) => [c.id, c]));
  const simCasas = simIds.map((id) => byId[id]).filter(Boolean);
  const payload = {
    versao: 1,
    exportado_em: new Date().toISOString(),
    escolhas,
    sim: simCasas.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      cidade: c.cidade,
      bairro: c.bairro,
      total_estimado: c.total_estimado,
      nota_qualidade: c.nota_qualidade,
      url: c.url
    }))
  };
  const text = JSON.stringify(payload, null, 2);
  const lines = [
    `Minhas casas SIM (${simCasas.length})`,
    ...simCasas.map((c, i) =>
      `${i + 1}. [${c.nota_qualidade}] ${c.cidade} · ${c.bairro || ""} — ${c.titulo} — ${money(c.total_estimado)}\n   ${c.url}`
    ),
    "",
    "--- JSON para importar ---",
    text
  ].join("\n");
  try {
    await navigator.clipboard.writeText(lines);
    flashMsg(`Copiado: ${simCasas.length} Sim (+ JSON completo).`);
  } catch {
    // fallback prompt
    window.prompt("Copie suas escolhas:", lines);
    flashMsg("JSON exibido para copiar.");
  }
}

function importEscolhas() {
  const raw = window.prompt("Cole o JSON exportado (ou só o objeto {\"id\":\"sim\",...}):");
  if (raw == null || !raw.trim()) return;
  try {
    let parsed = JSON.parse(raw.trim());
    let map = parsed;
    if (parsed && parsed.escolhas && typeof parsed.escolhas === "object") map = parsed.escolhas;
    if (!map || typeof map !== "object" || Array.isArray(map)) throw new Error("formato");
    const cleaned = {};
    for (const [k, v] of Object.entries(map)) {
      if (v === "sim" || v === "nao") cleaned[k] = v;
    }
    escolhas = cleaned;
    saveEscolhas();
    render();
    const { sim, nao } = escolhaCounts(casas.filter((c) => c.status === "ativo"));
    flashMsg(`Importado: Sim ${sim} · Não ${nao}.`);
  } catch (e) {
    flashMsg("Não deu para importar — cole um JSON válido.");
  }
}

boot();
