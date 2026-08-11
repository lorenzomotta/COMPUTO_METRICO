/**
 * Gerarchia VANI: Piani → Locali → Pareti → Strati finitura (più per parete) → STRATIAPERTURA (placeholder).
 */

import {
  getArchivioAperturePerLocale,
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
  aggiornaNoteVociDaSnapshotVanoRegistrato,
  rimuoviRigheMisurazioniPerVanoId,
} from "./modules/vaniRegistroAggiornaNoteVoci.js";
import { altezzaInclusaNelloStratoConElevazione } from "./utils/numberUtils.js";

/** Salvataggio elenco vani registrati (uno per voce). */
const STORAGE_VANI_REGISTRATI_KEY = "computo_metrico_vani_registrati";

/** Vecchio formato monolitico (migrazione una tantum). */
const STORAGE_VANI_LEGACY_KEY = "computo_metrico_vani_misurazione";

const VANI_ELIMINA_TITLE_DEFAULT = "CONFERMA ELIMINAZIONE";
const VANI_ELIMINA_BTN_ANNULLA_DEFAULT = "Annulla";

/** Id parete con riga strati/calcolo collassata (solo sessione UI). */
const collapsedPareteIds = new Set();
/** Slot netto strato collassati: chiave `${pareteId}:${stratoId}` (solo sessione UI). */
const collapsedStratoNettoKeys = new Set();
/** Dopo `renderGerarchia`, focus sul campo riferimento di questa parete. */
let vaniFocusPareteIdDopoRender = null;

function pareteStratiCollassati(pareteId) {
  return collapsedPareteIds.has(Number(pareteId));
}

function stratoNettoKey(pareteId, stratoId) {
  return `${Number(pareteId)}:${Number(stratoId)}`;
}

function stratoNettoCollassato(pareteId, stratoId) {
  return collapsedStratoNettoKeys.has(stratoNettoKey(pareteId, stratoId));
}

function setStratoNettoCollassato(pareteId, stratoId, collapsed) {
  const key = stratoNettoKey(pareteId, stratoId);
  if (collapsed) collapsedStratoNettoKeys.add(key);
  else collapsedStratoNettoKeys.delete(key);
}

function clearStratoNettoCollassatoPerParete(pareteId) {
  const prefix = `${Number(pareteId)}:`;
  [...collapsedStratoNettoKeys].forEach((key) => {
    if (key.startsWith(prefix)) collapsedStratoNettoKeys.delete(key);
  });
}

function collassaTutteParetiLocaleSalvo(locale, pareteIdDaEspandere) {
  const keep = pareteIdDaEspandere != null ? Number(pareteIdDaEspandere) : null;
  for (const p of locale.pareti) {
    if (keep != null && p.id === keep) collapsedPareteIds.delete(p.id);
    else collapsedPareteIds.add(p.id);
  }
}

function espandiTutteParetiLocale(locale) {
  for (const p of locale.pareti) collapsedPareteIds.delete(p.id);
}

function comprimiTutteParetiLocale(locale) {
  for (const p of locale.pareti) collapsedPareteIds.add(p.id);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Icona pulsante «espandi strati» su tutte le pareti del locale. */
const VANI_SVG_STRATI_ESPANDI =
  '<svg class="vani-icon-strati-toggle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/></svg>';

/** Icona pulsante «comprimi strati» su tutte le pareti del locale. */
const VANI_SVG_STRATI_COMPRIMI =
  '<svg class="vani-icon-strati-toggle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 11 5-5 5 5"/><path d="m7 17 5-5 5 5"/></svg>';

/** Icona «aggiungi apertura» (finestra). */
const VANI_SVG_FINESTRA =
  '<svg class="vani-icon-finestra" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>';

/** Caselle parete (salvate come boolean su ogni parete). */
const PARETE_FLAG_KEYS = ["zoccolo", "rustico", "civile", "gesso", "rivestimento"];

const PARETE_FLAG_LABELS = {
  zoccolo: "Zoccolo",
  rustico: "Rustico",
  civile: "Civile",
  gesso: "Gesso",
  rivestimento: "Rivestimento",
};

/** Spunta tipo parete → aggiunge / riempie uno strato con questa `note` (se non già presente). */
const PARETE_FLAG_AUTO_STRATO_NOTE = {
  zoccolo: "zoccolo",
  civile: "civile",
  gesso: "gesso",
  rustico: "rustico",
  rivestimento: "rivestimento",
};

function pareteFlagsDefaults() {
  return Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, false]));
}

let piani = [];
let nextPianoId = 1;
let nextLocaleId = 1;
let nextPareteId = 1;
let nextStratifinituraId = 1;

/** Vani già registrati (sidebar): { id, pianoNome, locali?: { nomeLocale, pareti[] }[], nomeLocale?, pareti? } (legacy: solo primo locale in nomeLocale/pareti). */
let vaniRegistrati = [];

/**
 * Se non null, la bozza è stata aperta dalla sidebar e corrisponde a questo id:
 * «REGISTRA VANO» aggiorna quel vano invece di crearne uno nuovo.
 * (Le voci in elenco VOCI mancanti vengono create dal sync se serve.)
 */
let vanoBozzaCollegatoId = null;

/** Evita select() sul focus ricreato dopo render (altrimenti ogni lettera selezionerebbe tutto il campo). */
let vaniLocaleFocusDaRender = false;

let vaniFeedbackTimer = 0;

/** Dati per «Elimina» nel modale conferma (dopo clic su ✕). */
let vaniEliminaPending = null;

/** Parete a cui collegare la nuova apertura dal dialog VANI. */
let vaniNuovaAperturaPareteId = null;

function ripristinaContatoriDaPiani() {
  let maxP = 0;
  let maxL = 0;
  let maxPa = 0;
  let maxSf = 0;
  for (const p of piani) {
    if (Number.isFinite(p.id)) maxP = Math.max(maxP, p.id);
    for (const l of p.locali || []) {
      if (Number.isFinite(l.id)) maxL = Math.max(maxL, l.id);
      for (const pa of l.pareti || []) {
        if (Number.isFinite(pa.id)) maxPa = Math.max(maxPa, pa.id);
        for (const st of pa.stratifinitura || []) {
          if (st && Number.isFinite(st.id)) maxSf = Math.max(maxSf, st.id);
        }
      }
    }
  }
  nextPianoId = maxP + 1;
  nextLocaleId = maxL + 1;
  nextPareteId = maxPa + 1;
  nextStratifinituraId = maxSf + 1;
}

function sanificaPianiCaricati(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return false;
  for (const p of lista) {
    if (!p || typeof p !== "object") return false;
    if (typeof p.nome !== "string") p.nome = "";
    if (!Array.isArray(p.locali)) return false;
    for (const l of p.locali) {
      if (!l || typeof l !== "object") return false;
      if (typeof l.nomeLocale !== "string") l.nomeLocale = "";
      if (!Array.isArray(l.pareti)) return false;
      for (const pa of l.pareti) {
        if (!pa || typeof pa !== "object") return false;
        if (typeof pa.riferimento !== "string") pa.riferimento = "";
        if (typeof pa.lunghezza !== "string" && typeof pa.lunghezza !== "number") pa.lunghezza = "";
        else if (typeof pa.lunghezza === "number") pa.lunghezza = String(pa.lunghezza);
        if (typeof pa.altezza !== "string" && typeof pa.altezza !== "number") pa.altezza = "";
        else if (typeof pa.altezza === "number") pa.altezza = String(pa.altezza);
        if (!Array.isArray(pa.idApertureMaster)) pa.idApertureMaster = [];
        pa.idApertureMaster = pa.idApertureMaster.map((x) => String(x ?? "").trim()).filter(Boolean);
        if (!Array.isArray(pa.stratifinitura) || pa.stratifinitura.length === 0) {
          pa.stratifinitura = [
            { id: 0, vocibreve: "", elevazione: "", altezza: "", note: "", stratiapertura: [] },
          ];
        } else {
          pa.stratifinitura = pa.stratifinitura.filter((st) => st && typeof st === "object");
          if (pa.stratifinitura.length === 0) {
            pa.stratifinitura = [
              { id: 0, vocibreve: "", elevazione: "", altezza: "", note: "", stratiapertura: [] },
            ];
          }
          for (const st of pa.stratifinitura) {
            if (typeof st.id !== "number" || !Number.isFinite(st.id)) st.id = 0;
            if (typeof st.vocibreve !== "string") st.vocibreve = "";
            if (typeof st.elevazione !== "string" && typeof st.elevazione !== "number") st.elevazione = "";
            else if (typeof st.elevazione === "number") st.elevazione = String(st.elevazione);
            if (typeof st.altezza !== "string" && typeof st.altezza !== "number") st.altezza = "";
            else if (typeof st.altezza === "number") st.altezza = String(st.altezza);
            if (typeof st.note !== "string") st.note = "";
            if (!Array.isArray(st.stratiapertura)) st.stratiapertura = [];
          }
        }
        for (const k of PARETE_FLAG_KEYS) {
          if (typeof pa[k] !== "boolean") pa[k] = false;
        }
      }
    }
  }
  return true;
}

function caricaRegistratiDaStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_VANI_REGISTRATI_KEY);
    if (!raw) {
      vaniRegistrati = [];
      return;
    }
    const data = JSON.parse(raw);
    vaniRegistrati = Array.isArray(data.items) ? data.items : [];
  } catch {
    vaniRegistrati = [];
  }
}

function salvaRegistratiInStorage() {
  localStorage.setItem(
    STORAGE_VANI_REGISTRATI_KEY,
    JSON.stringify({ v: 1, items: vaniRegistrati }),
  );
}

