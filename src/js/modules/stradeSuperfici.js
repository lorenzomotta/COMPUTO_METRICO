/**
 * STRADE — zone di superficie, sede, poi impianti (segnaletica → acqua).
 * Le zone manuali hanno aree (formula × moltiplicatore, con «sottrai») e strati.
 * Cordoli, Fogna, Allacci fogna, Luci, Gas, Acqua, Telefonica, Varie:
 *   quantità = formula × pezzi; l’unità (ml., mq., mc.) si sceglie in VOCI.
 * Segnaletica: quantità = formula × larghezza × pezzi; unità scelta in VOCI.
 * Manufatti: quantità in VOCI = N° pezzi; la formula toglie mq dalla Sede.
 * Sede stradale: aree automatiche
 * Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti con area)
 * a parità di riferimento; si possono solo aggiungere strati.
 * Ordine schede: … Cordoli → Fogna → … → Telefonica → Segnaletica → Varie → Manufatti → Sede → Reinterro.
 * Manufatti e Reinterro sono in sola lettura: le righe arrivano dalle spunte nelle altre schede.
 */

/** @typedef {'ingombro'|'marciapiedi'|'aiuole'|'parcheggi'|'manufatti'|'cordoli'|'segnaletica'|'fogna'|'allacciFogna'|'lucePubblica'|'lucePrivata'|'gas'|'acqua'|'telefonica'|'varie'|'sedeStradale'|'reinterro'} TipoZonaStrada */

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
export const TIPO_REINTERRO = "reinterro";

/** Segnaletica: formula × larghezza × pezzi, fuori dal calcolo Sede. */
export const TIPI_ZONA_FORMULA_UNITA_VOCE = /** @type {const} */ ([TIPO_SEGNALETICA]);

/** Stessa tabella dei Manufatti, ma la quantità è formula × pezzi. Fuori dal calcolo Sede. */
export const TIPI_ZONA_COME_MANUFATTI = /** @type {const} */ ([
  TIPO_FOGNA,
  TIPO_ALLACCI_FOGNA,
  TIPO_LUCE_PUBBLICA,
  TIPO_LUCE_PRIVATA,
  TIPO_GAS,
  TIPO_ACQUA,
  TIPO_TELEFONICA,
]);

/** Ordine schede UI: superfici → impianti → Segnaletica → Varie → Manufatti → Sede → Reinterro. */
export const TIPI_ZONA_STRADA = /** @type {const} */ ([
  "ingombro",
  "marciapiedi",
  "aiuole",
  "parcheggi",
  "cordoli",
  ...TIPI_ZONA_COME_MANUFATTI,
  TIPO_SEGNALETICA,
  TIPO_VARIE,
  "manufatti",
  TIPO_SEDE_STRADALE,
  TIPO_REINTERRO,
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
  reinterro: "Reinterro",
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
  reinterro: "STRADA_REINTERRO",
};

export function isZonaSedeStradale(tipo) {
  return tipo === TIPO_SEDE_STRADALE;
}

export function isZonaReinterro(tipo) {
  return tipo === TIPO_REINTERRO;
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

/** Fogna, Allacci fogna, Luci, Gas, Acqua, Telefonica. */
export function isZonaComeManufatti(tipo) {
  return TIPI_ZONA_COME_MANUFATTI.includes(
    /** @type {typeof TIPI_ZONA_COME_MANUFATTI[number]} */ (tipo),
  );
}

/** Segnaletica. */
export function isZonaFormulaUnitaVoce(tipo) {
  return TIPI_ZONA_FORMULA_UNITA_VOCE.includes(
    /** @type {typeof TIPI_ZONA_FORMULA_UNITA_VOCE[number]} */ (tipo),
  );
}

/** Cordoli / impianti: non sottraggono mq dalla Sede; niente spessore → volume. */
export function isZonaEsclusaDaSede(tipo) {
  return (
    isZonaCordoli(tipo) ||
    isZonaFormulaUnitaVoce(tipo) ||
    isZonaVarie(tipo) ||
    isZonaComeManufatti(tipo)
  );
}

function chiaveTipoManufatto(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("it-IT");
}

function pulisciNomeTipo(raw) {
  return String(raw ?? "").trim().replace(/\s+/g, " ");
}

function metaTipiVuota() {
  return { nascosti: [], rinominati: {}, misure: {} };
}

function normalizzaMisureTipi(raw) {
  /** @type {Record<string, { dimensioni: string, altezza: string }>} */
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== "object") continue;
    const dimensioni = pulisciNomeTipo(v.dimensioni || "").slice(0, 80);
    const altezza = pulisciNomeTipo(v.altezza || "").slice(0, 40);
    if (dimensioni || altezza) out[k] = { dimensioni, altezza };
  }
  return out;
}

function loadMetaTipi(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return metaTipiVuota();
    const data = JSON.parse(raw);
    const nascosti = Array.isArray(data?.nascosti)
      ? data.nascosti.filter((x) => typeof x === "string")
      : [];
    /** @type {Record<string, string>} */
    const rinominati = {};
    if (data?.rinominati && typeof data.rinominati === "object") {
      for (const [k, v] of Object.entries(data.rinominati)) {
        const nome = pulisciNomeTipo(v);
        if (nome) rinominati[k] = nome;
      }
    }
    return { nascosti, rinominati, misure: normalizzaMisureTipi(data?.misure) };
  } catch {
    return metaTipiVuota();
  }
}

