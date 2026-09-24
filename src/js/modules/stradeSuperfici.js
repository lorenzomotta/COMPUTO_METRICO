/**
 * STRADE — zone di superficie, sede, poi impianti (segnaletica → acqua).
 * Le zone manuali hanno aree (formula × moltiplicatore, con «sottrai») e strati.
 * Cordoli: quantità a metro lineare (formula = lunghezza).
 * Zone formula/unità-voce (Segnaletica, Fogna, Allacci fogna, Luci, Gas, Acqua):
 *   formula × moltiplicatore; unità presa dalla voce dello strato.
 * Sede stradale: aree automatiche
 * Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti con area)
 * a parità di riferimento; si possono solo aggiungere strati.
 * Ordine schede: … Cordoli → Sede → Segnaletica → Fogna → Allacci fogna →
 * Luce pubblica → Luce privata → Gas → Acqua.
 */

/** @typedef {'ingombro'|'marciapiedi'|'aiuole'|'parcheggi'|'manufatti'|'cordoli'|'segnaletica'|'fogna'|'allacciFogna'|'lucePubblica'|'lucePrivata'|'gas'|'acqua'|'telefonica'|'varie'|'sedeStradale'} TipoZonaStrada */

export const TIPI_ZONA_MANUALE = /** @type {const} */ ([
  "ingombro",
  "marciapiedi",
  "aiuole",
  "parcheggi",
  "manufatti",
  "cordoli",
  "segnaletica",
  "fogna",
  "allacciFogna",
  "lucePubblica",
  "lucePrivata",
  "gas",
  "acqua",
  "telefonica",
  "varie",
]);

export const TIPO_MANUFATTI = "manufatti";
export const TIPO_CORDOLI = "cordoli";
export const TIPO_SEGNALETICA = "segnaletica";
export const TIPO_FOGNA = "fogna";
export const TIPO_ALLACCI_FOGNA = "allacciFogna";
export const TIPO_LUCE_PUBBLICA = "lucePubblica";
export const TIPO_LUCE_PRIVATA = "lucePrivata";
export const TIPO_GAS = "gas";
export const TIPO_ACQUA = "acqua";
export const TIPO_TELEFONICA = "telefonica";
export const TIPO_VARIE = "varie";
export const TIPO_SEDE_STRADALE = "sedeStradale";

/** Zone con formula × mol; unità dalla voce; fuori dal calcolo Sede. */
export const TIPI_ZONA_FORMULA_UNITA_VOCE = /** @type {const} */ ([
  TIPO_SEGNALETICA,
  TIPO_FOGNA,
  TIPO_ALLACCI_FOGNA,
  TIPO_LUCE_PUBBLICA,
  TIPO_LUCE_PRIVATA,
  TIPO_GAS,
  TIPO_ACQUA,
  TIPO_TELEFONICA,
]);

/** Ordine schede UI: superfici → Sede → impianti → Varie. */
export const TIPI_ZONA_STRADA = /** @type {const} */ ([
  "ingombro",
  "marciapiedi",
  "aiuole",
  "parcheggi",
  "manufatti",
  "cordoli",
  TIPO_SEDE_STRADALE,
  ...TIPI_ZONA_FORMULA_UNITA_VOCE,
  TIPO_VARIE,
]);

export const VOCE_SEDE_STRADALE = "SEDE STRADALE";

export const TIPI_MANUFATTO_BASE = /** @type {const} */ ([
  "Chiusino",
  "Caditoia",
  "Pozzetto",
  "Pozzetto Ispezione",
  "Pozzetto Palo",
  "Pozzetto Chiusura Rete",
  "Palo Luce",
  "Punto Irrigazione",
]);

/** Elenco di partenza. I tipi aggiunti in Misurazione STRADE stanno in localStorage. */
export const TIPI_MANUFATTO = TIPI_MANUFATTO_BASE;

const STORAGE_TIPI_MANUFATTO_EXTRA = "computo_metrico_strade_tipi_manufatto";

/** Tipi di cordolo di partenza. Gli altri li aggiunge l’utente in Misurazione STRADE. */
export const TIPI_CORDOLO_BASE = /** @type {const} */ (["Retto", "Curvo"]);

const STORAGE_TIPI_CORDOLO_EXTRA = "computo_metrico_strade_tipi_cordolo";

export const FORMULA_SEDE_STRADALE =
  "Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti)";

export const ZONA_LABELS = {
  ingombro: "Ingombro",
  marciapiedi: "Marciapiedi",
  aiuole: "Aiuole",
  parcheggi: "Parcheggi",
  manufatti: "Manufatti",
  cordoli: "Cordoli",
  segnaletica: "Segnaletica",
  fogna: "Fogna",
  allacciFogna: "Allacci fogna",
  lucePubblica: "Luce pubblica",
  lucePrivata: "Luce privata",
  gas: "Gas",
  acqua: "Acqua",
  telefonica: "Telefonica",
  varie: "Varie",
  sedeStradale: "Sede stradale",
};

/** Valore `tipoOggetto` nelle misurazioni VOCI. */
export const ZONA_TIPO_OGGETTO = {
  ingombro: "STRADA_INGOMBRO",
  marciapiedi: "STRADA_MARCIAPIEDE",
  aiuole: "STRADA_AIUOLA",
  parcheggi: "STRADA_PARCHEGGIO",
  manufatti: "STRADA_MANUFATTO",
  cordoli: "STRADA_CORDOLI",
  segnaletica: "STRADA_SEGNALETICA",
  fogna: "STRADA_FOGNA",
  allacciFogna: "STRADA_ALLACCI_FOGNA",
  lucePubblica: "STRADA_LUCE_PUBBLICA",
  lucePrivata: "STRADA_LUCE_PRIVATA",
  gas: "STRADA_GAS",
  acqua: "STRADA_ACQUA",
  telefonica: "STRADA_TELEFONICA",
  varie: "STRADA_VARIE",
  sedeStradale: "STRADA_SEDE",
};

export function isZonaSedeStradale(tipo) {
  return tipo === TIPO_SEDE_STRADALE;
}

export function isZonaManufatti(tipo) {
  return tipo === TIPO_MANUFATTI;
}

export function isZonaCordoli(tipo) {
  return tipo === TIPO_CORDOLI;
}

export function isZonaSegnaletica(tipo) {
  return tipo === TIPO_SEGNALETICA;
}

export function isZonaVarie(tipo) {
  return tipo === TIPO_VARIE;
}

/** Segnaletica, Fogna, Allacci fogna, Luci, Gas, Acqua, Telefonica. */
export function isZonaFormulaUnitaVoce(tipo) {
  return TIPI_ZONA_FORMULA_UNITA_VOCE.includes(
    /** @type {typeof TIPI_ZONA_FORMULA_UNITA_VOCE[number]} */ (tipo),
  );
}

/** Cordoli / impianti: non sottraggono mq dalla Sede; niente spessore → volume. */
export function isZonaEsclusaDaSede(tipo) {
  return isZonaCordoli(tipo) || isZonaFormulaUnitaVoce(tipo) || isZonaVarie(tipo);
}

function chiaveTipoManufatto(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("it-IT");
}

function loadTipiManufattoExtra() {
  try {
    const raw = localStorage.getItem(STORAGE_TIPI_MANUFATTO_EXTRA);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveTipiManufattoExtra(nomi) {
  try {
    localStorage.setItem(STORAGE_TIPI_MANUFATTO_EXTRA, JSON.stringify(nomi));
  } catch {
    /* ignore */
  }
}

/** Tipi di base più quelli aggiunti dall’utente. */
export function elencoTipiManufatto() {
  const out = [...TIPI_MANUFATTO_BASE];
  const seen = new Set(out.map((x) => chiaveTipoManufatto(x)));
  for (const extra of loadTipiManufattoExtra()) {
    const nome = String(extra ?? "").trim().replace(/\s+/g, " ");
    const key = chiaveTipoManufatto(nome);
    if (!nome || seen.has(key)) continue;
    seen.add(key);
    out.push(nome);
  }
  return out;
}

/**
 * Aggiunge un tipo all’elenco (se non c’è già).
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function aggiungiTipoManufatto(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return { ok: false, nome: "", errore: "Scrivi il nome del nuovo tipo.", giaPresente: false };
  if (nome.length > 60) {
    return { ok: false, nome: "", errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).", giaPresente: false };
  }
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiManufatto().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return { ok: true, nome: noto, errore: "", giaPresente: true };
  const extra = loadTipiManufattoExtra();
  extra.push(nome);
  saveTipiManufattoExtra(extra);
  return { ok: true, nome, errore: "", giaPresente: false };
}

export function normalizzaTipoManufatto(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return "";
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiManufatto().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return noto;
  const aggiunto = aggiungiTipoManufatto(nome);
  return aggiunto.ok ? aggiunto.nome : "";
}

function loadTipiCordoloExtra() {
  try {
    const raw = localStorage.getItem(STORAGE_TIPI_CORDOLO_EXTRA);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveTipiCordoloExtra(nomi) {
  try {
    localStorage.setItem(STORAGE_TIPI_CORDOLO_EXTRA, JSON.stringify(nomi));
  } catch {
    /* ignore */
  }
}