/** Se esiste il vecchio salvataggio “tutto insieme”, spezza in voci registrate e rimuove la chiave legacy. */
function migraSalvataggioLegacySeServe() {
  if (vaniRegistrati.length > 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_VANI_LEGACY_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.piani) || !sanificaPianiCaricati(data.piani)) {
      localStorage.removeItem(STORAGE_VANI_LEGACY_KEY);
      return;
    }
    for (const p of data.piani) {
      for (const l of p.locali || []) {
        vaniRegistrati.push({
          id: `mig-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          pianoNome: typeof p.nome === "string" ? p.nome : "",
          nomeLocale: typeof l.nomeLocale === "string" ? l.nomeLocale : "",
          pareti: (l.pareti || []).map((pa) => ({
            riferimento: typeof pa.riferimento === "string" ? pa.riferimento : "",
            lunghezza: pa.lunghezza ?? "",
            altezza: pa.altezza ?? "",
            idApertureMaster: [...(pa.idApertureMaster || [])].map((x) => String(x ?? "").trim()).filter(Boolean),
            stratifinitura: (pa.stratifinitura || []).map((st) => ({
              id: typeof st.id === "number" ? st.id : 0,
              vocibreve: typeof st.vocibreve === "string" ? st.vocibreve : "",
              elevazione: st.elevazione != null && st.elevazione !== "" ? String(st.elevazione) : "",
              altezza: st.altezza != null && st.altezza !== "" ? String(st.altezza) : "",
              note: typeof st.note === "string" ? st.note : "",
              stratiapertura: Array.isArray(st.stratiapertura) ? [...st.stratiapertura] : [],
            })),
            ...Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, !!pa[k]])),
          })),
        });
      }
    }
    salvaRegistratiInStorage();
    localStorage.removeItem(STORAGE_VANI_LEGACY_KEY);
  } catch {
    localStorage.removeItem(STORAGE_VANI_LEGACY_KEY);
  }
}

function resetBozzaVuota() {
  vanoBozzaCollegatoId = null;
  nextPianoId = 1;
  nextLocaleId = 1;
  nextPareteId = 1;
  nextStratifinituraId = 1;
  piani = [emptyPiano()];
  collapsedPareteIds.clear();
  vaniFocusPareteIdDopoRender = null;
}

/** Un solo piano in bozza; almeno un locale; ogni locale con almeno una parete (non si eliminano più i locali extra). */
function assicuraBozzaUnPianoUnLocale() {
  if (!Array.isArray(piani) || piani.length === 0) {
    resetBozzaVuota();
    return;
  }
  if (piani.length > 1) piani = [piani[0]];
  const p = piani[0];
  if (!Array.isArray(p.locali) || p.locali.length === 0) {
    p.locali = [emptyLocale()];
  }
  for (const loc of p.locali) {
    if (!Array.isArray(loc.pareti) || loc.pareti.length === 0) {
      loc.pareti = [emptyParete()];
    }
  }
  ripristinaContatoriDaPiani();
}

function cloneParetePerSnapshot(pa) {
  return {
    riferimento: typeof pa.riferimento === "string" ? pa.riferimento : "",
    lunghezza: pa.lunghezza ?? "",
    altezza: pa.altezza ?? "",
    idApertureMaster: [...(pa.idApertureMaster || [])].map((x) => String(x ?? "").trim()).filter(Boolean),
    stratifinitura: (
      pa.stratifinitura || [
        { id: 0, vocibreve: "", elevazione: "", altezza: "", note: "", stratiapertura: [] },
      ]
    ).map((st) => ({
      id: typeof st.id === "number" ? st.id : 0,
      vocibreve: typeof st.vocibreve === "string" ? st.vocibreve : "",
      elevazione: st.elevazione != null && st.elevazione !== "" ? String(st.elevazione) : "",
      altezza: st.altezza != null && st.altezza !== "" ? String(st.altezza) : "",
      note: typeof st.note === "string" ? st.note : "",
      stratiapertura: Array.isArray(st.stratiapertura) ? [...st.stratiapertura] : [],
    })),
    ...Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, !!pa[k]])),
  };
}

function creaSnapshotRegistrato(idDaRiprendere) {
  const p = piani[0];
  const locs = Array.isArray(p.locali) ? p.locali : [];
  const idFinale =
    idDaRiprendere != null && String(idDaRiprendere).trim() !== ""
      ? String(idDaRiprendere).trim()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const locali = locs.map((l) => ({
    nomeLocale: typeof l.nomeLocale === "string" ? l.nomeLocale : "",
    pareti: (l.pareti || []).map((pa) => cloneParetePerSnapshot(pa)),
  }));
  const l0 = locs[0] || { nomeLocale: "", pareti: [] };
  return {
    id: idFinale,
    pianoNome: typeof p.nome === "string" ? p.nome : "",
    locali,
    nomeLocale: typeof l0.nomeLocale === "string" ? l0.nomeLocale : "",
    pareti: (l0.pareti || []).map((pa) => cloneParetePerSnapshot(pa)),
  };
}

function applicaRecordComeBozza(rec) {
  if (!rec || typeof rec !== "object") return;
  vanoBozzaCollegatoId = rec.id != null && String(rec.id).trim() !== "" ? String(rec.id).trim() : null;
  nextPianoId = 1;
  nextLocaleId = 1;
  nextPareteId = 1;
  nextStratifinituraId = 1;
  const piano = {
    id: nextPianoId++,
    nome: typeof rec.pianoNome === "string" ? rec.pianoNome : "",
    locali: [],
  };
  const blocchiLocali =
    Array.isArray(rec.locali) && rec.locali.length > 0
      ? rec.locali
      : [
          {
            nomeLocale: typeof rec.nomeLocale === "string" ? rec.nomeLocale : "",
            pareti: Array.isArray(rec.pareti) ? rec.pareti : [],
          },
        ];
  for (const blocco of blocchiLocali) {
    const locale = {
      id: nextLocaleId++,
      nomeLocale: typeof blocco.nomeLocale === "string" ? blocco.nomeLocale : "",
      pareti: [],
    };
    const srcPareti = Array.isArray(blocco.pareti) && blocco.pareti.length > 0 ? blocco.pareti : [{}];
    for (const src of srcPareti) {
      const stratSrc =
        Array.isArray(src.stratifinitura) && src.stratifinitura.length > 0 ? src.stratifinitura : null;
      const stratRows = stratSrc
        ? stratSrc.map((st) => ({
            id:
              typeof st?.id === "number" && Number.isFinite(st.id)
                ? st.id
                : nextStratifinituraId++,
            vocibreve: typeof st?.vocibreve === "string" ? st.vocibreve : "",
            elevazione:
              st?.elevazione != null && st.elevazione !== "" ? String(st.elevazione) : "",
            altezza: st?.altezza != null && st.altezza !== "" ? String(st.altezza) : "",
            note: typeof st?.note === "string" ? st.note : "",
            stratiapertura: Array.isArray(st?.stratiapertura) ? [...st.stratiapertura] : [],
          }))
        : [
            {
              id: nextStratifinituraId++,
              vocibreve: "",
              elevazione: "",
              altezza: "",
              note: "",
              stratiapertura: [],
            },
          ];
      locale.pareti.push({
        id: nextPareteId++,
        riferimento: typeof src.riferimento === "string" ? src.riferimento : "",
        lunghezza: src.lunghezza != null && src.lunghezza !== "" ? String(src.lunghezza) : "",
        altezza: src.altezza != null && src.altezza !== "" ? String(src.altezza) : "",
        idApertureMaster: Array.isArray(src.idApertureMaster)
          ? src.idApertureMaster.map((x) => String(x ?? "").trim()).filter(Boolean)
          : [],
        stratifinitura: stratRows,
        ...Object.fromEntries(
          PARETE_FLAG_KEYS.map((k) => [k, typeof src[k] === "boolean" ? src[k] : false]),
        ),
      });
    }
    piano.locali.push(locale);
  }
  piani = [piano];
  ripristinaContatoriDaPiani();
}

function mostraFeedbackRegistra(ok, testo) {
  const el = document.getElementById("vani-registra-feedback");
  if (!el) return;
  window.clearTimeout(vaniFeedbackTimer);
  el.textContent = testo;
  el.classList.toggle("vani-registra-feedback--err", !ok);
  vaniFeedbackTimer = window.setTimeout(() => {
    el.textContent = "";
    el.classList.remove("vani-registra-feedback--err");
  }, 4500);
}

function renderSidebarListaVani() {
  const ul = document.getElementById("vani-sidebar-list");
  if (!ul) return;
  ul.replaceChildren();
  if (vaniRegistrati.length === 0) {
    const li = document.createElement("li");
    li.className = "vani-sidebar-empty";
    li.textContent = "Nessun vano registrato.";
    ul.appendChild(li);
    return;
  }
  for (const item of vaniRegistrati) {
    const pianoEtichetta = (item.pianoNome && String(item.pianoNome).trim()) || "Piano";
    const nomiLoc = Array.isArray(item.locali)
      ? item.locali.map((x) => (x && typeof x.nomeLocale === "string" ? x.nomeLocale.trim() : "")).filter(Boolean)
      : [];
    const nomeLocLegacy = (item.nomeLocale && String(item.nomeLocale).trim()) || "";
    const nomeLoc =
      nomiLoc.length > 0 ? nomiLoc.join(", ") : nomeLocLegacy || "";
    const testo = nomeLoc ? `${pianoEtichetta} · ${nomeLoc}` : `${pianoEtichetta} · (senza nome)`;
    const li = document.createElement("li");
    li.className = "vani-sidebar-row";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vani-sidebar-item";
    btn.dataset.vanoId = String(item.id);
    btn.textContent = testo;
    btn.title = "Apri in modifica";

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-action btn-delete vani-sidebar-elimina";
    btnDel.dataset.action = "elimina-vano-registrato";
    btnDel.dataset.vanoId = String(item.id);
    btnDel.title = "Elimina questo vano dall’elenco";
    btnDel.setAttribute(
      "aria-label",
      `Elimina vano ${testo.replace(/"/g, "")} dall’elenco (chiede conferma)`,
    );
    btnDel.innerHTML = `<svg class="vani-sidebar-elimina-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;

    li.appendChild(btn);
    li.appendChild(btnDel);
    ul.appendChild(li);
  }
}

function onSidebarListaClick(event) {
  const delBtn = event.target.closest("button[data-action='elimina-vano-registrato']");
  if (delBtn) {
    event.preventDefault();
    event.stopPropagation();
    const vid = String(delBtn.dataset.vanoId ?? "").trim();
    if (!vid) return;
    const rec = vaniRegistrati.find((x) => String(x.id) === vid);
    if (!rec) return;
    const pianoEtichetta = (rec.pianoNome && String(rec.pianoNome).trim()) || "Piano";
    const nomiLoc = Array.isArray(rec.locali)
      ? rec.locali.map((x) => (x && typeof x.nomeLocale === "string" ? x.nomeLocale.trim() : "")).filter(Boolean)
      : [];
    const nomeLocLegacy = (rec.nomeLocale && String(rec.nomeLocale).trim()) || "";
    const nomeLoc =
      nomiLoc.length > 0 ? nomiLoc.join(", ") : nomeLocLegacy || "";
    const etichetta = nomeLoc ? `${pianoEtichetta} · ${nomeLoc}` : `${pianoEtichetta} · (senza nome)`;
    apriModaleConfermaEliminaVani(
      `Vuoi eliminare il vano «${etichetta}» dall’elenco? Verranno rimosse anche le righe nelle VOCI collegate a questo vano (misurazioni semiautomatiche da VANI). L’azione non è annullabile dal programma.`,
      { kind: "vanoRegistrato", vanoId: vid },
    );
    return;
  }

  const btn = event.target.closest(".vani-sidebar-item");
  if (!btn) return;
  const vid = String(btn.dataset.vanoId ?? "").trim();
  if (!vid) return;
  const rec = vaniRegistrati.find((x) => String(x.id) === vid);
  if (!rec) return;
  applicaRecordComeBozza(rec);
  // Quando apro un vano dalla sidebar, parto con tutti gli strati chiusi.
  collapsedPareteIds.clear();
  for (const piano of piani) {
    for (const locale of piano.locali || []) {
      comprimiTutteParetiLocale(locale);
    }
  }
  renderGerarchia();
  document.getElementById("vani-gerarchia-host")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const cell = document.querySelector(".vani-locale-cell");
  if (cell) {
    cell.classList.remove("vani-locale-highlight");
    void cell.offsetWidth;
    cell.classList.add("vani-locale-highlight");
    window.setTimeout(() => cell.classList.remove("vani-locale-highlight"), 2200);
  }
}

function eliminaVanoRegistrato(vanoId) {
  const vid = String(vanoId ?? "").trim();
  if (!vid) return;
  const idx = vaniRegistrati.findIndex((x) => String(x.id) === vid);
  if (idx < 0) return;
  vaniRegistrati.splice(idx, 1);
  try {
    salvaRegistratiInStorage();
  } catch {
    /* ignore */
  }
  rimuoviRigheMisurazioniPerVanoId(vid);
  if (vanoBozzaCollegatoId != null && String(vanoBozzaCollegatoId) === vid) {
    vanoBozzaCollegatoId = null;
    resetBozzaVuota();
  }
  renderGerarchia();
  mostraFeedbackRegistra(true, "Vano eliminato dall’elenco.");
}

function onRegistraVanoClick() {
  syncStateFromInputs();
  normalizzaUnicitaApertureNeiLocali();
  assicuraBozzaUnPianoUnLocale();
  try {
    const idModifica = vanoBozzaCollegatoId;
    const snap = creaSnapshotRegistrato(idModifica);
    if (idModifica) {
      const idx = vaniRegistrati.findIndex((x) => String(x.id) === String(idModifica));
      if (idx >= 0) vaniRegistrati[idx] = snap;
      else vaniRegistrati.push(snap);
    } else {
      vaniRegistrati.push(snap);
    }
    salvaRegistratiInStorage();
    aggiornaNoteVociDaSnapshotVanoRegistrato(snap);
    mostraFeedbackRegistra(
      true,
      idModifica
        ? "Vano aggiornato nella lista. Scheda azzerata per il vano successivo."
        : "Vano registrato. Scheda azzerata: puoi inserire il vano successivo.",
    );
    resetBozzaVuota();
    renderGerarchia();
  } catch {
    mostraFeedbackRegistra(false, "Impossibile salvare (spazio o errore di scrittura).");
  }
}

function emptyStratifinitura() {
  return {
    id: nextStratifinituraId++,
    vocibreve: "",
    elevazione: "",
    altezza: "",
    note: "",
    stratiapertura: [],
  };
}

/** Copia strato da modello → nuovi id e clone leggero di stratiapertura. */
function cloneStratoDaSorgente(st) {
  const ap = Array.isArray(st.stratiapertura) ? st.stratiapertura.map((x) => (x && typeof x === "object" ? { ...x } : x)) : [];
  return {
    id: nextStratifinituraId++,
    vocibreve: typeof st.vocibreve === "string" ? st.vocibreve : "",
    elevazione: st.elevazione != null && st.elevazione !== "" ? String(st.elevazione) : "",
    altezza: st.altezza != null && st.altezza !== "" ? String(st.altezza) : "",
    note: typeof st.note === "string" ? st.note : "",
    stratiapertura: ap,
  };
}

function stratoCompletamenteVuoto(st) {
  return (
    !String(st.vocibreve ?? "").trim() &&
    !String(st.elevazione ?? "").trim() &&
    !String(st.altezza ?? "").trim() &&
    !String(st.note ?? "").trim() &&
    (!Array.isArray(st.stratiapertura) || st.stratiapertura.length === 0)
  );
}

/** @returns {boolean} true se è stata aggiornata la gerarchia strati */
function maybeAggiungiStratoPerFlagTipo(parete, flagKey) {
  const note = PARETE_FLAG_AUTO_STRATO_NOTE[flagKey];
  if (!note) return false;
  if (!Array.isArray(parete.stratifinitura)) parete.stratifinitura = [];
  const want = note.toLowerCase();
  if (
    parete.stratifinitura.some((st) => String(st.note ?? "").trim().toLowerCase() === want)
  ) {
    return false;
  }
  const riempibile = parete.stratifinitura.find((st) => stratoCompletamenteVuoto(st));
  if (riempibile) {
    riempibile.note = note;
    return true;
  }
  const nuovo = emptyStratifinitura();
  nuovo.note = note;
  parete.stratifinitura.push(nuovo);
  return true;
}

function emptyParete() {
  return {
    id: nextPareteId++,
    riferimento: "",
    lunghezza: "",
    altezza: "",
    idApertureMaster: [],
    stratifinitura: [emptyStratifinitura()],
    ...pareteFlagsDefaults(),
  };
}

function emptyLocale() {
  return {
    id: nextLocaleId++,
    nomeLocale: "",
    pareti: [emptyParete()],
  };
}

function emptyPiano() {
  return {
    id: nextPianoId++,
    nome: "",
    locali: [emptyLocale()],
  };
}

function refreshArchivioLocaleDatalist() {
  const dl = document.getElementById("vani-archivio-locale-datalist");
  if (!dl) return;
  dl.replaceChildren();
  for (const loc of getUniqueLocalesForVaniPicker()) {
    const opt = document.createElement("option");
    opt.value = loc;
    dl.appendChild(opt);
  }
}

function prunePareteForLocale(parete, nomeLocale) {
  const allowed = new Set(
    getArchivioAperturePerLocale(nomeLocale).map((ap) => String(ap.idAperturaMaster ?? "").trim()),
  );
  parete.idApertureMaster = (parete.idApertureMaster || []).filter((id) => allowed.has(String(id ?? "").trim()));
}

/** Valore numerico archivio → testo in lista (virgola decimale, 2 cifre come in computo). */
function fmtDimApLabel(v) {
  if (v === "" || v === undefined || v === null) return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parsing flessibile (virgola o punto). */
function parseMetroLoose(v) {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function fmtItTwoDecimalsOrDash(val) {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function mqLordiDaLungH(L, H) {
  if (L === null || H === null) return null;
  return Number((L * H).toFixed(6));
}

function formatApLabel(ap) {
  const largh = ap.largh ?? ap.lunghezza;
  const alt = ap.alt ?? ap.altezza;
  const hDav = ap.hDav ?? ap.hDavanzale;
  return `LARGHEZZA ${fmtDimApLabel(largh)}, ALTEZZA ${fmtDimApLabel(alt)}, HDAVANZALE ${fmtDimApLabel(hDav)}`;
}

/** ID aperture già scelte su altre pareti dello stesso locale (stringhe normalizzate). */
function idsAperturePreseAltroveNelLocale(locale, pareteIdCorrente) {
  const taken = new Set();
  for (const pa of locale.pareti) {
    if (pa.id === pareteIdCorrente) continue;
    for (const id of pa.idApertureMaster || []) {
      const s = String(id ?? "").trim();
      if (s) taken.add(s);
    }
  }
  return taken;
}

/** Rimuove l’id da tutte le pareti tranne `pareteId`. */
function rimuoviIdAperturaDaAltrePareti(pareteId, idM) {
  for (const p of piani) {
    for (const l of p.locali) {
      for (const pa of l.pareti) {
        if (pa.id === pareteId) continue;
        pa.idApertureMaster = (pa.idApertureMaster || []).filter((x) => String(x ?? "").trim() !== idM);
      }
    }
  }
}

/**
 * Se lo stesso id risulta su più pareti del locale (dati vecchi / incoerenti), resta solo sulla prima parete in ordine.
 */
function normalizzaUnicitaApertureNeiLocali() {
  for (const p of piani) {
    for (const l of p.locali) {
      const idToPareteId = new Map();
      for (const pa of l.pareti) {
        for (const id of pa.idApertureMaster || []) {
          const s = String(id ?? "").trim();
          if (!s || idToPareteId.has(s)) continue;
          idToPareteId.set(s, pa.id);
        }
      }
      for (const pa of l.pareti) {
        const keep = (pa.idApertureMaster || []).filter((id) => {
          const s = String(id ?? "").trim();
          return s && idToPareteId.get(s) === pa.id;
        });
        pa.idApertureMaster = [...new Set(keep.map((x) => String(x ?? "").trim()))];
      }
    }
  }
}

function findParete(pareteId) {
  const pid = Number(pareteId);
  for (const p of piani) {
    for (const l of p.locali) {
      for (const pa of l.pareti) {
        if (pa.id === pid) return { piano: p, locale: l, parete: pa };
      }
    }
  }
  return null;
}

function findLocale(localeId) {
  const lid = Number(localeId);
  for (const p of piani) {
    for (const l of p.locali) {
      if (l.id === lid) return { piano: p, locale: l };
    }
  }
  return null;
}

function findPiano(pianoId) {
  const id = Number(pianoId);
  return piani.find((p) => p.id === id) ?? null;
}

function syncStateFromInputs() {
  document.querySelectorAll(".vani-piano-block").forEach((block) => {
    const pid = Number(block.dataset.pianoId);
    const piano = findPiano(pid);
    if (!piano) return;
    const nome = block.querySelector(".vani-piano-nome");
    if (nome instanceof HTMLInputElement) {
      const r = tryEnsurePianoInArchivio(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, nome.value);
      if (r.canonical) {
        piano.nome = r.canonical;
        nome.value = r.canonical;
      } else {
        piano.nome = nome.value;
      }
      if (r.added) {
        document.dispatchEvent(
          new CustomEvent("computo-archivio-piani-misura-changed", { detail: { added: true } }),
        );
      }
    }

    block.querySelectorAll(".vani-locale-cell").forEach((cell) => {
      const lid = Number(cell.dataset.localeId);
      const loc = piano.locali.find((x) => x.id === lid);
      if (!loc) return;
      const inp = cell.querySelector(".vani-locale-nome");
      if (inp instanceof HTMLInputElement) loc.nomeLocale = inp.value;
    });

    block.querySelectorAll("tr[data-parete-id]").forEach((tr) => {
      const paid = Number(tr.dataset.pareteId);
      const hit = findParete(paid);
      if (!hit) return;
      const rif = tr.querySelector(".vani-parete-rif");
      const lung = tr.querySelector(".vani-parete-lung");
      const alt = tr.querySelector(".vani-parete-alt");
      if (rif instanceof HTMLInputElement) hit.parete.riferimento = rif.value;
      if (lung instanceof HTMLInputElement) hit.parete.lunghezza = lung.value;
      if (alt instanceof HTMLInputElement) hit.parete.altezza = alt.value;
      tr.querySelectorAll(".vani-parete-flag").forEach((el) => {
        if (!(el instanceof HTMLInputElement)) return;
        const key = String(el.dataset.flag ?? "").trim();
        if (!PARETE_FLAG_KEYS.includes(key)) return;
        hit.parete[key] = el.checked;
      });
      const stratRow = tr.nextElementSibling;
      if (
        stratRow instanceof HTMLTableRowElement &&
        stratRow.classList.contains("vani-tr-stratifinitura")
      ) {
        stratRow.querySelectorAll(".vani-stratifinitura-row").forEach((rowEl) => {
          const sid = Number(rowEl.dataset.stratifinituraId);
          const st = hit.parete.stratifinitura?.find((x) => x.id === sid);
          if (!st) return;
          const vb = rowEl.querySelector(".vani-stratifinitura-vocibreve");
          const el = rowEl.querySelector(".vani-stratifinitura-elevazione");
          const al = rowEl.querySelector(".vani-stratifinitura-altezza");
          const nt = rowEl.querySelector(".vani-stratifinitura-note");
          if (vb instanceof HTMLInputElement) st.vocibreve = vb.value;
          if (el instanceof HTMLInputElement) st.elevazione = el.value;
          if (al instanceof HTMLInputElement) st.altezza = al.value;
          if (nt instanceof HTMLInputElement) st.note = nt.value;
        });
      }
    });
  });
}

function renderApertureCell(localeNome, parete, locale) {
  const nome = localeNome.trim();
  const td = document.createElement("td");
  td.className = "vani-td-aperture";

  if (!nome) {
    const sp = document.createElement("span");
    sp.className = "vani-cell-hint";
    sp.textContent = "—";
    td.appendChild(sp);
    return td;
  }

  const candidati = getArchivioAperturePerLocale(nome);
  if (candidati.length === 0) {
    const sp = document.createElement("span");
    sp.className = "vani-cell-hint";
    sp.textContent = "Nessuna ap.";
    td.appendChild(sp);
    return td;
  }

  const box = document.createElement("div");
  box.className = "vani-ap-checkboxes";
  const sel = new Set((parete.idApertureMaster || []).map((x) => String(x ?? "").trim()).filter(Boolean));
  const preseAltrove = idsAperturePreseAltroveNelLocale(locale, parete.id);
  for (const ap of candidati) {
    const idM = String(ap.idAperturaMaster ?? "").trim();
    if (!idM) continue;
    const lab = document.createElement("label");
    lab.className = "vani-ap-line";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.pareteId = String(parete.id);
    cb.dataset.idAperturaMaster = idM;
    cb.checked = sel.has(idM);
    const bloccata = preseAltrove.has(idM) && !sel.has(idM);
    cb.disabled = bloccata;
    if (bloccata) {
      lab.classList.add("vani-ap-line-blocked");
      lab.title = "Già collegata a un'altra parete di questo locale.";
    }
    const tx = document.createElement("span");
    tx.textContent = formatApLabel(ap);
    lab.appendChild(cb);
    lab.appendChild(tx);
    box.appendChild(lab);
  }
  td.appendChild(box);
  return td;
}

/** Una cella larga (colspan 3): rif., L, H e checkbox sulla stessa riga visiva. */
function renderPareteMisureTd(parete) {
  const td = document.createElement("td");
  td.colSpan = 3;
  td.className = "vani-td-parete-misure";

  const row = document.createElement("div");
  row.className = "vani-parete-misure-row";

  const toggleStrati = document.createElement("button");
  toggleStrati.type = "button";
  toggleStrati.className = "btn-action btn-secondary vani-btn-micro vani-parete-toggle-strati";
  toggleStrati.dataset.action = "toggle-parete-strati";
  toggleStrati.dataset.pareteId = String(parete.id);
  toggleStrati.id = `vani-parete-strati-toggle-${parete.id}`;
  const coll = pareteStratiCollassati(parete.id);
  toggleStrati.setAttribute("aria-expanded", String(!coll));
  toggleStrati.setAttribute("aria-controls", `vani-parete-strati-${parete.id}`);
  toggleStrati.title = coll
    ? "Mostra strati finitura e calcolo strati netti"
    : "Nascondi strati finitura e calcolo strati netti";
  toggleStrati.setAttribute("aria-label", toggleStrati.title);
  toggleStrati.textContent = coll ? "▸" : "▾";

  const rif = document.createElement("input");
  rif.type = "text";
  rif.className = "vani-parete-rif";
  rif.placeholder = "rif.";
  rif.setAttribute("aria-label", "Riferimento parete");
  rif.value = parete.riferimento ?? "";

  const rifWrap = document.createElement("div");
  rifWrap.className = "vani-parete-rif-wrap";
  const rifLabel = document.createElement("span");
  rifLabel.className = "vani-parete-field-label";
  rifLabel.textContent = "Riferimento";
  rifWrap.appendChild(rifLabel);
  rifWrap.appendChild(rif);

  const lh = document.createElement("div");
  lh.className = "vani-parete-lh-inline";

  const lung = document.createElement("input");
  lung.type = "number";
  lung.className = "vani-parete-lung vani-in-num vani-in-num--lh";
  lung.step = "0.001";
  lung.min = "0";
  lung.max = "99.999";
  lung.placeholder = "L";
  lung.title = "Massimo 99,999 (due cifre intere, tre decimali)";
  lung.setAttribute("aria-label", "Lunghezza parete");
  lung.value = parete.lunghezza ?? "";
  const lungLabel = document.createElement("span");
  lungLabel.className = "vani-parete-field-label";
  lungLabel.textContent = "Lung.";

  const alt = document.createElement("input");
  alt.type = "number";
  alt.className = "vani-parete-alt vani-in-num vani-in-num--lh";
  alt.step = "0.001";
  alt.min = "0";
  alt.max = "99.999";
  alt.placeholder = "H";
  alt.title = "Massimo 99,999 (due cifre intere, tre decimali)";
  alt.setAttribute("aria-label", "Altezza parete");
  alt.value = parete.altezza ?? "";
  const altLabel = document.createElement("span");
  altLabel.className = "vani-parete-field-label";
  altLabel.textContent = "Alt.";

  lh.appendChild(lungLabel);
  lh.appendChild(lung);
  lh.appendChild(altLabel);
  lh.appendChild(alt);

  const flags = document.createElement("div");
  flags.className = "vani-parete-flags";
  flags.setAttribute("role", "group");
  flags.setAttribute("aria-label", "Tipologie parete");

  for (const key of PARETE_FLAG_KEYS) {
    const lab = document.createElement("label");
    lab.className = "vani-parete-flag-line";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "vani-parete-flag";
    cb.dataset.pareteId = String(parete.id);
    cb.dataset.flag = key;
    cb.checked = !!parete[key];
    cb.setAttribute("aria-label", PARETE_FLAG_LABELS[key]);
    const tx = document.createElement("span");
    tx.textContent = PARETE_FLAG_LABELS[key];
    lab.appendChild(cb);
    lab.appendChild(tx);
    flags.appendChild(lab);
  }

  row.appendChild(toggleStrati);
  row.appendChild(rifWrap);
  row.appendChild(lh);
  row.appendChild(flags);
  td.appendChild(row);
  return td;
}

/** Riepilogo sotto gli strati: rigo lordo + blocchi aperture sottratte (una riga per apertura) + mq netto. */
function buildStratiNettiSection(parete, nomeLocale, stratListInput = null, titleText = "Calcolo strati netti") {
  const stratList = Array.isArray(stratListInput)
    ? stratListInput
    : Array.isArray(parete.stratifinitura) && parete.stratifinitura.length > 0
      ? parete.stratifinitura
      : [{ id: 0, vocibreve: "", elevazione: "", altezza: "", note: "", stratiapertura: [] }];

  const box = document.createElement("div");
  box.className = "vani-strati-netti";

  const head = document.createElement("div");
  head.className = "vani-strati-netti-head";

  const title = document.createElement("span");
  title.className = "vani-strati-netti-title";
  title.textContent = titleText;

  head.appendChild(title);

  const trimmedLocale = String(nomeLocale ?? "").trim();

  const table = document.createElement("table");
  table.className = "vani-strati-netti-table";

  const colg = document.createElement("colgroup");
  for (const cls of [
    "vani-sn-col-voce",
    "vani-sn-col-lung",
    "vani-sn-col-h",
    "vani-sn-col-ml",
    "vani-sn-col-mq",
  ]) {
    const col = document.createElement("col");
    col.className = cls;
    colg.appendChild(col);
  }
  table.appendChild(colg);

  const thead = document.createElement("thead");
  const trH = document.createElement("tr");
  const headers = [
    "Voce breve",
    "Lung. parete (m)",
    "H strato (m)",
    "ML lordi (m)",
    "Mq lordi (m²)",
  ];
  for (let i = 0; i < headers.length; i++) {
    const th = document.createElement("th");
    th.scope = "col";
    if (i > 0) th.className = "vani-strati-netti-num";
    th.textContent = headers[i];
    trH.appendChild(th);
  }
  thead.appendChild(trH);
  table.appendChild(thead);

  const idsParete = (parete.idApertureMaster || []).map((id) => String(id ?? "").trim()).filter(Boolean);
  const haApertureCollegati = Boolean(trimmedLocale && idsParete.length > 0);

  const tbodySingle = document.createElement("tbody");
  tbodySingle.className = "vani-sn-tbody-single";

  stratList.forEach((st, tiStrato) => {
    const L = parseMetroLoose(parete.lunghezza);
    const H = parseMetroLoose(st.altezza);
    const elevRaw = String(st.elevazione ?? "").trim();
    const E = elevRaw === "" ? 0 : parseMetroLoose(st.elevazione);
    const stratoElevInvalid = elevRaw !== "" && E === null;
    const stratoHxOk = H !== null && !stratoElevInvalid;

    const vb = typeof st.vocibreve === "string" ? st.vocibreve.trim() : "";

    const trMain = document.createElement("tr");
    trMain.className =
      tiStrato === 0 ? "vani-sn-row-main" : "vani-sn-row-main vani-sn-row-main--dopo-precedente";
    trMain.dataset.stratifinituraId = String(st.id);

    const tdVoc = document.createElement("td");
    tdVoc.className = "vani-sn-cell-voc";
    tdVoc.textContent = vb || "—";
    trMain.appendChild(tdVoc);

    const tdL = document.createElement("td");
    tdL.className = "vani-strati-netti-num vani-sn-cell-data-num";
    tdL.textContent = fmtDimApLabel(parete.lunghezza);
    trMain.appendChild(tdL);

    const tdH = document.createElement("td");
    tdH.className = "vani-strati-netti-num vani-sn-cell-data-num";
    tdH.textContent = fmtDimApLabel(st.altezza);
    trMain.appendChild(tdH);

    const mlLordi = L;
    const tdMlLordi = document.createElement("td");
    tdMlLordi.className = "vani-strati-netti-num vani-sn-cell-data-num";
    tdMlLordi.textContent = fmtItTwoDecimalsOrDash(mlLordi);
    tdMlLordi.title = "Metri lineari lordi: qui pari alla lunghezza parete (corsia di finitura).";
    trMain.appendChild(tdMlLordi);

    const mqLordiNum = mqLordiDaLungH(L, H);
    const tdMqLordi = document.createElement("td");
    tdMqLordi.className = "vani-strati-netti-num vani-sn-cell-data-num";
    tdMqLordi.textContent = mqLordiNum == null ? "—" : fmtItTwoDecimalsOrDash(mqLordiNum);
    trMain.appendChild(tdMqLordi);

    tbodySingle.appendChild(trMain);

    let sommaMqAperture = 0;

    if (haApertureCollegati) {
      const trBanner = document.createElement("tr");
      trBanner.className = "vani-sn-row-ap-banner";
      const tdB0 = document.createElement("td");
      tdB0.className = "vani-sn-cell-empty";

      const tdB1 = document.createElement("td");
      tdB1.colSpan = 4;
      tdB1.className = "vani-sn-ap-banner-label";
      tdB1.textContent = "Aperture sottratte";
      trBanner.appendChild(tdB0);
      trBanner.appendChild(tdB1);
      tbodySingle.appendChild(trBanner);

      const trSubh = document.createElement("tr");
      trSubh.className = "vani-sn-row-ap-subhd";
      const sh0 = document.createElement("td");
      sh0.className = "vani-sn-cell-empty";
      trSubh.appendChild(sh0);
      for (const [label, ttl] of [
        ["Lungh. apertura (m)", "Larghezza apertura in archivio"],
        ["h inclusa (m)", "Altezza apertura compresa nella fascia dello strato"],
        ["ML netti (m)", "Uguale alla lungh. apertura (porzione lineare sottratta)"],
        ["Mq netti (m²)", "Lungh. × h inclusa"],
      ]) {
        const ths = document.createElement("td");
        ths.className = `vani-sn-ap-sub-label vani-strati-netti-num`;
        ths.textContent = label;
        ths.title = ttl;
        trSubh.appendChild(ths);
      }
      tbodySingle.appendChild(trSubh);

      const arch = getArchivioAperturePerLocale(trimmedLocale);
      const idToAp = new Map(
        arch.map((ap) => [String(ap.idAperturaMaster ?? "").trim(), ap]).filter((e) => e[0]),
      );

      const renderApRow = (larVal, hIncVal, mqVal) => {
        const larDisp =
          larVal !== null && Number.isFinite(larVal) ? fmtItTwoDecimalsOrDash(larVal) : "—";
        const mlDisp =
          larVal !== null && Number.isFinite(larVal) ? fmtItTwoDecimalsOrDash(larVal) : "—";

        let hDisp = "—";
        if (hIncVal !== null && Number.isFinite(hIncVal)) {
          hDisp = fmtItTwoDecimalsOrDash(hIncVal);
        }

        let mqDisp = "—";
        if (mqVal !== null && Number.isFinite(mqVal)) {
          mqDisp = fmtItTwoDecimalsOrDash(mqVal);
          sommaMqAperture += mqVal;
        }

        const trAp = document.createElement("tr");
        trAp.className = "vani-sn-row-ap-data";
        const a0 = document.createElement("td");
        a0.className = "vani-sn-cell-empty";
        trAp.appendChild(a0);
        for (const txt of [larDisp, hDisp, mlDisp, mqDisp]) {
          const at = document.createElement("td");
          at.className = "vani-strati-netti-num";
          at.textContent = txt;
          trAp.appendChild(at);
        }
        tbodySingle.appendChild(trAp);
      };

      let any = false;
      for (const k of idsParete) {
        const apRow = idToAp.get(k);
        if (!apRow) continue;
        any = true;
        const lar = parseMetroLoose(apRow.largh ?? apRow.lunghezza);
        let hInc = null;
        let mq = null;
        if (stratoHxOk) {
          hInc = altezzaInclusaNelloStratoConElevazione(E, H, apRow);
          if (hInc !== null && lar !== null) mq = Number((lar * hInc).toFixed(6));
        }
        renderApRow(lar, hInc, mq);
      }
      if (!any) renderApRow(null, null, null);
    }

    const trTot = document.createElement("tr");
    trTot.className =
      haApertureCollegati
        ? "vani-sn-row-totmq"
        : "vani-sn-row-totmq vani-sn-row-totmq--solo-lordo";
    trTot.dataset.stratifinituraId = String(st.id);
    const t0 = document.createElement("td");
    t0.colSpan = 3;
    t0.className = "vani-sn-totmq-label";
    t0.textContent = "Mq netto strato (lordi − somma mq aperture)";
    const tMq = document.createElement("td");
    tMq.className = "vani-sn-cell-empty";
    const tVal = document.createElement("td");
    tVal.className = "vani-strati-netti-num vani-sn-totmq-val";
    if (mqLordiNum === null || mqLordiNum === undefined || !Number.isFinite(mqLordiNum)) {
      tVal.textContent = "—";
    } else {
      tVal.textContent = fmtItTwoDecimalsOrDash(Number((mqLordiNum - sommaMqAperture).toFixed(6)));
    }
    trTot.appendChild(t0);
    trTot.appendChild(tMq);
    trTot.appendChild(tVal);
    tbodySingle.appendChild(trTot);
  });

  table.appendChild(tbodySingle);

  box.appendChild(head);
  box.appendChild(table);
  return box;
}

function buildStratoNettoSlot(parete, nomeLocale, st) {
  const slot = document.createElement("div");
  slot.className = "vani-strato-netto-slot";
  slot.dataset.stratifinituraId = String(st?.id ?? "");
  slot.dataset.pareteId = String(parete?.id ?? "");
  if (stratoNettoCollassato(parete?.id, st?.id)) slot.classList.add("vani-strato-netto-slot--collapsed");
  slot.appendChild(buildStratiNettiSection(parete, nomeLocale, [st], "Calcolo netto strato"));
  return slot;
}

function aggiornaPannelliStratiNettiDaFormInput() {
  syncStateFromInputs();
  document.querySelectorAll(".vani-stratifinitura-panel").forEach((panel) => {
    const stratTr = panel.closest("tr");
    const pareteTr = stratTr?.previousElementSibling;
    if (!(pareteTr instanceof HTMLElement) || !pareteTr.dataset.pareteId) return;
    const hit = findParete(Number(pareteTr.dataset.pareteId));
    if (!hit) return;
    panel.querySelectorAll(".vani-strato-netto-slot").forEach((slot) => {
      const stratoId = Number(slot.dataset.stratifinituraId);
      const st = (hit.parete.stratifinitura || []).find((x) => x.id === stratoId);
      if (!st) return;
      slot.replaceWith(buildStratoNettoSlot(hit.parete, hit.locale.nomeLocale ?? "", st));
    });
  });
}

function onVaniFormRefreshStratiNetti(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (
    !el.classList.contains("vani-stratifinitura-vocibreve") &&
    !el.classList.contains("vani-stratifinitura-elevazione") &&
    !el.classList.contains("vani-stratifinitura-altezza") &&
    !el.classList.contains("vani-parete-lung") &&
    !el.classList.contains("vani-parete-alt")
  ) {
    return;
  }
  aggiornaPannelliStratiNettiDaFormInput();
}

/** Contenuto strati finitura (va incollato nella riga tabella sotto la parete). */
function renderStratifinituraPanel(parete, nomeLocale) {
  const wrap = document.createElement("div");
  wrap.className = "vani-stratifinitura-panel vani-stratifinitura-wrap";

  const toolbar = document.createElement("div");
  toolbar.className = "vani-stratifinitura-toolbar";
  const lbl = document.createElement("span");
  lbl.className = "vani-stratifinitura-label";
  lbl.textContent = "Strati finitura";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-action btn-secondary vani-btn-micro";
  addBtn.dataset.action = "aggiungi-stratifinitura";
  addBtn.dataset.pareteId = String(parete.id);
  addBtn.title = "Aggiungi strato finitura";
  addBtn.textContent = "+S";
  toolbar.appendChild(lbl);
  toolbar.appendChild(addBtn);
  wrap.appendChild(toolbar);

  const stratList =
    Array.isArray(parete.stratifinitura) && parete.stratifinitura.length > 0
      ? parete.stratifinitura
      : [{ id: 0, vocibreve: "", elevazione: "", altezza: "", note: "", stratiapertura: [] }];

  for (const st of stratList) {
    const row = document.createElement("div");
    row.className = "vani-stratifinitura-row";
    row.dataset.stratifinituraId = String(st.id);

    const netOpen = !stratoNettoCollassato(parete.id, st.id);
    const toggleNetto = document.createElement("button");
    toggleNetto.type = "button";
    toggleNetto.className = "btn-action btn-secondary vani-btn-micro vani-stratifinitura-toggle";
    toggleNetto.dataset.action = "toggle-strato-netto";
    toggleNetto.dataset.pareteId = String(parete.id);
    toggleNetto.dataset.stratifinituraId = String(st.id);
    toggleNetto.id = `vani-strato-netto-toggle-${parete.id}-${st.id}`;
    toggleNetto.setAttribute("aria-expanded", String(netOpen));
    toggleNetto.title = netOpen ? "Nascondi calcolo netto strato" : "Mostra calcolo netto strato";
    toggleNetto.setAttribute("aria-label", toggleNetto.title);
    toggleNetto.textContent = netOpen ? "▾" : "▸";

    const inpVb = document.createElement("input");
    inpVb.type = "text";
    inpVb.className = "vani-stratifinitura-vocibreve";
    inpVb.placeholder = "Voce breve";
    inpVb.setAttribute("aria-label", "Voce breve (ricerca elenco voci)");
    inpVb.setAttribute("list", "vani-vocibrevi-datalist");
    inpVb.autocomplete = "off";
    inpVb.value = typeof st.vocibreve === "string" ? st.vocibreve : "";
    const vbWrap = document.createElement("div");
    vbWrap.className = "vani-stratifinitura-field-wrap";
    const vbLabel = document.createElement("span");
    vbLabel.className = "vani-parete-field-label";
    vbLabel.textContent = "VOCE";
    vbWrap.appendChild(vbLabel);
    vbWrap.appendChild(inpVb);

    const inpEl = document.createElement("input");
    inpEl.type = "number";
    inpEl.className = "vani-stratifinitura-elevazione vani-in-num vani-in-num--99";
    inpEl.step = "0.01";
    inpEl.min = "0";
    inpEl.max = "99.99";
    inpEl.placeholder = "Elev.";
    inpEl.title = "Elevazione: max 99,99 (due cifre intere, due decimali)";
    inpEl.setAttribute("aria-label", "Elevazione");
    inpEl.value =
      st.elevazione != null && st.elevazione !== "" ? String(st.elevazione) : "";
    const elWrap = document.createElement("div");
    elWrap.className = "vani-stratifinitura-field-wrap vani-stratifinitura-field-wrap--num";
    const elLabel = document.createElement("span");
    elLabel.className = "vani-parete-field-label";
    elLabel.textContent = "ELEVAZIONE";
    elWrap.appendChild(elLabel);
    elWrap.appendChild(inpEl);

    const inpAl = document.createElement("input");
    inpAl.type = "number";
    inpAl.className = "vani-stratifinitura-altezza vani-in-num vani-in-num--99";
    inpAl.step = "0.01";
    inpAl.min = "0";
    inpAl.max = "99.99";
    inpAl.placeholder = "Alt.";
    inpAl.title = "Altezza strato: max 99,99 (due cifre intere, due decimali)";
    inpAl.setAttribute("aria-label", "Altezza");
    inpAl.value = st.altezza != null && st.altezza !== "" ? String(st.altezza) : "";
    const alWrap = document.createElement("div");
    alWrap.className = "vani-stratifinitura-field-wrap vani-stratifinitura-field-wrap--num";
    const alLabel = document.createElement("span");
    alLabel.className = "vani-parete-field-label";
    alLabel.textContent = "Altezza";
    alWrap.appendChild(alLabel);
    alWrap.appendChild(inpAl);

    const inpNote = document.createElement("input");
    inpNote.type = "text";
    inpNote.className = "vani-stratifinitura-note";
    inpNote.placeholder = "note";
    inpNote.value = typeof st.note === "string" ? st.note : "";
    inpNote.setAttribute("aria-label", "Note strato finitura");

    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn-action btn-delete vani-btn-micro";
    rm.dataset.action = "rimuovi-stratifinitura";
    rm.dataset.pareteId = String(parete.id);
    rm.dataset.stratifinituraId = String(st.id);
    rm.textContent = "✕";
    rm.title = "Rimuovi strato";
    rm.disabled = stratList.length <= 1;

    row.appendChild(toggleNetto);
    row.appendChild(vbWrap);
    row.appendChild(elWrap);
    row.appendChild(alWrap);
    row.appendChild(inpNote);
    row.appendChild(rm);
    wrap.appendChild(row);
    wrap.appendChild(buildStratoNettoSlot(parete, nomeLocale, st));
  }
  return wrap;
}

function appendStratifinituraRow(tbody, parete, colSpan, nomeLocale) {
  const trS = document.createElement("tr");
  trS.className = "vani-tr-stratifinitura";
  trS.id = `vani-parete-strati-${parete.id}`;
  if (pareteStratiCollassati(parete.id)) trS.classList.add("vani-tr-stratifinitura--collapsed");
  const td = document.createElement("td");
  td.colSpan = colSpan;
  td.className = "vani-td-stratifinitura-below";
  td.appendChild(renderStratifinituraPanel(parete, nomeLocale));
  trS.appendChild(td);
  tbody.appendChild(trS);
}

function renderPianoTable(piano, opts = {}) {
  const { soloUnVano = true } = opts;
  const wrap = document.createElement("div");
  wrap.className = "vani-piano-block";
  wrap.dataset.pianoId = String(piano.id);

  const head = document.createElement("div");
  head.className = "vani-piano-head";
  const btnVoce = `
    <button type="button" class="btn-action btn-secondary vani-btn-mini vani-piano-btn-voce" data-action="apri-dialog-nuova-voce" title="Apri il modulo nuova voce del computo">AGGIUNGI VOCE</button>`;
  if (soloUnVano) {
    const loc0 = piano.locali[0];
    const lid = loc0 ? String(loc0.id) : "";
    const lnome = loc0 && typeof loc0.nomeLocale === "string" ? loc0.nomeLocale : "";
    head.innerHTML = `
    <div class="vani-piano-head-inner">
      <span class="vani-piano-tag">Piano</span>
      <input type="text" class="vani-piano-nome" placeholder="Scegli o scrivi (archivio)" list="datalist-piani-misura-archivio" autocomplete="off" value="${escapeHtml(piano.nome)}" aria-label="Nome piano" />
      <div class="vani-piano-locale-wrap vani-locale-cell" data-locale-id="${escapeHtml(lid)}">
        <span class="vani-piano-locale-tag">Locale</span>
        <div class="vani-locale-cell-inner vani-locale-cell-inner--inline">
          <input type="text" class="vani-locale-nome" list="vani-archivio-locale-datalist" placeholder="LOCALE" value="${escapeHtml(lnome)}" aria-label="Locale" />
          <button type="button" class="btn-action btn-secondary vani-btn-mini" data-action="aggiungi-locale" data-piano-id="${piano.id}" title="Aggiungi un altro locale nello stesso piano">+ Loc.</button>
          <div class="vani-locale-actions">
            <button type="button" class="btn-action btn-secondary vani-btn-mini vani-btn-aggiungi-parete" data-action="aggiungi-parete" data-locale-id="${escapeHtml(lid)}" title="Aggiungi una parete al vano">AGGIUNGI PARETE</button>
            <button type="button" class="btn-action btn-secondary vani-btn-micro vani-btn-icon-strati" data-action="toggle-tutte-parete-strati" data-mode="expand" data-locale-id="${escapeHtml(lid)}" title="Espandi strati su tutte le pareti" aria-label="Espandi strati su tutte le pareti">${VANI_SVG_STRATI_ESPANDI}</button>
            <button type="button" class="btn-action btn-secondary vani-btn-micro vani-btn-icon-strati" data-action="toggle-tutte-parete-strati" data-mode="collapse" data-locale-id="${escapeHtml(lid)}" title="Comprimi strati su tutte le pareti" aria-label="Comprimi strati su tutte le pareti">${VANI_SVG_STRATI_COMPRIMI}</button>
          </div>
        </div>
      </div>
    </div>
    ${btnVoce}
  `;
  } else {
    head.innerHTML = `
    <div class="vani-piano-head-inner">
      <span class="vani-piano-tag">Piano</span>
      <input type="text" class="vani-piano-nome" placeholder="Scegli o scrivi (archivio)" list="datalist-piani-misura-archivio" autocomplete="off" value="${escapeHtml(piano.nome)}" aria-label="Nome piano" />
      <button type="button" class="btn-action btn-secondary vani-btn-mini" data-action="aggiungi-locale" data-piano-id="${piano.id}">+ Loc.</button>
      <button type="button" class="btn-action btn-delete vani-btn-mini" data-action="rimuovi-piano" data-piano-id="${piano.id}" ${piani.length <= 1 ? "disabled" : ""}>✕</button>
    </div>
    ${btnVoce}
  `;
  }

  const table = document.createElement("table");
  table.className = soloUnVano ? "vani-grid-table vani-grid-table--solo-vano" : "vani-grid-table";
  table.innerHTML = soloUnVano
    ? `
    <thead>
      <tr>
        <th colspan="3" class="vani-th-parete-block">Parete · quote · tipo</th>
        <th class="vani-th-ap">Aperture</th>
        <th class="vani-th-act"></th>
      </tr>
    </thead>
  `
    : `
    <thead>
      <tr>
        <th class="vani-th-locale">Locale</th>
        <th colspan="3" class="vani-th-parete-block">Parete · quote · tipo</th>
        <th class="vani-th-ap">Aperture</th>
        <th class="vani-th-act"></th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");

  for (const loc of piano.locali) {
    const n = loc.pareti.length;
    let idx = 0;
    for (const parete of loc.pareti) {
      const tr = document.createElement("tr");
      tr.dataset.pareteId = String(parete.id);

      if (!soloUnVano && idx === 0) {
        const tdL = document.createElement("td");
        tdL.className = "vani-locale-cell";
        tdL.dataset.localeId = String(loc.id);
        tdL.rowSpan = n * 2;
        tdL.innerHTML = `
          <div class="vani-locale-cell-inner">
            <input type="text" class="vani-locale-nome" list="vani-archivio-locale-datalist" placeholder="LOCALE" value="${escapeHtml(loc.nomeLocale)}" aria-label="Locale" />
            <div class="vani-locale-actions">
              <button type="button" class="btn-action btn-secondary vani-btn-mini vani-btn-aggiungi-parete" data-action="aggiungi-parete" data-locale-id="${loc.id}" title="Aggiungi una parete al locale">AGGIUNGI PARETE</button>
              <button type="button" class="btn-action btn-secondary vani-btn-micro vani-btn-icon-strati" data-action="toggle-tutte-parete-strati" data-mode="expand" data-locale-id="${loc.id}" title="Espandi strati su tutte le pareti" aria-label="Espandi strati su tutte le pareti">${VANI_SVG_STRATI_ESPANDI}</button>
              <button type="button" class="btn-action btn-secondary vani-btn-micro vani-btn-icon-strati" data-action="toggle-tutte-parete-strati" data-mode="collapse" data-locale-id="${loc.id}" title="Comprimi strati su tutte le pareti" aria-label="Comprimi strati su tutte le pareti">${VANI_SVG_STRATI_COMPRIMI}</button>
              <button type="button" class="btn-action btn-delete vani-btn-micro" data-action="rimuovi-locale" data-locale-id="${loc.id}" ${piano.locali.length <= 1 ? "disabled" : ""} title="Rimuovi locale">✕</button>
            </div>
          </div>
        `;
        tr.appendChild(tdL);
      }

      tr.appendChild(renderPareteMisureTd(parete));
      tr.appendChild(renderApertureCell(loc.nomeLocale, parete, loc));

      const tdAct = document.createElement("td");
      tdAct.className = "vani-td-act";
      const actInner = document.createElement("div");
      actInner.className = "vani-td-act-inner";

      const bAp = document.createElement("button");
      bAp.type = "button";
      bAp.className = "btn-action btn-secondary vani-btn-micro vani-btn-aggiungi-apertura";
      bAp.dataset.action = "aggiungi-apertura-parete";
      bAp.dataset.pareteId = String(parete.id);
      const localeOk = String(loc.nomeLocale ?? "").trim() !== "";
      bAp.disabled = !localeOk;
      bAp.title = localeOk
        ? "Aggiungi un’apertura all’archivio e collegala a questa parete"
        : "Inserisci prima il nome del locale";
      bAp.setAttribute("aria-label", "Aggiungi apertura");
      bAp.innerHTML = VANI_SVG_FINESTRA;

      const bDup = document.createElement("button");
      bDup.type = "button";
      bDup.className = "btn-action btn-secondary vani-btn-micro vani-btn-dup-parete";
      bDup.dataset.action = "duplica-parete";
      bDup.dataset.pareteId = String(parete.id);
      bDup.title =
        "Duplica parete (misure, flag, strati). Le aperture vanno ricollegate perché sono uniche nel locale.";
      bDup.setAttribute("aria-label", "Duplica parete");
      bDup.innerHTML = `<svg class="vani-icon-dup-parete" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 17V5a2 2 0 0 1 2-2h10"/></svg>`;

      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn-action btn-delete vani-btn-micro";
      b.dataset.action = "rimuovi-parete";
      b.dataset.pareteId = String(parete.id);
      b.textContent = "✕";
      b.title =
        loc.pareti.length <= 1
          ? "Non puoi eliminare l’unica parete: usa «AGGIUNGI PARETE» per aggiungerne un’altra."
          : "Rimuovi parete";

      actInner.appendChild(bAp);
      actInner.appendChild(bDup);
      actInner.appendChild(b);
      tdAct.appendChild(actInner);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
      appendStratifinituraRow(
        tbody,
        parete,
        soloUnVano ? 5 : idx === 0 ? 6 : 5,
        loc.nomeLocale,
      );
      idx++;
    }
  }

  table.appendChild(tbody);
  wrap.appendChild(head);
  wrap.appendChild(table);
  return wrap;
}

function renderGerarchia() {
  const host = document.getElementById("vani-gerarchia-host");
  if (!host) return;
  assicuraBozzaUnPianoUnLocale();
  normalizzaUnicitaApertureNeiLocali();
  host.replaceChildren();

  if (piani[0]) {
    host.appendChild(
      renderPianoTable(piani[0], { soloUnVano: piani[0].locali.length <= 1 }),
    );
  }
  refreshArchivioLocaleDatalist();
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
  popolaDatalistVocibrevi("vani-vocibrevi-datalist");
  renderSidebarListaVani();

  const fid = vaniFocusPareteIdDopoRender;
  vaniFocusPareteIdDopoRender = null;
  if (fid != null) {
    queueMicrotask(() => {
      const tr = document.querySelector(`#vani-gerarchia-host tr[data-parete-id="${Number(fid)}"]`);
      const inp = tr?.querySelector(".vani-parete-rif");
      if (inp instanceof HTMLInputElement) {
        inp.focus();
        inp.select();
      }
    });
  }
}

function addPiano() {
  return;
}

function removePiano(id) {
  if (piani.length <= 1) return;
  piani = piani.filter((p) => p.id !== id);
  renderGerarchia();
}

function addLocale(pianoId) {
  return;
}

function removeLocale(localeId) {
  const hit = findLocale(localeId);
  if (!hit || hit.piano.locali.length <= 1) return;
  for (const p of hit.locale.pareti) collapsedPareteIds.delete(p.id);
  hit.piano.locali = hit.piano.locali.filter((l) => l.id !== localeId);
  renderGerarchia();
}

function addParete(localeId) {
  const hit = findLocale(localeId);
  if (!hit) return;
  const nuova = emptyParete();
  hit.locale.pareti.push(nuova);
  collassaTutteParetiLocaleSalvo(hit.locale, nuova.id);
  vaniFocusPareteIdDopoRender = nuova.id;
  renderGerarchia();
}

function removeParete(pareteId) {
  const hit = findParete(pareteId);
  if (!hit || hit.locale.pareti.length <= 1) return;
  collapsedPareteIds.delete(Number(pareteId));
  clearStratoNettoCollassatoPerParete(pareteId);
  hit.locale.pareti = hit.locale.pareti.filter((p) => p.id !== pareteId);
  renderGerarchia();
}

function resetVaniConfermaEliminaDialogUiDefault() {
  const titleEl = document.getElementById("vani-conferma-elimina-title");
  const btnNo = document.getElementById("vani-conferma-elimina-annulla");
  const btnOk = document.getElementById("vani-conferma-elimina-conferma");
  if (titleEl) titleEl.textContent = VANI_ELIMINA_TITLE_DEFAULT;
  if (btnOk) {
    btnOk.hidden = false;
    btnOk.disabled = false;
  }
  if (btnNo) btnNo.textContent = VANI_ELIMINA_BTN_ANNULLA_DEFAULT;
}

/** Messaggio solo lettura nel dialog conferma (stesso elemento: un pulsante per chiudere). */
function apriModaleInfoVaniConferma(messaggioTitolo, messaggio) {
  const dlg = document.getElementById("vani-conferma-elimina-dialog");
  const pMsg = document.getElementById("vani-conferma-elimina-msg");
  const titleEl = document.getElementById("vani-conferma-elimina-title");
  const btnNo = document.getElementById("vani-conferma-elimina-annulla");
  const btnOk = document.getElementById("vani-conferma-elimina-conferma");
  if (!dlg || !pMsg || !titleEl || !btnNo || !btnOk) return;
  vaniEliminaPending = null;
  titleEl.textContent = messaggioTitolo;
  pMsg.textContent = messaggio;
  btnOk.hidden = true;
  btnOk.disabled = true;
  btnNo.textContent = "Ho capito";
  dlg.addEventListener("close", resetVaniConfermaEliminaDialogUiDefault, { once: true });
  dlg.showModal();
}

function apriModaleConfermaEliminaVani(messaggio, pending) {
  const dlg = document.getElementById("vani-conferma-elimina-dialog");
  const pMsg = document.getElementById("vani-conferma-elimina-msg");
  if (!dlg || !pMsg) return;
  resetVaniConfermaEliminaDialogUiDefault();
  vaniEliminaPending = pending;
  pMsg.textContent = messaggio;
  dlg.showModal();
}

function eseguiEliminazioneVaniPendente() {
  const p = vaniEliminaPending;
  vaniEliminaPending = null;
  if (!p) return;
  if (p.kind === "parete") removeParete(p.pareteId);
  else if (p.kind === "strato") removeStratifinitura(p.pareteId, p.stratifinituraId);
  else if (p.kind === "locale") removeLocale(p.localeId);
  else if (p.kind === "piano") removePiano(p.pianoId);
  else if (p.kind === "vanoRegistrato") eliminaVanoRegistrato(p.vanoId);
}

let vaniConfermaEliminaDialogInizializzato = false;

function initVaniConfermaEliminaDialog() {
  if (vaniConfermaEliminaDialogInizializzato) return;
  const dlg = document.getElementById("vani-conferma-elimina-dialog");
  const btnNo = document.getElementById("vani-conferma-elimina-annulla");
  const btnOk = document.getElementById("vani-conferma-elimina-conferma");
  if (!dlg || !btnNo || !btnOk) return;
  vaniConfermaEliminaDialogInizializzato = true;
  btnNo.addEventListener("click", () => {
    vaniEliminaPending = null;
    dlg.close();
  });
  btnOk.addEventListener("click", () => {
    syncStateFromInputs();
    eseguiEliminazioneVaniPendente();
    dlg.close();
  });
  dlg.addEventListener("cancel", () => {
    vaniEliminaPending = null;
  });
}

/**
 * Copia parete dopo l’originale: misure, flag, strati finitura (nuovi id).
 * Le aperture non si copiano (nello stesso locale ogni id resta legato a una sola parete).
 */
function duplicaParete(pareteId) {
  const hit = findParete(pareteId);
  if (!hit) return;
  const src = hit.parete;
  const list = hit.locale.pareti;
  const idx = list.findIndex((p) => p.id === pareteId);
  if (idx < 0) return;

  const rifBase = typeof src.riferimento === "string" ? src.riferimento.trim() : "";
  const riferimento = rifBase === "" ? "" : `${rifBase} (copia)`;

  const stratiDaSrc = Array.isArray(src.stratifinitura)
    ? src.stratifinitura.map((st) => cloneStratoDaSorgente(st))
    : [];
  const stratifinitura = stratiDaSrc.length > 0 ? stratiDaSrc : [emptyStratifinitura()];

  const nuova = {
    id: nextPareteId++,
    riferimento,
    lunghezza: src.lunghezza != null && src.lunghezza !== "" ? String(src.lunghezza) : "",
    altezza: src.altezza != null && src.altezza !== "" ? String(src.altezza) : "",
    idApertureMaster: [],
    stratifinitura,
    ...Object.fromEntries(PARETE_FLAG_KEYS.map((k) => [k, !!src[k]])),
  };

  list.splice(idx + 1, 0, nuova);
  collassaTutteParetiLocaleSalvo(hit.locale, nuova.id);
  vaniFocusPareteIdDopoRender = nuova.id;
  renderGerarchia();
}

function addStratifinitura(pareteId) {
  const hit = findParete(pareteId);
  if (!hit) return;
  if (!Array.isArray(hit.parete.stratifinitura)) hit.parete.stratifinitura = [];
  hit.parete.stratifinitura.push(emptyStratifinitura());
  renderGerarchia();
}

function removeStratifinitura(pareteId, stratId) {
  const hit = findParete(pareteId);
  if (!hit || !Array.isArray(hit.parete.stratifinitura)) return;
  if (hit.parete.stratifinitura.length <= 1) return;
  const sid = Number(stratId);
  setStratoNettoCollassato(pareteId, sid, false);
  hit.parete.stratifinitura = hit.parete.stratifinitura.filter((x) => x.id !== sid);
  renderGerarchia();
}

function apriDialogNuovaAperturaParete(pareteId) {
  const hit = findParete(pareteId);
  if (!hit) return;
  const localeNome = String(hit.locale?.nomeLocale ?? "").trim();
  if (!localeNome) {
    window.alert("Inserisci prima il nome del locale: le aperture dell’archivio sono filtrate per locale.");
    return;
  }
  vaniNuovaAperturaPareteId = pareteId;
  const dlg = document.getElementById("vani-nuova-apertura-dialog");
  const pianoEl = document.getElementById("vani-nap-piano");
  const localeEl = document.getElementById("vani-nap-locale");
  const larghEl = document.getElementById("vani-nap-largh");
  const altEl = document.getElementById("vani-nap-alt");
  const hdavEl = document.getElementById("vani-nap-hdav");
  const anteEl = document.getElementById("vani-nap-ante");
  const tipEl = document.getElementById("vani-nap-tipologia");
  const falsoEl = document.getElementById("vani-nap-falso");
  const scuroEl = document.getElementById("vani-nap-scuro");
  const infEl = document.getElementById("vani-nap-inferiata");
  const zanEl = document.getElementById("vani-nap-zanzariera");
  if (pianoEl) pianoEl.value = String(hit.piano?.nome ?? "").trim();
  if (localeEl) localeEl.value = localeNome;
  if (larghEl) larghEl.value = "";
  if (altEl) altEl.value = "";
  if (hdavEl) hdavEl.value = "0";
  if (anteEl) anteEl.value = "1";
  if (tipEl) tipEl.value = "FINESTRA";
  if (falsoEl) falsoEl.value = "NO";
  if (scuroEl) scuroEl.value = "NO";
  if (infEl) infEl.value = "NO";
  if (zanEl) zanEl.value = "NO";
  dlg?.showModal();
  setTimeout(() => larghEl?.focus(), 0);
}

function chiudiDialogNuovaAperturaParete() {
  vaniNuovaAperturaPareteId = null;
  document.getElementById("vani-nuova-apertura-dialog")?.close();
}

function onSubmitNuovaAperturaParete(event) {
  event.preventDefault();
  const pareteId = vaniNuovaAperturaPareteId;
  if (pareteId == null) return;
  const payload = {
    pareteId,
    piano: document.getElementById("vani-nap-piano")?.value ?? "",
    locale: document.getElementById("vani-nap-locale")?.value ?? "",
    largh: document.getElementById("vani-nap-largh")?.value ?? "",
    alt: document.getElementById("vani-nap-alt")?.value ?? "",
    hDav: document.getElementById("vani-nap-hdav")?.value ?? "0",
    ante: document.getElementById("vani-nap-ante")?.value ?? "1",
    tipologia: document.getElementById("vani-nap-tipologia")?.value ?? "FINESTRA",
    falso: document.getElementById("vani-nap-falso")?.value ?? "NO",
    scuro: document.getElementById("vani-nap-scuro")?.value ?? "NO",
    inferiata: document.getElementById("vani-nap-inferiata")?.value ?? "NO",
    zanzariera: document.getElementById("vani-nap-zanzariera")?.value ?? "NO",
  };
  document.dispatchEvent(
    new CustomEvent("computo-vani-richiedi-nuova-apertura", { detail: payload }),
  );
}

function collegaAperturaCreataAllaParete(detail) {
  const idM = String(detail?.idAperturaMaster ?? "").trim();
  const pareteId = Number(detail?.pareteId);
  if (!idM || !Number.isFinite(pareteId)) return;
  syncStateFromInputs();
  const hit = findParete(pareteId);
  if (!hit) return;
  rimuoviIdAperturaDaAltrePareti(hit.parete.id, idM);
  const arr = hit.parete.idApertureMaster || (hit.parete.idApertureMaster = []);
  if (!arr.some((x) => String(x ?? "").trim() === idM)) arr.push(idM);
  chiudiDialogNuovaAperturaParete();
  refreshArchivioLocaleDatalist();
  renderGerarchia();
  mostraFeedbackRegistra(true, "Apertura aggiunta all’archivio e collegata alla parete.");
}

function onHostClick(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  syncStateFromInputs();
  const action = btn.dataset.action;
  if (action === "apri-dialog-nuova-voce") {
    document.dispatchEvent(new CustomEvent("computo-apri-dialog-nuova-voce"));
    return;
  }
  if (action === "aggiungi-apertura-parete") {
    const pid = Number(btn.dataset.pareteId);
    if (!Number.isFinite(pid)) return;
    apriDialogNuovaAperturaParete(pid);
    return;
  }
  if (action === "aggiungi-piano") {
    addPiano();
    return;
  }
  if (action === "rimuovi-piano") {
    apriModaleConfermaEliminaVani(
      "Vuoi eliminare questo piano insieme a tutti i locali e alle pareti collegati? L’azione non è annullabile dal programma.",
      { kind: "piano", pianoId: Number(btn.dataset.pianoId) },
    );
    return;
  }
  if (action === "aggiungi-locale") {
    addLocale(Number(btn.dataset.pianoId));
    return;
  }
  if (action === "rimuovi-locale") {
    apriModaleConfermaEliminaVani(
      "Vuoi eliminare questo locale con tutte le sue parete e relativi strati? L’azione non è annullabile dal programma.",
      { kind: "locale", localeId: Number(btn.dataset.localeId) },
    );
    return;
  }
  if (action === "aggiungi-parete") {
    addParete(Number(btn.dataset.localeId));
    return;
  }
  if (action === "toggle-parete-strati") {
    const pid = Number(btn.dataset.pareteId);
    if (!Number.isFinite(pid)) return;
    if (collapsedPareteIds.has(pid)) collapsedPareteIds.delete(pid);
    else collapsedPareteIds.add(pid);
    renderGerarchia();
    queueMicrotask(() => {
      const t = document.getElementById(`vani-parete-strati-toggle-${pid}`);
      t?.focus();
    });
    return;
  }
  if (action === "toggle-tutte-parete-strati") {
    const locHit = findLocale(Number(btn.dataset.localeId));
    if (!locHit) return;
    const mode = String(btn.dataset.mode ?? "").trim();
    if (mode === "expand") espandiTutteParetiLocale(locHit.locale);
    else if (mode === "collapse") comprimiTutteParetiLocale(locHit.locale);
    renderGerarchia();
    return;
  }
  if (action === "aggiungi-stratifinitura") {
    addStratifinitura(Number(btn.dataset.pareteId));
    return;
  }
  if (action === "toggle-strato-netto") {
    const pid = Number(btn.dataset.pareteId);
    const sid = Number(btn.dataset.stratifinituraId);
    if (!Number.isFinite(pid) || !Number.isFinite(sid)) return;
    setStratoNettoCollassato(pid, sid, !stratoNettoCollassato(pid, sid));
    renderGerarchia();
    queueMicrotask(() => {
      const t = document.getElementById(`vani-strato-netto-toggle-${pid}-${sid}`);
      t?.focus();
    });
    return;
  }
  if (action === "rimuovi-stratifinitura") {
    const pid = Number(btn.dataset.pareteId);
    const sid = Number(btn.dataset.stratifinituraId);
    const hit = findParete(pid);
    const etRif =
      hit?.parete?.riferimento && String(hit.parete.riferimento).trim()
        ? ` (parete «${String(hit.parete.riferimento).trim()}»)`
        : "";
    apriModaleConfermaEliminaVani(`Vuoi eliminare questo strato di finitura${etRif}?`, {
      kind: "strato",
      pareteId: pid,
      stratifinituraId: sid,
    });
    return;
  }
  if (action === "duplica-parete") {
    duplicaParete(Number(btn.dataset.pareteId));
    return;
  }
  if (action === "rimuovi-parete") {
    const pid = Number(btn.dataset.pareteId);
    const hit = findParete(pid);
    if (!hit) return;
    if (hit.locale.pareti.length <= 1) {
      apriModaleInfoVaniConferma(
        "Eliminazione non possibile",
        "Non puoi eliminare l’unica parete di questo locale. Usa «AGGIUNGI PARETE» per aggiungerne un’altra sullo stesso vano; dopo potrai rimuovere quella che non ti serve.",
      );
      return;
    }
    const et =
      hit?.parete?.riferimento && String(hit.parete.riferimento).trim()
        ? ` «${String(hit.parete.riferimento).trim()}»`
        : "";
    apriModaleConfermaEliminaVani(
      `Vuoi eliminare la parete${et}? Verranno rimossi anche tutti gli strati di finitura collegati.`,
      { kind: "parete", pareteId: pid },
    );
  }
}

function onHostChange(event) {
  const cbAp = event.target.closest("input[type='checkbox'][data-id-apertura-master]");
  if (cbAp instanceof HTMLInputElement) {
    syncStateFromInputs();
    const pid = Number(cbAp.dataset.pareteId);
    const idM = String(cbAp.dataset.idAperturaMaster ?? "").trim();
    const hit = findParete(pid);
    if (!hit || !idM) return;
    if (cbAp.checked) {
      rimuoviIdAperturaDaAltrePareti(hit.parete.id, idM);
      const arr = hit.parete.idApertureMaster || (hit.parete.idApertureMaster = []);
      if (!arr.some((x) => String(x ?? "").trim() === idM)) arr.push(idM);
    } else {
      hit.parete.idApertureMaster = (hit.parete.idApertureMaster || []).filter(
        (x) => String(x ?? "").trim() !== idM,
      );
    }
    renderGerarchia();
    return;
  }

  const cbFlag = event.target.closest("input[type='checkbox'].vani-parete-flag");
  if (cbFlag instanceof HTMLInputElement) {
    syncStateFromInputs();
    const pid = Number(cbFlag.dataset.pareteId);
    const key = String(cbFlag.dataset.flag ?? "").trim();
    const hit = findParete(pid);
    if (!hit || !PARETE_FLAG_KEYS.includes(key)) return;
    hit.parete[key] = cbFlag.checked;
    if (cbFlag.checked && PARETE_FLAG_AUTO_STRATO_NOTE[key]) {
      if (maybeAggiungiStratoPerFlagTipo(hit.parete, key)) renderGerarchia();
    }
  }
}

function onHostInput(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (!el.classList.contains("vani-locale-nome")) return;
  syncStateFromInputs();
  const cell = el.closest(".vani-locale-cell");
  const lid = Number(cell?.dataset.localeId);
  const hit = findLocale(lid);
  if (!hit) return;
  for (const pa of hit.locale.pareti) prunePareteForLocale(pa, hit.locale.nomeLocale);
  renderGerarchia();
  const again = document.querySelector(`.vani-locale-cell[data-locale-id="${lid}"] .vani-locale-nome`);
  if (again instanceof HTMLInputElement) {
    vaniLocaleFocusDaRender = true;
    again.focus();
    const len = again.value.length;
    again.setSelectionRange(len, len);
    queueMicrotask(() => {
      vaniLocaleFocusDaRender = false;
    });
  }
}

function onLocaleFocusIn(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || !el.classList.contains("vani-locale-nome")) return;
  refreshArchivioLocaleDatalist();
  if (vaniLocaleFocusDaRender) return;
  requestAnimationFrame(() => {
    if (vaniLocaleFocusDaRender || document.activeElement !== el) return;
    el.select();
  });
}

function onVaniFormFocusInArchivioPiano(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || !el.classList.contains("vani-piano-nome")) return;
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
}

function onVaniFormFocusOutArchivioPiano(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || !el.classList.contains("vani-piano-nome")) return;
  risolviBlurCampoPianoArchivioStorage(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, el);
}

function onVaniFormFocusInVocibreve(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || !el.classList.contains("vani-stratifinitura-vocibreve")) return;
  popolaDatalistVocibrevi("vani-vocibrevi-datalist");
}

