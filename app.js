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

let casas = [];

async function boot() {
  const res = await fetch("./data.json", { cache: "no-store" });
  const data = await res.json();
  casas = data.casas || [];
  document.getElementById("atualizado").textContent = fmtDate(data.atualizado_em);
  renderStats(casas);
  document.getElementById("cidade").addEventListener("change", render);
  document.getElementById("veredito").addEventListener("change", render);
  document.getElementById("maxTotal").addEventListener("input", render);
  document.getElementById("minQuartos").addEventListener("change", render);
  document.getElementById("sort").addEventListener("change", render);
  document.getElementById("reset").addEventListener("click", () => {
    document.getElementById("cidade").value = "";
    document.getElementById("veredito").value = "";
    document.getElementById("maxTotal").value = "";
    document.getElementById("minQuartos").value = "";
    document.getElementById("sort").value = "custo";
    render();
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
  document.getElementById("statBest").textContent = barata
    ? `${money(barata.total_estimado)} · ${barata.bairro}`
    : "—";
}

function filtered() {
  const cidade = document.getElementById("cidade").value;
  const veredito = document.getElementById("veredito").value;
  const maxTotal = Number(document.getElementById("maxTotal").value || Infinity);
  const minQuartos = Number(document.getElementById("minQuartos").value || 0);
  const sort = document.getElementById("sort").value;
  let list = casas.filter(c => c.status === "ativo");
  if (cidade) list = list.filter(c => c.cidade === cidade);
  if (veredito) list = list.filter(c => c.veredito === veredito);
  list = list.filter(c => (c.total_estimado ?? Infinity) <= maxTotal);
  list = list.filter(c => (c.quartos ?? 0) >= minQuartos || minQuartos === 0);
  list.sort((a,b) => {
    if (sort === "total") return (a.total_estimado||9e9) - (b.total_estimado||9e9);
    if (sort === "nota") return (b.nota_qualidade||0) - (a.nota_qualidade||0);
    // custo-benefício = nota / total
    const ca = (a.nota_qualidade||0) / Math.max(a.total_estimado||1,1);
    const cb = (b.nota_qualidade||0) / Math.max(b.total_estimado||1,1);
    return cb - ca;
  });
  return list;
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
  return `<article class="card">
    ${foto}
    <div class="body">
      <div class="meta">
        <div>
          <div class="city">${c.cidade} · ${val(c.bairro)} · ${val(c.fonte)}</div>
          <h2>${c.titulo}</h2>
        </div>
        <span class="badge ${c.veredito}">${c.veredito}</span>
      </div>
      <div class="nums">
        <div><strong>${money(c.total_estimado)}</strong><span>total est.</span></div>
        <div><strong>${val(c.quartos)} q</strong><span>${val(c.banheiros)} banheiros</span></div>
        <div><strong>${val(c.nota_qualidade)}</strong><span>nota QoL</span></div>
      </div>
      <div class="note">Aluguel ${money(c.aluguel)} · ${taxaBits}<br>
      Anual: ${val(c.anual)} · Praia: ${val(c.praia_declarada)} · Disp.: ${val(c.disponibilidade)} · Pets: ${val(c.pets)} · Mobiliado: ${val(c.mobiliado)} · Área: ${c.area_m2 ? c.area_m2+" m²" : "não informado"}</div>
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

function render() {
  const list = filtered();
  document.getElementById("count").textContent = `${list.length} casa(s)`;
  document.getElementById("grid").innerHTML = list.length
    ? list.map(card).join("")
    : `<div class="empty">Nenhuma casa com esses filtros.</div>`;
}

boot();
