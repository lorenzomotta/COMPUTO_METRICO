/**
 * SOLAI INCLINATI — UI (aree falda, CANALE, sottrai/travi, strati → VOCI).
 */

import {
  ARCHIVIO_PIANI_MISURA_STORAGE_KEY,
  tryEnsurePianoInArchivio,
  risolviBlurCampoPianoArchivioStorage,
  popolaDatalistArchivioPianiMisura,
} from "./modules/archivioPianiMisura.js";
import { popolaDatalistVocibrevi } from "./modules/archivioVociVocibrevi.js";
import {
  aggiornaVociDaSnapshotSolaiInclinati,
  rimuoviRigheMisurazioniPerSchedaSolaiInclinati,
} from "./modules/solaiInclinatiRegistroAggiornaVoci.js";
import {
  emptyAreaFalda,
  emptyStratoFalda,
  emptySuperficieFalda,
  sanificaSuperficieFalda,
  cloneSuperficieFaldaPerSnapshot,
  rinumeraAreeFalda,
  rinumeraStratiFalda,
  renderSolaiInclinatiPanel,
  syncSolaiInclinatiDaBlock,
  aggiornaCalcoliSolaiInclinatiBlock,
} from "./modules/solaiInclinatiSuperfici.js";

const STORAGE_SOLAI_REGISTRATI_KEY = "computo_metrico_solai_inclinati_registrati";
const DATALIST_VOCI = "solai-incl-vocibrevi-datalist";

let nextId = 1;
let pianoNome = "";
let descrizione = "";
/** @type {ReturnType<typeof emptySuperficieFalda>} */
let superficie = emptySuperficieFalda(() => nextId++);
/** @type {{ id: string, pianoNome: string, descrizione: string, aree: object[], strati: object[], note?: string }[]} */
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
    const raw = localStorage.getItem(STORAGE_SOLAI_REGISTRATI_KEY);
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
      STORAGE_SOLAI_REGISTRATI_KEY,
      JSON.stringify({ v: 1, items: registrati }),
    );
  } catch {
    /* ignore */
  }
}