export function initVaniParetiUi() {
  initVaniConfermaEliminaDialog();
  const form = document.getElementById("vani-misurazione-form");
  form?.addEventListener("click", onHostClick);
  form?.addEventListener("input", onVaniFormRefreshStratiNetti);
  form?.addEventListener("focusin", onLocaleFocusIn);
  form?.addEventListener("focusin", onVaniFormFocusInVocibreve);
  form?.addEventListener("focusin", onVaniFormFocusInArchivioPiano);
  form?.addEventListener("focusout", onVaniFormFocusOutArchivioPiano);
  const host = document.getElementById("vani-gerarchia-host");
  host?.addEventListener("change", onHostChange);
  host?.addEventListener("input", onHostInput);
  document.getElementById("vani-sidebar-list")?.addEventListener("click", onSidebarListaClick);
  document.getElementById("btn-vani-registra")?.addEventListener("click", onRegistraVanoClick);

  document.getElementById("vani-nap-annulla")?.addEventListener("click", () => {
    chiudiDialogNuovaAperturaParete();
  });
  document.getElementById("vani-nuova-apertura-form")?.addEventListener("submit", onSubmitNuovaAperturaParete);
  document.addEventListener("computo-vani-apertura-creata", (event) => {
    collegaAperturaCreataAllaParete(event.detail);
  });

  document.addEventListener("computo-nuovo-iniziato", () => {
    vaniRegistrati = [];
    resetBozzaVuota();
    const shell = document.getElementById("vista-vani");
    if (shell && !shell.hidden) renderGerarchia();
  });
}

export function prepareVistaVaniPareti() {
  refreshArchivioLocaleDatalist();
  popolaDatalistArchivioPianiMisura(ARCHIVIO_PIANI_MISURA_STORAGE_KEY, "datalist-piani-misura-archivio");
  popolaDatalistVocibrevi("vani-vocibrevi-datalist");
  caricaRegistratiDaStorage();
  migraSalvataggioLegacySeServe();
  resetBozzaVuota();
  renderGerarchia();
}
