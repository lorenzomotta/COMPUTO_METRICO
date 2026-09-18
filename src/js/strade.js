/**
 * STRADE — UI (superfici, sede, segnaletica, fogna, luci, gas, acqua).
 */

import {
  ARCHIVIO_PIANI_MISURA_STORAGE_KEY,
  tryEnsurePianoInArchivio,
  risolviBlurCampoPianoArchivioStorage,
  popolaDatalistArchivioPianiMisura,
} from "./modules/archivioPianiMisura.js";
import { popolaDatalistVocibrevi } from "./modules/archivioVociVocibrevi.js";
import {
  aggiornaVociDaSnapshotStrade,
  rimuoviRigheMisurazioniPerSchedaStrade,
} from "./modules/stradeRegistroAggiornaVoci.js";
import {
  TIPI_ZONA_STRADA,
  ZONA_LABELS,
  emptyAreaStrada,
  duplicaAreaStrada,
  emptyStratoStrada,
  emptySottrazioneStrato,
  emptySchedaStrade,
  sanificaSchedaStrade,
  cloneSchedaPerSnapshot,
  rinumeraAreeZona,
  rinumeraStratiZona,
  rinumeraSottrazioniStrato,
  renderZonaStradaPanel,
  syncZonaDaBlock,
  aggiornaCalcoliZonaBlock,
  zonaHaVoceStrato,
  maxIdNelloScheda,
  isZonaSedeStradale,
  isZonaCordoli,
  isZonaFormulaUnitaVoce,
  totaliSedeStradale,
} from "./modules/stradeSuperfici.js";

const STORAGE_STRADE_REGISTRATI_KEY = "computo_metrico_strade_registrati";
const DATALIST_VOCI = "strade-vocibrevi-datalist";

let nextId = 1;
let pianoNome = "";
let descrizione = "";
/** @type {'ingombro'|'marciapiedi'|'aiuole'|'parcheggi'|'manufatti'|'cordoli'|'segnaletica'|'fogna'|'lucePubblica'|'lucePrivata'|'gas'|'acqua'|'sedeStradale'} */
let schedaAttiva = "ingombro";
let scheda = emptySchedaStrade(() => nextId++);
/** @type {{ id: string, pianoNome: string, descrizione: string }[]} */
let registrati = [];
let schedaBozzaCollegataId = null;
let feedbackTimer = 0;
let eliminaPending = null;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadRegistrati() {
  try {
    const raw = localStorage.getItem(STORAGE_STRADE_REGISTRATI_KEY);
    if (!raw) {
      registrati = [];
      return;
    }
    const data = JSON.parse(raw);
    registrati = Array.isArray(data?.items) ? data.items : [];
  } catch {
    registrati = [];
  }
}

function saveRegistrati() {
  try {
    localStorage.setItem(
      STORAGE_STRADE_REGISTRATI_KEY,
      JSON.stringify({ v: 1, items: registrati }),
    );
  } catch {
    /* ignore */
  }
}

function mostraFeedback(msg) {
  const el = document.getElementById("strade-registra-feedback");
  if (!el) return;
  el.textContent = msg || "";
  window.clearTimeout(feedbackTimer);
  if (msg) {
    feedbackTimer = window.setTimeout(() => {
      el.textContent = "";
    }, 3500);
  }
}

function nuovaSchedaId() {
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function zonaAttiva() {
  return scheda[schedaAttiva];
}

function syncBozzaDaDom() {
  const host = document.getElementById("strade-gerarchia-host");
  const pianoInp = host?.querySelector(".strade-piano-nome");
  const descInp = host?.querySelector(".strade-descrizione");
  if (pianoInp instanceof HTMLInputElement) pianoNome = pianoInp.value;
  if (descInp instanceof HTMLInputElement) descrizione = descInp.value;
  const block = host?.querySelector(".strade-sup-block");
  if (block instanceof HTMLElement) {
    const tipo = String(block.dataset.tipoZona || "");
    if (TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (tipo))) {
      syncZonaDaBlock(block, scheda[tipo]);
    }
  }
}

function creaSnapshotRegistrato() {
  const id = schedaBozzaCollegataId || nuovaSchedaId();
  const zone = cloneSchedaPerSnapshot(scheda);
  return {
    id,
    pianoNome: String(pianoNome || "").trim(),
    descrizione: String(descrizione || "").trim(),
    ...zone,
  };
}

function resetBozza() {
  pianoNome = "";
  descrizione = "";
  schedaAttiva = "ingombro";
  scheda = emptySchedaStrade(() => nextId++);
  schedaBozzaCollegataId = null;
}