function saveMetaTipi(storageKey, meta) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function leggiJsonArray(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function scriviJson(key, value) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function loadListaConLegacy(key, legacyKey) {
  const attuale = leggiJsonArray(key);
  if (attuale != null) return attuale.map(pulisciNomeTipo).filter(Boolean);
  const legacy = legacyKey ? leggiJsonArray(legacyKey) : null;
  const nomi = (legacy || []).map(pulisciNomeTipo).filter(Boolean);
  if (nomi.length) scriviJson(key, nomi);
  return nomi;
}

function loadMetaConLegacy(key, legacyKey) {
  try {
    if (key && localStorage.getItem(key) == null && legacyKey && localStorage.getItem(legacyKey) != null) {
      const meta = loadMetaTipi(legacyKey);
      scriviJson(key, meta);
      return meta;
    }
  } catch {
    /* ignore */
  }
  return loadMetaTipi(key);
}

/**
 * Libreria (resta nel programma) + nomi solo di questo computo.
 * @param {readonly string[]} base
 * @param {{ libreriaExtra: string, libreriaMeta: string, localeExtra: string, localeMeta: string, legacyExtra?: string, legacyMeta?: string }} chiavi
 */
function creaCatalogoTipi(base, chiavi) {
  const libreriaExtra = chiavi.libreriaExtra;
  const libreriaMeta = chiavi.libreriaMeta;
  const localeExtra = chiavi.localeExtra;
  const localeMeta = chiavi.localeMeta;
  const legacyExtra = chiavi.legacyExtra || "";
  const legacyMeta = chiavi.legacyMeta || "";

  const libExtra = () => loadListaConLegacy(libreriaExtra, legacyExtra);
  const saveLibExtra = (nomi) => scriviJson(libreriaExtra, nomi);
  const locExtra = () => loadListaConLegacy(localeExtra, "");
  const saveLocExtra = (nomi) => scriviJson(localeExtra, nomi);
  const libMeta = () => loadMetaConLegacy(libreriaMeta, legacyMeta);
  const saveLibMeta = (meta) => scriviJson(libreriaMeta, meta);
  const locMeta = () => loadMetaTipi(localeMeta);
  const saveLocMeta = (meta) => scriviJson(localeMeta, meta);

  function pushUnico(out, seen, nome) {
    const n = pulisciNomeTipo(nome);
    const k = chiaveTipoManufatto(n);
    if (!n || seen.has(k)) return;
    seen.add(k);
    out.push(n);
  }

  function elenco() {
    const lib = libMeta();
    const loc = locMeta();
    const out = [];
    const seen = new Set();
    for (const b of base) {
      const bk = chiaveTipoManufatto(b);
      if (lib.nascosti.includes(bk) || loc.nascosti.includes(bk)) continue;
      pushUnico(out, seen, loc.rinominati[bk] || lib.rinominati[bk] || b);
    }
    for (const extra of libExtra()) {
      const k = chiaveTipoManufatto(extra);
      if (loc.nascosti.includes(k)) continue;
      pushUnico(out, seen, loc.rinominati[k] || extra);
    }
    for (const extra of locExtra()) pushUnico(out, seen, extra);
    return out;
  }

  function chiaveBaseLibreria(nome) {
    const key = chiaveTipoManufatto(nome);
    const meta = libMeta();
    const hit = base.find((b) => {
      const bk = chiaveTipoManufatto(b);
      if (meta.nascosti.includes(bk)) return false;
      return chiaveTipoManufatto(meta.rinominati[bk] || b) === key;
    });
    return hit ? chiaveTipoManufatto(hit) : "";
  }

  function trova(nome) {
    const key = chiaveTipoManufatto(nome);
    const loc = locMeta();
    for (const [k, v] of Object.entries(loc.rinominati)) {
      if (chiaveTipoManufatto(v) === key) return { kind: "overlay", chiave: k };
    }
    const baseKey = chiaveBaseLibreria(nome);
    if (baseKey) return { kind: "libreria", chiave: baseKey };
    const extra = libExtra().find((x) => chiaveTipoManufatto(x) === key);
    if (extra) return { kind: "libreria", chiave: chiaveTipoManufatto(extra) };
    const locale = locExtra().find((x) => chiaveTipoManufatto(x) === key);
    if (locale) return { kind: "locale", chiave: chiaveTipoManufatto(locale) };
    return null;
  }

  function inLibreria(nome) {
    const fonte = trova(nome);
    return fonte != null && fonte.kind !== "locale";
  }

  function eBase(chiave) {
    return base.some((b) => chiaveTipoManufatto(b) === chiave);
  }

  function controllaNuovo(raw, erroreVuoto) {
    const nome = pulisciNomeTipo(raw);
    if (!nome) return { ok: false, nome: "", errore: erroreVuoto, giaPresente: false };
    if (nome.length > 60) {
      return {
        ok: false,
        nome: "",
        errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).",
        giaPresente: false,
      };
    }
    const noto = elenco().find((x) => chiaveTipoManufatto(x) === chiaveTipoManufatto(nome));
    if (noto) return { ok: true, nome: noto, errore: "", giaPresente: true };
    return { ok: true, nome, errore: "", giaPresente: false };
  }

  function aggiungi(raw, erroreVuoto, inLibreriaFlag = false) {
    const check = controllaNuovo(raw, erroreVuoto);
    if (!check.ok || check.giaPresente) return check;
    if (inLibreriaFlag) {
      const extra = libExtra();
      extra.push(check.nome);
      saveLibExtra(extra);
    } else {
      const extra = locExtra();
      extra.push(check.nome);
      saveLocExtra(extra);
    }
    return { ok: true, nome: check.nome, errore: "", giaPresente: false };
  }

  function controllaRinomina(vecchio, nuovo, erroreVuoto) {
    const da = pulisciNomeTipo(vecchio);
    const a = pulisciNomeTipo(nuovo);
    if (!da) return { ok: false, nome: "", errore: "Scegli il tipo da modificare.", giaPresente: false, invariato: false };
    if (!a) return { ok: false, nome: "", errore: erroreVuoto, giaPresente: false, invariato: false };
    if (a.length > 60) {
      return {
        ok: false,
        nome: "",
        errore: "Il nome del tipo è troppo lungo (massimo 60 caratteri).",
        giaPresente: false,
        invariato: false,
      };
    }
    if (!trova(da)) {
      return { ok: false, nome: "", errore: "Questo tipo non c’è nell’elenco.", giaPresente: false, invariato: false };
    }
    if (chiaveTipoManufatto(da) === chiaveTipoManufatto(a)) {
      return { ok: true, nome: da, errore: "", giaPresente: false, invariato: true };
    }
    const occupato = elenco().find((x) => chiaveTipoManufatto(x) === chiaveTipoManufatto(a));
    if (occupato) {
      return {
        ok: false,
        nome: "",
        errore: `Il tipo «${occupato}» c’è già nell’elenco.`,
        giaPresente: true,
        invariato: false,
      };
    }
    return { ok: true, nome: a, errore: "", giaPresente: false, invariato: false };
  }

  function rinomina(vecchio, nuovo, erroreVuoto, inLibreriaFlag = false) {
    const check = controllaRinomina(vecchio, nuovo, erroreVuoto);
    if (!check.ok || check.invariato) return check;
    const fonte = trova(pulisciNomeTipo(vecchio));
    if (!fonte) {
      return { ok: false, nome: "", errore: "Questo tipo non c’è nell’elenco.", giaPresente: false, invariato: false };
    }
    const a = check.nome;
    if (inLibreriaFlag && fonte.kind === "locale") {
      saveLocExtra(locExtra().filter((x) => chiaveTipoManufatto(x) !== fonte.chiave));
      const extra = libExtra();
      extra.push(a);
      saveLibExtra(extra);
      const loc = locMeta();
      const lib = libMeta();
      spostaMisureTra(loc, fonte.chiave, lib, chiaveTipoManufatto(a));
      saveLocMeta(loc);
      saveLibMeta(lib);
    } else if (inLibreriaFlag && eBase(fonte.chiave)) {
      const meta = libMeta();
      meta.rinominati[fonte.chiave] = a;
      saveLibMeta(meta);
      const loc = locMeta();
      delete loc.rinominati[fonte.chiave];
      saveLocMeta(loc);
    } else if (inLibreriaFlag) {
      const extra = libExtra();
      const idx = extra.findIndex((x) => chiaveTipoManufatto(x) === fonte.chiave);
      if (idx >= 0) extra[idx] = a;
      else extra.push(a);
      saveLibExtra(extra);
      const loc = locMeta();
      delete loc.rinominati[fonte.chiave];
      saveLocMeta(loc);
      const lib = libMeta();
      spostaMisureTra(lib, fonte.chiave, lib, chiaveTipoManufatto(a));
      saveLibMeta(lib);
    } else if (fonte.kind === "locale") {
      const extra = locExtra();
      const idx = extra.findIndex((x) => chiaveTipoManufatto(x) === fonte.chiave);
      if (idx >= 0) extra[idx] = a;
      saveLocExtra(extra);
      const loc = locMeta();
      spostaMisureTra(loc, fonte.chiave, loc, chiaveTipoManufatto(a));
      saveLocMeta(loc);
    } else {
      const loc = locMeta();
      loc.rinominati[fonte.chiave] = a;
      saveLocMeta(loc);
    }
    return { ok: true, nome: a, errore: "", giaPresente: false, invariato: false };
  }

  function spostaMisureTra(metaDa, chiaveDa, metaA, chiaveA) {
    if (!metaDa.misure) metaDa.misure = {};
    if (!metaA.misure) metaA.misure = {};
    if (metaDa === metaA && chiaveDa === chiaveA) return;
    const dati = metaDa.misure[chiaveDa];
    if (!dati) return;
    metaA.misure[chiaveA] = dati;
    delete metaDa.misure[chiaveDa];
  }

  function togliMisure(meta, chiave) {
    if (meta?.misure) delete meta.misure[chiave];
  }

  function leggiMisure(nome) {
    const fonte = trova(nome);
    if (!fonte) return { dimensioni: "", altezza: "" };
    const meta = fonte.kind === "locale" ? locMeta() : libMeta();
    const m = meta.misure?.[fonte.chiave];
    return { dimensioni: m?.dimensioni || "", altezza: m?.altezza || "" };
  }

  function salvaMisure(nome, dati) {
    const fonte = trova(nome);
    if (!fonte) return { ok: false };
    const dimensioni = pulisciNomeTipo(dati?.dimensioni || "").slice(0, 80);
    const altezza = pulisciNomeTipo(dati?.altezza || "").slice(0, 40);
    const meta = fonte.kind === "locale" ? locMeta() : libMeta();
    if (!meta.misure) meta.misure = {};
    if (!dimensioni && !altezza) delete meta.misure[fonte.chiave];
    else meta.misure[fonte.chiave] = { dimensioni, altezza };
    if (fonte.kind === "locale") saveLocMeta(meta);
    else saveLibMeta(meta);
    return { ok: true };
  }

  function elimina(nome, inLibreriaFlag = false) {
    const da = pulisciNomeTipo(nome);
    if (!da) return { ok: false, errore: "Scegli il tipo da eliminare." };
    const fonte = trova(da);
    if (!fonte) return { ok: false, errore: "Questo tipo non c’è nell’elenco." };
    if (inLibreriaFlag && fonte.kind !== "locale") {
      if (eBase(fonte.chiave)) {
        const meta = libMeta();
        if (!meta.nascosti.includes(fonte.chiave)) meta.nascosti.push(fonte.chiave);
        delete meta.rinominati[fonte.chiave];
        togliMisure(meta, fonte.chiave);
        saveLibMeta(meta);
      } else {
        saveLibExtra(libExtra().filter((x) => chiaveTipoManufatto(x) !== fonte.chiave));
        const meta = libMeta();
        togliMisure(meta, fonte.chiave);
        saveLibMeta(meta);
      }
      const loc = locMeta();
      delete loc.rinominati[fonte.chiave];
      loc.nascosti = loc.nascosti.filter((k) => k !== fonte.chiave);
      togliMisure(loc, fonte.chiave);
      saveLocMeta(loc);
      return { ok: true, errore: "" };
    }
    if (fonte.kind === "locale") {
      saveLocExtra(locExtra().filter((x) => chiaveTipoManufatto(x) !== fonte.chiave));
      const loc = locMeta();
      togliMisure(loc, fonte.chiave);
      saveLocMeta(loc);
      return { ok: true, errore: "" };
    }
    const loc = locMeta();
    if (!loc.nascosti.includes(fonte.chiave)) loc.nascosti.push(fonte.chiave);
    delete loc.rinominati[fonte.chiave];
    saveLocMeta(loc);
    return { ok: true, errore: "" };
  }

  elenco();
  return { elenco, aggiungi, rinomina, elimina, inLibreria, controllaNuovo, controllaRinomina, leggiMisure, salvaMisure };
}