function mostraFeedback(msg) {
  const el = document.getElementById("solai-incl-registra-feedback");
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
  return `sinc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function syncBozzaDaDom() {
  const host = document.getElementById("solai-incl-gerarchia-host");
  const pianoInp = host?.querySelector(".solai-incl-piano-nome");
  const descInp = host?.querySelector(".solai-incl-descrizione");
  if (pianoInp instanceof HTMLInputElement) pianoNome = pianoInp.value;
  if (descInp instanceof HTMLInputElement) descrizione = descInp.value;
  const block = host?.querySelector(".solai-incl-sup-block");
  if (block instanceof HTMLElement) {
    syncSolaiInclinatiDaBlock(block, superficie);
  }
}

function creaSnapshotRegistrato() {
  const id = schedaBozzaCollegataId || nuovaSchedaId();
  const snapSurf = cloneSuperficieFaldaPerSnapshot(superficie);
  return {
    id,
    pianoNome: String(pianoNome || "").trim(),
    descrizione: String(descrizione || "").trim(),
    note: snapSurf.note,
    aree: snapSurf.aree,
    strati: snapSurf.strati,
  };
}

function resetBozza() {
  pianoNome = "";
  descrizione = "";
  superficie = emptySuperficieFalda(() => nextId++);
  schedaBozzaCollegataId = null;
}

function applicaRecordComeBozza(rec) {
  schedaBozzaCollegataId = String(rec.id || "");
  pianoNome = typeof rec.pianoNome === "string" ? rec.pianoNome : "";
  descrizione = typeof rec.descrizione === "string" ? rec.descrizione : "";
  superficie = sanificaSuperficieFalda(
    {
      note: typeof rec.note === "string" ? rec.note : "",
      aree: Array.isArray(rec.aree) ? rec.aree : [],
      strati: Array.isArray(rec.strati) ? rec.strati : [],
    },
    () => nextId++,
  );
}

function renderSidebarLista() {
  const ul = document.getElementById("solai-incl-sidebar-list");
  if (!ul) return;
  if (registrati.length === 0) {
    ul.innerHTML = `<li class="vani-sidebar-empty">Nessuna scheda registrata.</li>`;
    return;
  }
  ul.innerHTML = registrati
    .map((rec) => {
      const titolo = escapeHtml(
        `${rec.pianoNome || "—"} · ${rec.descrizione || "solaio"} · ${(rec.aree || []).length} aree`,
      );
      return `<li class="vani-sidebar-row">
        <button type="button" class="vani-sidebar-item" data-action="edit" data-id="${escapeHtml(rec.id)}" title="Apri in modifica">${titolo}</button>
        <button type="button" class="btn-action btn-delete vani-sidebar-elimina" data-action="delete" data-id="${escapeHtml(rec.id)}" title="Elimina">✕</button>
      </li>`;
    })
    .join("");
}

function renderForm() {
  const host = document.getElementById("solai-incl-gerarchia-host");
  if (!host) return;
  host.innerHTML = "";

  const top = document.createElement("div");
  top.className = "vani-top-row solai-top-row";
  top.innerHTML = `
    <label class="field">
      <span>Piano</span>
      <input type="text" class="solai-incl-piano-nome" list="datalist-piani-misura-archivio" autocomplete="off" value="${escapeHtml(pianoNome)}" placeholder="es. Piano terra" />
    </label>
    <label class="field">
      <span>Descrizione / locale</span>
      <input type="text" class="solai-incl-descrizione" autocomplete="off" value="${escapeHtml(descrizione)}" placeholder="es. Soggiorno, corridoio…" />
    </label>`;
  host.appendChild(top);
  host.appendChild(
    renderSolaiInclinatiPanel({
      superficie,
      datalistId: DATALIST_VOCI,
    }),
  );
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
    document.querySelector("#vista-solai-inclinati .solai-incl-piano-nome")?.focus();
    return;
  }
  const haVoceStrato = (snap.strati || []).some((st) => String(st.vocibreve || "").trim());
  const haVoceTrave = (snap.aree || []).some(
    (a) =>
      a?.segno === true &&
      (a?.traveInSpessore === true || a?.traveInAltezza === true) &&
      String(a.vocibreveTrave || "").trim(),
  );
  if (!haVoceStrato && !haVoceTrave) {
    mostraFeedback("Inserisci almeno una voce (strato o trave).");
    return;
  }

  const idx = registrati.findIndex((r) => r.id === snap.id);
  if (idx >= 0) registrati[idx] = snap;
  else registrati.push(snap);
  saveRegistrati();
  tryEnsurePianoInArchivio(snap.pianoNome, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
  aggiornaVociDaSnapshotSolaiInclinati(snap);
  schedaBozzaCollegataId = snap.id;
  mostraFeedback("Solaio inclinato registrato. VOCI aggiornate.");
  renderSidebarLista();
}

function chiediElimina(id) {
  eliminaPending = id;
  const dlg = document.getElementById("solai-incl-conferma-elimina-dialog");
  const msg = document.getElementById("solai-incl-conferma-elimina-msg");
  const rec = registrati.find((r) => r.id === id);
  if (msg) {
    msg.textContent = rec
      ? `Eliminare il solaio inclinato «${rec.pianoNome || "—"} · ${rec.descrizione || ""}»? Le misure collegate alle VOCI verranno rimosse.`
      : "Eliminare questa scheda?";
  }
  if (dlg && typeof dlg.showModal === "function") dlg.showModal();
}

function confermaElimina() {
  const id = eliminaPending;
  eliminaPending = null;
  const dlg = document.getElementById("solai-incl-conferma-elimina-dialog");
  if (dlg && typeof dlg.close === "function") dlg.close();
  if (!id) return;
  registrati = registrati.filter((r) => r.id !== id);
  saveRegistrati();
  rimuoviRigheMisurazioniPerSchedaSolaiInclinati(id);
  if (schedaBozzaCollegataId === id) resetBozza();
  refreshAll();
  mostraFeedback("Scheda eliminata.");
}

function onHostInput(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const block = t.closest(".solai-incl-sup-block");
  if (!block) return;
  syncSolaiInclinatiDaBlock(block, superficie);
  aggiornaCalcoliSolaiInclinatiBlock(block, superficie);
}

const VOCE_TRAVE_SPESSORE = "TRAVE IN SPESSORE";
const VOCE_TRAVE_ALTEZZA = "TRAVE IN ALTEZZA";

/** Imposta la voce breve della trave in base alle spunte. */
function applicaVoceBreveTraveAutomatica(area, flagAppenaAttivato) {
  if (!area || area.segno !== true) {
    if (area) area.vocibreveTrave = "";
    return;
  }
  if (flagAppenaAttivato === "spessore") {
    area.vocibreveTrave = VOCE_TRAVE_SPESSORE;
    return;
  }
  if (flagAppenaAttivato === "altezza") {
    area.vocibreveTrave = VOCE_TRAVE_ALTEZZA;
    return;
  }
  // Dopo uncheck: se resta una sola opzione, aggiorna la voce; se nessuna, svuota.
  if (area.traveInSpessore === true && area.traveInAltezza !== true) {
    area.vocibreveTrave = VOCE_TRAVE_SPESSORE;
  } else if (area.traveInAltezza === true && area.traveInSpessore !== true) {
    area.vocibreveTrave = VOCE_TRAVE_ALTEZZA;
  } else if (area.traveInSpessore !== true && area.traveInAltezza !== true) {
    area.vocibreveTrave = "";
  }
}

function onHostChange(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const block = t.closest(".solai-incl-sup-block");
  if (block && t.classList.contains("solai-incl-canale")) {
    syncSolaiInclinatiDaBlock(block, superficie);
    return;
  }
  if (
    t.classList.contains("vani-sup-area-segno") ||
    t.classList.contains("solai-trave-spessore") ||
    t.classList.contains("solai-trave-altezza-flag")
  ) {
    const block = t.closest(".solai-incl-sup-block");
    if (!block) return;
    syncSolaiInclinatiDaBlock(block, superficie);

    const areaRow = t.closest(".vani-sup-area-row");
    const aid = areaRow ? Number(areaRow.dataset.areaId) : NaN;
    const area = superficie.aree.find((x) => x.id === aid);

    if (t.classList.contains("vani-sup-area-segno")) {
      if (area && area.segno !== true) {
        area.traveInSpessore = false;
        area.traveInAltezza = false;
        area.vocibreveTrave = "";
        area.altezzaTrave = "";
      }
      renderForm();
      return;
    }

    if (t.classList.contains("solai-trave-spessore") || t.classList.contains("solai-trave-altezza-flag")) {
      const checked = t instanceof HTMLInputElement && t.checked;
      let appena = null;
      if (t.classList.contains("solai-trave-spessore")) {
        if (checked && area) {
          area.traveInSpessore = true;
          area.traveInAltezza = false;
          appena = "spessore";
        } else if (area) {
          area.traveInSpessore = false;
        }
      }
      if (t.classList.contains("solai-trave-altezza-flag")) {
        if (checked && area) {
          area.traveInAltezza = true;
          area.traveInSpessore = false;
          appena = "altezza";
        } else if (area) {
          area.traveInAltezza = false;
        }
      }
      applicaVoceBreveTraveAutomatica(area, appena);
      renderForm();
    }
  }
}

function onHostClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("button[data-action]") : null;
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  if (action === "rimuovi-area-solai-incl") {
    const aid = Number(btn.getAttribute("data-area-id"));
    syncBozzaDaDom();
    if ((superficie.aree || []).length <= 1) return;
    superficie.aree = superficie.aree.filter((a) => a.id !== aid);
    rinumeraAreeFalda(superficie);
    renderForm();
    return;
  }
  if (action === "rimuovi-strato-solai-incl") {
    const sid = Number(btn.getAttribute("data-strato-id"));
    syncBozzaDaDom();
    if ((superficie.strati || []).length <= 1) return;
    superficie.strati = superficie.strati.filter((st) => st.id !== sid);
    rinumeraStratiFalda(superficie);
    renderForm();
  }
}

function onSidebarAzioniClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("[data-sidebar-azione]") : null;
  if (!btn) return;
  const azione = btn.getAttribute("data-sidebar-azione");
  syncBozzaDaDom();
  if (azione === "aggiungi-area") {
    superficie.aree.push(emptyAreaFalda(() => nextId++, superficie.aree.length + 1));
    rinumeraAreeFalda(superficie);
    renderForm();
    return;
  }
  if (azione === "aggiungi-strato") {
    superficie.strati.push(emptyStratoFalda(() => nextId++, superficie.strati.length + 1));
    rinumeraStratiFalda(superficie);
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

export function prepareVistaSolaiInclinati() {
  loadRegistrati();
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
  popolaDatalistVocibrevi(DATALIST_VOCI);
  refreshAll();
}

export function initSolaiInclinatiUi() {
  loadRegistrati();

  document.getElementById("btn-solai-incl-registra")?.addEventListener("click", () => {
    onRegistra();
  });

  document.getElementById("solai-incl-sidebar-azioni")?.addEventListener("click", onSidebarAzioniClick);
  document.getElementById("solai-incl-sidebar-list")?.addEventListener("click", onSidebarListClick);

  const host = document.getElementById("solai-incl-gerarchia-host");
  host?.addEventListener("input", onHostInput);
  host?.addEventListener("change", onHostChange);
  host?.addEventListener("click", onHostClick);
  host?.addEventListener("blur", (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.classList.contains("solai-incl-piano-nome")) {
      risolviBlurCampoPianoArchivioStorage(t, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
    }
  }, true);

  document.getElementById("solai-incl-conferma-elimina-annulla")?.addEventListener("click", () => {
    eliminaPending = null;
    const dlg = document.getElementById("solai-incl-conferma-elimina-dialog");
    if (dlg && typeof dlg.close === "function") dlg.close();
  });
  document.getElementById("solai-incl-conferma-elimina-conferma")?.addEventListener("click", () => {
    confermaElimina();
  });
}
