/**
 * «USA VOCE ESISTENTE» dal popup ASSOCIA VOCE E PREZZO:
 * elenco delle voci estese già scritte nel computo.
 * La scelta copia testo e prezzo sulla voce breve attuale, senza eliminarla.
 * Più voci brevi possono così usare lo stesso testo esteso.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatEuroIt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Una riga per ogni testo esteso diverso (il campo VOCE), non per voce breve.
 * La voce che stai modificando non compare. Il prezzo è quello della prima voce
 * con quel testo.
 * @param {object[]} voci
 * @param {{ escludiIdVoce: number|null }} opts
 */
export function elencoVociEstese(voci, { escludiIdVoce }) {
  const list = Array.isArray(voci) ? voci : [];
  /** @type {Map<string, { idVoce: number, voce: string, prezzo: number, nBrevi: number, posizione: number }>} */
  const groups = new Map();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.idVoce !== "number") continue;
    if (escludiIdVoce != null && item.idVoce === escludiIdVoce) continue;
    const testo = String(item.voce ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!testo) continue;
    const key = testo.toLocaleLowerCase("it-IT");
    const prezzo = Number(item.prezzo);
    const posizione = Number(item.posizione) || 0;
    const prev = groups.get(key);
    if (!prev) {
      groups.set(key, {
        idVoce: item.idVoce,
        voce: testo,
        prezzo: Number.isFinite(prezzo) ? prezzo : 0,
        nBrevi: 1,
        posizione,
      });
      continue;
    }
    prev.nBrevi += 1;
    if (posizione < prev.posizione) {
      prev.posizione = posizione;
      prev.idVoce = item.idVoce;
      prev.prezzo = Number.isFinite(prezzo) ? prezzo : prev.prezzo;
    }
  }
  return [...groups.values()].sort((a, b) => a.voce.localeCompare(b.voce, "it"));
}

function renderLista(host, items, selectedId) {
  if (!host) return;
  host.replaceChildren();
  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "voce-usa-esistente-item";
    btn.dataset.idVoce = String(item.idVoce);
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", selectedId === item.idVoce ? "true" : "false");
    if (selectedId === item.idVoce) btn.classList.add("is-selected");
    const testo = String(item.voce ?? "").trim();
    const nBrevi = Number(item.nBrevi) || 1;
    const usata = nBrevi > 1 ? ` · già usata da ${nBrevi} voci brevi` : "";
    btn.innerHTML = `<span class="voce-usa-esistente-item-testo">${escapeHtml(testo)}</span>
      <span class="voce-usa-esistente-item-meta">${escapeHtml(formatEuroIt(item.prezzo))}${escapeHtml(usata)}</span>`;
    host.appendChild(btn);
  }
}

/**
 * @param {{
 *   getVoci: () => object[],
 *   getEditingId: () => number|null,
 *   onScelta: (result: { voce: string, prezzo: number }) => void,
 * }} opts
 */
export function initVoceUsaEsistente({ getVoci, getEditingId, onScelta }) {
  const dialogEl = document.querySelector("#voce-usa-esistente-dialog");
  const formEl = document.querySelector("#voce-usa-esistente-form");
  const filtroEl = document.querySelector("#voce-usa-esistente-filtro");
  const listaEl = document.querySelector("#voce-usa-esistente-lista");
  const vuotoEl = document.querySelector("#voce-usa-esistente-vuoto");
  const unitaEl = document.querySelector("#voce-usa-esistente-unita");
  const cancelEl = document.querySelector("#voce-usa-esistente-cancel");
  const okEl = document.querySelector("#voce-usa-esistente-ok");
  const openBtnEl = document.querySelector("#voce-btn-usa-esistente");
  if (!dialogEl || !openBtnEl) return;

  let selectedId = /** @type {number|null} */ (null);
  let itemsCorrenti = [];

  function passaFiltro(item, q) {
    if (!q) return true;
    return String(item.voce || "")
      .toLocaleLowerCase("it-IT")
      .includes(q);
  }

  function refreshLista() {
    const q = String(filtroEl?.value ?? "")
      .trim()
      .toLocaleLowerCase("it-IT");
    const visibili = itemsCorrenti.filter((item) => passaFiltro(item, q));
    renderLista(listaEl, visibili, selectedId);
    if (vuotoEl) {
      const nessunaInUnita = itemsCorrenti.length === 0;
      vuotoEl.hidden = visibili.length > 0;
      vuotoEl.textContent = nessunaInUnita
        ? "Nessuna voce estesa già scritta nel computo."
        : "Nessuna voce corrisponde alla ricerca.";
    }
    if (okEl) okEl.disabled = selectedId == null || !visibili.some((v) => v.idVoce === selectedId);
  }

  function apri() {
    const voci = getVoci() || [];
    const editingId = getEditingId();
    selectedId = null;
    itemsCorrenti = elencoVociEstese(voci, { escludiIdVoce: editingId });
    if (unitaEl) unitaEl.hidden = true;
    if (filtroEl) filtroEl.value = "";
    refreshLista();
    if (typeof dialogEl.showModal === "function") dialogEl.showModal();
    setTimeout(() => filtroEl?.focus(), 0);
  }

  function chiudi() {
    if (dialogEl.open) dialogEl.close();
  }

  openBtnEl.addEventListener("click", () => {
    const editingId = getEditingId();
    if (editingId == null) return;
    apri();
  });

  cancelEl?.addEventListener("click", () => chiudi());

  filtroEl?.addEventListener("input", () => refreshLista());

  listaEl?.addEventListener("click", (event) => {
    const btn = event.target.closest(".voce-usa-esistente-item");
    if (!btn) return;
    const id = Number(btn.dataset.idVoce);
    if (Number.isNaN(id)) return;
    selectedId = id;
    refreshLista();
  });

  listaEl?.addEventListener("dblclick", (event) => {
    const btn = event.target.closest(".voce-usa-esistente-item");
    if (!btn || !okEl || okEl.disabled) return;
    formEl?.requestSubmit();
  });

  formEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const editingId = getEditingId();
    if (editingId == null || selectedId == null) return;
    const target = itemsCorrenti.find((v) => v.idVoce === selectedId);
    const voce = String(target?.voce ?? "").trim();
    if (!voce) return;
    chiudi();
    onScelta?.({ voce, prezzo: Number(target.prezzo) || 0 });
  });
}