/** Retto, Curvo, più i tipi aggiunti dall’utente. */
export function elencoTipiCordolo() {
  const out = [...TIPI_CORDOLO_BASE];
  const seen = new Set(out.map((x) => chiaveTipoManufatto(x)));
  for (const extra of loadTipiCordoloExtra()) {
    const nome = String(extra ?? "").trim().replace(/\s+/g, " ");
    const key = chiaveTipoManufatto(nome);
    if (!nome || seen.has(key)) continue;
    seen.add(key);
    out.push(nome);
  }
  return out;
}

/**
 * Aggiunge un tipo di cordolo all’elenco (se non c’è già).
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function aggiungiTipoCordolo(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return { ok: false, nome: "", errore: "Scrivi il nome del nuovo tipo di cordolo.", giaPresente: false };
  if (nome.length > 60) {
    return { ok: false, nome: "", errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).", giaPresente: false };
  }
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiCordolo().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return { ok: true, nome: noto, errore: "", giaPresente: true };
  const extra = loadTipiCordoloExtra();
  extra.push(nome);
  saveTipiCordoloExtra(extra);
  return { ok: true, nome, errore: "", giaPresente: false };
}

export function normalizzaTipoCordolo(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return "";
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiCordolo().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return noto;
  const aggiunto = aggiungiTipoCordolo(nome);
  return aggiunto.ok ? aggiunto.nome : "";
}

export const TIPI_SEGNALETICA_BASE = /** @type {const} */ ([
  "Bianca continua",
  "Bianca tratteggiata",
  "Gialla continua",
  "Gialla tratteggiata",
  "Stop",
  "Attraversamento",
  "Zebre",
]);

const STORAGE_TIPI_SEGNALETICA_EXTRA = "computo_metrico_strade_tipi_segnaletica";