function applicaRecordComeBozza(rec) {
  schedaBozzaCollegataId = String(rec.id || "");
  pianoNome = typeof rec.pianoNome === "string" ? rec.pianoNome : "";
  descrizione = typeof rec.descrizione === "string" ? rec.descrizione : "";
  scheda = sanificaSchedaStrade(rec, () => nextId++);
  const max = maxIdNelloScheda(scheda);
  if (max >= nextId) nextId = max + 1;
}

function aggiornaSidebarAzioniAttive() {
  const nav = document.getElementById("strade-sidebar-azioni");
  if (!nav) return;
  const label = document.getElementById("strade-sidebar-azioni-label");
  const nomeZona = ZONA_LABELS[schedaAttiva] || schedaAttiva;
  if (label) label.textContent = nomeZona;
  const sede = isZonaSedeStradale(schedaAttiva);
  nav.querySelectorAll("button.vani-sidebar-azione").forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    const azione = btn.getAttribute("data-sidebar-azione");
    const disabilita = sede && (azione === "aggiungi-area" || azione === "aggiungi-sottrazione");
    btn.disabled = disabilita;
    btn.setAttribute("aria-disabled", String(disabilita));
    if (azione === "aggiungi-area") {
      btn.title = sede
        ? "Nella Sede stradale le aree si calcolano da sole"
        : isZonaCordoli(schedaAttiva)
          ? `Aggiunge una lunghezza in ${nomeZona}`
          : isZonaFormulaUnitaVoce(schedaAttiva)
            ? `Aggiunge un calcolo in ${nomeZona}`
            : `Aggiunge un’area in ${nomeZona}`;
    } else if (azione === "aggiungi-strato") {
      btn.title = `Aggiunge uno strato in ${nomeZona}`;
    } else if (azione === "aggiungi-sottrazione") {
      btn.title = sede
        ? "Nella Sede stradale non si aggiungono sottrazioni per strato"
        : `Aggiunge una sottrazione sull’ultimo strato di ${nomeZona}`;
    }
  });
}

function renderSidebarLista() {
  const ul = document.getElementById("strade-sidebar-list");
  if (!ul) return;
  if (registrati.length === 0) {
    ul.innerHTML = `<li class="vani-sidebar-empty">Nessuna scheda registrata.</li>`;
    return;
  }
  ul.innerHTML = registrati
    .map((rec) => {
      const titolo = escapeHtml(`${rec.pianoNome || "—"} · ${rec.descrizione || "strada"}`);
      return `<li class="vani-sidebar-row">
        <button type="button" class="vani-sidebar-item" data-action="edit" data-id="${escapeHtml(rec.id)}" title="Apri in modifica">${titolo}</button>
        <button type="button" class="btn-action btn-delete vani-sidebar-elimina" data-action="delete" data-id="${escapeHtml(rec.id)}" title="Elimina">✕</button>
      </li>`;
    })
    .join("");
}

function renderSchedeTabs() {
  const nav = document.createElement("div");
  nav.className = "vani-schede-tabs";
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Parti della strada");
  for (const tipo of TIPI_ZONA_STRADA) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vani-scheda-tab" + (schedaAttiva === tipo ? " is-active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(schedaAttiva === tipo));
    btn.dataset.action = "seleziona-scheda-strada";
    btn.dataset.scheda = tipo;
    btn.id = `strade-scheda-tab-${tipo}`;
    btn.textContent = ZONA_LABELS[tipo];
    nav.appendChild(btn);
  }
  return nav;
}

function renderForm() {
  const host = document.getElementById("strade-gerarchia-host");
  if (!host) return;
  host.innerHTML = "";

  const top = document.createElement("div");
  top.className = "vani-top-row strade-top-row";
  top.innerHTML = `
    <label class="field">
      <span>Piano</span>
      <input type="text" class="strade-piano-nome" list="datalist-piani-misura-archivio" autocomplete="off" value="${escapeHtml(pianoNome)}" placeholder="es. Esterni, Piano terra" />
    </label>
    <label class="field">
      <span>Strada / tratto</span>
      <input type="text" class="strade-descrizione" autocomplete="off" value="${escapeHtml(descrizione)}" placeholder="es. Via Roma, tratto nord…" />
    </label>`;
  host.appendChild(top);
  host.appendChild(renderSchedeTabs());
  host.appendChild(
    renderZonaStradaPanel({
      tipo: schedaAttiva,
      zona: scheda[schedaAttiva],
      datalistId: DATALIST_VOCI,
      schedaCompleta: scheda,
    }),
  );
  aggiornaSidebarAzioniAttive();
}

function refreshAll() {
  renderForm();
  renderSidebarLista();
}

