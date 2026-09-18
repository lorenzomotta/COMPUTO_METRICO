/**
 * «USA VOCE ESISTENTE» dal popup ASSOCIA VOCE E PREZZO:
 * elenco voci del computo con la stessa unità, poi sposta le misurazioni
 * sulla voce scelta e aggiorna le vocibreve nei moduli registrati.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

const STORAGE_MODULI_RETARGET = [
  "computo_metrico_vani_registrati",
  "computo_metrico_camminamenti_registrati",
  "computo_metrico_perimetrali_registrati",
  "computo_metrico_elevazione_registrati",
  "computo_metrico_solai_interni_registrati",
  "computo_metrico_solai_inclinati_registrati",
  "computo_metrico_strade_registrati",
];

const KEYS_VOCEBREVE = new Set(["vocibreve", "vocibreveTrave"]);

export function abbrevKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

export function unitaKey(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function testoBreveVoce(voce, maxLen = 90) {
  const t = String(voce ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
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
 * @param {object[]} voci
 * @param {{ escludiIdVoce: number|null, unitaRaw: string }} opts
 */
export function filtraVociStessaUnita(voci, { escludiIdVoce, unitaRaw }) {
  const want = unitaKey(unitaRaw);
  if (!want) return [];
  const list = Array.isArray(voci) ? voci : [];
  return list
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (typeof item.idVoce !== "number") return false;
      if (escludiIdVoce != null && item.idVoce === escludiIdVoce) return false;
      if (unitaKey(item.unitaMisura) !== want) return false;
      const testo = String(item.voce ?? "").trim();
      const ab = String(item.voceAbbreviata ?? "").trim();
      return testo !== "" || ab !== "";
    })
    .sort((a, b) => {
      const pa = Number(a.posizione) || 0;
      const pb = Number(b.posizione) || 0;
      if (pa !== pb) return pa - pb;
      return a.idVoce - b.idVoce;
    });
}

function retargetEsterniIdVoce(raw, ctx) {
  const s = String(raw ?? "").trim();
  if (!s) return s;
  if (abbrevKey(s) === ctx.fromKey) return ctx.toAbbrev;
  if (ctx.fromId != null && s === String(ctx.fromId)) return ctx.toAbbrev;
  return s;
}

function retargetInValue(val, ctx) {
  if (Array.isArray(val)) {
    let changed = false;
    for (const item of val) changed = retargetInValue(item, ctx) || changed;
    return changed;
  }
  if (!val || typeof val !== "object") return false;
  let changed = false;
  for (const key of Object.keys(val)) {
    if (KEYS_VOCEBREVE.has(key) && typeof val[key] === "string") {
      const cur = val[key].trim();
      if (cur && abbrevKey(cur) === ctx.fromKey) {
        val[key] = ctx.toAbbrev;
        changed = true;
      }
    } else if (key === "idVoce" && typeof val[key] === "string") {
      const next = retargetEsterniIdVoce(val[key], ctx);
      if (next !== val[key]) {
        val[key] = next;
        changed = true;
      }
    } else if (val[key] && typeof val[key] === "object") {
      changed = retargetInValue(val[key], ctx) || changed;
    }
  }
  return changed;
}

export function retargetVocibreveNeiModuli({ fromAbbrev, toAbbrev, fromId }) {
  const fromKey = abbrevKey(fromAbbrev);
  const to = String(toAbbrev ?? "").trim();
  if (!fromKey || !to || fromKey === abbrevKey(to)) return false;
  const ctx = { fromKey, toAbbrev: to, fromId };
  let any = false;
  for (const key of STORAGE_MODULI_RETARGET) {
    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch {
      continue;
    }
    if (!raw) continue;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    if (retargetInValue(data, ctx)) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        any = true;
      } catch {
        /* ignore */
      }
    }
  }
  return any;
}

/**
 * Sposta le misurazioni da `fromId` a `toId` e rimuove la voce di partenza.
 * @returns {{ ok: true, voci: object[], fromAbbrev: string, toAbbrev: string, fromId: number, toId: number } | { ok: false, motivo: string }}
 */
