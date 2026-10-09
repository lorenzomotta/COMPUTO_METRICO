/**
 * STRADE — UI (superfici, sede, segnaletica, fogna, allacci fogna, luci, gas, acqua).
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
  rinominaVoceTipoStrade,
  tipoStradeUsatoNelComputo,
  voceBreveDaTipoZona,
} from "./modules/stradeRegistroAggiornaVoci.js";
import {
  TIPI_ZONA_STRADA,
  ZONA_LABELS,
  ZONA_TIPO_OGGETTO,
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
  renderElencoLibreriaTipologie,
  zonaHaLibreriaTipi,
  misureTipoDaLibreria,
  syncZonaDaBlock,
  aggiornaCalcoliZonaBlock,
  schedaStradeHaDatiRegistrabili,
  elencoZoneMisuraSenzaVoce,
  maxIdNelloScheda,
  isZonaSedeStradale,
  isZonaReinterro,
  isZonaManufatti,
  isZonaComeManufatti,
  isZonaCordoli,
  isZonaSegnaletica,
  isZonaVarie,
  isZonaFormulaUnitaVoce,
  aggiungiTipoManufatto,
  aggiungiTipoImpianto,
  aggiungiTipoCordolo,
  aggiungiTipoSegnaletica,
  aggiungiTipoVarie,
  controllaNuovoTipoManufatto,
  controllaNuovoTipoImpianto,
  controllaNuovoTipoCordolo,
  controllaNuovoTipoSegnaletica,
  controllaNuovoTipoVarie,
  rinominaTipoManufatto,
  rinominaTipoImpianto,
  rinominaTipoCordolo,
  rinominaTipoSegnaletica,
  rinominaTipoVarie,
  controllaRinominaTipoManufatto,
  controllaRinominaTipoImpianto,
  controllaRinominaTipoCordolo,
  controllaRinominaTipoSegnaletica,
  controllaRinominaTipoVarie,
  eliminaTipoManufatto,
  eliminaTipoImpianto,
  eliminaTipoCordolo,
  eliminaTipoSegnaletica,
  eliminaTipoVarie,
  tipoManufattoInLibreria,
  tipoImpiantoInLibreria,
  tipoCordoloInLibreria,
  tipoSegnaleticaInLibreria,
  tipoVarieInLibreria,
  totaliSedeStradale,
} from "./modules/stradeSuperfici.js";

const STORAGE_STRADE_REGISTRATI_KEY = "computo_metrico_strade_registrati";
const DATALIST_VOCI = "strade-vocibrevi-datalist";

let nextId = 1;
let pianoNome = "";
let descrizione = "";
/** @type {'ingombro'|'marciapiedi'|'aiuole'|'parcheggi'|'manufatti'|'cordoli'|'segnaletica'|'fogna'|'allacciFogna'|'lucePubblica'|'lucePrivata'|'gas'|'acqua'|'telefonica'|'varie'|'sedeStradale'|'reinterro'} */
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

function chiaveTipoLocaleStradeOk(key) {
  return typeof key === "string" && /^computo_metrico_strade_tipi_locale_[A-Za-z0-9_]+$/.test(key);
}

function chiaveLibreriaStradeOk(key) {
  return typeof key === "string" && /^lp_libreria_strade_[A-Za-z0-9_]+$/.test(key);
}

function leggiVociStorage(accetta) {
  /** @type {Record<string, unknown>} */
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!accetta(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw == null) continue;
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

function sostituisciVociStorage(mappa, accetta) {
  const daTogliere = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (accetta(key)) daTogliere.push(key);
    }
    for (const key of daTogliere) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  if (!mappa || typeof mappa !== "object") return;
  for (const [key, value] of Object.entries(mappa)) {
    if (!accetta(key) || value == null) continue;
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}

/** Schede STRADE, tipi di questo computo e libreria tipi, da mettere nel file esportato. */
export function datiStradePerExport() {
  let registrati = null;
  try {
    const raw = localStorage.getItem(STORAGE_STRADE_REGISTRATI_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && Array.isArray(data.items)) registrati = data;
    }
  } catch {
    registrati = null;
  }
  return {
    registrati,
    tipiLocale: leggiVociStorage(chiaveTipoLocaleStradeOk),
    libreria: leggiVociStorage(chiaveLibreriaStradeOk),
  };
}