function loadTipiSegnaleticaExtra() {
  try {
    const raw = localStorage.getItem(STORAGE_TIPI_SEGNALETICA_EXTRA);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveTipiSegnaleticaExtra(nomi) {
  try {
    localStorage.setItem(STORAGE_TIPI_SEGNALETICA_EXTRA, JSON.stringify(nomi));
  } catch {
    /* ignore */
  }
}

export function elencoTipiSegnaletica() {
  const out = [...TIPI_SEGNALETICA_BASE];
  const seen = new Set(out.map((x) => chiaveTipoManufatto(x)));
  for (const extra of loadTipiSegnaleticaExtra()) {
    const nome = String(extra ?? "").trim().replace(/\s+/g, " ");
    const key = chiaveTipoManufatto(nome);
    if (!nome || seen.has(key)) continue;
    seen.add(key);
    out.push(nome);
  }
  return out;
}

/**
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function aggiungiTipoSegnaletica(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return { ok: false, nome: "", errore: "Scrivi il nome del nuovo tipo di segnaletica.", giaPresente: false };
  if (nome.length > 60) {
    return { ok: false, nome: "", errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).", giaPresente: false };
  }
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiSegnaletica().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return { ok: true, nome: noto, errore: "", giaPresente: true };
  const extra = loadTipiSegnaleticaExtra();
  extra.push(nome);
  saveTipiSegnaleticaExtra(extra);
  return { ok: true, nome, errore: "", giaPresente: false };
}

export function normalizzaTipoSegnaletica(raw) {
  let nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (chiaveTipoManufatto(nome) === chiaveTipoManufatto("Striscia bianca continua")) {
    nome = "Bianca continua";
  }
  if (!nome) return "";
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiSegnaletica().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return noto;
  const aggiunto = aggiungiTipoSegnaletica(nome);
  return aggiunto.ok ? aggiunto.nome : "";
}

export const TIPI_VARIE_BASE = /** @type {const} */ (["Reinterro"]);

const STORAGE_TIPI_VARIE_EXTRA = "computo_metrico_strade_tipi_varie";

function loadTipiVarieExtra() {
  try {
    const raw = localStorage.getItem(STORAGE_TIPI_VARIE_EXTRA);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveTipiVarieExtra(nomi) {
  try {
    localStorage.setItem(STORAGE_TIPI_VARIE_EXTRA, JSON.stringify(nomi));
  } catch {
    /* ignore */
  }
}

export function elencoTipiVarie() {
  const out = [...TIPI_VARIE_BASE];
  const seen = new Set(out.map((x) => chiaveTipoManufatto(x)));
  for (const extra of loadTipiVarieExtra()) {
    const nome = String(extra ?? "").trim().replace(/\s+/g, " ");
    const key = chiaveTipoManufatto(nome);
    if (!nome || seen.has(key)) continue;
    seen.add(key);
    out.push(nome);
  }
  return out;
}

/**
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function aggiungiTipoVarie(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return { ok: false, nome: "", errore: "Scrivi il nome del nuovo tipo.", giaPresente: false };
  if (nome.length > 60) {
    return { ok: false, nome: "", errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).", giaPresente: false };
  }
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiVarie().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return { ok: true, nome: noto, errore: "", giaPresente: true };
  const extra = loadTipiVarieExtra();
  extra.push(nome);
  saveTipiVarieExtra(extra);
  return { ok: true, nome, errore: "", giaPresente: false };
}

export function normalizzaTipoVarie(raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return "";
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiVarie().find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return noto;
  const aggiunto = aggiungiTipoVarie(nome);
  return aggiunto.ok ? aggiunto.nome : "";
}

/** Larghezza vuota = nulla (la quantità resta la formula). Numero ≥ 0 = metri, e la quantità diventa mq. */
export function larghezzaArea(area) {
  const txt = String(area?.larghezza ?? "").trim();
  if (txt === "") return null;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

function parseDim(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return null;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

function fmtDim(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Number(v).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function fmtTotaleNegativo(v) {
  if (!Number.isFinite(v) || v === 0) return fmtDim(0);
  return `−${fmtDim(v)}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Valuta una formula come in MISURE VARIE: numeri, + − * /, parentesi. */
export function evalFormulaArea(raw) {
  const txt = String(raw ?? "").trim();
  if (!txt) return null;
  const normalized = txt
    .replaceAll(",", ".")
    .replaceAll("×", "*")
    .replaceAll("⋅", "*")
    .replaceAll("·", "*")
    .replaceAll("−", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-");
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return null;
  try {
    const result = Function(`"use strict"; return (${normalized});`)();
    if (typeof result !== "number" || !Number.isFinite(result) || result < 0) return null;
    return Number(result.toFixed(3));
  } catch {
    return null;
  }
}

/** Vuoto → 1; qualsiasi numero finito è accettato (niente min/max). Testo non numerico → 1. */
export function parseMoltiplicatoreArea(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return 1;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n)) return 1;
  return n;
}

function testoMoltiplicatore(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return "1";
  return txt;
}

function formulaDaLatiLegacy(lato1, lato2) {
  const a = String(lato1 ?? "").trim();
  const b = String(lato2 ?? "").trim();
  if (a && b) return `${a} * ${b}`;
  if (a) return a;
  if (b) return b;
  return "";
}

function formulaArea(area) {
  const diretta = String(area?.formula ?? "").trim();
  if (diretta) return diretta;
  return formulaDaLatiLegacy(area?.lato1, area?.lato2);
}

/** Risultato = formula × moltiplicatore. Se c’è la larghezza, si moltiplica anche quella (mq). */
export function mqDiArea(area) {
  const val = evalFormulaArea(formulaArea(area));
  if (val == null) return 0;
  const mol = parseMoltiplicatoreArea(area?.moltiplicatore);
  const lar = larghezzaArea(area);
  const base = lar == null ? val : val * lar;
  return Number((base * mol).toFixed(3));
}

export function formulaAreaValida(area) {
  const f = formulaArea(area);
  if (!f) return true;
  return evalFormulaArea(f) != null;
}

export function totaliAreeZona(zona) {
  let mqPos = 0;
  let mqNeg = 0;
  for (const area of zona?.aree || []) {
    const mq = mqDiArea(area);
    if (area?.segno === true) mqNeg += mq;
    else mqPos += mq;
  }
  return {
    mqPos: Number(mqPos.toFixed(3)),
    mqNeg: Number(mqNeg.toFixed(3)),
    mqNetto: Number((mqPos - mqNeg).toFixed(3)),
  };
}

export function mqSottrazioniStrato(strato) {
  let tot = 0;
  for (const s of strato?.sottrazioni || []) {
    tot += mqDiArea(s);
  }
  return Number(tot.toFixed(3));
}

export function mqNettoStrato(zona, strato, mqBaseOverride) {
  const base =
    typeof mqBaseOverride === "number" && Number.isFinite(mqBaseOverride)
      ? mqBaseOverride
      : totaliAreeZona(zona).mqNetto;
  const sott = mqSottrazioniStrato(strato);
  return Number((base - sott).toFixed(3));
}

export function chiaveRiferimento(raw) {
  return String(raw ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

export function mqNettoZonaPerRiferimento(zona, rifKey) {
  let tot = 0;
  for (const area of zona?.aree || []) {
    if (chiaveRiferimento(area?.riferimento) !== rifKey) continue;
    const mq = mqDiArea(area);
    tot += area?.segno === true ? -mq : mq;
  }
  return Number(tot.toFixed(3));
}

/**
 * Una riga per ogni riferimento presente nelle zone manuali.
 * mqSede = Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti) sullo stesso riferimento.
 * I manufatti senza formula (area 0) non cambiano il calcolo.
 */
export function elencoRiferimentiSede(scheda) {
  /** @type {Map<string, string>} */
  const labels = new Map();
  for (const tipo of TIPI_ZONA_MANUALE) {
    if (isZonaEsclusaDaSede(tipo)) continue; // Cordoli/impianti: non entrano nel calcolo mq sede
    for (const a of scheda?.[tipo]?.aree || []) {
      const key = chiaveRiferimento(a?.riferimento);
      const label = String(a?.riferimento ?? "").trim();
      if (!labels.has(key)) labels.set(key, label);
      else if (tipo === "ingombro" && label) labels.set(key, label);
    }
  }
  let n = 1;
  const rows = [];
  for (const [key, riferimento] of labels) {
    const mqIngombro = mqNettoZonaPerRiferimento(scheda?.ingombro, key);
    const mqMarciapiedi = mqNettoZonaPerRiferimento(scheda?.marciapiedi, key);
    const mqAiuole = mqNettoZonaPerRiferimento(scheda?.aiuole, key);
    const mqParcheggi = mqNettoZonaPerRiferimento(scheda?.parcheggi, key);
    const mqManufatti = mqNettoZonaPerRiferimento(scheda?.manufatti, key);
    const mqSede = Number(
      (mqIngombro - mqMarciapiedi - mqAiuole - mqParcheggi - mqManufatti).toFixed(3),
    );
    if (
      mqIngombro === 0 &&
      mqMarciapiedi === 0 &&
      mqAiuole === 0 &&
      mqParcheggi === 0 &&
      mqManufatti === 0
    ) {
      continue;
    }
    rows.push({
      n: n++,
      key,
      riferimento,
      mqIngombro,
      mqMarciapiedi,
      mqAiuole,
      mqParcheggi,
      mqManufatti,
      mqSede,
    });
  }
  return rows;
}

export function totaliSedeStradale(scheda) {
  const rows = elencoRiferimentiSede(scheda);
  const mqNetto = Number(rows.reduce((s, r) => s + r.mqSede, 0).toFixed(3));
  return { rows, mqNetto };
}

export function areeVirtualiSede(scheda) {
  return elencoRiferimentiSede(scheda)
    .filter((r) => r.mqSede !== 0)
    .map((r) => ({
      id: r.n,
      n: r.n,
      riferimento: r.riferimento,
      formula: FORMULA_SEDE_STRADALE,
      moltiplicatore: "1",
      segno: r.mqSede < 0,
      mqFisso: Math.abs(r.mqSede),
    }));
}

export function calcolaMcDaMqESpessore(mq, spessore) {
  const sp = parseDim(spessore) ?? 0;
  const base = Number.isFinite(mq) ? mq : 0;
  return Number((base * sp).toFixed(3));
}

export function emptyAreaStrada(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    riferimento: "",
    formula: "",
    moltiplicatore: "1",
    segno: false,
    tipoManufatto: "",
    tipoCordolo: "",
    tipoSegnaletica: "",
    tipoVarie: "",
    larghezza: "",
  };
}

export function emptySottrazioneStrato(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    riferimento: "",
    formula: "",
    moltiplicatore: "1",
  };
}

export function duplicaAreaStrada(area, nextId, n) {
  const src = area && typeof area === "object" ? area : {};
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    riferimento: typeof src.riferimento === "string" ? src.riferimento : "",
    formula: formulaArea(src),
    moltiplicatore: testoMoltiplicatore(src.moltiplicatore),
    segno: src.segno === true,
    tipoManufatto: normalizzaTipoManufatto(src.tipoManufatto),
    tipoCordolo: normalizzaTipoCordolo(src.tipoCordolo),
    tipoSegnaletica: normalizzaTipoSegnaletica(src.tipoSegnaletica),
    tipoVarie: normalizzaTipoVarie(src.tipoVarie),
    larghezza: typeof src.larghezza === "string" ? src.larghezza : src.larghezza != null ? String(src.larghezza) : "",
  };
}

export function emptyStratoStrada(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    vocibreve: "",
    spessore: "",
    sottrazioni: [],
  };
}

export function emptyStratoSedeStradale(nextId, n = 1) {
  const st = emptyStratoStrada(nextId, n);
  st.vocibreve = VOCE_SEDE_STRADALE;
  return st;
}

export function emptyZonaStrada(nextId) {
  return {
    note: "",
    aree: [emptyAreaStrada(nextId, 1)],
    strati: [emptyStratoStrada(nextId, 1)],
  };
}

export function emptyZonaSedeStradale(nextId) {
  return {
    note: "",
    aree: [],
    strati: [emptyStratoSedeStradale(nextId, 1)],
  };
}

export function emptySchedaStrade(nextId) {
  return {
    ingombro: emptyZonaStrada(nextId),
    marciapiedi: emptyZonaStrada(nextId),
    aiuole: emptyZonaStrada(nextId),
    parcheggi: emptyZonaStrada(nextId),
    manufatti: emptyZonaStrada(nextId),
    cordoli: emptyZonaStrada(nextId),
    segnaletica: emptyZonaStrada(nextId),
    fogna: emptyZonaStrada(nextId),
    allacciFogna: emptyZonaStrada(nextId),
    lucePubblica: emptyZonaStrada(nextId),
    lucePrivata: emptyZonaStrada(nextId),
    gas: emptyZonaStrada(nextId),
    acqua: emptyZonaStrada(nextId),
    telefonica: emptyZonaStrada(nextId),
    varie: emptyZonaStrada(nextId),
    sedeStradale: emptyZonaSedeStradale(nextId),
  };
}

export function rinumeraAreeZona(zona) {
  if (!zona || !Array.isArray(zona.aree)) return;
  zona.aree.forEach((a, i) => {
    a.n = i + 1;
  });
}

export function rinumeraStratiZona(zona) {
  if (!zona || !Array.isArray(zona.strati)) return;
  zona.strati.forEach((st, i) => {
    st.n = i + 1;
  });
}

export function rinumeraSottrazioniStrato(strato) {
  if (!strato || !Array.isArray(strato.sottrazioni)) return;
  strato.sottrazioni.forEach((s, i) => {
    s.n = i + 1;
  });
}

function sanificaArea(row, nextId, n) {
  const src = row && typeof row === "object" ? row : {};
  const id = typeof src.id === "number" && Number.isFinite(src.id) ? src.id : nextId();
  return {
    id,
    n,
    riferimento: typeof src.riferimento === "string" ? src.riferimento : "",
    formula: formulaArea(src),
    moltiplicatore: testoMoltiplicatore(src.moltiplicatore),
    segno: src.segno === true,
    tipoManufatto: normalizzaTipoManufatto(src.tipoManufatto),
    tipoCordolo: normalizzaTipoCordolo(src.tipoCordolo),
    tipoSegnaletica: normalizzaTipoSegnaletica(src.tipoSegnaletica),
    tipoVarie: normalizzaTipoVarie(src.tipoVarie),
    larghezza: typeof src.larghezza === "string" ? src.larghezza : src.larghezza != null ? String(src.larghezza) : "",
  };
}

function sanificaSottrazione(row, nextId, n) {
  const src = row && typeof row === "object" ? row : {};
  const id = typeof src.id === "number" && Number.isFinite(src.id) ? src.id : nextId();
  return {
    id,
    n,
    riferimento: typeof src.riferimento === "string" ? src.riferimento : "",
    formula: formulaArea(src),
    moltiplicatore: testoMoltiplicatore(src.moltiplicatore),
  };
}

function sanificaStrato(row, nextId, n) {
  const src = row && typeof row === "object" ? row : {};
  const id = typeof src.id === "number" && Number.isFinite(src.id) ? src.id : nextId();
  const sottSrc = Array.isArray(src.sottrazioni)
    ? src.sottrazioni.filter((x) => x && typeof x === "object")
    : [];
  return {
    id,
    n,
    vocibreve: typeof src.vocibreve === "string" ? src.vocibreve : "",
    spessore: src.spessore != null && src.spessore !== "" ? String(src.spessore) : "",
    sottrazioni: sottSrc.map((s, i) => sanificaSottrazione(s, nextId, i + 1)),
  };
}

export function sanificaZonaStrada(raw, nextId) {
  const base = emptyZonaStrada(nextId);
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  base.note = typeof src.note === "string" ? src.note : "";

  const areeSrc = Array.isArray(src.aree) ? src.aree.filter((x) => x && typeof x === "object") : [];
  base.aree =
    areeSrc.length === 0
      ? [emptyAreaStrada(nextId, 1)]
      : areeSrc.map((a, i) => sanificaArea(a, nextId, i + 1));

  const stratSrc = Array.isArray(src.strati)
    ? src.strati.filter((x) => x && typeof x === "object")
    : [];
  base.strati =
    stratSrc.length === 0
      ? [emptyStratoStrada(nextId, 1)]
      : stratSrc.map((st, i) => sanificaStrato(st, nextId, i + 1));
  return base;
}

export function sanificaZonaSedeStradale(raw, nextId) {
  const base = emptyZonaSedeStradale(nextId);
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  base.note = typeof src.note === "string" ? src.note : "";
  base.aree = [];
  const stratSrc = Array.isArray(src.strati)
    ? src.strati.filter((x) => x && typeof x === "object")
    : [];
  base.strati =
    stratSrc.length === 0
      ? [emptyStratoSedeStradale(nextId, 1)]
      : stratSrc.map((st, i) => sanificaStrato(st, nextId, i + 1));
  return base;
}

export function sanificaSchedaStrade(raw, nextId) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const tipo of TIPI_ZONA_MANUALE) {
    out[tipo] = sanificaZonaStrada(src[tipo], nextId);
  }
  out.sedeStradale = sanificaZonaSedeStradale(src.sedeStradale, nextId);
  return out;
}

export function cloneZonaPerSnapshot(zona) {
  const src = zona && typeof zona === "object" ? zona : {};
  const aree = Array.isArray(src.aree) ? src.aree : [];
  const strati = Array.isArray(src.strati) ? src.strati : [];
  return {
    note: typeof src.note === "string" ? src.note : "",
    aree: aree.map((a, i) => ({
      id: typeof a?.id === "number" ? a.id : 0,
      n: typeof a?.n === "number" && Number.isFinite(a.n) ? a.n : i + 1,
      riferimento: typeof a?.riferimento === "string" ? a.riferimento : "",
      formula: formulaArea(a),
      moltiplicatore: testoMoltiplicatore(a?.moltiplicatore),
      segno: a?.segno === true,
      tipoManufatto: normalizzaTipoManufatto(a?.tipoManufatto),
      tipoCordolo: normalizzaTipoCordolo(a?.tipoCordolo),
      tipoSegnaletica: normalizzaTipoSegnaletica(a?.tipoSegnaletica),
      tipoVarie: normalizzaTipoVarie(a?.tipoVarie),
      larghezza: typeof a?.larghezza === "string" ? a.larghezza : a?.larghezza != null ? String(a.larghezza) : "",
    })),
    strati: strati.map((st, i) => ({
      id: typeof st?.id === "number" ? st.id : 0,
      n: typeof st?.n === "number" && Number.isFinite(st.n) ? st.n : i + 1,
      vocibreve: typeof st?.vocibreve === "string" ? st.vocibreve : "",
      spessore: st?.spessore != null && st.spessore !== "" ? String(st.spessore) : "",
      sottrazioni: (Array.isArray(st?.sottrazioni) ? st.sottrazioni : []).map((s, j) => ({
        id: typeof s?.id === "number" ? s.id : 0,
        n: typeof s?.n === "number" && Number.isFinite(s.n) ? s.n : j + 1,
        riferimento: typeof s?.riferimento === "string" ? s.riferimento : "",
        formula: formulaArea(s),
        moltiplicatore: testoMoltiplicatore(s?.moltiplicatore),
      })),
    })),
  };
}

export function cloneSchedaPerSnapshot(scheda) {
  const out = {};
  for (const tipo of TIPI_ZONA_STRADA) {
    out[tipo] = cloneZonaPerSnapshot(scheda?.[tipo]);
  }
  return out;
}

export function zonaHaVoceStrato(zona) {
  return (zona?.strati || []).some((st) => String(st?.vocibreve || "").trim());
}

/** True se la zona ha almeno un’area/misura utile da mandare in VOCI. */
export function zonaHaMisuraCompilata(tipo, zona, schedaCompleta) {
  if (isZonaSedeStradale(tipo)) {
    return areeVirtualiSede(schedaCompleta).length > 0;
  }
  const aree = Array.isArray(zona?.aree) ? zona.aree : [];
  if (isZonaManufatti(tipo)) {
    return aree.some(
      (a) =>
        Boolean(String(a?.formula ?? "").trim()) ||
        Boolean(String(a?.tipoManufatto ?? "").trim()),
    );
  }
  if (isZonaCordoli(tipo)) {
    return aree.some(
      (a) =>
        (Boolean(String(a?.formula ?? "").trim()) && evalFormulaArea(String(a?.formula ?? "")) != null) ||
        Boolean(String(a?.tipoCordolo ?? "").trim()),
    );
  }
  if (isZonaSegnaletica(tipo)) {
    return aree.some(
      (a) =>
        (Boolean(String(a?.formula ?? "").trim()) && evalFormulaArea(String(a?.formula ?? "")) != null) ||
        Boolean(String(a?.tipoSegnaletica ?? "").trim()),
    );
  }
  if (isZonaVarie(tipo)) {
    return aree.some(
      (a) =>
        (Boolean(String(a?.formula ?? "").trim()) && evalFormulaArea(String(a?.formula ?? "")) != null) ||
        Boolean(String(a?.tipoVarie ?? "").trim()),
    );
  }
  return aree.some((a) => {
    if (typeof a?.mqFisso === "number" && Number.isFinite(a.mqFisso) && a.mqFisso !== 0) {
      return true;
    }
    const f = String(a?.formula ?? "").trim();
    return Boolean(f) && evalFormulaArea(f) != null;
  });
}

/**
 * Serve una voce sullo strato della zona che ha le misure
 * (la sola «SEDE STRADALE» precompilata non basta se non ci sono mq sede).
 */
export function zonaManufattiHaTipo(zona) {
  return (zona?.aree || []).some((a) => Boolean(normalizzaTipoManufatto(a?.tipoManufatto)));
}

export function zonaCordoliHaTipo(zona) {
  return (zona?.aree || []).some((a) => Boolean(normalizzaTipoCordolo(a?.tipoCordolo)));
}

export function zonaSegnaleticaHaTipo(zona) {
  return (zona?.aree || []).some((a) => Boolean(normalizzaTipoSegnaletica(a?.tipoSegnaletica)));
}

export function zonaVarieHaTipo(zona) {
  return (zona?.aree || []).some((a) => Boolean(normalizzaTipoVarie(a?.tipoVarie)));
}

export function schedaStradeHaDatiRegistrabili(schedaCompleta) {
  if (!schedaCompleta || typeof schedaCompleta !== "object") return false;
  for (const tipo of TIPI_ZONA_STRADA) {
    const zona = schedaCompleta[tipo];
    if (!zonaHaMisuraCompilata(tipo, zona, schedaCompleta)) continue;
    if (isZonaManufatti(tipo)) {
      if (zonaManufattiHaTipo(zona)) return true;
      continue;
    }
    if (isZonaCordoli(tipo)) {
      if (zonaCordoliHaTipo(zona)) return true;
      continue;
    }
    if (isZonaSegnaletica(tipo)) {
      if (zonaSegnaleticaHaTipo(zona)) return true;
      continue;
    }
    if (isZonaVarie(tipo)) {
      if (zonaVarieHaTipo(zona)) return true;
      continue;
    }
    if (zonaHaVoceStrato(zona)) return true;
  }
  return false;
}

/** Zone con misure ma senza voce sullo strato (per messaggio d’errore). */
export function elencoZoneMisuraSenzaVoce(schedaCompleta) {
  const out = [];
  if (!schedaCompleta || typeof schedaCompleta !== "object") return out;
  for (const tipo of TIPI_ZONA_STRADA) {
    const zona = schedaCompleta[tipo];
    if (!zonaHaMisuraCompilata(tipo, zona, schedaCompleta)) continue;
    if (isZonaManufatti(tipo)) {
      if (!zonaManufattiHaTipo(zona)) out.push("Manufatti (scegli il tipo)");
      continue;
    }
    if (isZonaCordoli(tipo)) {
      if (!zonaCordoliHaTipo(zona)) out.push("Cordoli (scegli il tipo)");
      continue;
    }
    if (isZonaSegnaletica(tipo)) {
      if (!zonaSegnaleticaHaTipo(zona)) out.push("Segnaletica (scegli il tipo)");
      continue;
    }
    if (isZonaVarie(tipo)) {
      if (!zonaVarieHaTipo(zona)) out.push("Varie (scegli il tipo)");
      continue;
    }
    if (zonaHaVoceStrato(zona)) continue;
    out.push(ZONA_LABELS[tipo] || tipo);
  }
  return out;
}

export function maxIdNelloScheda(scheda) {
  let max = 0;
  const bump = (id) => {
    if (typeof id === "number" && Number.isFinite(id)) max = Math.max(max, id);
  };
  for (const tipo of TIPI_ZONA_STRADA) {
    const zona = scheda?.[tipo];
    for (const a of zona?.aree || []) bump(a?.id);
    for (const st of zona?.strati || []) {
      bump(st?.id);
      for (const s of st?.sottrazioni || []) bump(s?.id);
    }
  }
  return max;
}

function appendCellettaMq(tr, mqText, err, role) {
  const tdMq = document.createElement("td");
  tdMq.className = "vani-sup-calc" + (err ? " strade-area-mq-err" : "");
  tdMq.dataset.role = role;
  tdMq.textContent = mqText;
  if (err) tdMq.title = "Formula non valida. Usa numeri, + − * / e parentesi.";
  tr.appendChild(tdMq);
}

function appendFormulaEMoltiplicatore(tr, item, classPrefix, ariaBase, { pezzi = false, lineare = false, primaMoltiplicatore = null } = {}) {
  const tdF = document.createElement("td");
  tdF.className = "strade-formula-cell";
  const inpF = document.createElement("input");
  inpF.type = "text";
  inpF.className = `${classPrefix}-formula`;
  inpF.placeholder = pezzi ? "opz. area 1 pezzo" : lineare ? "es. 12,5" : "es. 12,5 * 3,2";
  inpF.setAttribute(
    "aria-label",
    pezzi ? `Formula area di un pezzo ${ariaBase}` : `Formula ${ariaBase}`,
  );
  inpF.autocomplete = "off";
  inpF.spellcheck = false;
  inpF.value = formulaArea(item);
  tdF.appendChild(inpF);
  tr.appendChild(tdF);
  if (typeof primaMoltiplicatore === "function") primaMoltiplicatore(tr);

  const tdM = document.createElement("td");
  tdM.className = "strade-mol-cell";
  const inpM = document.createElement("input");
  inpM.type = "text";
  inpM.className = `${classPrefix}-moltiplicatore vani-in-num`;
  inpM.inputMode = "decimal";
  inpM.placeholder = "1";
  inpM.setAttribute(
    "aria-label",
    pezzi ? `Numero pezzi ${ariaBase}` : `Moltiplicatore ${ariaBase}`,
  );
  inpM.title = pezzi
    ? "Quanti pezzi contare nelle VOCI (vuoto = 1). Se c’è una formula, quell’area × pezzi si toglie dalla Sede."
    : lineare
      ? "Ripete il risultato della formula (vuoto = 1)"
      : "Moltiplica il risultato della formula (vuoto = 1)";
  inpM.autocomplete = "off";
  inpM.value = testoMoltiplicatore(item?.moltiplicatore);
  tdM.appendChild(inpM);
  tr.appendChild(tdM);
}

function testoMqRiga(item, comeNegativo) {
  if (!formulaAreaValida(item)) return { text: "err", err: true };
  const mq = mqDiArea(item);
  return {
    text: comeNegativo ? fmtTotaleNegativo(mq) : fmtDim(mq),
    err: false,
  };
}

function appendTipoCordolo(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const sel = document.createElement("select");
  sel.className = "strade-area-tipo-cordolo";
  sel.setAttribute("aria-label", "Tipo cordolo");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— scegli —";
  sel.appendChild(empty);
  for (const t of elencoTipiCordolo()) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  }
  sel.value = normalizzaTipoCordolo(area?.tipoCordolo);
  td.appendChild(sel);
  tr.appendChild(td);
}

function appendTipoSegnaletica(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const sel = document.createElement("select");
  sel.className = "strade-area-tipo-segnaletica";
  sel.setAttribute("aria-label", "Tipo segnaletica");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— scegli —";
  sel.appendChild(empty);
  for (const t of elencoTipiSegnaletica()) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  }
  sel.value = normalizzaTipoSegnaletica(area?.tipoSegnaletica);
  td.appendChild(sel);
  tr.appendChild(td);
}

function appendTipoVarie(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const sel = document.createElement("select");
  sel.className = "strade-area-tipo-varie";
  sel.setAttribute("aria-label", "Tipo varie");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— scegli —";
  sel.appendChild(empty);
  for (const t of elencoTipiVarie()) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  }
  sel.value = normalizzaTipoVarie(area?.tipoVarie);
  td.appendChild(sel);
  tr.appendChild(td);
}

function appendLarghezza(tr, area) {
  const td = document.createElement("td");
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-area-larghezza";
  inp.placeholder = "vuota";
  inp.setAttribute("aria-label", "Larghezza in metri, lascia vuoto se non serve");
  inp.title = "Larghezza in metri. Lasciala vuota se la quantità non è in mq.";
  inp.autocomplete = "off";
  inp.value = typeof area?.larghezza === "string" ? area.larghezza : area?.larghezza != null ? String(area.larghezza) : "";
  td.appendChild(inp);
  tr.appendChild(td);
}

function appendTipoManufatto(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const sel = document.createElement("select");
  sel.className = "strade-area-tipo-manufatto";
  sel.setAttribute("aria-label", "Tipo manufatto");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— scegli —";
  sel.appendChild(empty);
  for (const t of elencoTipiManufatto()) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  }
  sel.value = normalizzaTipoManufatto(area?.tipoManufatto);
  td.appendChild(sel);
  tr.appendChild(td);
}

function renderAreeTable(tipo, zona) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";
  const isManufatti = isZonaManufatti(tipo);
  const isCordoli = isZonaCordoli(tipo);
  const isSegnaletica = isZonaSegnaletica(tipo);
  const isVarie = isZonaVarie(tipo);
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipo) && !isSegnaletica;
  const unitaCol = isCordoli ? "Ml" : isFormulaUnitaVoce || isVarie ? "Ris." : "Mq";
  const titoloSezione = isCordoli ? "Lunghezze" : isFormulaUnitaVoce || isVarie ? "Calcoli" : "Aree";

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">${titoloSezione}</span>`;
  wrap.appendChild(head);

  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = isManufatti
    ? "vani-sup-aree-table strade-aree-table--manufatti"
    : isCordoli
      ? "vani-sup-aree-table strade-aree-table--cordoli"
      : isSegnaletica
        ? "vani-sup-aree-table strade-aree-table--segnaletica"
        : isVarie
          ? "vani-sup-aree-table strade-aree-table--varie"
          : "vani-sup-aree-table";
  const conTipo = isManufatti || isCordoli || isSegnaletica || isVarie;
  table.innerHTML = isManufatti
    ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo manufatto</th><th>Formula</th><th>N° pezzi</th><th>Mq</th><th>Sottrai</th><th></th>
  </tr></thead>`
    : isCordoli
      ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo cordolo</th><th>Formula</th><th>×</th><th>Ml</th><th>Sottrai</th><th></th>
  </tr></thead>`
      : isSegnaletica
        ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    <col class="strade-col-formula"><col class="strade-col-lar"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo segnaletica</th><th>Formula</th><th>Larghezza</th><th>×</th><th>Ris.</th><th>Sottrai</th><th></th>
  </tr></thead>`
        : isVarie
          ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo varie</th><th>Formula</th><th>×</th><th>Ris.</th><th>Sottrai</th><th></th>
  </tr></thead>`
          : `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif">
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Formula</th><th>×</th><th>${unitaCol}</th><th>Sottrai</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  for (const area of zona.aree || []) {
    const tr = document.createElement("tr");
    tr.className = "vani-sup-area-row";
    tr.dataset.areaId = String(area.id);

    const tdN = document.createElement("td");
    tdN.className = "vani-sup-strato-num";
    tdN.textContent = String(area.n ?? "");
    tr.appendChild(tdN);

    const tdRif = document.createElement("td");
    const inpRif = document.createElement("input");
    inpRif.type = "text";
    inpRif.className = "vani-sup-area-rif";
    inpRif.placeholder = "rif.";
    inpRif.setAttribute(
      "aria-label",
      isCordoli ? "Riferimento lunghezza" : isFormulaUnitaVoce ? "Riferimento calcolo" : "Riferimento area",
    );
    inpRif.value = typeof area.riferimento === "string" ? area.riferimento : "";
    tdRif.appendChild(inpRif);
    tr.appendChild(tdRif);

    if (isManufatti) appendTipoManufatto(tr, area);
    if (isCordoli) appendTipoCordolo(tr, area);
    if (isSegnaletica) appendTipoSegnaletica(tr, area);
    if (isVarie) appendTipoVarie(tr, area);

    appendFormulaEMoltiplicatore(
      tr,
      area,
      "strade-area",
      isCordoli ? "lunghezza" : isSegnaletica ? "segnaletica" : isVarie || isFormulaUnitaVoce ? "calcolo" : "area",
      {
        pezzi: isManufatti,
        lineare: isCordoli || isSegnaletica || isVarie || isFormulaUnitaVoce,
        primaMoltiplicatore: isSegnaletica ? () => appendLarghezza(tr, area) : null,
      },
    );

    const mqInfo = testoMqRiga(area, area.segno === true);
    appendCellettaMq(tr, mqInfo.text, mqInfo.err, "area-mq");

    const tdSegno = document.createElement("td");
    tdSegno.className = "vani-sup-strato-segno-cell";
    const lbl = document.createElement("label");
    lbl.className = "vani-sup-strato-segno-label";
    lbl.title = isCordoli || isFormulaUnitaVoce
      ? "Valore negativo (sottrazione sulla zona)"
      : "Area negativa (sottrazione sulla zona)";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "vani-sup-area-segno";
    chk.checked = area.segno === true;
    chk.setAttribute(
      "aria-label",
      isCordoli || isFormulaUnitaVoce ? "Sottrai valore" : "Sottrai area",
    );
    lbl.appendChild(chk);
    lbl.append(" sottrai");
    tdSegno.appendChild(lbl);
    tr.appendChild(tdSegno);

    const tdAct = document.createElement("td");
    tdAct.className = "strade-area-act";
    const btnDup = document.createElement("button");
    btnDup.type = "button";
    btnDup.className = "btn-action btn-secondary vani-btn-micro strade-btn-dup-area";
    btnDup.dataset.action = "duplica-area-strada";
    btnDup.dataset.tipoZona = tipo;
    btnDup.dataset.areaId = String(area.id);
    btnDup.title = "Duplica area (copia formula, moltiplicatore e segno)";
    btnDup.setAttribute("aria-label", "Duplica area");
    btnDup.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 17V5a2 2 0 0 1 2-2h10"/></svg>`;
    tdAct.appendChild(btnDup);
    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-area-strada";
    btnRm.dataset.tipoZona = tipo;
    btnRm.dataset.areaId = String(area.id);
    btnRm.textContent = "✕";
    btnRm.title = "Rimuovi area";
    btnRm.disabled = (zona.aree || []).length <= 1;
    tdAct.appendChild(btnRm);
    tr.appendChild(tdAct);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  const t = totaliAreeZona(zona);
  const labelColspan = isSegnaletica ? 6 : conTipo ? 5 : 4;
  const labelPos = isCordoli
    ? "Totale lunghezze positive"
    : isSegnaletica
      ? "Totale positivo"
      : isFormulaUnitaVoce || isVarie
      ? "Totale valori positivi"
      : "Totale aree positive";
  const labelNeg = isCordoli
    ? "Totale lunghezze negative"
    : isSegnaletica
      ? "Totale negativo"
      : isFormulaUnitaVoce || isVarie
      ? "Totale valori negativi"
      : "Totale aree negative";
  const labelNetto = isCordoli
    ? "Ml netto zona (base per gli strati)"
    : isSegnaletica
      ? "Risultato netto (se c’è la larghezza è in mq)"
      : isFormulaUnitaVoce
      ? "Risultato netto (base per gli strati; unità = voce)"
      : isVarie
        ? "Risultato netto (unità = voce del tipo)"
      : "Mq netto zona (base per gli strati)";
  const tfoot = document.createElement("tfoot");
  tfoot.innerHTML = `
    <tr class="vani-sup-totale-row vani-sup-totale-row--pos">
      <td colspan="${labelColspan}">${labelPos}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-pos">${fmtDim(t.mqPos)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--neg">
      <td colspan="${labelColspan}">${labelNeg}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-neg">${fmtTotaleNegativo(t.mqNeg)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--netto">
      <td colspan="${labelColspan}">${labelNetto}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-netto">${fmtDim(t.mqNetto)}</td>
      <td colspan="2"></td>
    </tr>`;
  table.appendChild(tfoot);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  if (isManufatti) wrap.appendChild(renderNuovoTipoManufatto());
  if (isCordoli) wrap.appendChild(renderNuovoTipoCordolo());
  if (isSegnaletica) wrap.appendChild(renderNuovoTipoSegnaletica());
  if (isVarie) wrap.appendChild(renderNuovoTipoVarie());
  return wrap;
}

function renderNuovoTipoVarie() {
  const box = document.createElement("div");
  box.className = "strade-nuovo-tipo";
  const label = document.createElement("label");
  label.className = "strade-nuovo-tipo-label";
  label.textContent = "Nuovo tipo varie";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-nuovo-tipo-nome";
  inp.placeholder = "es. Trasporto";
  inp.setAttribute("aria-label", "Nome del nuovo tipo varie");
  inp.autocomplete = "off";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary";
  btn.dataset.action = "aggiungi-tipo-varie";
  btn.textContent = "Aggiungi tipo";
  box.append(label, inp, btn);
  return box;
}

function renderNuovoTipoSegnaletica() {
  const box = document.createElement("div");
  box.className = "strade-nuovo-tipo";
  const label = document.createElement("label");
  label.className = "strade-nuovo-tipo-label";
  label.textContent = "Nuovo tipo segnaletica";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-nuovo-tipo-nome";
  inp.placeholder = "es. Freccia";
  inp.setAttribute("aria-label", "Nome del nuovo tipo di segnaletica");
  inp.autocomplete = "off";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary";
  btn.dataset.action = "aggiungi-tipo-segnaletica";
  btn.textContent = "Aggiungi tipo";
  box.append(label, inp, btn);
  return box;
}

function renderNuovoTipoCordolo() {
  const box = document.createElement("div");
  box.className = "strade-nuovo-tipo";
  const label = document.createElement("label");
  label.className = "strade-nuovo-tipo-label";
  label.textContent = "Nuovo tipo cordolo";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-nuovo-tipo-nome";
  inp.placeholder = "es. Smusso";
  inp.setAttribute("aria-label", "Nome del nuovo tipo di cordolo");
  inp.autocomplete = "off";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary";
  btn.dataset.action = "aggiungi-tipo-cordolo";
  btn.textContent = "Aggiungi tipo";
  box.append(label, inp, btn);
  return box;
}

function renderNuovoTipoManufatto() {
  const box = document.createElement("div");
  box.className = "strade-nuovo-tipo";
  const label = document.createElement("label");
  label.className = "strade-nuovo-tipo-label";
  label.textContent = "Nuovo tipo";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-nuovo-tipo-nome";
  inp.placeholder = "es. Griglia";
  inp.setAttribute("aria-label", "Nome del nuovo tipo di manufatto");
  inp.autocomplete = "off";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary";
  btn.dataset.action = "aggiungi-tipo-manufatto";
  btn.textContent = "Aggiungi tipo";
  box.append(label, inp, btn);
  return box;
}

function renderSottrazioniStrato(tipo, strato) {
  const wrap = document.createElement("div");
  wrap.className = "strade-sott-wrap";
  const isCordoli = isZonaCordoli(tipo);
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipo);
  const unitaCol = isCordoli ? "Ml" : isFormulaUnitaVoce ? "Ris." : "Mq";

  const head = document.createElement("div");
  head.className = "strade-sott-head";
  head.innerHTML = `<span class="strade-sott-title">${
    isCordoli
      ? "Lunghezze da sottrarre in questo strato"
      : isFormulaUnitaVoce
        ? "Valori da sottrarre in questo strato"
        : "Aree da sottrarre in questo strato"
  }</span>`;
  wrap.appendChild(head);

  const list = strato.sottrazioni || [];
  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "strade-sott-empty";
    empty.textContent = isCordoli || isFormulaUnitaVoce
      ? "Nessuna sottrazione. Usa «Aggiungi sottrazione» per togliere un valore solo da questo strato."
      : "Nessuna sottrazione. Usa «Aggiungi sottrazione» per togliere un’area solo da questo strato.";
    wrap.appendChild(empty);
  } else {
    const tableWrap = document.createElement("div");
    tableWrap.className = "vani-sup-table-wrap";
    const table = document.createElement("table");
    table.className = "strade-sott-table";
    table.innerHTML = `<colgroup>
      <col class="strade-col-n"><col class="strade-col-rif">
      <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
      <col class="strade-col-act">
    </colgroup>
    <thead><tr>
      <th>N°</th><th>Rif.</th><th>Formula</th><th>×</th><th>${unitaCol}</th><th></th>
    </tr></thead>`;
    const tbody = document.createElement("tbody");
    for (const s of list) {
      const tr = document.createElement("tr");
      tr.className = "strade-sott-row";
      tr.dataset.sottId = String(s.id);

      const tdN = document.createElement("td");
      tdN.className = "vani-sup-strato-num";
      tdN.textContent = String(s.n ?? "");
      tr.appendChild(tdN);

      const tdRif = document.createElement("td");
      const inpRif = document.createElement("input");
      inpRif.type = "text";
      inpRif.className = "strade-sott-rif";
      inpRif.placeholder = "rif.";
      inpRif.setAttribute("aria-label", "Riferimento sottrazione");
      inpRif.value = typeof s.riferimento === "string" ? s.riferimento : "";
      tdRif.appendChild(inpRif);
      tr.appendChild(tdRif);

      appendFormulaEMoltiplicatore(tr, s, "strade-sott", "sottrazione", {
        lineare: isCordoli || isFormulaUnitaVoce,
      });

      const mqInfo = testoMqRiga(s, true);
      appendCellettaMq(tr, mqInfo.text, mqInfo.err, "sott-mq");

      const tdAct = document.createElement("td");
      const btnRm = document.createElement("button");
      btnRm.type = "button";
      btnRm.className = "btn-action btn-delete vani-btn-micro";
      btnRm.dataset.action = "rimuovi-sottrazione-strato";
      btnRm.dataset.tipoZona = tipo;
      btnRm.dataset.stratoId = String(strato.id);
      btnRm.dataset.sottId = String(s.id);
      btnRm.textContent = "✕";
      btnRm.title = "Rimuovi sottrazione";
      tdAct.appendChild(btnRm);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
  }

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.className = "btn-action btn-secondary vani-btn-mini strade-sott-add";
  btnAdd.dataset.action = "aggiungi-sottrazione-strato";
  btnAdd.dataset.tipoZona = tipo;
  btnAdd.dataset.stratoId = String(strato.id);
  btnAdd.textContent = "Aggiungi sottrazione";
  wrap.appendChild(btnAdd);
  return wrap;
}

function renderStratiCards(tipo, zona, datalistId, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";
  const senzaSpessore = isZonaEsclusaDaSede(tipo);
  const isCordoli = isZonaCordoli(tipo);
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipo);

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">Strati</span>`;
  wrap.appendChild(head);

  const mqBase =
    typeof opts.mqBaseOverride === "number" && Number.isFinite(opts.mqBaseOverride)
      ? opts.mqBaseOverride
      : totaliAreeZona(zona).mqNetto;
  const nascondiSottrazioni = opts.nascondiSottrazioni === true;

  for (const st of zona.strati || []) {
    const mqSott = nascondiSottrazioni ? 0 : mqSottrazioniStrato(st);
    const mqNetto = nascondiSottrazioni
      ? mqBase
      : mqNettoStrato(zona, st, mqBase);
    const spTxt = String(st.spessore ?? "").trim();
    const hasSp = !senzaSpessore && spTxt !== "";
    const calcolo = hasSp ? calcolaMcDaMqESpessore(mqNetto, st.spessore) : mqNetto;

    const card = document.createElement("div");
    card.className = "strade-strato-card";
    card.dataset.stratoId = String(st.id);

    const row = document.createElement("div");
    row.className = "strade-strato-head";

    const num = document.createElement("span");
    num.className = "strade-strato-num";
    num.textContent = String(st.n ?? "");
    row.appendChild(num);

    const voceWrap = document.createElement("label");
    voceWrap.className = "strade-strato-field strade-strato-field--voce";
    voceWrap.innerHTML = `<span>Voce</span>`;
    const inpVoce = document.createElement("input");
    inpVoce.type = "text";
    inpVoce.className = "strade-strato-voce";
    inpVoce.setAttribute("list", datalistId);
    inpVoce.placeholder = "Voce breve";
    inpVoce.autocomplete = "off";
    inpVoce.setAttribute("aria-label", "Voce breve strato");
    inpVoce.title = isFormulaUnitaVoce
      ? "Scegli la voce: l’unità di misura (n., ml., mq.…) viene da quella voce"
      : "Voce breve dello strato";
    inpVoce.value = typeof st.vocibreve === "string" ? st.vocibreve : "";
    voceWrap.appendChild(inpVoce);
    row.appendChild(voceWrap);

    if (!senzaSpessore) {
      const spWrap = document.createElement("label");
      spWrap.className = "strade-strato-field";
      spWrap.innerHTML = `<span>Spess.</span>`;
      const inpSp = document.createElement("input");
      inpSp.type = "number";
      inpSp.className = "strade-strato-spessore vani-in-num";
      inpSp.step = "0.001";
      inpSp.min = "0";
      inpSp.max = "9.999";
      inpSp.placeholder = "Sp.";
      inpSp.title = "Spessore strato (m)";
      inpSp.setAttribute("aria-label", "Spessore strato");
      inpSp.value = st.spessore != null && st.spessore !== "" ? String(st.spessore) : "";
      spWrap.appendChild(inpSp);
      row.appendChild(spWrap);
    }

    const labelBase = nascondiSottrazioni
      ? "Mq sede"
      : isCordoli
        ? "Ml zona"
        : isFormulaUnitaVoce
          ? "Ris. zona"
          : "Mq zona";
    const mqBaseEl = document.createElement("div");
    mqBaseEl.className = "strade-strato-metric";
    mqBaseEl.innerHTML = `<span>${labelBase}</span><strong data-role="strato-mq-base">${fmtDim(mqBase)}</strong>`;
    row.appendChild(mqBaseEl);

    if (!nascondiSottrazioni) {
      const mqSottEl = document.createElement("div");
      mqSottEl.className = "strade-strato-metric";
      const labelSott = isCordoli ? "Ml sottr." : isFormulaUnitaVoce ? "Ris. sottr." : "Mq sottr.";
      mqSottEl.innerHTML = `<span>${labelSott}</span><strong data-role="strato-mq-sott">${fmtTotaleNegativo(mqSott)}</strong>`;
      row.appendChild(mqSottEl);
    }

    const mqNettoEl = document.createElement("div");
    mqNettoEl.className = "strade-strato-metric";
    const labelNetto = isCordoli ? "Ml netto" : isFormulaUnitaVoce ? "Ris. netto" : "Mq netto";
    mqNettoEl.innerHTML = `<span>${labelNetto}</span><strong data-role="strato-mq-netto">${fmtDim(mqNetto)}</strong>`;
    row.appendChild(mqNettoEl);

    const calcTitle = isCordoli
      ? "Lunghezza (ml netto)"
      : isFormulaUnitaVoce
        ? "Risultato formula × moltiplicatore (unità dalla voce)"
        : hasSp
          ? "Volume (mq netto × spessore)"
          : "Area (mq netto, senza spessore)";
    const calcEl = document.createElement("div");
    calcEl.className = "strade-strato-metric";
    calcEl.innerHTML = `<span>Calcolo</span><strong data-role="strato-calcolo" title="${calcTitle}">${fmtDim(calcolo)}</strong>`;
    row.appendChild(calcEl);

    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-strato-strada";
    btnRm.dataset.tipoZona = tipo;
    btnRm.dataset.stratoId = String(st.id);
    btnRm.textContent = "✕";
    btnRm.title = "Rimuovi strato";
    btnRm.disabled = (zona.strati || []).length <= 1;
    row.appendChild(btnRm);

    card.appendChild(row);
    if (!nascondiSottrazioni) card.appendChild(renderSottrazioniStrato(tipo, st));
    wrap.appendChild(card);
  }

  return wrap;
}

function fmtDimSegno(v) {
  if (!Number.isFinite(v)) return "—";
  if (v < 0) return `−${fmtDim(Math.abs(v))}`;
  return fmtDim(v);
}

function renderAreeSedeTable(scheda) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">Aree automatiche</span>`;
  wrap.appendChild(head);

  const { rows, mqNetto } = totaliSedeStradale(scheda);

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "vani-sup-hint strade-sede-empty";
    empty.textContent =
      "Nessuna area ancora. Nelle altre schede usa lo stesso riferimento (es. «tratto A») su Ingombro, Marciapiedi, Aiuole, Parcheggi e Manufatti: qui comparirà Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti).";
    wrap.appendChild(empty);
    return wrap;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = "vani-sup-aree-table strade-sede-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>Rif.</th><th>Ingombro</th><th>Marciapiedi</th><th>Aiuole</th><th>Parcheggi</th><th>Manufatti</th><th>Sede mq</th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.className = "strade-sede-row";
    const rifLabel = r.riferimento ? r.riferimento : "(senza rif.)";
    tr.innerHTML = `
      <td class="vani-sup-strato-num">${escapeHtml(String(r.n))}</td>
      <td>${escapeHtml(rifLabel)}</td>
      <td class="vani-sup-calc">${escapeHtml(fmtDimSegno(r.mqIngombro))}</td>
      <td class="vani-sup-calc">${escapeHtml(fmtDimSegno(r.mqMarciapiedi))}</td>
      <td class="vani-sup-calc">${escapeHtml(fmtDimSegno(r.mqAiuole))}</td>
      <td class="vani-sup-calc">${escapeHtml(fmtDimSegno(r.mqParcheggi))}</td>
      <td class="vani-sup-calc">${escapeHtml(fmtDimSegno(r.mqManufatti))}</td>
      <td class="vani-sup-calc strade-sede-mq">${escapeHtml(fmtDimSegno(r.mqSede))}</td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  const tfoot = document.createElement("tfoot");
  tfoot.innerHTML = `
    <tr class="vani-sup-totale-row vani-sup-totale-row--netto">
      <td colspan="7">Mq netto sede (base per gli strati)</td>
      <td class="vani-sup-calc vani-sup-totale-mq-netto">${escapeHtml(fmtDimSegno(mqNetto))}</td>
    </tr>`;
  table.appendChild(tfoot);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

/**
 * Pannello di una zona. Per la sede serve la scheda intera (aree automatiche).
 * @param {{ tipo: TipoZonaStrada, zona: object, datalistId: string, schedaCompleta?: object }} opts
 */
export function renderZonaStradaPanel({ tipo, zona, datalistId, schedaCompleta }) {
  const isSede = isZonaSedeStradale(tipo);
  const data = zona && typeof zona === "object" ? zona : (isSede ? emptyZonaSedeStradale(() => 0) : emptyZonaStrada(() => 0));
  const label = ZONA_LABELS[tipo] || tipo;
  const mqSede = isSede ? totaliSedeStradale(schedaCompleta).mqNetto : null;

  const block = document.createElement("div");
  block.className = "vani-sup-block strade-sup-block";
  block.dataset.tipoZona = tipo;

  const head = document.createElement("div");
  head.className = "vani-sup-head";
  head.innerHTML = `
    <div class="vani-sup-fields">
      <span class="vani-sup-title">${escapeHtml(label)}</span>
      <label class="vani-sup-field vani-sup-field--note"><span>Note</span>
        <input type="text" class="vani-sup-note" value="${escapeHtml(data.note || "")}" placeholder="Note" aria-label="Note ${escapeHtml(label)}" /></label>
    </div>`;

  const hint = document.createElement("p");
  hint.className = "vani-sup-hint";
  hint.textContent = isSede
    ? "Le aree si calcolano da sole: per ogni riferimento, Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti). I manufatti senza area non vengono sottratti. Cordoli e le schede impianti (Segnaletica, Fogna, Allacci fogna, Luci, Gas, Acqua, Telefonica) non entrano in questo calcolo. Qui puoi solo aggiungere strati. Il primo strato è già «SEDE STRADALE»."
    : isZonaManufatti(tipo)
      ? "Scegli il tipo, oppure aggiungine uno nuovo sotto la tabella. Ogni tipo diventa una voce nelle VOCI: lì scrivi la descrizione e il prezzo. Il campo N° pezzi è la quantità, a numero. Se compili anche una formula, quell’area × pezzi viene sottratta dalla Sede stradale."
      : isZonaCordoli(tipo)
        ? "Scegli il tipo di cordolo (Retto, Curvo, oppure aggiungine uno nuovo). Ogni tipo diventa una voce nelle VOCI: lì scrivi la descrizione e il prezzo. In Formula metti la lunghezza (es. 12,5 oppure 3+4,2): la quantità è in metri lineari (ml). I Cordoli non vengono sottratti dalla Sede stradale."
        : isZonaSegnaletica(tipo)
          ? "Scegli il tipo di segnaletica, oppure aggiungine uno nuovo. Ogni tipo diventa una voce nelle VOCI. In Formula metti la misura (es. 12,5). La larghezza puoi lasciarla vuota: la quantità resta quella della formula e l’unità la scegli in VOCI. Se scrivi la larghezza in metri, la quantità diventa mq (formula × larghezza). Non viene sottratta dalla Sede."
          : isZonaVarie(tipo)
            ? "Scegli il tipo (per ora Reinterro, oppure aggiungine uno nuovo). Ogni tipo diventa una voce nelle VOCI: lì scegli l’unità di misura e il prezzo. In Formula scrivi il calcolo (es. 12,5 oppure 2*3*0,4). Il risultato va in quella voce. Varie non entra nella Sede stradale."
            : isZonaFormulaUnitaVoce(tipo)
          ? "In Formula scrivi il calcolo (es. 2 oppure 1,2*3). Il moltiplicatore ripete quel risultato. L’unità di misura (n., ml., mq., a corpo…) la decide la Voce dello strato nelle VOCI. Questa scheda non viene sottratta dalla Sede stradale."
          : "In Formula puoi scrivere un’espressione (es. 12,5 * 3,2 oppure (10+2)/2). Il moltiplicatore (default 1) ripete quel risultato: 4, 1,5, 10… quello che ti serve. Il segno «sottrai» toglie quell’area da tutta la zona. Ogni strato parte da quel mq netto: puoi togliere altre aree solo da quello strato.";

  block.appendChild(head);
  block.appendChild(hint);
  if (isSede) {
    block.appendChild(renderAreeSedeTable(schedaCompleta));
    block.appendChild(
      renderStratiCards(tipo, data, datalistId, {
        mqBaseOverride: mqSede,
        nascondiSottrazioni: true,
      }),
    );
  } else {
    block.appendChild(renderAreeTable(tipo, data));
    if (!isZonaManufatti(tipo) && !isZonaCordoli(tipo) && !isZonaSegnaletica(tipo) && !isZonaVarie(tipo)) {
      block.appendChild(renderStratiCards(tipo, data, datalistId));
    }
  }
  return block;
}

export function syncZonaDaBlock(block, zona) {
  if (!(block instanceof HTMLElement) || !zona) return;
  const note = block.querySelector(".vani-sup-note");
  if (note instanceof HTMLInputElement) zona.note = note.value;

  if (!Array.isArray(zona.aree)) zona.aree = [];
  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = zona.aree.find((x) => x.id === aid);
    if (!area) return;
    const rif = row.querySelector(".vani-sup-area-rif");
    const formula = row.querySelector(".strade-area-formula");
    const mol = row.querySelector(".strade-area-moltiplicatore");
    const segno = row.querySelector(".vani-sup-area-segno");
    const tipoMan = row.querySelector(".strade-area-tipo-manufatto");
    const tipoCor = row.querySelector(".strade-area-tipo-cordolo");
    const tipoSeg = row.querySelector(".strade-area-tipo-segnaletica");
    const tipoVar = row.querySelector(".strade-area-tipo-varie");
    const lar = row.querySelector(".strade-area-larghezza");
    if (rif instanceof HTMLInputElement) area.riferimento = rif.value;
    if (formula instanceof HTMLInputElement) area.formula = formula.value;
    if (mol instanceof HTMLInputElement) area.moltiplicatore = mol.value;
    if (segno instanceof HTMLInputElement) area.segno = segno.checked;
    if (tipoMan instanceof HTMLSelectElement) area.tipoManufatto = normalizzaTipoManufatto(tipoMan.value);
    if (tipoCor instanceof HTMLSelectElement) area.tipoCordolo = normalizzaTipoCordolo(tipoCor.value);
    if (tipoSeg instanceof HTMLSelectElement) area.tipoSegnaletica = normalizzaTipoSegnaletica(tipoSeg.value);
    if (tipoVar instanceof HTMLSelectElement) area.tipoVarie = normalizzaTipoVarie(tipoVar.value);
    if (lar instanceof HTMLInputElement) area.larghezza = lar.value;
  });

  if (!Array.isArray(zona.strati)) zona.strati = [];
  block.querySelectorAll(".strade-strato-card").forEach((card) => {
    const sid = Number(card.dataset.stratoId);
    const st = zona.strati.find((x) => x.id === sid);
    if (!st) return;
    const voce = card.querySelector(".strade-strato-voce");
    const sp = card.querySelector(".strade-strato-spessore");
    if (voce instanceof HTMLInputElement) st.vocibreve = voce.value;
    if (sp instanceof HTMLInputElement) st.spessore = sp.value;
    if (!Array.isArray(st.sottrazioni)) st.sottrazioni = [];
    card.querySelectorAll(".strade-sott-row").forEach((row) => {
      const sottId = Number(row.dataset.sottId);
      const sott = st.sottrazioni.find((x) => x.id === sottId);
      if (!sott) return;
      const rif = row.querySelector(".strade-sott-rif");
      const formula = row.querySelector(".strade-sott-formula");
      const mol = row.querySelector(".strade-sott-moltiplicatore");
      if (rif instanceof HTMLInputElement) sott.riferimento = rif.value;
      if (formula instanceof HTMLInputElement) sott.formula = formula.value;
      if (mol instanceof HTMLInputElement) sott.moltiplicatore = mol.value;
    });
  });
}

export function aggiornaCalcoliZonaBlock(block, zona, mqBaseOverride) {
  if (!(block instanceof HTMLElement) || !zona) return;

  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = (zona.aree || []).find((x) => x.id === aid);
    if (!area) return;
    const mqInfo = testoMqRiga(area, area.segno === true);
    const tdMq = row.querySelector('[data-role="area-mq"]');
    if (tdMq) {
      tdMq.textContent = mqInfo.text;
      tdMq.classList.toggle("strade-area-mq-err", mqInfo.err);
      tdMq.title = mqInfo.err ? "Formula non valida. Usa numeri, + − * / e parentesi." : "";
    }
  });

  const t = totaliAreeZona(zona);
  const pos = block.querySelector(".vani-sup-totale-mq-pos");
  const neg = block.querySelector(".vani-sup-totale-mq-neg");
  const netto = block.querySelector(".vani-sup-totale-mq-netto");
  if (pos) pos.textContent = fmtDim(t.mqPos);
  if (neg) neg.textContent = fmtTotaleNegativo(t.mqNeg);
  if (netto) netto.textContent = fmtDim(t.mqNetto);

  block.querySelectorAll(".strade-strato-card").forEach((card) => {
    const sid = Number(card.dataset.stratoId);
    const st = (zona.strati || []).find((x) => x.id === sid);
    if (!st) return;

    card.querySelectorAll(".strade-sott-row").forEach((row) => {
      const sottId = Number(row.dataset.sottId);
      const sott = (st.sottrazioni || []).find((x) => x.id === sottId);
      if (!sott) return;
      const mqInfo = testoMqRiga(sott, true);
      const tdMq = row.querySelector('[data-role="sott-mq"]');
      if (tdMq) {
        tdMq.textContent = mqInfo.text;
        tdMq.classList.toggle("strade-area-mq-err", mqInfo.err);
        tdMq.title = mqInfo.err ? "Formula non valida. Usa numeri, + − * / e parentesi." : "";
      }
    });

    const mqSott = mqSottrazioniStrato(st);
    const mqNetto = mqNettoStrato(zona, st, mqBaseOverride);
    const sp = card.querySelector(".strade-strato-spessore")?.value ?? st.spessore ?? "";
    const hasSp = String(sp).trim() !== "";
    const calcolo = hasSp ? calcolaMcDaMqESpessore(mqNetto, sp) : mqNetto;
    const mqBase =
      typeof mqBaseOverride === "number" && Number.isFinite(mqBaseOverride)
        ? mqBaseOverride
        : t.mqNetto;

    const elBase = card.querySelector('[data-role="strato-mq-base"]');
    const elSott = card.querySelector('[data-role="strato-mq-sott"]');
    const elNetto = card.querySelector('[data-role="strato-mq-netto"]');
    const elCalc = card.querySelector('[data-role="strato-calcolo"]');
    if (elBase) elBase.textContent = fmtDim(mqBase);
    if (elSott) elSott.textContent = fmtTotaleNegativo(mqSott);
    if (elNetto) elNetto.textContent = fmtDim(mqNetto);
    if (elCalc) {
      elCalc.textContent = fmtDim(calcolo);
      elCalc.title = hasSp ? "Volume (mq netto × spessore)" : "Area (mq netto, senza spessore)";
    }
  });
}
