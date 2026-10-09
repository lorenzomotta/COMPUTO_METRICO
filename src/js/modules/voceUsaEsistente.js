/**
 * «USA VOCE ESISTENTE» dal popup ASSOCIA VOCE E PREZZO:
 * elenco delle voci già presenti in CAPITOLATO.
 * La scelta copia testo, unità e prezzo sulla voce breve attuale, senza eliminarla.
 * Più voci brevi possono così usare lo stesso testo esteso.
 */

import { elencoCapitolato } from "./capitolato.js";

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

function renderLista(host, items, selectedChiave) {
  if (!host) return;
  host.replaceChildren();
  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "voce-usa-esistente-item";
    btn.dataset.chiave = String(item.chiave);
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", selectedChiave === item.chiave ? "true" : "false");
    if (selectedChiave === item.chiave) btn.classList.add("is-selected");
    const testo = String(item.voce ?? "").trim();
    const nBrevi = Number(item.nBrevi);
    const quante = Number.isFinite(nBrevi) ? nBrevi : 1;
    const usata = quante > 1 ? ` · già usata da ${quante} voci brevi` : "";
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

  let selectedChiave = /** @type {string|null} */ (null);
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
    renderLista(listaEl, visibili, selectedChiave);
    if (vuotoEl) {
      const nessunaInCapitolato = itemsCorrenti.length === 0;
      vuotoEl.hidden = visibili.length > 0;
      vuotoEl.textContent = nessunaInCapitolato
        ? "Nessuna voce presente nel capitolato."
        : "Nessuna voce corrisponde alla ricerca.";
    }
    if (okEl) okEl.disabled = selectedChiave == null || !visibili.some((v) => v.chiave === selectedChiave);
  }

  function apri() {
    const voci = getVoci() || [];
    selectedChiave = null;
    itemsCorrenti = elencoCapitolato(voci);
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
    const chiave = String(btn.dataset.chiave || "");
    if (!chiave) return;
    selectedChiave = chiave;
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
    if (editingId == null || selectedChiave == null) return;
    const target = itemsCorrenti.find((v) => v.chiave === selectedChiave);
    const voce = String(target?.voce ?? "").trim();
    if (!voce) return;
    chiudi();
    onScelta?.({
      voce,
      prezzo: Number(target.prezzo) || 0,
      unitaMisura: String(target.unitaMisura ?? "").trim(),
    });
  });
}