const catalogoManufatto = creaCatalogoTipi(TIPI_MANUFATTO_BASE, {
  libreriaExtra: "lp_libreria_strade_manufatto",
  libreriaMeta: "lp_libreria_strade_manufatto_meta",
  localeExtra: "computo_metrico_strade_tipi_locale_manufatto",
  localeMeta: "computo_metrico_strade_tipi_locale_manufatto_meta",
  legacyExtra: STORAGE_TIPI_MANUFATTO_EXTRA,
  legacyMeta: "computo_metrico_strade_tipi_manufatto_meta",
});

/** Tipi di libreria più quelli usati solo in questo computo. */
export function elencoTipiManufatto() {
  return catalogoManufatto.elenco();
}

/** @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }} */
export function controllaNuovoTipoManufatto(raw) {
  return catalogoManufatto.controllaNuovo(raw, "Scrivi il nome del nuovo tipo.");
}

/**
 * @param {string} raw
 * @param {boolean} [inLibreria]
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function aggiungiTipoManufatto(raw, inLibreria = false) {
  return catalogoManufatto.aggiungi(raw, "Scrivi il nome del nuovo tipo.", inLibreria);
}

/** @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean, invariato: boolean }} */
export function controllaRinominaTipoManufatto(vecchio, nuovo) {
  return catalogoManufatto.controllaRinomina(vecchio, nuovo, "Scrivi la nuova dicitura.");
}

/**
 * @param {boolean} [inLibreria]
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean, invariato: boolean }}
 */
export function rinominaTipoManufatto(vecchio, nuovo, inLibreria = false) {
  return catalogoManufatto.rinomina(vecchio, nuovo, "Scrivi la nuova dicitura.", inLibreria);
}

/**
 * @param {boolean} [inLibreria]
 * @returns {{ ok: boolean, errore: string }}
 */
export function eliminaTipoManufatto(nome, inLibreria = false) {
  return catalogoManufatto.elimina(nome, inLibreria);
}

export function tipoManufattoInLibreria(nome) {
  return catalogoManufatto.inLibreria(nome);
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

const catalogoCordolo = creaCatalogoTipi(TIPI_CORDOLO_BASE, {
  libreriaExtra: "lp_libreria_strade_cordolo",
  libreriaMeta: "lp_libreria_strade_cordolo_meta",
  localeExtra: "computo_metrico_strade_tipi_locale_cordolo",
  localeMeta: "computo_metrico_strade_tipi_locale_cordolo_meta",
  legacyExtra: STORAGE_TIPI_CORDOLO_EXTRA,
  legacyMeta: "computo_metrico_strade_tipi_cordolo_meta",
});

/** Retto, Curvo, più i tipi aggiunti dall’utente. */
export function elencoTipiCordolo() {
  return catalogoCordolo.elenco();
}

/**
 * Aggiunge un tipo di cordolo all’elenco (se non c’è già).
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function controllaNuovoTipoCordolo(raw) {
  return catalogoCordolo.controllaNuovo(raw, "Scrivi il nome del nuovo tipo di cordolo.");
}

export function aggiungiTipoCordolo(raw, inLibreria = false) {
  return catalogoCordolo.aggiungi(raw, "Scrivi il nome del nuovo tipo di cordolo.", inLibreria);
}

export function controllaRinominaTipoCordolo(vecchio, nuovo) {
  return catalogoCordolo.controllaRinomina(vecchio, nuovo, "Scrivi la nuova dicitura.");
}

export function rinominaTipoCordolo(vecchio, nuovo, inLibreria = false) {
  return catalogoCordolo.rinomina(vecchio, nuovo, "Scrivi la nuova dicitura.", inLibreria);
}

export function eliminaTipoCordolo(nome, inLibreria = false) {
  return catalogoCordolo.elimina(nome, inLibreria);
}

export function tipoCordoloInLibreria(nome) {
  return catalogoCordolo.inLibreria(nome);
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

const catalogoSegnaletica = creaCatalogoTipi(TIPI_SEGNALETICA_BASE, {
  libreriaExtra: "lp_libreria_strade_segnaletica",
  libreriaMeta: "lp_libreria_strade_segnaletica_meta",
  localeExtra: "computo_metrico_strade_tipi_locale_segnaletica",
  localeMeta: "computo_metrico_strade_tipi_locale_segnaletica_meta",
  legacyExtra: STORAGE_TIPI_SEGNALETICA_EXTRA,
  legacyMeta: "computo_metrico_strade_tipi_segnaletica_meta",
});

export function elencoTipiSegnaletica() {
  return catalogoSegnaletica.elenco();
}

/**
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function controllaNuovoTipoSegnaletica(raw) {
  return catalogoSegnaletica.controllaNuovo(raw, "Scrivi il nome del nuovo tipo di segnaletica.");
}

export function aggiungiTipoSegnaletica(raw, inLibreria = false) {
  return catalogoSegnaletica.aggiungi(raw, "Scrivi il nome del nuovo tipo di segnaletica.", inLibreria);
}

export function controllaRinominaTipoSegnaletica(vecchio, nuovo) {
  return catalogoSegnaletica.controllaRinomina(vecchio, nuovo, "Scrivi la nuova dicitura.");
}

export function rinominaTipoSegnaletica(vecchio, nuovo, inLibreria = false) {
  return catalogoSegnaletica.rinomina(vecchio, nuovo, "Scrivi la nuova dicitura.", inLibreria);
}

export function eliminaTipoSegnaletica(nome, inLibreria = false) {
  return catalogoSegnaletica.elimina(nome, inLibreria);
}

export function tipoSegnaleticaInLibreria(nome) {
  return catalogoSegnaletica.inLibreria(nome);
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

const catalogoVarie = creaCatalogoTipi(TIPI_VARIE_BASE, {
  libreriaExtra: "lp_libreria_strade_varie",
  libreriaMeta: "lp_libreria_strade_varie_meta",
  localeExtra: "computo_metrico_strade_tipi_locale_varie",
  localeMeta: "computo_metrico_strade_tipi_locale_varie_meta",
  legacyExtra: STORAGE_TIPI_VARIE_EXTRA,
  legacyMeta: "computo_metrico_strade_tipi_varie_meta",
});

export function elencoTipiVarie() {
  return catalogoVarie.elenco();
}

/**
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
export function controllaNuovoTipoVarie(raw) {
  return catalogoVarie.controllaNuovo(raw, "Scrivi il nome del nuovo tipo.");
}

export function aggiungiTipoVarie(raw, inLibreria = false) {
  return catalogoVarie.aggiungi(raw, "Scrivi il nome del nuovo tipo.", inLibreria);
}

export function controllaRinominaTipoVarie(vecchio, nuovo) {
  return catalogoVarie.controllaRinomina(vecchio, nuovo, "Scrivi la nuova dicitura.");
}

export function rinominaTipoVarie(vecchio, nuovo, inLibreria = false) {
  return catalogoVarie.rinomina(vecchio, nuovo, "Scrivi la nuova dicitura.", inLibreria);
}

export function eliminaTipoVarie(nome, inLibreria = false) {
  return catalogoVarie.elimina(nome, inLibreria);
}

export function tipoVarieInLibreria(nome) {
  return catalogoVarie.inLibreria(nome);
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

const STORAGE_TIPI_IMPIANTO = {
  fogna: "computo_metrico_strade_tipi_fogna",
  allacciFogna: "computo_metrico_strade_tipi_allacci_fogna",
  lucePubblica: "computo_metrico_strade_tipi_luce_pubblica",
  lucePrivata: "computo_metrico_strade_tipi_luce_privata",
  gas: "computo_metrico_strade_tipi_gas",
  acqua: "computo_metrico_strade_tipi_acqua",
  telefonica: "computo_metrico_strade_tipi_telefonica",
};

function storageTipiImpianto(tipo) {
  return STORAGE_TIPI_IMPIANTO[tipo] || "";
}

function catalogoImpianto(tipo) {
  const legacy = storageTipiImpianto(tipo);
  const id = String(tipo || "");
  return creaCatalogoTipi([], {
    libreriaExtra: `lp_libreria_strade_${id}`,
    libreriaMeta: `lp_libreria_strade_${id}_meta`,
    localeExtra: `computo_metrico_strade_tipi_locale_${id}`,
    localeMeta: `computo_metrico_strade_tipi_locale_${id}_meta`,
    legacyExtra: legacy,
    legacyMeta: legacy ? `${legacy}_meta` : "",
  });
}

for (const tipoImpianto of Object.keys(STORAGE_TIPI_IMPIANTO)) {
  catalogoImpianto(tipoImpianto).elenco();
}

export function elencoTipiImpianto(tipo) {
  if (!isZonaComeManufatti(tipo)) return [];
  return catalogoImpianto(tipo).elenco();
}

/**
 * @returns {{ ok: boolean, nome: string, errore: string, giaPresente: boolean }}
 */
function erroreImpianto(tipo) {
  return !isZonaComeManufatti(tipo);
}

export function controllaNuovoTipoImpianto(tipo, raw) {
  const etichetta = ZONA_LABELS[tipo] || "questa scheda";
  if (erroreImpianto(tipo)) {
    return { ok: false, nome: "", errore: "Questo tipo non si aggiunge in questa scheda.", giaPresente: false };
  }
  return catalogoImpianto(tipo).controllaNuovo(raw, `Scrivi il nome del nuovo tipo di ${etichetta}.`);
}

export function aggiungiTipoImpianto(tipo, raw, inLibreria = false) {
  const etichetta = ZONA_LABELS[tipo] || "questa scheda";
  if (erroreImpianto(tipo)) {
    return { ok: false, nome: "", errore: "Questo tipo non si aggiunge in questa scheda.", giaPresente: false };
  }
  return catalogoImpianto(tipo).aggiungi(raw, `Scrivi il nome del nuovo tipo di ${etichetta}.`, inLibreria);
}

export function controllaRinominaTipoImpianto(tipo, vecchio, nuovo) {
  const etichetta = ZONA_LABELS[tipo] || "questa scheda";
  if (erroreImpianto(tipo)) {
    return {
      ok: false,
      nome: "",
      errore: "Questo tipo non si modifica in questa scheda.",
      giaPresente: false,
      invariato: false,
    };
  }
  return catalogoImpianto(tipo).controllaRinomina(vecchio, nuovo, `Scrivi la nuova dicitura di ${etichetta}.`);
}

export function rinominaTipoImpianto(tipo, vecchio, nuovo, inLibreria = false) {
  const etichetta = ZONA_LABELS[tipo] || "questa scheda";
  if (erroreImpianto(tipo)) {
    return {
      ok: false,
      nome: "",
      errore: "Questo tipo non si modifica in questa scheda.",
      giaPresente: false,
      invariato: false,
    };
  }
  return catalogoImpianto(tipo).rinomina(vecchio, nuovo, `Scrivi la nuova dicitura di ${etichetta}.`, inLibreria);
}

export function eliminaTipoImpianto(tipo, nome, inLibreria = false) {
  if (erroreImpianto(tipo)) {
    return { ok: false, errore: "Questo tipo non si elimina in questa scheda." };
  }
  return catalogoImpianto(tipo).elimina(nome, inLibreria);
}

export function tipoImpiantoInLibreria(tipo, nome) {
  if (erroreImpianto(tipo)) return false;
  return catalogoImpianto(tipo).inLibreria(nome);
}

function catalogoTipiZona(tipoZona) {
  if (isZonaManufatti(tipoZona)) return catalogoManufatto;
  if (isZonaCordoli(tipoZona)) return catalogoCordolo;
  if (isZonaSegnaletica(tipoZona)) return catalogoSegnaletica;
  if (isZonaVarie(tipoZona)) return catalogoVarie;
  if (isZonaComeManufatti(tipoZona)) return catalogoImpianto(tipoZona);
  return null;
}

/** Se il tipo è in libreria, Dimensioni e Spessore salvati. Altrimenti null. */
export function misureTipoDaLibreria(tipoZona, nome) {
  const nomePulito = String(nome ?? "").trim();
  if (!nomePulito) return null;
  const cat = catalogoTipiZona(tipoZona);
  if (!cat || !cat.inLibreria(nomePulito)) return null;
  const m = cat.leggiMisure(nomePulito);
  return {
    dimensioni: String(m?.dimensioni || "").trim(),
    spessore: String(m?.altezza || "").trim(),
  };
}

/** Se il tipo è in libreria, restituisce il testo di Dimensioni. Altrimenti stringa vuota. */
export function dimensioniFormulaDaLibreria(tipoZona, nome) {
  return misureTipoDaLibreria(tipoZona, nome)?.dimensioni || "";
}

export function normalizzaTipoImpianto(tipo, raw) {
  const nome = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!nome || !isZonaComeManufatti(tipo)) return "";
  const key = chiaveTipoManufatto(nome);
  const noto = elencoTipiImpianto(tipo).find((x) => chiaveTipoManufatto(x) === key);
  if (noto) return noto;
  const aggiunto = aggiungiTipoImpianto(tipo, nome);
  return aggiunto.ok ? aggiunto.nome : "";
}

