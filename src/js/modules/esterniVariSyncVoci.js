/**
 * Sincronizza le misurazioni di ESTERNI VARI nelle VOCI del computo.
 * La «voce» associata è la voce abbreviata (campo storico `idVoce` sulle righe).
 * Se la voce non esiste, viene creata (MANUALE) come in VANI.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_DEFAULT = {
  SCAVO: "mc",
  CORSELLO: "mc",
  MISURAZIONE_VARIA: "a corpo",
};

function abbrevKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

function isRigaEsterni(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  const key = typeof row.esterniKey === "string" ? row.esterniKey.trim() : "";
  return tipo === VOCE_MM_TIPO_SEMIAUTOMATICA && key !== "" && tipoOggetto !== "";
}

function creaVoceManuale({ idVoce, posizione, voceAbbreviata, unitaMisura }) {
  const ab = String(voceAbbreviata ?? "").trim();
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    unitaMisura: unitaMisura || "mq.",
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
  };
}

function rigaBase({
  piano,
  riferimento,
  tipoOggetto,
  misura1,
  misura2,
  misura3,
  numero,
  segno,
  risultato,
  esterniKey,
  formula,
  formulaValue,
}) {
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano: typeof piano === "string" ? piano : "",
    riferimento: typeof riferimento === "string" ? riferimento : "",
    tipoOggetto,
    specifica: typeof riferimento === "string" ? riferimento.trim() : "",
    formula: typeof formula === "string" ? formula : "",
    formulaValue: formulaValue ?? null,
    misura1: misura1 ?? null,
    misura2: misura2 ?? null,
    misura3: misura3 ?? null,
    canaleGronda: false,
    grondaCanaleValore: null,
    numero: Number.isInteger(numero) && numero >= 0 ? numero : 1,
    segno: segno === true,
    risultato: Number(Number(risultato || 0).toFixed(3)),
    apertureCollegate: [],
    esterniKey,
  };
}

/**
 * @param {{
 *   scaviEsterni: object[],
 *   corselliEsterni: object[],
 *   camminamentiEsterni: object[],
 *   misurazioniVarie: object[],
 * }} data
 */
export function syncEsterniMisurazioniNelleVoci(data) {
  const scavi = Array.isArray(data?.scaviEsterni) ? data.scaviEsterni : [];
  const corselli = Array.isArray(data?.corselliEsterni) ? data.corselliEsterni : [];
  const misurazioni = Array.isArray(data?.misurazioniVarie) ? data.misurazioniVarie : [];
  // camminamentiEsterni non più supportati in ESTERNI VARI (modulo CAMMINAMENTI dedicato).

  let raw;
  try {
    raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
  } catch {
    return false;
  }

  let voci;
  if (!raw) {
    voci = [];
  } else {
    try {
      voci = JSON.parse(raw);
    } catch {
      return false;
    }
    if (!Array.isArray(voci)) return false;
  }

  function risolviEtichettaVoce(rawVoce) {
    const label = String(rawVoce ?? "").trim();
    if (!label) return "";
    const idNum = Number(label);
    if (Number.isFinite(idNum) && String(idNum) === label) {
      const found = voci.find((v) => v && v.idVoce === idNum);
      const ab = typeof found?.voceAbbreviata === "string" ? found.voceAbbreviata.trim() : "";
      return ab || label;
    }
    return label;
  }

  /** @type {Map<string, { label: string, rows: object[], unitaPreferita: string }>} */
  const byAbbrev = new Map();

  const add = (rawVoce, row, unitaPreferita) => {
    const label = risolviEtichettaVoce(rawVoce);
    if (!label) return;
    const key = abbrevKey(label);
    if (!byAbbrev.has(key)) {
      byAbbrev.set(key, { label, rows: [], unitaPreferita });
    }
    byAbbrev.get(key).rows.push(row);
  };

  for (const item of scavi) {
    add(
      item.idVoce,
      rigaBase({
        piano: item.piano,
        riferimento: item.riferimento,
        tipoOggetto: "SCAVO",
        misura1: item.misura1,
        misura2: item.misura2,
        misura3: item.altezza,
        numero: 1,
        segno: false,
        risultato: item.volume,
        esterniKey: `scavo:${item.idPlScavo}`,
        formula: item.formula,
        formulaValue: item.formulaValue,
      }),
      UNITA_DEFAULT.SCAVO,
    );
  }
  for (const item of corselli) {
    add(
      item.idVoce,
      rigaBase({
        piano: item.piano,
        riferimento: item.riferimento,
        tipoOggetto: "CORSELLO",
        misura1: item.misura1,
        misura2: item.misura2,
        misura3: item.altezza,
        numero: 1,
        segno: false,
        risultato: item.volume,
        esterniKey: `corsello:${item.idPlCors}`,
        formula: item.formula,
        formulaValue: item.formulaValue,
      }),
      UNITA_DEFAULT.CORSELLO,
    );
  }
  for (const item of misurazioni) {
    add(
      item.idVoce,
      rigaBase({
        piano: item.piano,
        riferimento: item.riferimento,
        tipoOggetto: "MISURAZIONE_VARIA",
        misura1: null,
        misura2: null,
        misura3: null,
        numero: item.numero,
        segno: false,
        risultato: item.risultato,
        esterniKey: `misurazione:${item.idMisurazione}`,
        formula: item.formula,
        formulaValue: item.formulaValue,
      }),
      UNITA_DEFAULT.MISURAZIONE_VARIA,
    );
  }

  let changed = false;

  // Rimuovi da tutte le voci le righe esterni non più presenti / da ricalcolare
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const filtered = mm.filter((row) => !isRigaEsterni(row));
    if (filtered.length !== mm.length) {
      item.misurazioniManuali = filtered;
      changed = true;
    }
  }

  const keysPresenti = new Set();
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (ab) keysPresenti.add(abbrevKey(ab));
  }

  let nextId =
    voci.reduce((max, item) => {
      const id = typeof item?.idVoce === "number" && Number.isFinite(item.idVoce) ? item.idVoce : 0;
      return Math.max(max, id);
    }, 0) + 1;
  let nextPos =
    voci.reduce((max, item) => {
      const p =
        typeof item?.posizione === "number" && Number.isFinite(item.posizione) ? item.posizione : 0;
      return Math.max(max, p);
    }, 0) + 1;

  for (const [key, pack] of byAbbrev) {
    if (!keysPresenti.has(key)) {
      voci.push(
        creaVoceManuale({
          idVoce: nextId,
          posizione: nextPos,
          voceAbbreviata: pack.label,
          unitaMisura: pack.unitaPreferita,
        }),
      );
      keysPresenti.add(key);
      nextId += 1;
      nextPos += 1;
      changed = true;
    }
  }

  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (!ab) continue;
    const pack = byAbbrev.get(abbrevKey(ab));
    if (!pack) continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaEsterni = mm.filter((row) => !isRigaEsterni(row));
    const mmAggiornate = [...mmSenzaEsterni, ...pack.rows];
    if (JSON.stringify(mmAggiornate) !== JSON.stringify(mm)) {
      item.misurazioniManuali = mmAggiornate;
      changed = true;
    }
  }

  // Se non ci sono più riferimenti esterni, le righe sono già state rimosse sopra.
  if (!changed && byAbbrev.size === 0) {
    // potremmo aver rimosso righe → changed già true; altrimenti nulla
  }

  if (!changed) return false;

  try {
    localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
    return true;
  } catch {
    return false;
  }
}