export function mergeVoceInEsistente(voci, fromId, toId) {
  if (!Array.isArray(voci)) return { ok: false, motivo: "Elenco voci non valido." };
  if (fromId == null || toId == null || fromId === toId) {
    return { ok: false, motivo: "Seleziona una voce diversa da quella attuale." };
  }
  const from = voci.find((v) => v && v.idVoce === fromId);
  const to = voci.find((v) => v && v.idVoce === toId);
  if (!from || !to) return { ok: false, motivo: "Voce non trovata." };
  if (unitaKey(from.unitaMisura) !== unitaKey(to.unitaMisura)) {
    return { ok: false, motivo: "Le due voci non hanno la stessa unità di misura." };
  }
  const mmFrom = Array.isArray(from.misurazioniManuali) ? from.misurazioniManuali : [];
  const mmTo = Array.isArray(to.misurazioniManuali) ? to.misurazioniManuali : [];
  const next = voci
    .filter((v) => v && v.idVoce !== fromId)
    .map((v) => {
      if (v.idVoce !== toId) return v;
      return { ...v, misurazioniManuali: [...mmTo, ...mmFrom] };
    });
  return {
    ok: true,
    voci: next,
    fromAbbrev: String(from.voceAbbreviata ?? "").trim(),
    toAbbrev: String(to.voceAbbreviata ?? "").trim(),
    fromId,
    toId,
  };
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
    const ab = String(item.voceAbbreviata ?? "").trim() || "—";
    const um = String(item.unitaMisura ?? "").trim() || "—";
    const testo = testoBreveVoce(item.voce);
    btn.innerHTML = `<span class="voce-usa-esistente-item-ab">${escapeHtml(ab)}</span>
      <span class="voce-usa-esistente-item-meta">${escapeHtml(um)} · ${escapeHtml(formatEuroIt(item.prezzo))}</span>
      <span class="voce-usa-esistente-item-testo">${escapeHtml(testo || "—")}</span>`;
    host.appendChild(btn);
  }
}

/**
 * @param {{
 *   getVoci: () => object[],
 *   getEditingId: () => number|null,
 *   getUnita: () => string,
 *   onMerged: (result: { fromAbbrev: string, toAbbrev: string, fromId: number, toId: number, labelTarget: string }) => void,
 * }} opts
 */
export function initVoceUsaEsistente({ getVoci, getEditingId, getUnita, onMerged }) {
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
    const blob = `${item.voceAbbreviata || ""} ${item.voce || ""}`.toLocaleLowerCase("it-IT");
    return blob.includes(q);
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
        ? "Nessuna voce con questa unità di misura."
        : "Nessuna voce corrisponde alla ricerca.";
    }
    if (okEl) okEl.disabled = selectedId == null || !visibili.some((v) => v.idVoce === selectedId);
  }

  function apri() {
    const voci = getVoci() || [];
    const editingId = getEditingId();
    const unita = getUnita() || "";
    selectedId = null;
    itemsCorrenti = filtraVociStessaUnita(voci, { escludiIdVoce: editingId, unitaRaw: unita });
    if (unitaEl) {
      const um = String(unita).trim() || "—";
      unitaEl.textContent = `Unità di misura vincolata: ${um}`;
    }
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
    const label =
      String(target?.voceAbbreviata ?? "").trim() ||
      testoBreveVoce(target?.voce, 60) ||
      `voce ${selectedId}`;
    const ok = window.confirm(
      `Le misurazioni passeranno alla voce «${label}».\nLa voce attuale verrà eliminata.\nContinuare?`,
    );
    if (!ok) return;
    const merged = mergeVoceInEsistente(getVoci() || [], editingId, selectedId);
    if (!merged.ok) {
      window.alert(merged.motivo);
      return;
    }
    try {
      localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(merged.voci));
    } catch {
      window.alert("Impossibile salvare le voci.");
      return;
    }
    retargetVocibreveNeiModuli({
      fromAbbrev: merged.fromAbbrev,
      toAbbrev: merged.toAbbrev,
      fromId: merged.fromId,
    });
    chiudi();
    onMerged?.({
      fromAbbrev: merged.fromAbbrev,
      toAbbrev: merged.toAbbrev,
      fromId: merged.fromId,
      toId: merged.toId,
      labelTarget: label,
    });
  });
}
