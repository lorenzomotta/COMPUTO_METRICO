/**
 * ELEVAZIONE: piano + zona/facciata + pareti (strati, flag esterni, aperture).
 */

import {
  getArchivioAperturePerZona,
  getAperturaMasterById,
  getUniqueLocalesForVaniPicker,
} from "./modules/vaniApertureLocales.js";
import {
  ARCHIVIO_PIANI_MISURA_STORAGE_KEY,
  tryEnsurePianoInArchivio,
  risolviBlurCampoPianoArchivioStorage,
  popolaDatalistArchivioPianiMisura,
} from "./modules/archivioPianiMisura.js";
import { popolaDatalistVocibrevi } from "./modules/archivioVociVocibrevi.js";
import {
  aggiornaVociDaSnapshotElevazione,
  rimuoviRigheMisurazioniPerSchedaElevazione,
} from "./modules/elevazioneRegistroAggiornaVoci.js";
import { altezzaInclusaNelloStratoConElevazione, mqAperturaConPercentuale, normalizzaPercentualeApertura } from "./utils/numberUtils.js";

const STORAGE_ELEV_REGISTRATI_KEY = "computo_metrico_elevazione_registrati";
const VOCE_FONDAZIONE_CONTINUA = "FONDAZIONE CONTINUA";

/** Icona «aggiungi apertura» (finestra a croce). */
const ELEV_SVG_FINESTRA =
  '<svg class="vani-icon-finestra" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>';

const PARETE_FLAG_KEYS = [
  "portante",
  "zoccoloEsterno",
  "rusticoEsterno",
  "civileEsterno",
  "rivestimentoEsterno",
  "pitturaEsterna",
  "correa",
];

const PARETE_FLAG_LABELS = {
  portante: "ELEVAZIONE C.A.",
  zoccoloEsterno: "Zoccolo Esterno",
  rusticoEsterno: "Rustico Esterno",
  civileEsterno: "Civile Esterno",
  rivestimentoEsterno: "Rivestimento esterno",
  pitturaEsterna: "Pittura esterna",
  correa: "Correa",
};

const PARETE_FLAG_AUTO_STRATO_NOTE = {
  portante: "elevazione c.a.",
  zoccoloEsterno: "zoccolo esterno",
  rusticoEsterno: "rustico esterno",
  civileEsterno: "civile esterno",
  rivestimentoEsterno: "rivestimento esterno",
  pitturaEsterna: "pittura esterna",
  correa: "correa",
};

/** Note vecchie ancora valide (non creare un secondo strato). */
const PARETE_FLAG_NOTE_ALIASES = {
  portante: ["portante"],
};

const collapsedPareteIds = new Set();
let nextPareteId = 1;
let nextStratoId = 1;
let pianoNome = "";
let zonaNome = "";
/** @type {{ id: number, riferimento: string, lunghezza: string, altezza: string, idApertureMaster: string[], stratifinitura: object[] }[]} */
let pareti = [];
/** @type {{ id: string, pianoNome: string, zonaNome: string, pareti: object[] }[]} */
let registrati = [];
let schedaBozzaCollegataId = null;
let feedbackTimer = 0;
let eliminaPending = null;
let nuovaAperturaPareteId = null;
/** Se valorizzato, il dialog apertura è in modalità modifica. */
let editingAperturaId = null;
let focusPareteIdDopoRender = null;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pareteFlagsDefaults() {
  return Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, false]));
}

function emptyStrato() {
  const id = nextStratoId++;
  return { id, vocibreve: "", elevazione: "0", altezza: "", note: "" };
}

function emptyParete() {
  const id = nextPareteId++;
  return {
    id,
    riferimento: `Parete ${id}`,
    lunghezza: "",
    altezza: "",
    idApertureMaster: [],
    stratifinitura: [emptyStrato()],
    fondazione: false,
    fondazioneLarghezza: "",
    fondazioneAltezza: "",
    ...pareteFlagsDefaults(),
  };
}

function parseNum(raw) {
  const txt = String(raw ?? "").trim().replaceAll(",", ".");
  if (!txt) return null;
  const n = Number(txt);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function loadRegistrati() {
  try {
    const raw = localStorage.getItem(STORAGE_ELEV_REGISTRATI_KEY);
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
      STORAGE_ELEV_REGISTRATI_KEY,
      JSON.stringify({ v: 1, items: registrati }),
    );
  } catch {
    /* ignore */
  }
}

function mostraFeedback(msg) {
  const el = document.getElementById("elev-registra-feedback");
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
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function creaSnapshotRegistrato() {
  const id = schedaBozzaCollegataId || nuovaSchedaId();
  return {
    id,
    pianoNome: String(pianoNome || "").trim(),
    zonaNome: String(zonaNome || "").trim(),
    pareti: pareti.map((pa) => ({
      riferimento: String(pa.riferimento || "").trim(),
      lunghezza: String(pa.lunghezza || "").trim(),
      altezza: String(pa.altezza || "").trim(),
      idApertureMaster: Array.isArray(pa.idApertureMaster)
        ? pa.idApertureMaster.map((x) => String(x)).filter(Boolean)
        : [],
      stratifinitura: (Array.isArray(pa.stratifinitura) ? pa.stratifinitura : []).map((st) => ({
        id: st.id,
        vocibreve: String(st.vocibreve || "").trim(),
        elevazione: String(st.elevazione || "").trim(),
        altezza: String(st.altezza || "").trim(),
        note: String(st.note || "").trim(),
      })),
      fondazione: pa.fondazione === true,
      fondazioneLarghezza: String(pa.fondazioneLarghezza || "").trim(),
      fondazioneAltezza: String(pa.fondazioneAltezza || "").trim(),
      ...Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, pa[k] === true])),
    })),
  };
}