/** Riscrive le schede STRADE lette da un computo importato. */
export function applicaStradeDaImport(blocco) {
  if (!blocco || typeof blocco !== "object") return;
  sostituisciVociStorage(blocco.tipiLocale, chiaveTipoLocaleStradeOk);
  if (blocco.libreria && typeof blocco.libreria === "object") {
    sostituisciVociStorage(blocco.libreria, chiaveLibreriaStradeOk);
  }
  const reg = blocco.registrati;
  try {
    if (reg && typeof reg === "object" && Array.isArray(reg.items)) {
      localStorage.setItem(
        STORAGE_STRADE_REGISTRATI_KEY,
        JSON.stringify({ v: 1, items: reg.items }),
      );
    } else {
      localStorage.removeItem(STORAGE_STRADE_REGISTRATI_KEY);
    }
  } catch {
    /* ignore */
  }
  loadRegistrati();
  resetBozza();
  const shell = document.getElementById("vista-strade");
  if (shell && !shell.hidden) refreshAll();
  else renderSidebarLista();
}

function mostraFeedback(msg, isErr = false) {
  const el = document.getElementById("strade-registra-feedback");
  if (el) {
    el.textContent = isErr ? "" : msg || "";
    el.classList.remove("vani-registra-feedback--err");
    window.clearTimeout(feedbackTimer);
    if (!isErr && msg) {
      feedbackTimer = window.setTimeout(() => {
        el.textContent = "";
      }, 3500);
    }
  }
  if (isErr && msg) mostraAvvisoModale(msg);
}

function mostraAvvisoModale(msg, titolo = "Attenzione") {
  const dlg = document.getElementById("strade-avviso-dialog");
  const titleEl = document.getElementById("strade-avviso-title");
  const msgEl = document.getElementById("strade-avviso-msg");
  if (titleEl) titleEl.textContent = titolo;
  if (msgEl) msgEl.textContent = msg || "";
  if (dlg && typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
    queueMicrotask(() => {
      document.getElementById("strade-avviso-ok")?.focus();
    });
    return;
  }
  window.alert(msg);
}