function onRegistra() {
  syncBozzaDaDom();
  const snap = creaSnapshotRegistrato();
  if (!snap.pianoNome) {
    mostraFeedback("Indica il piano.");
    document.querySelector("#vista-strade .strade-piano-nome")?.focus();
    return;
  }
  const haVoce = TIPI_ZONA_STRADA.some((tipo) => zonaHaVoceStrato(snap[tipo]));
  if (!haVoce) {
    mostraFeedback("Inserisci almeno una voce su uno strato.");
    return;
  }

  const idx = registrati.findIndex((r) => r.id === snap.id);
  if (idx >= 0) registrati[idx] = snap;
  else registrati.push(snap);
  saveRegistrati();
  tryEnsurePianoInArchivio(snap.pianoNome, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
  aggiornaVociDaSnapshotStrade(snap);
  schedaBozzaCollegataId = snap.id;
  mostraFeedback("Strada registrata. VOCI aggiornate.");
  renderSidebarLista();
}

function chiediElimina(id) {
  eliminaPending = id;
  const dlg = document.getElementById("strade-conferma-elimina-dialog");
  const msg = document.getElementById("strade-conferma-elimina-msg");
  const rec = registrati.find((r) => r.id === id);
  if (msg) {
    msg.textContent = rec
      ? `Eliminare la strada «${rec.pianoNome || "—"} · ${rec.descrizione || ""}»? Le misure collegate alle VOCI verranno rimosse.`
      : "Eliminare questa scheda?";
  }
  if (dlg && typeof dlg.showModal === "function") dlg.showModal();
}

function confermaElimina() {
  const id = eliminaPending;
  eliminaPending = null;
  const dlg = document.getElementById("strade-conferma-elimina-dialog");
  if (dlg && typeof dlg.close === "function") dlg.close();
  if (!id) return;
  registrati = registrati.filter((r) => r.id !== id);
  saveRegistrati();
  rimuoviRigheMisurazioniPerSchedaStrade(id);
  if (schedaBozzaCollegataId === id) resetBozza();
  refreshAll();
  mostraFeedback("Scheda eliminata.");
}

function onHostInput(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const block = t.closest(".strade-sup-block");
  if (!block) return;
  const tipo = String(block.dataset.tipoZona || "");
  if (!TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (tipo))) return;
  syncZonaDaBlock(block, scheda[tipo]);
  const mqOverride = isZonaSedeStradale(tipo) ? totaliSedeStradale(scheda).mqNetto : undefined;
  aggiornaCalcoliZonaBlock(block, scheda[tipo], mqOverride);
}

function onHostChange(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const block = t.closest(".strade-sup-block");
  if (!block) return;
  const tipo = String(block.dataset.tipoZona || "");
  if (!TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (tipo))) return;
  syncZonaDaBlock(block, scheda[tipo]);
  const mqOverride = isZonaSedeStradale(tipo) ? totaliSedeStradale(scheda).mqNetto : undefined;
  aggiornaCalcoliZonaBlock(block, scheda[tipo], mqOverride);
}

function onHostClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("button[data-action]") : null;
  if (!btn) return;
  const action = btn.getAttribute("data-action");

  if (action === "seleziona-scheda-strada") {
    const tipo = String(btn.getAttribute("data-scheda") || "");
    if (!TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (tipo))) return;
    syncBozzaDaDom();
    schedaAttiva = /** @type {typeof schedaAttiva} */ (tipo);
    renderForm();
    queueMicrotask(() => {
      document.getElementById(`strade-scheda-tab-${tipo}`)?.focus();
    });
    return;
  }

  const tipo = String(btn.getAttribute("data-tipo-zona") || schedaAttiva);
  if (!TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (tipo))) return;
  syncBozzaDaDom();
  const zona = scheda[tipo];

  if (action === "rimuovi-area-strada") {
    if (isZonaSedeStradale(tipo)) return;
    const aid = Number(btn.getAttribute("data-area-id"));
    if ((zona.aree || []).length <= 1) return;
    zona.aree = zona.aree.filter((a) => a.id !== aid);
    rinumeraAreeZona(zona);
    renderForm();
    return;
  }
  if (action === "duplica-area-strada") {
    if (isZonaSedeStradale(tipo)) return;
    const aid = Number(btn.getAttribute("data-area-id"));
    const idx = (zona.aree || []).findIndex((a) => a.id === aid);
    if (idx < 0) return;
    const copia = duplicaAreaStrada(zona.aree[idx], () => nextId++, zona.aree.length + 1);
    zona.aree.splice(idx + 1, 0, copia);
    rinumeraAreeZona(zona);
    renderForm();
    queueMicrotask(() => {
      const row = document.querySelector(`.vani-sup-area-row[data-area-id="${copia.id}"] .strade-area-formula`);
      if (row instanceof HTMLInputElement) row.focus();
    });
    return;
  }
  if (action === "rimuovi-strato-strada") {
    const sid = Number(btn.getAttribute("data-strato-id"));
    if ((zona.strati || []).length <= 1) return;
    zona.strati = zona.strati.filter((st) => st.id !== sid);
    rinumeraStratiZona(zona);
    renderForm();
    return;
  }
  if (action === "aggiungi-sottrazione-strato") {
    if (isZonaSedeStradale(tipo)) return;
    const sid = Number(btn.getAttribute("data-strato-id"));
    const st = (zona.strati || []).find((x) => x.id === sid);
    if (!st) return;
    if (!Array.isArray(st.sottrazioni)) st.sottrazioni = [];
    st.sottrazioni.push(emptySottrazioneStrato(() => nextId++, st.sottrazioni.length + 1));
    rinumeraSottrazioniStrato(st);
    renderForm();
    return;
  }
  if (action === "rimuovi-sottrazione-strato") {
    if (isZonaSedeStradale(tipo)) return;
    const sid = Number(btn.getAttribute("data-strato-id"));
    const sottId = Number(btn.getAttribute("data-sott-id"));
    const st = (zona.strati || []).find((x) => x.id === sid);
    if (!st) return;
    st.sottrazioni = (st.sottrazioni || []).filter((s) => s.id !== sottId);
    rinumeraSottrazioniStrato(st);
    renderForm();
  }
}

function onSidebarAzioniClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("[data-sidebar-azione]") : null;
  if (!btn || (btn instanceof HTMLButtonElement && btn.disabled)) return;
  const azione = btn.getAttribute("data-sidebar-azione");
  const tipo = schedaAttiva;
  syncBozzaDaDom();
  const zona = zonaAttiva();
  if (!zona) return;

  if (azione === "aggiungi-area") {
    if (isZonaSedeStradale(tipo)) return;
    zona.aree.push(emptyAreaStrada(() => nextId++, zona.aree.length + 1));
    rinumeraAreeZona(zona);
    renderForm();
    return;
  }
  if (azione === "aggiungi-strato") {
    zona.strati.push(emptyStratoStrada(() => nextId++, zona.strati.length + 1));
    rinumeraStratiZona(zona);
    renderForm();
    return;
  }
  if (azione === "aggiungi-sottrazione") {
    if (isZonaSedeStradale(tipo)) return;
    const st = zona.strati[zona.strati.length - 1];
    if (!st) return;
    if (!Array.isArray(st.sottrazioni)) st.sottrazioni = [];
    st.sottrazioni.push(emptySottrazioneStrato(() => nextId++, st.sottrazioni.length + 1));
    rinumeraSottrazioniStrato(st);
    renderForm();
  }
}

function onSidebarListClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("[data-action]") : null;
  if (!btn) return;
  const id = btn.getAttribute("data-id") || "";
  const action = btn.getAttribute("data-action");
  if (action === "edit") {
    const rec = registrati.find((r) => r.id === id);
    if (!rec) return;
    syncBozzaDaDom();
    applicaRecordComeBozza(rec);
    refreshAll();
    mostraFeedback("Scheda aperta in modifica.");
    return;
  }
  if (action === "delete") {
    chiediElimina(id);
  }
}

export function prepareVistaStrade() {
  loadRegistrati();
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
  popolaDatalistVocibrevi(DATALIST_VOCI);
  resetBozza();
  refreshAll();
}

export function initStradeUi() {
  loadRegistrati();

  document.getElementById("btn-strade-registra")?.addEventListener("click", () => {
    onRegistra();
  });

  document.getElementById("strade-sidebar-azioni")?.addEventListener("click", onSidebarAzioniClick);
  document.getElementById("strade-sidebar-list")?.addEventListener("click", onSidebarListClick);

  const host = document.getElementById("strade-gerarchia-host");
  host?.addEventListener("input", onHostInput);
  host?.addEventListener("change", onHostChange);
  host?.addEventListener("click", onHostClick);
  host?.addEventListener(
    "blur",
    (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.classList.contains("strade-piano-nome")) {
        risolviBlurCampoPianoArchivioStorage(t, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
      }
    },
    true,
  );

  document.getElementById("strade-conferma-elimina-annulla")?.addEventListener("click", () => {
    eliminaPending = null;
    const dlg = document.getElementById("strade-conferma-elimina-dialog");
    if (dlg && typeof dlg.close === "function") dlg.close();
  });
  document.getElementById("strade-conferma-elimina-conferma")?.addEventListener("click", () => {
    confermaElimina();
  });

  document.addEventListener("computo-nuovo-iniziato", () => {
    registrati = [];
    resetBozza();
    const shell = document.getElementById("vista-strade");
    if (shell && !shell.hidden) refreshAll();
    else renderSidebarLista();
  });

  document.addEventListener("computo-storage-ripristinato", () => {
    loadRegistrati();
    resetBozza();
    const shell = document.getElementById("vista-strade");
    if (shell && !shell.hidden) refreshAll();
    else renderSidebarLista();
  });
}