function resetBozza() {
  pianoNome = "";
  zonaNome = "";
  pareti = [emptyParete()];
  schedaBozzaCollegataId = null;
  collapsedPareteIds.clear();
  focusPareteIdDopoRender = null;
}

function applicaRecordComeBozza(rec) {
  schedaBozzaCollegataId = String(rec.id || "");
  pianoNome = typeof rec.pianoNome === "string" ? rec.pianoNome : "";
  zonaNome = typeof rec.zonaNome === "string" ? rec.zonaNome : "";
  const source = Array.isArray(rec.pareti) ? rec.pareti : [];
  pareti = source.map((pa) => {
    const id = nextPareteId++;
    collapsedPareteIds.add(id);
    const flags = pareteFlagsDefaults();
    for (const k of PARETE_FLAG_KEYS) flags[k] = pa?.[k] === true;
    const strat = Array.isArray(pa.stratifinitura) ? pa.stratifinitura : [];
    return {
      id,
      riferimento: typeof pa.riferimento === "string" ? pa.riferimento : `Parete ${id}`,
      lunghezza: typeof pa.lunghezza === "string" ? pa.lunghezza : String(pa.lunghezza ?? ""),
      altezza: typeof pa.altezza === "string" ? pa.altezza : String(pa.altezza ?? ""),
      idApertureMaster: Array.isArray(pa.idApertureMaster)
        ? pa.idApertureMaster.map((x) => String(x))
        : [],
      stratifinitura:
        strat.length > 0
          ? strat.map((st) => ({
              id: nextStratoId++,
              vocibreve: String(st.vocibreve || ""),
              elevazione: String(st.elevazione ?? "0"),
              altezza: String(st.altezza || ""),
              note: String(st.note || ""),
            }))
          : [emptyStrato()],
      fondazione: pa?.fondazione === true,
      fondazioneLarghezza:
        typeof pa?.fondazioneLarghezza === "string"
          ? pa.fondazioneLarghezza
          : String(pa?.fondazioneLarghezza ?? ""),
      fondazioneAltezza:
        typeof pa?.fondazioneAltezza === "string"
          ? pa.fondazioneAltezza
          : String(pa?.fondazioneAltezza ?? ""),
      ...flags,
    };
  });
  if (pareti.length === 0) pareti = [emptyParete()];
}

function maybeAggiungiStratoPerFlagTipo(parete, flagKey) {
  const noteAttesa = PARETE_FLAG_AUTO_STRATO_NOTE[flagKey];
  if (!noteAttesa || parete[flagKey] !== true) return;
  const noteKey = noteAttesa.toLocaleLowerCase("it-IT");
  const noteKeys = new Set([
    noteKey,
    ...(PARETE_FLAG_NOTE_ALIASES[flagKey] || []).map((a) => String(a).trim().toLocaleLowerCase("it-IT")),
  ]);
  const voceNome =
    typeof PARETE_FLAG_LABELS[flagKey] === "string" && PARETE_FLAG_LABELS[flagKey].trim()
      ? PARETE_FLAG_LABELS[flagKey].trim()
      : noteAttesa;
  const haGia = (parete.stratifinitura || []).some((st) =>
    noteKeys.has(String(st.note || "").trim().toLocaleLowerCase("it-IT")),
  );
  if (haGia) return;
  const vuoto = (parete.stratifinitura || []).find(
    (st) => !String(st.vocibreve || "").trim() && !String(st.note || "").trim(),
  );
  if (vuoto) {
    vuoto.note = noteAttesa;
    vuoto.vocibreve = voceNome;
    return;
  }
  const st = emptyStrato();
  st.note = noteAttesa;
  st.vocibreve = voceNome;
  parete.stratifinitura.push(st);
}

function rimuoviIdAperturaDaAltrePareti(exceptPareteId, idM) {
  for (const pa of pareti) {
    if (pa.id === exceptPareteId) continue;
    pa.idApertureMaster = (pa.idApertureMaster || []).filter((x) => x !== idM);
  }
}

function renderSidebarLista() {
  const ul = document.getElementById("elev-sidebar-list");
  if (!ul) return;
  if (registrati.length === 0) {
    ul.innerHTML = `<li class="vani-sidebar-empty">Nessuna scheda registrata.</li>`;
    return;
  }
  ul.innerHTML = registrati
    .map((rec) => {
      const titolo = escapeHtml(
        `${rec.pianoNome || "—"} · ${rec.zonaNome || "zona"} · ${(rec.pareti || []).length} pareti`,
      );
      return `<li class="vani-sidebar-row">
        <button type="button" class="vani-sidebar-item" data-action="edit" data-id="${escapeHtml(rec.id)}" title="Apri in modifica">${titolo}</button>
        <button type="button" class="btn-action btn-delete vani-sidebar-elimina" data-action="delete" data-id="${escapeHtml(rec.id)}" title="Elimina">✕</button>
      </li>`;
    })
    .join("");
}