function chiudiAvvisoModale() {
  const dlg = document.getElementById("strade-avviso-dialog");
  if (dlg && typeof dlg.close === "function" && dlg.open) dlg.close();
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
      // Assicura che la zona esista (schede vecchie / tipi nuovi).
      if (!scheda[tipo]) {
        scheda = { ...scheda, ...sanificaSchedaStrade(scheda, () => nextId++) };
      }
      if (scheda[tipo]) syncZonaDaBlock(block, scheda[tipo]);
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
  const manufatti = isZonaManufatti(schedaAttiva);
  const reinterro = isZonaReinterro(schedaAttiva);
  const cordoli = isZonaCordoli(schedaAttiva);
  const segnaletica = isZonaSegnaletica(schedaAttiva);
  const varie = isZonaVarie(schedaAttiva);
  const impianto = isZonaComeManufatti(schedaAttiva);
  const senzaStrati = manufatti || reinterro || cordoli || segnaletica || varie || impianto;
  nav.querySelectorAll("button.vani-sidebar-azione").forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    const azione = btn.getAttribute("data-sidebar-azione");
    const disabilita =
      (sede && (azione === "aggiungi-area" || azione === "aggiungi-sottrazione")) ||
      (manufatti && (azione === "aggiungi-area" || azione === "aggiungi-strato" || azione === "aggiungi-sottrazione")) ||
      (reinterro && (azione === "aggiungi-area" || azione === "aggiungi-strato" || azione === "aggiungi-sottrazione")) ||
      (cordoli && (azione === "aggiungi-strato" || azione === "aggiungi-sottrazione")) ||
      (segnaletica && (azione === "aggiungi-strato" || azione === "aggiungi-sottrazione")) ||
      (varie && (azione === "aggiungi-strato" || azione === "aggiungi-sottrazione")) ||
      (impianto && (azione === "aggiungi-strato" || azione === "aggiungi-sottrazione"));
    btn.disabled = disabilita;
    btn.setAttribute("aria-disabled", String(disabilita));
    if (azione === "aggiungi-area") {
      btn.title = sede
        ? "Nella Sede stradale le aree si calcolano da sole"
        : manufatti
          ? "Manufatti è in sola lettura: le righe arrivano dalla spunta nelle altre schede"
          : reinterro
            ? "Reinterro è in sola lettura: le righe arrivano dalla spunta nelle altre schede"
        : isZonaCordoli(schedaAttiva)
          ? `Aggiunge una lunghezza in ${nomeZona}`
          : isZonaComeManufatti(schedaAttiva)
            ? `Aggiunge una riga in ${nomeZona}`
          : isZonaFormulaUnitaVoce(schedaAttiva)
            ? `Aggiunge un calcolo in ${nomeZona}`
            : `Aggiunge un’area in ${nomeZona}`;
    } else if (azione === "aggiungi-strato") {
      btn.title = senzaStrati
        ? manufatti
          ? "Nei Manufatti la voce è il tipo, non lo strato"
          : reinterro
            ? "In Reinterro la voce è il tipo, non lo strato"
          : cordoli
            ? "Nei Cordoli la voce è il tipo, non lo strato"
            : segnaletica
              ? "Nella Segnaletica la voce è il tipo, non lo strato"
              : varie
                ? "In Varie la voce è il tipo, non lo strato"
                : "In questa scheda la voce è il tipo, non lo strato"
        : `Aggiunge uno strato in ${nomeZona}`;
    } else if (azione === "aggiungi-sottrazione") {
      btn.title = sede
        ? "Nella Sede stradale non si aggiungono sottrazioni per strato"
        : senzaStrati
          ? manufatti
            ? "Nei Manufatti non ci sono strati"
            : reinterro
              ? "In Reinterro non ci sono strati"
            : cordoli
              ? "Nei Cordoli non ci sono strati"
              : segnaletica
                ? "Nella Segnaletica non ci sono strati"
                : varie
                  ? "In Varie non ci sono strati"
                  : "In questa scheda non ci sono strati"
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
      <span>Piano (facoltativo)</span>
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
  aggiornaModaleTipologie();
}

function aggiornaModaleTipologie() {
  const dlg = document.getElementById("strade-tipologie-dialog");
  if (!(dlg instanceof HTMLDialogElement) || !dlg.open) return;
  if (!zonaHaLibreriaTipi(schedaAttiva)) {
    dlg.close();
    return;
  }
  const lista = document.getElementById("strade-tipologie-lista");
  if (lista) lista.replaceChildren(renderElencoLibreriaTipologie(schedaAttiva));
  const title = document.getElementById("strade-tipologie-title");
  if (title) title.textContent = `Libreria Tipologie — ${ZONA_LABELS[schedaAttiva] || ""}`;
}

function apriLibreriaTipologie(nomeDaCompilare = "") {
  if (!zonaHaLibreriaTipi(schedaAttiva)) return;
  const dlg = document.getElementById("strade-tipologie-dialog");
  if (!(dlg instanceof HTMLDialogElement) || typeof dlg.showModal !== "function") return;
  const lista = document.getElementById("strade-tipologie-lista");
  if (lista) lista.replaceChildren(renderElencoLibreriaTipologie(schedaAttiva));
  const title = document.getElementById("strade-tipologie-title");
  if (title) title.textContent = `Libreria Tipologie — ${ZONA_LABELS[schedaAttiva] || ""}`;
  if (!dlg.open) dlg.showModal();
  const nome = String(nomeDaCompilare || "").trim().toLocaleLowerCase("it-IT");
  if (!nome || !lista) return;
  queueMicrotask(() => {
    for (const inp of lista.querySelectorAll(".strade-tipo-nome-edit")) {
      if (!(inp instanceof HTMLInputElement)) continue;
      if (inp.value.trim().toLocaleLowerCase("it-IT") !== nome) continue;
      const row = inp.closest("tr");
      row?.classList.add("strade-tipo-riga--appena-aggiunta");
      row?.scrollIntoView({ block: "nearest" });
      const dim = row?.querySelector(".strade-tipo-dimensioni");
      if (dim instanceof HTMLInputElement) dim.focus();
      return;
    }
  });
}

function refreshAll() {
  renderForm();
  renderSidebarLista();
}

function onRegistra() {
  try {
    syncBozzaDaDom();
    const snap = creaSnapshotRegistrato();

    const senzaVoce = elencoZoneMisuraSenzaVoce(snap);
    if (senzaVoce.length > 0) {
      const soloTipo = senzaVoce.every((nome) => nome.includes("(scegli il tipo)"));
      mostraFeedback(
        soloTipo
          ? "Scegli il tipo su ogni riga che vuoi mandare in VOCI."
          : `Manca la Voce sullo strato di: ${senzaVoce.join(", ")}. Scrivila sotto «Strati» e riprova.`,
        true,
      );
      return;
    }

    if (!schedaStradeHaDatiRegistrabili(snap)) {
      mostraFeedback(
        "Compila almeno una Formula valida e la Voce sullo strato, poi premi di nuovo REGISTRA STRADA.",
        true,
      );
      return;
    }

    const idx = registrati.findIndex((r) => r.id === snap.id);
    if (idx >= 0) registrati[idx] = snap;
    else registrati.push(snap);
    saveRegistrati();
    if (snap.pianoNome) {
      tryEnsurePianoInArchivio(snap.pianoNome, ARCHIVIO_PIANI_MISURA_STORAGE_KEY);
    }
    const esito = aggiornaVociDaSnapshotStrade(snap) || { righe: 0 };
    schedaBozzaCollegataId = snap.id;
    renderSidebarLista();
    if (!esito.righe) {
      mostraFeedback(
        "Scheda salvata a sinistra, ma nessuna misura in VOCI. Controlla Formula (es. 12*3) e Voce sullo strato.",
        true,
      );
      return;
    }
    mostraFeedback(`Strada registrata. ${esito.righe} misure aggiornate in VOCI.`);
  } catch (err) {
    console.error("[STRADE] REGISTRA fallita", err);
    mostraFeedback("Errore in registrazione. Riapri STRADE e riprova.", true);
  }
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
  if (
    t instanceof HTMLSelectElement &&
    t.matches(
      ".strade-area-tipo-manufatto, .strade-area-tipo-cordolo, .strade-area-tipo-segnaletica, .strade-area-tipo-varie, .strade-area-tipo-impianto",
    )
  ) {
    const misure = misureTipoDaLibreria(tipo, t.value);
    const riga = t.closest("tr");
    const formula = riga?.querySelector(".strade-area-formula");
    const campoDim = riga?.querySelector(".strade-area-dimensioni");
    const campoSpe = riga?.querySelector(".strade-area-spessore");
    if (misure) {
      if (
        misure.dimensioni &&
        (formula instanceof HTMLInputElement || formula instanceof HTMLTextAreaElement) &&
        !formula.readOnly
      ) {
        formula.value = misure.dimensioni;
        if (formula instanceof HTMLTextAreaElement) {
          formula.style.height = "auto";
          formula.style.height = `${Math.min(Math.max(formula.scrollHeight, 28), 160)}px`;
        }
      }
      if (campoDim instanceof HTMLInputElement && !campoDim.readOnly) campoDim.value = misure.dimensioni;
      if (campoSpe instanceof HTMLInputElement && !campoSpe.readOnly && misure.spessore) {
        campoSpe.value = misure.spessore;
      }
    }
  }
  syncZonaDaBlock(block, scheda[tipo]);
  const mqOverride = isZonaSedeStradale(tipo) ? totaliSedeStradale(scheda).mqNetto : undefined;
  aggiornaCalcoliZonaBlock(block, scheda[tipo], mqOverride);
}

function stessoNomeTipo(a, b) {
  const na = String(a ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
  const nb = String(b ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
  return na !== "" && na === nb;
}

function tipoUsatoInSchede(tipoZona, campo, nome) {
  const guarda = (s) => (s?.[tipoZona]?.aree || []).some((area) => stessoNomeTipo(area?.[campo], nome));
  if (guarda(scheda)) return true;
  return registrati.some((rec) => guarda(rec));
}

function applicaNomeAlleSchede(tipoZona, campo, vecchio, nuovo) {
  const tocca = (s) => {
    for (const area of s?.[tipoZona]?.aree || []) {
      if (stessoNomeTipo(area?.[campo], vecchio)) area[campo] = nuovo;
    }
  };
  tocca(scheda);
  for (const rec of registrati) tocca(rec);
  saveRegistrati();
}

function cfgModificaTipo(action, btn) {
  if (action.endsWith("manufatto")) {
    return {
      zona: "manufatti",
      campo: "tipoManufatto",
      tipoOggetto: "STRADA_MANUFATTO",
      controllaNuovo: controllaNuovoTipoManufatto,
      aggiungi: (nome, inLibreria) => aggiungiTipoManufatto(nome, inLibreria),
      controllaRinomina: controllaRinominaTipoManufatto,
      rinomina: (vecchio, nuovo, inLibreria) => rinominaTipoManufatto(vecchio, nuovo, inLibreria),
      elimina: (nome, inLibreria) => eliminaTipoManufatto(nome, inLibreria),
      inLibreria: tipoManufattoInLibreria,
    };
  }
  if (action.endsWith("cordolo")) {
    return {
      zona: "cordoli",
      campo: "tipoCordolo",
      tipoOggetto: "STRADA_CORDOLI",
      controllaNuovo: controllaNuovoTipoCordolo,
      aggiungi: (nome, inLibreria) => aggiungiTipoCordolo(nome, inLibreria),
      controllaRinomina: controllaRinominaTipoCordolo,
      rinomina: (vecchio, nuovo, inLibreria) => rinominaTipoCordolo(vecchio, nuovo, inLibreria),
      elimina: (nome, inLibreria) => eliminaTipoCordolo(nome, inLibreria),
      inLibreria: tipoCordoloInLibreria,
    };
  }
  if (action.endsWith("segnaletica")) {
    return {
      zona: "segnaletica",
      campo: "tipoSegnaletica",
      tipoOggetto: "STRADA_SEGNALETICA",
      controllaNuovo: controllaNuovoTipoSegnaletica,
      aggiungi: (nome, inLibreria) => aggiungiTipoSegnaletica(nome, inLibreria),
      controllaRinomina: controllaRinominaTipoSegnaletica,
      rinomina: (vecchio, nuovo, inLibreria) => rinominaTipoSegnaletica(vecchio, nuovo, inLibreria),
      elimina: (nome, inLibreria) => eliminaTipoSegnaletica(nome, inLibreria),
      inLibreria: tipoSegnaleticaInLibreria,
    };
  }
  if (action.endsWith("varie")) {
    return {
      zona: "varie",
      campo: "tipoVarie",
      tipoOggetto: "STRADA_VARIE",
      controllaNuovo: controllaNuovoTipoVarie,
      aggiungi: (nome, inLibreria) => aggiungiTipoVarie(nome, inLibreria),
      controllaRinomina: controllaRinominaTipoVarie,
      rinomina: (vecchio, nuovo, inLibreria) => rinominaTipoVarie(vecchio, nuovo, inLibreria),
      elimina: (nome, inLibreria) => eliminaTipoVarie(nome, inLibreria),
      inLibreria: tipoVarieInLibreria,
    };
  }
  if (action.endsWith("impianto")) {
    const zona = String(btn.getAttribute("data-tipo-zona") || "");
    return {
      zona,
      campo: "tipoImpianto",
      tipoOggetto: ZONA_TIPO_OGGETTO[zona] || "",
      controllaNuovo: (nome) => controllaNuovoTipoImpianto(zona, nome),
      aggiungi: (nome, inLibreria) => aggiungiTipoImpianto(zona, nome, inLibreria),
      controllaRinomina: (vecchio, nuovo) => controllaRinominaTipoImpianto(zona, vecchio, nuovo),
      rinomina: (vecchio, nuovo, inLibreria) => rinominaTipoImpianto(zona, vecchio, nuovo, inLibreria),
      elimina: (nome, inLibreria) => eliminaTipoImpianto(zona, nome, inLibreria),
      inLibreria: (nome) => tipoImpiantoInLibreria(zona, nome),
    };
  }
  return null;
}

function chiediSiNo(titolo, msg) {
  const dlg = document.getElementById("strade-libreria-dialog");
  const titleEl = document.getElementById("strade-libreria-title");
  const msgEl = document.getElementById("strade-libreria-msg");
  const btnSi = document.getElementById("strade-libreria-si");
  const btnNo = document.getElementById("strade-libreria-no");
  if (
    !(dlg instanceof HTMLDialogElement) ||
    !(btnSi instanceof HTMLButtonElement) ||
    !(btnNo instanceof HTMLButtonElement) ||
    typeof dlg.showModal !== "function"
  ) {
    return Promise.resolve(window.confirm(msg));
  }
  if (titleEl) titleEl.textContent = titolo;
  if (msgEl) msgEl.textContent = msg;
  return new Promise((resolve) => {
    let chiuso = false;
    const fine = (val) => {
      if (chiuso) return;
      chiuso = true;
      btnSi.removeEventListener("click", onSi);
      btnNo.removeEventListener("click", onNo);
      dlg.removeEventListener("cancel", onCancel);
      if (dlg.open) dlg.close();
      resolve(val);
    };
    const onSi = () => fine(true);
    const onNo = () => fine(false);
    const onCancel = (e) => {
      e.preventDefault();
      fine(false);
    };
    btnSi.addEventListener("click", onSi);
    btnNo.addEventListener("click", onNo);
    dlg.addEventListener("cancel", onCancel);
    dlg.showModal();
    btnSi.focus();
  });
}

async function onHostClick(e) {
  const btn = e.target instanceof Element ? e.target.closest("button[data-action]") : null;
  if (!btn) return;
  const action = btn.getAttribute("data-action");

  if (action === "apri-libreria-tipologie") {
    apriLibreriaTipologie();
    return;
  }

  if (action === "vai-origine-riga") {
    const destinazione = String(btn.getAttribute("data-scheda") || "");
    const areaId = String(btn.getAttribute("data-area-id") || "");
    if (!TIPI_ZONA_STRADA.includes(/** @type {typeof TIPI_ZONA_STRADA[number]} */ (destinazione))) return;
    syncBozzaDaDom();
    schedaAttiva = /** @type {typeof schedaAttiva} */ (destinazione);
    renderForm();
    queueMicrotask(() => {
      const row = areaId
        ? document.querySelector(`.strade-sup-block .vani-sup-area-row[data-area-id="${CSS.escape(areaId)}"]`)
        : null;
      if (row instanceof HTMLElement) {
        row.classList.add("strade-riga-origine-evidenza");
        row.scrollIntoView({ block: "center" });
      }
      document.getElementById(`strade-scheda-tab-${destinazione}`)?.focus();
    });
    return;
  }

  if (action && (action.startsWith("salva-tipo-") || action.startsWith("elimina-tipo-"))) {
    const cfg = cfgModificaTipo(action, btn);
    if (!cfg) return;
    syncBozzaDaDom();
    const row = btn.closest(".strade-tipo-riga");
    const inp = row?.querySelector(".strade-tipo-nome-edit");
    const originale = inp instanceof HTMLInputElement ? inp.dataset.nomeOriginale || "" : "";
    if (action.startsWith("salva-tipo-")) {
      const nuovo = inp instanceof HTMLInputElement ? inp.value : "";
      const check = cfg.controllaRinomina(originale, nuovo);
      if (!check.ok) {
        mostraFeedback(check.errore, true);
        return;
      }
      if (check.invariato) {
        mostraFeedback("Il nome è già quello.");
        return;
      }
      const giaInLibreria = cfg.inLibreria(originale);
      const si = await chiediSiNo(
        "Libreria",
        giaInLibreria
          ? `Vuoi modificare «${originale}» in «${check.nome}» anche nella libreria? Con Sì lo ritrovi così nei computi successivi. Con No il nome nuovo resta solo in questo computo.`
          : `Vuoi aggiungere «${check.nome}» alla libreria? Con Sì lo ritrovi nei computi successivi. Con No la modifica resta solo in questo computo.`,
      );
      const esito = cfg.rinomina(originale, check.nome, si);
      if (!esito.ok) {
        mostraFeedback(esito.errore, true);
        return;
      }
      applicaNomeAlleSchede(cfg.zona, cfg.campo, originale, esito.nome);
      const vocePrima = voceBreveDaTipoZona(cfg.zona, originale);
      const voceDopo = voceBreveDaTipoZona(cfg.zona, esito.nome);
      const vociNuove = rinominaVoceTipoStrade(vocePrima, voceDopo, cfg.tipoOggetto);
      const vociVecchie = rinominaVoceTipoStrade(originale, voceDopo, cfg.tipoOggetto);
      const voci = { aggiornata: Boolean(vociNuove.aggiornata || vociVecchie.aggiornata) };
      renderForm();
      const dove = si ? "La libreria è aggiornata." : "Il nome resta solo in questo computo.";
      mostraFeedback(
        voci.aggiornata
          ? `Tipo aggiornato in «${esito.nome}». Anche le VOCI usano questo nome. ${dove}`
          : `Tipo aggiornato in «${esito.nome}». ${dove}`,
      );
      return;
    }
    const inSchede = tipoUsatoInSchede(cfg.zona, cfg.campo, originale);
    const nomeVoce = voceBreveDaTipoZona(cfg.zona, originale);
    const inComputo =
      tipoStradeUsatoNelComputo(nomeVoce, cfg.tipoOggetto) ||
      tipoStradeUsatoNelComputo(originale, cfg.tipoOggetto);
    if (inSchede || inComputo) {
      const motivi = [];
      if (inComputo) motivi.push("è già usato nelle VOCI");
      if (inSchede) motivi.push("è già scelto in una riga di Misurazione strade");
      mostraFeedback(`Non puoi eliminare «${originale}»: ${motivi.join(" e ")}.`, true);
      return;
    }
    const giaInLibreria = cfg.inLibreria(originale);
    const si = await chiediSiNo(
      "Elimina tipo",
      giaInLibreria
        ? `Eliminare «${originale}» dalla libreria? Non lo troverai nei computi successivi.`
        : `Eliminare «${originale}»? È solo in questo computo.`,
    );
    if (!si) return;
    const esito = cfg.elimina(originale, giaInLibreria);
    if (!esito.ok) {
      mostraFeedback(esito.errore, true);
      return;
    }
    renderForm();
    mostraFeedback(
      giaInLibreria ? `Tipo «${originale}» tolto dalla libreria.` : `Tipo «${originale}» eliminato da questo computo.`,
    );
    return;
  }

  if (
    action === "aggiungi-tipo-manufatto" ||
    action === "aggiungi-tipo-cordolo" ||
    action === "aggiungi-tipo-segnaletica" ||
    action === "aggiungi-tipo-varie" ||
    action === "aggiungi-tipo-impianto"
  ) {
    syncBozzaDaDom();
    const cfg = cfgModificaTipo(action, btn);
    if (!cfg) return;
    const inp = btn.parentElement?.querySelector(".strade-nuovo-tipo-nome");
    const nome = inp instanceof HTMLInputElement ? inp.value : "";
    const check = cfg.controllaNuovo(nome);
    if (!check.ok) {
      mostraFeedback(check.errore, true);
      return;
    }
    if (check.giaPresente) {
      apriLibreriaTipologie(check.nome);
      mostraFeedback(`Il tipo «${check.nome}» c’è già. Puoi compilare dimensioni e spessore.`);
      return;
    }
    const si = await chiediSiNo(
      "Libreria",
      `Vuoi aggiungere «${check.nome}» alla libreria? Con Sì lo ritrovi nei computi successivi. Con No resta solo in questo computo.`,
    );
    const esito = cfg.aggiungi(check.nome, si);
    if (!esito.ok) {
      mostraFeedback(esito.errore, true);
      return;
    }
    renderForm();
    apriLibreriaTipologie(esito.nome);
    mostraFeedback(
      si
        ? `Tipo «${esito.nome}» aggiunto alla libreria. Scrivi dimensioni e spessore.`
        : `Tipo «${esito.nome}» aggiunto solo in questo computo. Scrivi dimensioni e spessore.`,
    );
    return;
  }

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
    if (isZonaSedeStradale(tipo) || isZonaManufatti(tipo) || isZonaReinterro(tipo)) return;
    const aid = Number(btn.getAttribute("data-area-id"));
    if ((zona.aree || []).length <= 1) return;
    zona.aree = zona.aree.filter((a) => a.id !== aid);
    rinumeraAreeZona(zona);
    renderForm();
    return;
  }
  if (action === "duplica-area-strada") {
    if (isZonaSedeStradale(tipo) || isZonaManufatti(tipo) || isZonaReinterro(tipo)) return;
    const aid = Number(btn.getAttribute("data-area-id"));
    const idx = (zona.aree || []).findIndex((a) => a.id === aid);
    if (idx < 0) return;
    const copia = duplicaAreaStrada(zona.aree[idx], () => nextId++, zona.aree.length + 1);
    zona.aree.splice(idx + 1, 0, copia);
    rinumeraAreeZona(zona);
    renderForm();
    queueMicrotask(() => {
      const row = document.querySelector(`.vani-sup-area-row[data-area-id="${copia.id}"] .strade-area-formula`);
      if (row instanceof HTMLInputElement || row instanceof HTMLTextAreaElement) row.focus();
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
    if (isZonaSedeStradale(tipo) || isZonaManufatti(tipo) || isZonaReinterro(tipo)) return;
    zona.aree.push(emptyAreaStrada(() => nextId++, zona.aree.length + 1));
    rinumeraAreeZona(zona);
    renderForm();
    return;
  }
  if (azione === "aggiungi-strato") {
    if (isZonaManufatti(tipo) || isZonaReinterro(tipo) || isZonaComeManufatti(tipo) || isZonaCordoli(tipo) || isZonaSegnaletica(tipo) || isZonaVarie(tipo)) return;
    zona.strati.push(emptyStratoStrada(() => nextId++, zona.strati.length + 1));
    rinumeraStratiZona(zona);
    renderForm();
    return;
  }
  if (azione === "aggiungi-sottrazione") {
    if (isZonaSedeStradale(tipo) || isZonaManufatti(tipo) || isZonaReinterro(tipo) || isZonaComeManufatti(tipo) || isZonaCordoli(tipo) || isZonaSegnaletica(tipo) || isZonaVarie(tipo)) return;
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

  document.getElementById("strade-misurazione-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    onRegistra();
  });

  document.getElementById("strade-sidebar-azioni")?.addEventListener("click", onSidebarAzioniClick);
  document.getElementById("strade-sidebar-list")?.addEventListener("click", onSidebarListClick);

  const host = document.getElementById("strade-gerarchia-host");
  const onInvioTipo = (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (e.key !== "Enter") return;
    if (t.classList.contains("strade-nuovo-tipo-nome")) {
      e.preventDefault();
      t.parentElement?.querySelector("button[data-action='aggiungi-tipo-manufatto'], button[data-action='aggiungi-tipo-cordolo'], button[data-action='aggiungi-tipo-segnaletica'], button[data-action='aggiungi-tipo-varie'], button[data-action='aggiungi-tipo-impianto']")?.click();
      return;
    }
    if (t.classList.contains("strade-tipo-nome-edit")) {
      e.preventDefault();
      t.closest(".strade-tipo-riga")?.querySelector("button[data-action^='salva-tipo-']")?.click();
    }
  };
  host?.addEventListener("input", onHostInput);
  host?.addEventListener("change", onHostChange);
  host?.addEventListener("click", onHostClick);
  host?.addEventListener("keydown", onInvioTipo);
  const dlgTipologie = document.getElementById("strade-tipologie-dialog");
  dlgTipologie?.addEventListener("click", onHostClick);
  dlgTipologie?.addEventListener("keydown", onInvioTipo);
  document.getElementById("strade-tipologie-chiudi")?.addEventListener("click", () => {
    if (dlgTipologie instanceof HTMLDialogElement && dlgTipologie.open) dlgTipologie.close();
  });
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

  document.getElementById("strade-avviso-ok")?.addEventListener("click", () => {
    chiudiAvvisoModale();
  });
  document.getElementById("strade-avviso-dialog")?.addEventListener("cancel", (e) => {
    e.preventDefault();
    chiudiAvvisoModale();
  });
  document.getElementById("strade-avviso-dialog")?.addEventListener("click", (e) => {
    const dlg = e.currentTarget;
    if (!(dlg instanceof HTMLDialogElement)) return;
    if (e.target === dlg) chiudiAvvisoModale();
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