/** Larghezza vuota = non si moltiplica. Se c’è un numero, la quantità è formula × larghezza × pezzi. */
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

/** Come evalFormulaArea, e accetta anche la «x» al posto del per. Esempio: 0,40 x 0,40. */
function evalFormulaDimensioni(raw) {
  const txt = String(raw ?? "").trim().replaceAll("x", "*").replaceAll("X", "*");
  return evalFormulaArea(txt);
}

function parseAltezzaTipo(raw) {
  const txt = String(raw ?? "").trim();
  if (!txt) return { vuota: true, valore: null, valida: true };
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { vuota: false, valore: null, valida: false };
  return { vuota: false, valore: Number(n.toFixed(3)), valida: true };
}

function calcolaAreaVolumeTipo(dimensioni, altezza) {
  const testo = String(dimensioni ?? "").trim();
  const area = testo ? evalFormulaDimensioni(testo) : null;
  const h = parseAltezzaTipo(altezza);
  const volume = area != null && !h.vuota && h.valida ? Number((area * h.valore).toFixed(3)) : null;
  return { area, volume, formulaErrata: testo !== "" && area == null, altezzaErrata: !h.valida };
}

/** Valuta una formula come in MISURE VARIE: numeri, + − * /, parentesi. */
export function evalFormulaArea(raw) {
  const txt = String(raw ?? "").trim();
  if (!txt) return null;
  const normalized = txt
    .replaceAll(",", ".")
    .replaceAll("×", "*")
    .replaceAll("x", "*")
    .replaceAll("X", "*")
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

function testoDimensioniArea(area) {
  return pulisciNomeTipo(area?.dimensioni || "").slice(0, 80);
}

function testoSpessoreArea(area) {
  return pulisciNomeTipo(area?.spessore || "").slice(0, 40);
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

/** Nome lungo, come la voce breve: «Pozzetto ispezione (Fogna)». */
function etichettaTipoEstesa(tipoZona, nomeTipo) {
  const nome = String(nomeTipo ?? "").trim().replace(/\s+/g, " ");
  if (!nome) return "";
  const sezione = ZONA_LABELS[tipoZona] || tipoZona;
  return `${nome} (${sezione})`;
}

const ZONE_SPUNTA_MANUFATTI = ["fogna", "allacciFogna", "lucePubblica", "lucePrivata", "gas", "acqua", "telefonica", "varie"];

function nomeTipoPerSpuntaManufatti(tipo, area) {
  if (isZonaVarie(tipo)) return normalizzaTipoVarie(area?.tipoVarie);
  if (isZonaComeManufatti(tipo)) return normalizzaTipoImpianto(tipo, area?.tipoImpianto);
  return "";
}

/** Righe di Fogna, impianti e Varie con la spunta Manufatti. Non sono salvate nella scheda Manufatti. */
export function areeManufattiDaSpunta(scheda) {
  const out = [];
  for (const tipo of ZONE_SPUNTA_MANUFATTI) {
    for (const area of scheda?.[tipo]?.aree || []) {
      if (area?.inManufatti !== true) continue;
      const nome = nomeTipoPerSpuntaManufatti(tipo, area);
      if (!nome) continue;
      out.push({
        id: `der-${tipo}-${area.id}`,
        derivata: true,
        origineTipo: tipo,
        origineId: area.id,
        n: out.length + 1,
        riferimento: typeof area.riferimento === "string" ? area.riferimento : "",
        formula: formulaArea(area),
        moltiplicatore: testoMoltiplicatore(area.moltiplicatore),
        segno: area.segno === true,
        tipoManufatto: etichettaTipoEstesa(tipo, nome),
      });
    }
  }
  return out;
}

/** Righe di Fogna, impianti e Varie con la spunta Reinterro. Non sono salvate in una scheda a parte. */
export function areeReinterroDaSpunta(scheda) {
  const out = [];
  for (const tipo of ZONE_SPUNTA_MANUFATTI) {
    for (const area of scheda?.[tipo]?.aree || []) {
      if (area?.inReinterro !== true) continue;
      const nome = nomeTipoPerSpuntaManufatti(tipo, area);
      if (!nome) continue;
      out.push({
        id: `der-rei-${tipo}-${area.id}`,
        derivata: true,
        origineTipo: tipo,
        origineId: area.id,
        n: out.length + 1,
        riferimento: typeof area.riferimento === "string" ? area.riferimento : "",
        formula: formulaArea(area),
        moltiplicatore: testoMoltiplicatore(area.moltiplicatore),
        segno: area.segno === true,
        tipoReinterro: etichettaTipoEstesa(tipo, nome),
        dimensioni: testoDimensioniArea(area),
        spessore: testoSpessoreArea(area),
      });
    }
  }
  return out;
}

function areaManufattoVuota(area) {
  return (
    !String(area?.tipoManufatto ?? "").trim() &&
    !String(area?.formula ?? "").trim() &&
    !String(area?.riferimento ?? "").trim()
  );
}

function mqManufattiPerRiferimento(scheda, rifKey) {
  let tot = mqNettoZonaPerRiferimento(scheda?.manufatti, rifKey);
  for (const area of areeManufattiDaSpunta(scheda)) {
    if (chiaveRiferimento(area.riferimento) !== rifKey) continue;
    const mq = mqDiArea(area);
    tot += area.segno === true ? -mq : mq;
  }
  return Number(tot.toFixed(3));
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
  for (const a of areeManufattiDaSpunta(scheda)) {
    const key = chiaveRiferimento(a.riferimento);
    const label = String(a.riferimento ?? "").trim();
    if (!labels.has(key)) labels.set(key, label);
  }
  let n = 1;
  const rows = [];
  for (const [key, riferimento] of labels) {
    const mqIngombro = mqNettoZonaPerRiferimento(scheda?.ingombro, key);
    const mqMarciapiedi = mqNettoZonaPerRiferimento(scheda?.marciapiedi, key);
    const mqAiuole = mqNettoZonaPerRiferimento(scheda?.aiuole, key);
    const mqParcheggi = mqNettoZonaPerRiferimento(scheda?.parcheggi, key);
    const mqManufatti = mqManufattiPerRiferimento(scheda, key);
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
    tipoImpianto: "",
    larghezza: "",
    dimensioni: "",
    spessore: "",
    inManufatti: false,
    inReinterro: false,
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
    tipoImpianto: typeof src.tipoImpianto === "string" ? src.tipoImpianto.trim().replace(/\s+/g, " ") : "",
    larghezza: typeof src.larghezza === "string" ? src.larghezza : src.larghezza != null ? String(src.larghezza) : "",
    dimensioni: testoDimensioniArea(src),
    spessore: testoSpessoreArea(src),
    inManufatti: src.inManufatti === true,
    inReinterro: src.inReinterro === true,
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

function sanificaArea(row, nextId, n, tipoZona) {
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
    tipoImpianto: normalizzaTipoImpianto(tipoZona, src.tipoImpianto),
    larghezza: typeof src.larghezza === "string" ? src.larghezza : src.larghezza != null ? String(src.larghezza) : "",
    dimensioni: testoDimensioniArea(src),
    spessore: testoSpessoreArea(src),
    inManufatti: src.inManufatti === true,
    inReinterro: src.inReinterro === true,
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

export function sanificaZonaStrada(raw, nextId, tipoZona) {
  const base = emptyZonaStrada(nextId);
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  base.note = typeof src.note === "string" ? src.note : "";

  const areeSrc = Array.isArray(src.aree) ? src.aree.filter((x) => x && typeof x === "object") : [];
  base.aree =
    areeSrc.length === 0
      ? [emptyAreaStrada(nextId, 1)]
      : areeSrc.map((a, i) => sanificaArea(a, nextId, i + 1, tipoZona));

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
    out[tipo] = sanificaZonaStrada(src[tipo], nextId, tipo);
  }
  out.sedeStradale = sanificaZonaSedeStradale(src.sedeStradale, nextId);
  return out;
}

export function cloneZonaPerSnapshot(zona, tipoZona) {
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
      tipoImpianto: normalizzaTipoImpianto(tipoZona, a?.tipoImpianto),
      larghezza: typeof a?.larghezza === "string" ? a.larghezza : a?.larghezza != null ? String(a.larghezza) : "",
      dimensioni: testoDimensioniArea(a),
      spessore: testoSpessoreArea(a),
      inManufatti: a?.inManufatti === true,
      inReinterro: a?.inReinterro === true,
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
    out[tipo] = cloneZonaPerSnapshot(scheda?.[tipo], tipo);
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
  if (isZonaReinterro(tipo)) return false;
  const aree = Array.isArray(zona?.aree) ? zona.aree : [];
  if (isZonaManufatti(tipo)) {
    return aree.some(
      (a) =>
        Boolean(String(a?.formula ?? "").trim()) ||
        Boolean(String(a?.tipoManufatto ?? "").trim()),
    );
  }
  if (isZonaComeManufatti(tipo)) {
    return aree.some(
      (a) =>
        Boolean(String(a?.formula ?? "").trim()) ||
        Boolean(String(a?.tipoImpianto ?? "").trim()),
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

export function zonaImpiantoHaTipo(tipo, zona) {
  return (zona?.aree || []).some((a) => Boolean(normalizzaTipoImpianto(tipo, a?.tipoImpianto)));
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
    if (isZonaComeManufatti(tipo)) {
      if (zonaImpiantoHaTipo(tipo, zona)) return true;
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
    if (isZonaReinterro(tipo)) continue;
    const zona = schedaCompleta[tipo];
    if (!zonaHaMisuraCompilata(tipo, zona, schedaCompleta)) continue;
    if (isZonaManufatti(tipo)) {
      if (!zonaManufattiHaTipo(zona)) out.push("Manufatti (scegli il tipo)");
      continue;
    }
    if (isZonaComeManufatti(tipo)) {
      if (!zonaImpiantoHaTipo(tipo, zona)) out.push(`${ZONA_LABELS[tipo] || tipo} (scegli il tipo)`);
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

/** Alza il riquadro della formula quando il testo va a capo o su più righe. */
function adattaAltezzaFormula(el) {
  if (!(el instanceof HTMLTextAreaElement)) return;
  el.style.height = "auto";
  const max = 160;
  const next = Math.min(el.scrollHeight, max);
  el.style.height = `${Math.max(next, 28)}px`;
}

function appendFormulaEMoltiplicatore(
  tr,
  item,
  classPrefix,
  ariaBase,
  { pezzi = false, lineare = false, primaMoltiplicatore = null, multilinea = false, sottraeSede = true } = {},
) {
  const tdF = document.createElement("td");
  tdF.className = "strade-formula-cell";
  const inpF = multilinea ? document.createElement("textarea") : document.createElement("input");
  if (inpF instanceof HTMLTextAreaElement) inpF.rows = 1;
  else inpF.type = "text";
  inpF.className = `${classPrefix}-formula`;
  inpF.placeholder = pezzi
    ? sottraeSede
      ? "opz. area 1 pezzo"
      : "es. 12,5 oppure 2*3"
    : lineare
      ? "es. 12,5"
      : "es. 12,5 * 3,2";
  inpF.setAttribute(
    "aria-label",
    pezzi && sottraeSede ? `Formula area di un pezzo ${ariaBase}` : `Formula ${ariaBase}`,
  );
  inpF.autocomplete = "off";
  inpF.spellcheck = false;
  inpF.value = formulaArea(item);
  if (inpF instanceof HTMLTextAreaElement) {
    inpF.addEventListener("input", () => adattaAltezzaFormula(inpF));
    queueMicrotask(() => adattaAltezzaFormula(inpF));
  }
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
    ? sottraeSede
      ? "Quanti pezzi contare nelle VOCI (vuoto = 1). Se c’è una formula, quell’area × pezzi si toglie dalla Sede."
      : "Moltiplica il risultato della formula (vuoto = 1). In VOCI la quantità è formula × pezzi."
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

function appendTipoManufattoTesto(tr, testo, origineTipo) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-area-tipo-manufatto-testo";
  inp.readOnly = true;
  inp.value = testo || "";
  const da = ZONA_LABELS[origineTipo] || "un'altra scheda";
  inp.title = `Arriva da ${da}. È lo stesso nome che va in VOCI.`;
  inp.setAttribute("aria-label", "Tipo manufatto");
  td.appendChild(inp);
  tr.appendChild(td);
}

function appendSpuntaManufatti(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-spunta-cell";
  const lbl = document.createElement("label");
  lbl.className = "strade-spunta-manufatti";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.className = "strade-area-in-manufatti";
  chk.checked = area?.inManufatti === true;
  chk.setAttribute("aria-label", "Copia questa riga in Manufatti");
  lbl.title = "Se la spunti, la riga compare in Manufatti con il nome della voce, la stessa formula e gli stessi pezzi.";
  lbl.append(chk, document.createTextNode(" Manufatti"));
  td.appendChild(lbl);
  tr.appendChild(td);
}

function appendSpuntaReinterro(tr, area) {
  const td = document.createElement("td");
  td.className = "strade-spunta-cell";
  const lbl = document.createElement("label");
  lbl.className = "strade-spunta-reinterro";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.className = "strade-area-in-reinterro";
  chk.checked = area?.inReinterro === true;
  chk.setAttribute("aria-label", "Copia questa riga in Reinterro");
  lbl.title = "Se la spunti, la riga compare in Reinterro con il nome della voce, Dimensioni, Spessore, la stessa formula e gli stessi pezzi.";
  lbl.append(chk, document.createTextNode(" Reinterro"));
  td.appendChild(lbl);
  tr.appendChild(td);
}

function appendDimensioniSpessore(tr, area) {
  const tdD = document.createElement("td");
  const dim = document.createElement("input");
  dim.type = "text";
  dim.className = "strade-area-dimensioni";
  dim.placeholder = "0,40 x 0,40";
  dim.setAttribute("aria-label", "Dimensioni");
  dim.autocomplete = "off";
  dim.value = testoDimensioniArea(area);
  tdD.appendChild(dim);
  tr.appendChild(tdD);

  const tdS = document.createElement("td");
  const spe = document.createElement("input");
  spe.type = "text";
  spe.className = "strade-area-spessore";
  spe.placeholder = "es. 0,10";
  spe.setAttribute("aria-label", "Spessore");
  spe.autocomplete = "off";
  spe.value = testoSpessoreArea(area);
  tdS.appendChild(spe);
  tr.appendChild(tdS);
}

function appendTipoReinterroTesto(tr, testo, origineTipo) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-area-tipo-reinterro-testo";
  inp.readOnly = true;
  inp.value = testo || "";
  const da = ZONA_LABELS[origineTipo] || "un'altra scheda";
  inp.title = `Arriva da ${da}. È lo stesso nome che va in VOCI.`;
  inp.setAttribute("aria-label", "Tipo reinterro");
  td.appendChild(inp);
  tr.appendChild(td);
}

function bloccaRigaManufattoDerivata(tr, origineTipo, vaiOrigine) {
  const da = ZONA_LABELS[origineTipo] || "un'altra scheda";
  for (const el of tr.querySelectorAll("input, textarea, select")) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.readOnly = true;
    if (el instanceof HTMLInputElement && el.type === "checkbox") el.disabled = true;
    if (el instanceof HTMLSelectElement) el.disabled = true;
  }
  const act = tr.querySelector(".strade-area-act");
  if (!act) return;
  act.replaceChildren();
  if (vaiOrigine && origineTipo) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-action btn-secondary vani-btn-micro strade-btn-vai-origine";
    btn.dataset.action = "vai-origine-riga";
    btn.dataset.scheda = origineTipo;
    btn.dataset.areaId = String(vaiOrigine.origineId ?? "");
    btn.title = `Apri la riga in ${da}, dove puoi modificarla.`;
    btn.setAttribute("aria-label", `Apri la riga in ${da}`);
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
    act.appendChild(btn);
    return;
  }
  const nota = document.createElement("span");
  nota.className = "strade-riga-origine";
  nota.textContent = da;
  nota.title = `Riga copiata da ${da}. Per cambiarla, modifica quella scheda.`;
  act.appendChild(nota);
}

function totaliAreeConDerivate(zona, extra) {
  const base = totaliAreeZona(zona);
  let mqPos = base.mqPos;
  let mqNeg = base.mqNeg;
  for (const area of extra || []) {
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

function appendTipoImpianto(tr, area, tipo) {
  const td = document.createElement("td");
  td.className = "strade-tipo-cell";
  const sel = document.createElement("select");
  sel.className = "strade-area-tipo-impianto";
  const etichetta = ZONA_LABELS[tipo] || "impianto";
  sel.setAttribute("aria-label", `Tipo ${etichetta}`);
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— scegli —";
  sel.appendChild(empty);
  for (const t of elencoTipiImpianto(tipo)) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  }
  sel.value = normalizzaTipoImpianto(tipo, area?.tipoImpianto);
  td.appendChild(sel);
  tr.appendChild(td);
}

function renderAreeTable(tipo, zona, schedaCompleta) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";
  const isManufatti = isZonaManufatti(tipo);
  const isReinterro = isZonaReinterro(tipo);
  const isImpianto = isZonaComeManufatti(tipo);
  const comeManufatti = isManufatti || isImpianto || isReinterro;
  const isCordoli = isZonaCordoli(tipo);
  const isSegnaletica = isZonaSegnaletica(tipo);
  const isVarie = isZonaVarie(tipo);
  const conSpuntaManufatti = isImpianto || isVarie;
  const conDimensioni = isImpianto || isVarie || isReinterro;
  const colDimensioni = `<col class="strade-col-dimensioni"><col class="strade-col-spessore">`;
  const thDimensioni = `<th>Dimensioni</th><th>Spessore</th>`;
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipo) && !isSegnaletica;
  const unitaCol = isCordoli ? "Ml" : isFormulaUnitaVoce || isVarie ? "Ris." : "Mq";
  const titoloSezione = isCordoli ? "Lunghezze" : isFormulaUnitaVoce || isVarie ? "Calcoli" : "Aree";
  const etichettaTipo = ZONA_LABELS[tipo] || tipo;

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">${titoloSezione}</span>`;
  wrap.appendChild(head);

  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = comeManufatti
    ? `vani-sup-aree-table strade-aree-table--${isReinterro ? "reinterro" : isImpianto ? "impianto" : "manufatti"}`
    : isCordoli
      ? "vani-sup-aree-table strade-aree-table--cordoli"
      : isSegnaletica
        ? "vani-sup-aree-table strade-aree-table--segnaletica"
        : isVarie
          ? "vani-sup-aree-table strade-aree-table--varie"
          : "vani-sup-aree-table";
  const conTipo = comeManufatti || isCordoli || isSegnaletica || isVarie;
  table.innerHTML = comeManufatti
    ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    ${isImpianto ? `<col class="strade-col-spunta"><col class="strade-col-spunta">` : ""}
    ${isImpianto || isReinterro ? colDimensioni : ""}
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    ${isManufatti ? "" : `<col class="strade-col-sottrai">`}<col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>${escapeHtml(isManufatti ? "Tipo manufatto" : isReinterro ? "Tipo reinterro" : `Tipo ${etichettaTipo.toLocaleLowerCase("it-IT")}`)}</th>${isImpianto ? "<th>Manufatti</th><th>Reinterro</th>" : ""}${isImpianto || isReinterro ? thDimensioni : ""}<th>Formula</th><th>N° pezzi</th><th>${isManufatti ? "Mq" : "Ris."}</th>${isManufatti ? "" : "<th>Sottrai</th>"}<th></th>
  </tr></thead>`
    : isCordoli
      ? `<colgroup>
    <col class="strade-col-n"><col class="strade-col-rif"><col class="strade-col-tipo">
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo cordolo</th><th>Formula</th><th>×</th><th>Ris.</th><th>Sottrai</th><th></th>
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
    <col class="strade-col-spunta"><col class="strade-col-spunta">
    ${colDimensioni}
    <col class="strade-col-formula"><col class="strade-col-mol"><col class="strade-col-mq">
    <col class="strade-col-sottrai"><col class="strade-col-act">
  </colgroup>
  <thead><tr>
    <th>N°</th><th>Rif.</th><th>Tipo varie</th><th>Manufatti</th><th>Reinterro</th>${thDimensioni}<th>Formula</th><th>×</th><th>Ris.</th><th>Sottrai</th><th></th>
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

  const righeTabella = [];
  if (isReinterro) {
    for (const area of areeReinterroDaSpunta(schedaCompleta)) righeTabella.push({ area, derivata: true });
  } else if (isManufatti) {
    for (const area of areeManufattiDaSpunta(schedaCompleta)) righeTabella.push({ area, derivata: true });
  }
  if (!isReinterro) {
    for (const area of zona.aree || []) {
      if (isManufatti && areaManufattoVuota(area)) continue;
      righeTabella.push({ area, derivata: false });
    }
  }

  for (const { area, derivata } of righeTabella) {
    const tr = document.createElement("tr");
    tr.className = "vani-sup-area-row";
    tr.dataset.areaId = String(area.id);
    if (derivata) tr.dataset.derivata = "1";

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

    if (isReinterro) appendTipoReinterroTesto(tr, area.tipoReinterro, area.origineTipo);
    else if (isManufatti && derivata) appendTipoManufattoTesto(tr, area.tipoManufatto, area.origineTipo);
    else if (isManufatti) appendTipoManufatto(tr, area);
    if (isImpianto) appendTipoImpianto(tr, area, tipo);
    if (isCordoli) appendTipoCordolo(tr, area);
    if (isSegnaletica) appendTipoSegnaletica(tr, area);
    if (isVarie) appendTipoVarie(tr, area);
    if (conSpuntaManufatti) {
      appendSpuntaManufatti(tr, area);
      appendSpuntaReinterro(tr, area);
    }
    if (conDimensioni) appendDimensioniSpessore(tr, area);

    appendFormulaEMoltiplicatore(
      tr,
      area,
      "strade-area",
      isCordoli ? "lunghezza" : isSegnaletica ? "segnaletica" : isVarie || isFormulaUnitaVoce ? "calcolo" : "area",
      {
        pezzi: comeManufatti,
        lineare: isCordoli || isSegnaletica || isVarie || isFormulaUnitaVoce || isReinterro,
        multilinea: conTipo,
        sottraeSede: isManufatti,
        primaMoltiplicatore: isSegnaletica ? () => appendLarghezza(tr, area) : null,
      },
    );

    const mqInfo = testoMqRiga(area, area.segno === true);
    appendCellettaMq(tr, mqInfo.text, mqInfo.err, "area-mq");

    if (!isManufatti) {
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
    }

    const tdAct = document.createElement("td");
    tdAct.className = "strade-area-act";
    const btnDup = document.createElement("button");
    btnDup.type = "button";
    btnDup.className = "btn-action btn-secondary vani-btn-micro strade-btn-dup-area";
    btnDup.dataset.action = "duplica-area-strada";
    btnDup.dataset.tipoZona = tipo;
    btnDup.dataset.areaId = String(area.id);
    if (derivata) btnDup.disabled = true;
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
    btnRm.disabled = derivata || (zona.aree || []).length <= 1;
    tdAct.appendChild(btnRm);
    tr.appendChild(tdAct);
    if (derivata) {
      bloccaRigaManufattoDerivata(
        tr,
        area.origineTipo,
        isManufatti ? { origineId: area.origineId } : null,
      );
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  const t = totaliAreeConDerivate(
    isReinterro ? { aree: [] } : zona,
    isReinterro ? areeReinterroDaSpunta(schedaCompleta) : isManufatti ? areeManufattiDaSpunta(schedaCompleta) : [],
  );
  const labelColspan =
    (isSegnaletica ? 6 : conTipo ? 5 : 4) + (conSpuntaManufatti ? 2 : 0) + (conDimensioni ? 2 : 0);
  const labelPos = isCordoli
    ? "Totale lunghezze positive"
    : isSegnaletica
      ? "Totale positivo"
      : isFormulaUnitaVoce || isVarie || isReinterro
      ? "Totale valori positivi"
      : "Totale aree positive";
  const labelNeg = isCordoli
    ? "Totale lunghezze negative"
    : isSegnaletica
      ? "Totale negativo"
      : isFormulaUnitaVoce || isVarie || isReinterro
      ? "Totale valori negativi"
      : "Totale aree negative";
  const labelNetto = isCordoli
    ? "Risultato netto (formula × pezzi; unità in VOCI)"
    : isSegnaletica
      ? "Risultato netto (formula × larghezza × pezzi; unità in VOCI)"
      : isFormulaUnitaVoce
      ? "Risultato netto (base per gli strati; unità = voce)"
      : isVarie
        ? "Risultato netto (formula × pezzi; unità in VOCI)"
        : isReinterro
          ? "Risultato netto (formula × pezzi, copiato dalle schede di partenza)"
          : isImpianto
          ? "Risultato netto (formula × pezzi; unità in VOCI; non entra nella Sede)"
      : "Mq netto zona (base per gli strati)";
  const codaColspan = isManufatti ? 1 : 2;
  const tfoot = document.createElement("tfoot");
  tfoot.innerHTML = `
    <tr class="vani-sup-totale-row vani-sup-totale-row--pos">
      <td colspan="${labelColspan}">${labelPos}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-pos">${fmtDim(t.mqPos)}</td>
      <td colspan="${codaColspan}"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--neg">
      <td colspan="${labelColspan}">${labelNeg}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-neg">${fmtTotaleNegativo(t.mqNeg)}</td>
      <td colspan="${codaColspan}"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--netto">
      <td colspan="${labelColspan}">${labelNetto}</td>
      <td class="vani-sup-calc vani-sup-totale-mq-netto">${fmtDim(t.mqNetto)}</td>
      <td colspan="${codaColspan}"></td>
    </tr>`;
  table.appendChild(tfoot);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

export function zonaHaLibreriaTipi(tipo) {
  return (
    isZonaManufatti(tipo) ||
    isZonaComeManufatti(tipo) ||
    isZonaCordoli(tipo) ||
    isZonaSegnaletica(tipo) ||
    isZonaVarie(tipo)
  );
}

export function renderElencoLibreriaTipologie(tipo) {
  if (isZonaManufatti(tipo)) {
    return renderElencoTipiModificabili(
      elencoTipiManufatto(),
      "salva-tipo-manufatto",
      "elimina-tipo-manufatto",
      "",
      catalogoManufatto,
    );
  }
  if (isZonaComeManufatti(tipo)) {
    return renderElencoTipiModificabili(
      elencoTipiImpianto(tipo),
      "salva-tipo-impianto",
      "elimina-tipo-impianto",
      tipo,
      catalogoImpianto(tipo),
    );
  }
  if (isZonaCordoli(tipo)) {
    return renderElencoTipiModificabili(
      elencoTipiCordolo(),
      "salva-tipo-cordolo",
      "elimina-tipo-cordolo",
      "",
      catalogoCordolo,
    );
  }
  if (isZonaSegnaletica(tipo)) {
    return renderElencoTipiModificabili(
      elencoTipiSegnaletica(),
      "salva-tipo-segnaletica",
      "elimina-tipo-segnaletica",
      "",
      catalogoSegnaletica,
    );
  }
  if (isZonaVarie(tipo)) {
    return renderElencoTipiModificabili(elencoTipiVarie(), "salva-tipo-varie", "elimina-tipo-varie", "", catalogoVarie);
  }
  const vuoto = document.createElement("p");
  vuoto.className = "strade-tipi-esistenti-vuoto";
  vuoto.textContent = "Questa scheda non ha una libreria di tipi.";
  return vuoto;
}

function renderBarraTipologie(tipo) {
  const bar = document.createElement("div");
  bar.className = "strade-tipologie-barra";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary strade-btn-libreria-tipologie";
  btn.dataset.action = "apri-libreria-tipologie";
  btn.textContent = "Libreria Tipologie";
  const nuovo = isZonaManufatti(tipo)
    ? renderNuovoTipoManufatto()
    : isZonaComeManufatti(tipo)
      ? renderNuovoTipoImpianto(tipo)
      : isZonaCordoli(tipo)
        ? renderNuovoTipoCordolo()
        : isZonaSegnaletica(tipo)
          ? renderNuovoTipoSegnaletica()
          : renderNuovoTipoVarie();
  bar.append(btn, nuovo);
  return bar;
}

function aggiornaCalcoliTipoRiga(row) {
  const dim = row.querySelector(".strade-tipo-dimensioni");
  const alt = row.querySelector(".strade-tipo-spessore");
  const areaEl = row.querySelector(".strade-tipo-area");
  const volEl = row.querySelector(".strade-tipo-volume");
  if (!(dim instanceof HTMLInputElement) || !(alt instanceof HTMLInputElement) || !areaEl || !volEl) return;
  const calc = calcolaAreaVolumeTipo(dim.value, alt.value);
  areaEl.textContent = calc.area == null ? "—" : fmtDim(calc.area);
  volEl.textContent = calc.volume == null ? "—" : fmtDim(calc.volume);
  areaEl.title = calc.formulaErrata
    ? "Formula non valida. Usa numeri e x, per esempio 0,40 x 0,40."
    : "Risultato della formula Dimensioni";
  volEl.title = calc.altezzaErrata
    ? "Spessore non valido. Scrivi un numero, oppure lascialo vuoto."
    : calc.volume == null
      ? "Volume vuoto perché manca lo spessore o l’area"
      : "Area × Spessore";
}

function renderElencoTipiModificabili(nomi, actionSalva, actionElimina, tipoZona = "", catalogo = null) {
  const box = document.createElement("div");
  box.className = "strade-tipi-esistenti";
  const title = document.createElement("p");
  title.className = "strade-tipi-esistenti-titolo";
  title.textContent = "Libreria tipi";
  const hint = document.createElement("p");
  hint.className = "strade-tipi-esistenti-hint";
  hint.textContent =
    "In Dimensioni scrivi una formula, per esempio 0,40 x 0,40. Area è il risultato. Volume è Area × Spessore. Se lo Spessore è vuoto, Volume resta vuoto. Questi numeri si salvano da soli con il tipo.";
  box.append(title, hint);
  if (!nomi.length) {
    const empty = document.createElement("p");
    empty.className = "strade-tipi-esistenti-vuoto";
    empty.textContent = "Nessun tipo. Scrivilo nel campo in alto e premi Aggiungi tipo.";
    box.append(empty);
    return box;
  }
  const table = document.createElement("table");
  table.className = "strade-tipi-tabella";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th>Tipo</th>
    <th>Dimensioni</th>
    <th>Spessore</th>
    <th>Area</th>
    <th>Volume</th>
    <th></th>
  </tr>`;
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  for (const nome of nomi) {
    const mis = catalogo?.leggiMisure?.(nome) || { dimensioni: "", altezza: "" };
    const row = document.createElement("tr");
    row.className = "strade-tipo-riga";
    const tdNome = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "strade-tipo-nome-edit";
    inp.value = nome;
    inp.dataset.nomeOriginale = nome;
    inp.setAttribute("aria-label", `Dicitura del tipo ${nome}`);
    inp.autocomplete = "off";
    tdNome.append(inp);
    const tdDim = document.createElement("td");
    const dim = document.createElement("input");
    dim.type = "text";
    dim.className = "strade-tipo-dimensioni";
    dim.value = mis.dimensioni || "";
    dim.placeholder = "0,40 x 0,40";
    dim.setAttribute("aria-label", `Dimensioni di ${nome}`);
    dim.autocomplete = "off";
    tdDim.append(dim);
    const tdAlt = document.createElement("td");
    const alt = document.createElement("input");
    alt.type = "text";
    alt.className = "strade-tipo-spessore";
    alt.value = mis.altezza || "";
    alt.placeholder = "es. 0,10";
    alt.setAttribute("aria-label", `Spessore di ${nome}`);
    alt.autocomplete = "off";
    tdAlt.append(alt);
    const tdArea = document.createElement("td");
    tdArea.className = "strade-tipo-area strade-tipo-calc";
    tdArea.textContent = "—";
    const tdVol = document.createElement("td");
    tdVol.className = "strade-tipo-volume strade-tipo-calc";
    tdVol.textContent = "—";
    const tdAzioni = document.createElement("td");
    const azioni = document.createElement("div");
    azioni.className = "strade-tipo-azioni";
    const salva = document.createElement("button");
    salva.type = "button";
    salva.className = "btn-action btn-secondary";
    salva.dataset.action = actionSalva;
    if (tipoZona) salva.dataset.tipoZona = tipoZona;
    salva.textContent = "Salva nome";
    const elim = document.createElement("button");
    elim.type = "button";
    elim.className = "btn-action btn-delete";
    elim.dataset.action = actionElimina;
    if (tipoZona) elim.dataset.tipoZona = tipoZona;
    elim.textContent = "Elimina";
    azioni.append(salva, elim);
    tdAzioni.append(azioni);
    row.append(tdNome, tdDim, tdAlt, tdArea, tdVol, tdAzioni);
    const salvaMisureRiga = () => {
      aggiornaCalcoliTipoRiga(row);
      const originale = inp.dataset.nomeOriginale || nome;
      catalogo?.salvaMisure?.(originale, { dimensioni: dim.value, altezza: alt.value });
    };
    dim.addEventListener("input", salvaMisureRiga);
    alt.addEventListener("input", salvaMisureRiga);
    aggiornaCalcoliTipoRiga(row);
    tbody.append(row);
  }
  box.append(table);
  return box;
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

function renderNuovoTipoImpianto(tipo) {
  const etichetta = ZONA_LABELS[tipo] || "impianto";
  const box = document.createElement("div");
  box.className = "strade-nuovo-tipo";
  const label = document.createElement("label");
  label.className = "strade-nuovo-tipo-label";
  label.textContent = `Nuovo tipo ${etichetta.toLocaleLowerCase("it-IT")}`;
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "strade-nuovo-tipo-nome";
  inp.placeholder = "es. Tubo";
  inp.setAttribute("aria-label", `Nome del nuovo tipo di ${etichetta}`);
  inp.autocomplete = "off";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-action btn-secondary";
  btn.dataset.action = "aggiungi-tipo-impianto";
  btn.dataset.tipoZona = tipo;
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
      ? "Questa scheda è in sola lettura. Le righe arrivano dalla spunta Manufatti in Fogna, negli impianti o in Varie. Il tipo è il nome della voce, per esempio Pozzetto ispezione (Fogna). Formula e N° pezzi sono quelli della scheda di partenza. L’icona della lente apre la scheda da cui arriva la riga."
      : isZonaReinterro(tipo)
        ? "Questa scheda è in sola lettura. Le righe arrivano dalla spunta Reintero in Fogna, negli impianti o in Varie. Il tipo è il nome della voce, per esempio Pozzetto ispezione (Fogna). Dimensioni, Spessore, formula e N° pezzi sono quelli della scheda di partenza."
      : isZonaCordoli(tipo)
        ? "Scegli il tipo di cordolo (Retto, Curvo, oppure aggiungine uno nuovo). Ogni tipo diventa una voce nelle VOCI: lì scegli ml., mq. o mc. e il prezzo. La quantità è formula × pezzi. Se la formula è vuota, la quantità è 0. I Cordoli non vengono sottratti dalla Sede stradale."
        : isZonaSegnaletica(tipo)
          ? "Scegli il tipo di segnaletica, oppure aggiungine uno nuovo. Ogni tipo diventa una voce nelle VOCI: lì scegli ml., mq. o mc. e il prezzo. La quantità è formula × larghezza × pezzi. Se manca la larghezza, conta come 1. Se la formula è vuota, la quantità è 0. Non viene sottratta dalla Sede."
          : isZonaVarie(tipo)
            ? "Scegli il tipo (per ora Reinterro, oppure aggiungine uno nuovo). Se il tipo è in libreria, Dimensioni e Spessore si compilano da soli. Ogni tipo diventa una voce nelle VOCI: lì scegli ml., mq. o mc. e il prezzo. La quantità è formula × pezzi. Se la formula è vuota, la quantità è 0. La spunta Manufatti copia la riga nella scheda Manufatti. La spunta Reinterro copia anche Dimensioni e Spessore. Varie non entra nella Sede stradale."
            : isZonaComeManufatti(tipo)
              ? "Scegli il tipo, oppure aggiungine uno nuovo nel campo in alto. Se il tipo è in libreria, Dimensioni e Spessore si compilano da soli. Nella casella resta solo il nome, per esempio Pozzetto ispezione. In VOCI la voce breve diventa «Pozzetto ispezione (Luce pubblica)»: tra parentesi c’è questa scheda, così lo stesso tipo in un’altra sezione non si mescola. La spunta Manufatti copia la riga nella scheda Manufatti. La spunta Reinterro copia anche Dimensioni e Spessore, con la stessa formula e gli stessi pezzi. Lì scegli ml., mq. o mc. e il prezzo. La quantità è formula × pezzi. Se la formula è vuota, la quantità è 0. Questa scheda non viene sottratta dalla Sede stradale."
            : isZonaFormulaUnitaVoce(tipo)
          ? "In Formula scrivi il calcolo (es. 2 oppure 1,2*3). Il moltiplicatore ripete quel risultato. L’unità di misura (n., ml., mq., a corpo…) la decide la Voce dello strato nelle VOCI. Questa scheda non viene sottratta dalla Sede stradale."
          : "In Formula puoi scrivere un’espressione (es. 12,5 * 3,2 oppure (10+2)/2). Il moltiplicatore (default 1) ripete quel risultato: 4, 1,5, 10… quello che ti serve. Il segno «sottrai» toglie quell’area da tutta la zona. Ogni strato parte da quel mq netto: puoi togliere altre aree solo da quello strato.";

  if (zonaHaLibreriaTipi(tipo) && !isZonaManufatti(tipo)) block.appendChild(renderBarraTipologie(tipo));
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
    block.appendChild(renderAreeTable(tipo, data, schedaCompleta));
    if (!isZonaManufatti(tipo) && !isZonaReinterro(tipo) && !isZonaComeManufatti(tipo) && !isZonaCordoli(tipo) && !isZonaSegnaletica(tipo) && !isZonaVarie(tipo)) {
      block.appendChild(renderStratiCards(tipo, data, datalistId));
    }
  }
  if (isZonaManufatti(tipo) || isZonaReinterro(tipo)) bloccaPannelloSolaLettura(block);
  return block;
}

function bloccaPannelloSolaLettura(block) {
  block.classList.add("strade-pannello-sola-lettura");
  for (const el of block.querySelectorAll("input, textarea, select, button")) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.type === "checkbox") el.disabled = true;
      else el.readOnly = true;
    }
    if (el instanceof HTMLSelectElement) el.disabled = true;
    if (el instanceof HTMLButtonElement && !el.classList.contains("strade-btn-vai-origine")) el.disabled = true;
  }
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
    const tipoImp = row.querySelector(".strade-area-tipo-impianto");
    const lar = row.querySelector(".strade-area-larghezza");
    if (rif instanceof HTMLInputElement) area.riferimento = rif.value;
    if (formula instanceof HTMLInputElement || formula instanceof HTMLTextAreaElement) {
      area.formula = formula.value;
    }
    if (mol instanceof HTMLInputElement) area.moltiplicatore = mol.value;
    if (segno instanceof HTMLInputElement) area.segno = segno.checked;
    if (tipoMan instanceof HTMLSelectElement) area.tipoManufatto = normalizzaTipoManufatto(tipoMan.value);
    if (tipoCor instanceof HTMLSelectElement) area.tipoCordolo = normalizzaTipoCordolo(tipoCor.value);
    if (tipoSeg instanceof HTMLSelectElement) area.tipoSegnaletica = normalizzaTipoSegnaletica(tipoSeg.value);
    if (tipoVar instanceof HTMLSelectElement) area.tipoVarie = normalizzaTipoVarie(tipoVar.value);
    if (tipoImp instanceof HTMLSelectElement) {
      area.tipoImpianto = normalizzaTipoImpianto(block.dataset.tipoZona || "", tipoImp.value);
    }
    const spuntaMan = row.querySelector(".strade-area-in-manufatti");
    if (spuntaMan instanceof HTMLInputElement) area.inManufatti = spuntaMan.checked;
    const spuntaRei = row.querySelector(".strade-area-in-reinterro");
    if (spuntaRei instanceof HTMLInputElement) area.inReinterro = spuntaRei.checked;
    const dimArea = row.querySelector(".strade-area-dimensioni");
    const speArea = row.querySelector(".strade-area-spessore");
    if (dimArea instanceof HTMLInputElement) area.dimensioni = testoDimensioniArea({ dimensioni: dimArea.value });
    if (speArea instanceof HTMLInputElement) area.spessore = testoSpessoreArea({ spessore: speArea.value });
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

  let extraPos = 0;
  let extraNeg = 0;
  block.querySelectorAll('.vani-sup-area-row[data-derivata="1"]').forEach((row) => {
    const item = {
      formula: row.querySelector(".strade-area-formula")?.value ?? "",
      moltiplicatore: row.querySelector(".strade-area-moltiplicatore")?.value ?? "1",
    };
    const mq = mqDiArea(item);
    const segno = row.querySelector(".vani-sup-area-segno");
    if (segno instanceof HTMLInputElement && segno.checked) extraNeg += mq;
    else extraPos += mq;
  });
  const t0 = totaliAreeZona(zona);
  const t = {
    mqPos: Number((t0.mqPos + extraPos).toFixed(3)),
    mqNeg: Number((t0.mqNeg + extraNeg).toFixed(3)),
    mqNetto: Number((t0.mqPos + extraPos - (t0.mqNeg + extraNeg)).toFixed(3)),
  };
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