function renderApertureCell(pa) {
  const zona = String(zonaNome || "").trim();
  if (!zona) {
    return `<div class="vani-aperture-cell"><span class="vani-muted">Imposta Zona/Facciata per collegare aperture</span></div>`;
  }
  const byId = new Map();
  for (const ap of getArchivioAperturePerZona(zona)) {
    const id = String(ap.idAperturaMaster || "").trim();
    if (id) byId.set(id, ap);
  }
  for (const rawId of pa.idApertureMaster || []) {
    const id = String(rawId || "").trim();
    if (!id || byId.has(id)) continue;
    const ap = getAperturaMasterById(id);
    if (ap) byId.set(id, ap);
  }
  const candidati = [...byId.values()].sort((a, b) =>
    String(a.idAperturaMaster).localeCompare(String(b.idAperturaMaster), "it"),
  );
  if (candidati.length === 0) {
    return `<div class="vani-aperture-cell"><span class="vani-muted">Nessuna apertura per la zona «${escapeHtml(zona)}»</span></div>`;
  }
  const usateAltrove = new Set();
  for (const altra of pareti) {
    if (altra.id === pa.id) continue;
    for (const id of altra.idApertureMaster || []) usateAltrove.add(id);
  }
  const checks = candidati
    .map((ap) => {
      const id = String(ap.idAperturaMaster || "");
      const checked = (pa.idApertureMaster || []).includes(id);
      const disabled = !checked && usateAltrove.has(id);
      const loc = typeof ap.locale === "string" && ap.locale.trim() ? ap.locale.trim() : "—";
      const label = `${id} · ${loc} · L ${ap.largh ?? "—"} × H ${ap.alt ?? "—"} × ${normalizzaPercentualeApertura(ap.percentuale)}%`;
      const azioni = checked
        ? `<span class="elev-apertura-azioni">
            <button type="button" class="btn-action btn-edit vani-btn-mini" data-action="edit-apertura" data-parete-id="${pa.id}" data-apertura-id="${escapeHtml(id)}" title="Modifica apertura">✎</button>
            <button type="button" class="btn-action btn-delete vani-btn-mini" data-action="delete-apertura" data-parete-id="${pa.id}" data-apertura-id="${escapeHtml(id)}" title="Elimina apertura dall’archivio">🗑</button>
          </span>`
        : "";
      return `<div class="elev-apertura-row${disabled ? " is-disabled" : ""}">
        <label class="vani-apertura-check${disabled ? " is-disabled" : ""}">
          <input type="checkbox" data-action="toggle-apertura" data-parete-id="${pa.id}" data-apertura-id="${escapeHtml(id)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
          <span>${escapeHtml(label)}</span>
        </label>
        ${azioni}
      </div>`;
    })
    .join("");
  return `<div class="vani-aperture-cell">${checks}</div>`;
}

function renderStrati(pa) {
  const collapsed = collapsedPareteIds.has(pa.id);
  if (collapsed) {
    return `<button type="button" class="btn-action btn-secondary vani-btn-mini" data-action="toggle-parete" data-parete-id="${pa.id}">▸ Strati (${pa.stratifinitura.length})</button>`;
  }
  const rows = pa.stratifinitura
    .map((st, idx) => {
      const L = parseNum(pa.lunghezza) ?? 0;
      const H = parseNum(st.altezza) ?? parseNum(pa.altezza) ?? 0;
      const mqLordi = Number((L * H).toFixed(2));
      let mqAperture = 0;
      const elev = parseNum(st.elevazione) ?? 0;
      for (const idM of pa.idApertureMaster || []) {
        const ap = getAperturaMasterById(idM);
        if (!ap) continue;
        const hInc = altezzaInclusaNelloStratoConElevazione(elev, H || null, ap) ?? 0;
        mqAperture += mqAperturaConPercentuale(ap.largh || 0, hInc, ap.percentuale, 2);
      }
      const mqNetti = Number((mqLordi - mqAperture).toFixed(2));
      return `<div class="vani-strato-row" data-parete-id="${pa.id}" data-strato-id="${st.id}">
        <span class="vani-strato-idx">${idx + 1}</span>
        <label class="field"><span>Voce breve</span>
          <input type="text" list="elev-vocibrevi-datalist" data-field="vocibreve" data-parete-id="${pa.id}" data-strato-id="${st.id}" value="${escapeHtml(st.vocibreve)}" autocomplete="off" />
        </label>
        <label class="field"><span>Elev.</span>
          <input type="text" data-field="elevazione" data-parete-id="${pa.id}" data-strato-id="${st.id}" value="${escapeHtml(st.elevazione)}" />
        </label>
        <label class="field"><span>H strato</span>
          <input type="text" data-field="altezza" data-parete-id="${pa.id}" data-strato-id="${st.id}" value="${escapeHtml(st.altezza)}" />
        </label>
        <label class="field"><span>Note</span>
          <input type="text" data-field="note" data-parete-id="${pa.id}" data-strato-id="${st.id}" value="${escapeHtml(st.note)}" />
        </label>
        <span class="vani-strato-mq">Lordo ${mqLordi} · Netto ${mqNetti} mq</span>
        <button type="button" class="btn-action btn-delete vani-btn-mini" data-action="del-strato" data-parete-id="${pa.id}" data-strato-id="${st.id}" title="Elimina strato">✕</button>
      </div>`;
    })
    .join("");
  return `<div class="vani-strati-block">
    <div class="vani-strati-toolbar">
      <button type="button" class="btn-action btn-secondary vani-btn-mini" data-action="toggle-parete" data-parete-id="${pa.id}">▾ Nascondi strati</button>
    </div>
    ${rows}
  </div>`;
}

function renderGerarchia() {
  const host = document.getElementById("elev-gerarchia-host");
  if (!host) return;

  const flagsHtml = (pa) =>
    PARETE_FLAG_KEYS.map((k) => {
      const checked = pa[k] === true ? "checked" : "";
      return `<label class="vani-parete-flag-label"><input type="checkbox" class="vani-parete-flag" data-flag="${k}" data-parete-id="${pa.id}" ${checked} /> ${escapeHtml(PARETE_FLAG_LABELS[k])}</label>`;
    }).join("");

  const fondazioneHtml = (pa) => {
    const checked = pa.fondazione === true ? "checked" : "";
    const L = parseNum(pa.lunghezza) ?? 0;
    const larg = parseNum(pa.fondazioneLarghezza) ?? 0;
    const alt = parseNum(pa.fondazioneAltezza) ?? 0;
    const volume = Number((L * larg * alt).toFixed(3));
    const fields =
      pa.fondazione === true
        ? `<div class="elev-fondazione-fields">
        <label class="field"><span>Larghezza fondazione (m)</span>
          <input type="text" data-field="fondazioneLarghezza" data-parete-id="${pa.id}" value="${escapeHtml(pa.fondazioneLarghezza || "")}" placeholder="0.00" />
        </label>
        <label class="field"><span>Altezza fondazione (m)</span>
          <input type="text" data-field="fondazioneAltezza" data-parete-id="${pa.id}" value="${escapeHtml(pa.fondazioneAltezza || "")}" placeholder="0.00" />
        </label>
        <span class="elev-fondazione-volume" title="Lunghezza × Larghezza × Altezza">Volume ${volume} mc · voce «${escapeHtml(VOCE_FONDAZIONE_CONTINUA)}»</span>
      </div>`
        : "";
    return `<div class="elev-fondazione-block">
      <label class="vani-parete-flag-label elev-fondazione-flag-label">
        <input type="checkbox" class="elev-parete-fondazione" data-parete-id="${pa.id}" ${checked} /> Fondazione
      </label>
      ${fields}
    </div>`;
  };

  const paretiHtml = pareti
    .map(
      (pa) => `<article class="vani-parete-card" data-parete-id="${pa.id}">
      <div class="vani-parete-misure">
        <label class="field"><span>Riferimento</span>
          <input type="text" class="elev-parete-rif" data-field="riferimento" data-parete-id="${pa.id}" value="${escapeHtml(pa.riferimento)}" />
        </label>
        <label class="field"><span>Lunghezza (m)</span>
          <input type="text" data-field="lunghezza" data-parete-id="${pa.id}" value="${escapeHtml(pa.lunghezza)}" />
        </label>
        <label class="field"><span>Altezza (m)</span>
          <input type="text" data-field="altezza-parete" data-parete-id="${pa.id}" value="${escapeHtml(pa.altezza)}" />
        </label>
        <div class="vani-parete-actions">
          <button type="button" class="btn-action btn-delete vani-btn-mini" data-action="del-parete" data-parete-id="${pa.id}" title="Elimina parete">✕</button>
        </div>
      </div>
      <div class="vani-parete-flags">${flagsHtml(pa)}</div>
      ${fondazioneHtml(pa)}
      <div class="vani-parete-aperture"><strong>Aperture</strong>${renderApertureCell(pa)}</div>
      ${renderStrati(pa)}
    </article>`,
    )
    .join("");

  host.innerHTML = `
    <div class="vani-top-row">
      <label class="field"><span>Piano</span>
        <input type="text" class="elev-piano-nome" list="datalist-piani-misura-archivio" value="${escapeHtml(pianoNome)}" autocomplete="off" />
      </label>
      <label class="field"><span>Zona / Facciata</span>
        <input type="text" class="elev-zona-nome" value="${escapeHtml(zonaNome)}" placeholder="es. Nord, Est" autocomplete="off" />
      </label>
    </div>
    <div class="vani-pareti-list">${paretiHtml}</div>
  `;

  if (focusPareteIdDopoRender != null) {
    const el = host.querySelector(
      `input.elev-parete-rif[data-parete-id="${focusPareteIdDopoRender}"]`,
    );
    el?.focus();
    focusPareteIdDopoRender = null;
  }
}

function syncTopFieldsFromDom() {
  const pianoEl = document.querySelector("#elev-gerarchia-host .elev-piano-nome");
  const zonaEl = document.querySelector("#elev-gerarchia-host .elev-zona-nome");
  if (pianoEl) pianoNome = pianoEl.value;
  if (zonaEl) zonaNome = zonaEl.value;
}

function findParete(id) {
  return pareti.find((p) => p.id === Number(id));
}

function findStrato(parete, id) {
  return (parete?.stratifinitura || []).find((s) => s.id === Number(id));
}

function aggiornaAnteprimaVolumeFondazione(pa) {
  if (!pa || pa.fondazione !== true) return;
  const card = document.querySelector(
    `#elev-gerarchia-host .vani-parete-card[data-parete-id="${pa.id}"]`,
  );
  const volEl = card?.querySelector(".elev-fondazione-volume");
  if (!volEl) return;
  const L = parseNum(pa.lunghezza) ?? 0;
  const larg = parseNum(pa.fondazioneLarghezza) ?? 0;
  const alt = parseNum(pa.fondazioneAltezza) ?? 0;
  const volume = Number((L * larg * alt).toFixed(3));
  volEl.textContent = `Volume ${volume} mc · voce «${VOCE_FONDAZIONE_CONTINUA}»`;
}

function onHostInput(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.classList.contains("elev-piano-nome") || t.classList.contains("elev-zona-nome")) {
    syncTopFieldsFromDom();
    return;
  }
  const pareteId = Number(t.getAttribute("data-parete-id"));
  const pa = findParete(pareteId);
  if (!pa) return;
  const field = t.getAttribute("data-field");
  const stratoId = Number(t.getAttribute("data-strato-id"));
  if (field === "riferimento") pa.riferimento = t.value;
  else if (field === "lunghezza") {
    pa.lunghezza = t.value;
    aggiornaAnteprimaVolumeFondazione(pa);
  } else if (field === "altezza-parete") pa.altezza = t.value;
  else if (field === "fondazioneLarghezza" || field === "fondazioneAltezza") {
    pa[field] = t.value;
    aggiornaAnteprimaVolumeFondazione(pa);
  } else if (field === "vocibreve" || field === "elevazione" || field === "altezza" || field === "note") {
    const st = findStrato(pa, stratoId);
    if (st) st[field] = t.value;
  }
}

function onHostChange(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  if (t.classList.contains("elev-piano-nome")) {
    syncTopFieldsFromDom();
    risolviBlurCampoPianoArchivioStorage(t, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
    pianoNome = t.value;
    return;
  }
  if (t.classList.contains("elev-zona-nome")) {
    syncTopFieldsFromDom();
    for (const pa of pareti) pruneApertureParetePerZona(pa);
    renderGerarchia();
    return;
  }

  if (t.classList.contains("elev-parete-fondazione")) {
    const pa = findParete(t.getAttribute("data-parete-id"));
    if (!pa) return;
    pa.fondazione = t.checked === true;
    if (!pa.fondazione) {
      pa.fondazioneLarghezza = "";
      pa.fondazioneAltezza = "";
    }
    renderGerarchia();
    return;
  }

  if (t.classList.contains("vani-parete-flag")) {
    const pa = findParete(t.getAttribute("data-parete-id"));
    const flag = t.getAttribute("data-flag");
    if (!pa || !flag) return;
    pa[flag] = t.checked === true;
    if (pa[flag]) maybeAggiungiStratoPerFlagTipo(pa, flag);
    collapsedPareteIds.delete(pa.id);
    renderGerarchia();
    return;
  }

  if (t.getAttribute("data-action") === "toggle-apertura") {
    const pa = findParete(t.getAttribute("data-parete-id"));
    const idM = String(t.getAttribute("data-apertura-id") || "");
    if (!pa || !idM) return;
    if (t.checked) {
      rimuoviIdAperturaDaAltrePareti(pa.id, idM);
      if (!pa.idApertureMaster.includes(idM)) pa.idApertureMaster.push(idM);
    } else {
      pa.idApertureMaster = pa.idApertureMaster.filter((x) => x !== idM);
    }
    renderGerarchia();
  }
}

function getPareteAttiva() {
  if (!Array.isArray(pareti) || pareti.length === 0) return null;
  const espansa = pareti.find((p) => !collapsedPareteIds.has(Number(p.id)));
  if (espansa) return espansa;
  return pareti[pareti.length - 1];
}

function aggiungiPareteBozza() {
  syncTopFieldsFromDom();
  const pa = emptyParete();
  pareti.push(pa);
  focusPareteIdDopoRender = pa.id;
  for (const p of pareti) {
    if (p.id === pa.id) collapsedPareteIds.delete(p.id);
    else collapsedPareteIds.add(p.id);
  }
  renderGerarchia();
}

function duplicaPareteBozza(pareteId) {
  const src = findParete(pareteId);
  if (!src) return;
  const copy = {
    ...JSON.parse(JSON.stringify(src)),
    id: nextPareteId++,
    riferimento: `${src.riferimento} (copia)`,
    idApertureMaster: [],
    stratifinitura: (src.stratifinitura || []).map((st) => ({
      ...st,
      id: nextStratoId++,
    })),
  };
  const idx = pareti.findIndex((p) => p.id === pareteId);
  pareti.splice(idx + 1, 0, copy);
  focusPareteIdDopoRender = copy.id;
  for (const p of pareti) {
    if (p.id === copy.id) collapsedPareteIds.delete(p.id);
    else collapsedPareteIds.add(p.id);
  }
  renderGerarchia();
}

function aggiungiStratoAllaParete(pareteId) {
  const pa = findParete(pareteId);
  if (!pa) return;
  pa.stratifinitura.push(emptyStrato());
  collapsedPareteIds.delete(pareteId);
  renderGerarchia();
}

function onSidebarAzioniClick(e) {
  const btn = e.target.closest("button[data-sidebar-azione]");
  if (!(btn instanceof HTMLButtonElement) || btn.disabled) return;
  const azione = String(btn.dataset.sidebarAzione ?? "").trim();
  if (!azione) return;

  if (azione === "aggiungi-parete") {
    aggiungiPareteBozza();
    return;
  }
  const attiva = getPareteAttiva();
  if (!attiva) {
    mostraFeedback("Aggiungi prima una parete.");
    return;
  }
  if (azione === "aggiungi-apertura") {
    apriDialogNuovaApertura(attiva.id);
    return;
  }
  if (azione === "duplica-parete") {
    duplicaPareteBozza(attiva.id);
    return;
  }
  if (azione === "aggiungi-strato") {
    aggiungiStratoAllaParete(attiva.id);
  }
}

function onHostClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const pareteId = Number(btn.getAttribute("data-parete-id"));
  const stratoId = Number(btn.getAttribute("data-strato-id"));

  if (action === "add-parete") {
    aggiungiPareteBozza();
    return;
  }
  if (action === "dup-parete") {
    duplicaPareteBozza(pareteId);
    return;
  }
  if (action === "del-parete") {
    if (pareti.length <= 1) {
      mostraFeedback("Serve almeno una parete.");
      return;
    }
    pareti = pareti.filter((p) => p.id !== pareteId);
    collapsedPareteIds.delete(pareteId);
    renderGerarchia();
    return;
  }
  if (action === "toggle-parete") {
    if (collapsedPareteIds.has(pareteId)) collapsedPareteIds.delete(pareteId);
    else collapsedPareteIds.add(pareteId);
    renderGerarchia();
    return;
  }
  if (action === "add-strato") {
    aggiungiStratoAllaParete(pareteId);
    return;
  }
  if (action === "del-strato") {
    const pa = findParete(pareteId);
    if (!pa) return;
    if (pa.stratifinitura.length <= 1) {
      mostraFeedback("Serve almeno uno strato.");
      return;
    }
    pa.stratifinitura = pa.stratifinitura.filter((s) => s.id !== stratoId);
    renderGerarchia();
    return;
  }
  if (action === "new-apertura") {
    apriDialogNuovaApertura(pareteId);
    return;
  }
  if (action === "edit-apertura") {
    const idM = String(btn.getAttribute("data-apertura-id") || "").trim();
    if (idM) apriDialogModificaApertura(pareteId, idM);
    return;
  }
  if (action === "delete-apertura") {
    const idM = String(btn.getAttribute("data-apertura-id") || "").trim();
    if (!idM) return;
    eliminaPending = { type: "apertura", id: idM, pareteId };
    const dialog = document.getElementById("elev-conferma-elimina-dialog");
    const msg = document.getElementById("elev-conferma-elimina-msg");
    if (msg) {
      msg.textContent =
        `Eliminare l’apertura «${idM}» dall’archivio? Verrà tolta anche da tutte le VOCI e dalle altre pareti che la usano.`;
    }
    dialog?.showModal();
    return;
  }
}

function onRegistra() {
  syncTopFieldsFromDom();
  const snap = creaSnapshotRegistrato();
  if (!snap.pianoNome) {
    mostraFeedback("Indica il piano.");
    return;
  }
  if (!snap.zonaNome) {
    mostraFeedback("Indica zona/facciata.");
    return;
  }
  if (snap.pareti.length === 0) {
    mostraFeedback("Aggiungi almeno una parete.");
    return;
  }
  for (const pa of snap.pareti) {
    if (pa.fondazione !== true) continue;
    if (parseNum(pa.lunghezza) == null) {
      mostraFeedback(`Fondazione su «${pa.riferimento || "parete"}»: indica la lunghezza.`);
      return;
    }
    if (parseNum(pa.fondazioneLarghezza) == null) {
      mostraFeedback(`Fondazione su «${pa.riferimento || "parete"}»: indica la larghezza.`);
      return;
    }
    if (parseNum(pa.fondazioneAltezza) == null) {
      mostraFeedback(`Fondazione su «${pa.riferimento || "parete"}»: indica l'altezza.`);
      return;
    }
  }
  tryEnsurePianoInArchivio(snap.pianoNome, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
  const idx = registrati.findIndex((r) => r.id === snap.id);
  if (idx >= 0) registrati[idx] = snap;
  else registrati.push(snap);
  saveRegistrati();
  aggiornaVociDaSnapshotElevazione(snap);
  resetBozza();
  renderSidebarLista();
  renderGerarchia();
  popolaDatalistVocibrevi("elev-vocibrevi-datalist");
  mostraFeedback("Scheda elevazione registrata. VOCI aggiornate.");
}

function onSidebarClick(e) {
  const btn = e.target.closest("[data-action][data-id]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");
  const rec = registrati.find((r) => r.id === id);
  if (!rec) return;
  if (action === "edit") {
    applicaRecordComeBozza(rec);
    renderGerarchia();
    mostraFeedback("Scheda caricata in modifica.");
    return;
  }
  if (action === "delete") {
    eliminaPending = { type: "scheda", id };
    const dialog = document.getElementById("elev-conferma-elimina-dialog");
    const msg = document.getElementById("elev-conferma-elimina-msg");
    if (msg) {
      msg.textContent = `Eliminare «${rec.pianoNome} · ${rec.zonaNome}» e le relative misurazioni nelle VOCI?`;
    }
    dialog?.showModal();
  }
}

function confermaElimina() {
  const pending = eliminaPending;
  eliminaPending = null;
  document.getElementById("elev-conferma-elimina-dialog")?.close();
  if (!pending) return;

  if (pending.type === "apertura") {
    const idM = String(pending.id || "").trim();
    const pareteId = Number(pending.pareteId);
    if (!idM) return;
    for (const pa of pareti) {
      pa.idApertureMaster = (pa.idApertureMaster || []).filter((x) => String(x) !== idM);
    }
    document.dispatchEvent(
      new CustomEvent("computo-richiedi-elimina-apertura", {
        detail: { idAperturaMaster: idM, pareteId },
      }),
    );
    renderGerarchia();
    mostraFeedback(`Apertura ${idM} eliminata.`);
    return;
  }

  const id = pending.type === "scheda" ? pending.id : pending;
  if (!id) return;
  registrati = registrati.filter((r) => r.id !== id);
  saveRegistrati();
  rimuoviRigheMisurazioniPerSchedaElevazione(id);
  if (schedaBozzaCollegataId === id) resetBozza();
  renderSidebarLista();
  renderGerarchia();
  mostraFeedback("Scheda eliminata.");
}

function setDialogAperturaMode({ editingId = null, titolo, salvaLabel } = {}) {
  editingAperturaId = editingId;
  const titoloEl = document.getElementById("elev-nap-titolo");
  const salvaEl = document.getElementById("elev-nap-salva");
  const editIdEl = document.getElementById("elev-nap-edit-id");
  if (titoloEl) titoloEl.textContent = titolo;
  if (salvaEl) salvaEl.textContent = salvaLabel;
  if (editIdEl) editIdEl.value = editingId || "";
}

function fillDialogAperturaFromValues(vals) {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  set("elev-nap-piano", vals.piano);
  set("elev-nap-zona", vals.zona);
  set("elev-nap-locale", vals.locale);
  set("elev-nap-largh", vals.largh);
  set("elev-nap-alt", vals.alt);
  set("elev-nap-percentuale", vals.percentuale);
  set("elev-nap-hdav", vals.hDav);
  set("elev-nap-ante", vals.ante);
  set("elev-nap-tipologia", vals.tipologia);
  set("elev-nap-falso", vals.falso);
  set("elev-nap-scuro", vals.scuro);
  set("elev-nap-inferiata", vals.inferiata);
  set("elev-nap-zanzariera", vals.zanzariera);
  set("elev-nap-controdavanzale", vals.controdavanzale);
}

function apriDialogNuovaApertura(pareteId) {
  syncTopFieldsFromDom();
  nuovaAperturaPareteId = pareteId;
  refreshArchivioLocaleDatalist();
  setDialogAperturaMode({
    editingId: null,
    titolo: "Nuova apertura sulla parete elevazione",
    salvaLabel: "Salva e collega",
  });
  fillDialogAperturaFromValues({
    piano: pianoNome,
    zona: zonaNome,
    locale: "",
    largh: "",
    alt: "",
    percentuale: "100",
    hDav: "0",
    ante: "1",
    tipologia: "FINESTRA",
    falso: "NO",
    scuro: "NO",
    inferiata: "NO",
    zanzariera: "NO",
    controdavanzale: "NO",
  });
  document.getElementById("elev-nuova-apertura-dialog")?.showModal();
  window.requestAnimationFrame(() => document.getElementById("elev-nap-locale")?.focus());
}

function apriDialogModificaApertura(pareteId, idApertura) {
  const ap = getAperturaMasterById(idApertura);
  if (!ap) {
    mostraFeedback("Apertura non trovata nell’archivio.");
    return;
  }
  syncTopFieldsFromDom();
  nuovaAperturaPareteId = pareteId;
  refreshArchivioLocaleDatalist();
  setDialogAperturaMode({
    editingId: String(idApertura),
    titolo: `Modifica apertura ${idApertura}`,
    salvaLabel: "Salva modifiche",
  });
  fillDialogAperturaFromValues({
    piano: ap.piano ?? pianoNome,
    zona: (typeof ap.zona === "string" && ap.zona.trim()) || zonaNome,
    locale: ap.locale ?? "",
    largh: ap.largh != null ? String(ap.largh) : "",
    alt: ap.alt != null ? String(ap.alt) : "",
    percentuale: String(normalizzaPercentualeApertura(ap.percentuale)),
    hDav: ap.hDav != null ? String(ap.hDav) : "0",
    ante: ap.ante != null ? String(ap.ante) : "1",
    tipologia: ap.tipologia || "FINESTRA",
    falso: ap.falso || "NO",
    scuro: ap.scuro || "NO",
    inferiata: ap.inferiata || "NO",
    zanzariera: ap.zanzariera || "NO",
    controdavanzale: ap.controdavanzale || "NO",
  });
  document.getElementById("elev-nuova-apertura-dialog")?.showModal();
  window.requestAnimationFrame(() => document.getElementById("elev-nap-largh")?.focus());
}

function chiudiDialogApertura() {
  editingAperturaId = null;
  nuovaAperturaPareteId = null;
  const editIdEl = document.getElementById("elev-nap-edit-id");
  if (editIdEl) editIdEl.value = "";
  document.getElementById("elev-nuova-apertura-dialog")?.close();
}

function onNuovaAperturaSubmit(e) {
  e.preventDefault();
  const zona =
    String(document.getElementById("elev-nap-zona")?.value || "").trim() ||
    String(zonaNome || "").trim();
  const locale = String(document.getElementById("elev-nap-locale")?.value || "").trim();
  if (!zona) {
    mostraFeedback("Indica la zona/facciata dell’apertura.");
    return;
  }
  if (!locale) {
    mostraFeedback("Indica il locale (come in VANI) per collegare l’apertura.");
    return;
  }
  const detail = {
    pareteId: nuovaAperturaPareteId,
    piano: document.getElementById("elev-nap-piano")?.value || "",
    zona,
    locale,
    largh: document.getElementById("elev-nap-largh")?.value || "",
    alt: document.getElementById("elev-nap-alt")?.value || "",
    percentuale: document.getElementById("elev-nap-percentuale")?.value || "100",
    hDav: document.getElementById("elev-nap-hdav")?.value || "0",
    ante: document.getElementById("elev-nap-ante")?.value || "1",
    tipologia: document.getElementById("elev-nap-tipologia")?.value || "FINESTRA",
    falso: document.getElementById("elev-nap-falso")?.value || "NO",
    scuro: document.getElementById("elev-nap-scuro")?.value || "NO",
    inferiata: document.getElementById("elev-nap-inferiata")?.value || "NO",
    zanzariera: document.getElementById("elev-nap-zanzariera")?.value || "NO",
    controdavanzale: document.getElementById("elev-nap-controdavanzale")?.value || "NO",
  };
  const editId =
    editingAperturaId ||
    String(document.getElementById("elev-nap-edit-id")?.value || "").trim();
  chiudiDialogApertura();
  if (editId) {
    document.dispatchEvent(
      new CustomEvent("computo-richiedi-modifica-apertura", {
        detail: { ...detail, idAperturaMaster: editId },
      }),
    );
    return;
  }
  document.dispatchEvent(
    new CustomEvent("computo-vani-richiedi-nuova-apertura", { detail }),
  );
}

function onAperturaCreata(e) {
  const id = e.detail?.idAperturaMaster;
  const pareteId = Number(e.detail?.pareteId);
  if (!id || !pareteId) return;
  const pa = findParete(pareteId);
  if (!pa) return;
  rimuoviIdAperturaDaAltrePareti(pareteId, String(id));
  if (!pa.idApertureMaster.includes(String(id))) pa.idApertureMaster.push(String(id));
  refreshArchivioLocaleDatalist();
  renderGerarchia();
}

function onAperturaAggiornata() {
  refreshArchivioLocaleDatalist();
  renderGerarchia();
  mostraFeedback("Apertura aggiornata.");
}

function onAperturaEliminata(e) {
  const id = String(e.detail?.idAperturaMaster || "").trim();
  if (id) {
    for (const pa of pareti) {
      pa.idApertureMaster = (pa.idApertureMaster || []).filter((x) => String(x) !== id);
    }
  }
  refreshArchivioLocaleDatalist();
  renderGerarchia();
}

function refreshArchivioLocaleDatalist() {
  const dl = document.getElementById("elev-archivio-locale-datalist");
  if (!dl) return;
  dl.replaceChildren();
  for (const loc of getUniqueLocalesForVaniPicker()) {
    const opt = document.createElement("option");
    opt.value = loc;
    dl.appendChild(opt);
  }
}

function pruneApertureParetePerZona(parete) {
  const allowed = new Set(
    getArchivioAperturePerZona(zonaNome).map((ap) => String(ap.idAperturaMaster ?? "").trim()),
  );
  parete.idApertureMaster = (parete.idApertureMaster || []).filter((id) =>
    allowed.has(String(id ?? "").trim()),
  );
}

export function prepareVistaElevazionePareti() {
  loadRegistrati();
  if (pareti.length === 0) pareti = [emptyParete()];
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
  popolaDatalistVocibrevi("elev-vocibrevi-datalist");
  refreshArchivioLocaleDatalist();
  renderSidebarLista();
  renderGerarchia();
}

export function initElevazioneParetiUi() {
  loadRegistrati();
  if (pareti.length === 0) pareti = [emptyParete()];

  const host = document.getElementById("elev-gerarchia-host");
  host?.addEventListener("input", onHostInput);
  host?.addEventListener("change", onHostChange);
  host?.addEventListener("click", onHostClick);

  document.getElementById("btn-elev-registra")?.addEventListener("click", onRegistra);
  document.getElementById("elev-sidebar-list")?.addEventListener("click", onSidebarClick);
  document.getElementById("elev-sidebar-azioni")?.addEventListener("click", onSidebarAzioniClick);
  document
    .getElementById("elev-conferma-elimina-conferma")
    ?.addEventListener("click", confermaElimina);
  document
    .getElementById("elev-conferma-elimina-annulla")
    ?.addEventListener("click", () => {
      eliminaPending = null;
      document.getElementById("elev-conferma-elimina-dialog")?.close();
    });
  document
    .getElementById("elev-nuova-apertura-form")
    ?.addEventListener("submit", onNuovaAperturaSubmit);
  document.getElementById("elev-nap-annulla")?.addEventListener("click", () => {
    chiudiDialogApertura();
  });
  document.addEventListener("computo-vani-apertura-creata", onAperturaCreata);
  document.addEventListener("computo-apertura-aggiornata", onAperturaAggiornata);
  document.addEventListener("computo-apertura-eliminata", onAperturaEliminata);
  document.addEventListener("computo-nuovo-iniziato", () => {
    registrati = [];
    resetBozza();
    renderSidebarLista();
    renderGerarchia();
  });

  document.getElementById("elev-misurazione-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
  });
}
