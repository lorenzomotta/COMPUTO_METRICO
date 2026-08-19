/**
 * Riepilogo pareti con un flag VANI attivo (es. rivestimento, rustico, zoccolo).
 * MQ lordi = L × H; MQ netti = lordi − aperture (L × H inclusa × percentuale/100).
 * Per lo zoccolino H e elevazione arrivano dallo strato «zoccolino», come in VANI.
 */

import { altezzaInclusaNelloStratoConElevazione, mqAperturaConPercentuale } from "../utils/numberUtils.js";

export const STORAGE_VANI_REGISTRATI_KEY = "computo_metrico_vani_registrati";
const STORAGE_PERIM_REGISTRATI_KEY = "computo_metrico_perimetrali_registrati";
const STORAGE_ELEV_REGISTRATI_KEY = "computo_metrico_elevazione_registrati";
const STORAGE_APERTURE_MASTER_KEY = "computo_metrico_aperture_master";

function parseDimensione(raw) {
  const txt = String(raw ?? "").trim().replaceAll(",", ".");
  if (txt === "") return null;
  if (!/^\d+(\.\d+)?$/.test(txt)) return null;
  const n = Number(txt);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(3)) : null;
}

function iterLocaliVano(vano) {
  if (Array.isArray(vano.locali) && vano.locali.length > 0) {
    return vano.locali.map((blocco) => ({
      nomeLocale: typeof blocco.nomeLocale === "string" ? blocco.nomeLocale : "",
      pareti: Array.isArray(blocco.pareti) ? blocco.pareti : [],
    }));
  }
  return [
    {
      nomeLocale: typeof vano.nomeLocale === "string" ? vano.nomeLocale : "",
      pareti: Array.isArray(vano.pareti) ? vano.pareti : [],
    },
  ];
}

function loadRegistratiItems(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

function loadApertureMasterById() {
  /** @type {Map<string, object>} */
  const map = new Map();
  try {
    const raw = localStorage.getItem(STORAGE_APERTURE_MASTER_KEY);
    if (!raw) return map;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;
    for (const ap of parsed) {
      const id = typeof ap?.idAperturaMaster === "string" ? ap.idAperturaMaster.trim() : "";
      if (id) map.set(id, ap);
    }
  } catch {
    /* ignore */
  }
  return map;
}

function trovaStratoPerNota(parete, nota) {
  const want = String(nota ?? "").trim().toLowerCase();
  if (!want) return null;
  const list = Array.isArray(parete?.stratifinitura) ? parete.stratifinitura : [];
  return (
    list.find((st) => String(st?.note ?? "").trim().toLowerCase() === want) ||
    list.find((st) => String(st?.vocibreve ?? "").trim().toLowerCase() === want) ||
    null
  );
}

function calcolaMetrichePareteFlag(parete, stratoNote, apertureById) {
  const lunghezza = parseDimensione(parete.lunghezza);
  let altezza = parseDimensione(parete.altezza);
  let elevazione = 0;
  let elevazioneValida = true;
  if (stratoNote) {
    const st = trovaStratoPerNota(parete, stratoNote);
    if (!st) {
      altezza = null;
    } else {
      altezza = parseDimensione(st.altezza);
      const elevRaw = String(st.elevazione ?? "").trim();
      if (elevRaw === "") {
        elevazione = 0;
      } else {
        elevazione = parseDimensione(st.elevazione);
        if (elevazione == null) elevazioneValida = false;
      }
    }
  }
  const mqLordi =
    lunghezza != null && altezza != null ? Number((lunghezza * altezza).toFixed(3)) : null;
  const mqAperture =
    !elevazioneValida || altezza == null
      ? 0
      : calcolaMqApertureParete(parete, altezza, apertureById, elevazione);
  const mqNetti =
    mqLordi == null ? null : Number(Math.max(0, mqLordi - mqAperture).toFixed(3));
  return { lunghezza, altezza, mqLordi, mqNetti };
}

/**
 * Come in VANI: fascia [elevazione, elevazione + altezzaStrato].
 * @param {object} parete
 * @param {number|null} altezzaStrato
 * @param {Map<string, object>} apertureById
 * @param {number|null} elevazioneStrato
 */
function calcolaMqApertureParete(parete, altezzaStrato, apertureById, elevazioneStrato = 0) {
  if (altezzaStrato == null) return 0;
  const elev = elevazioneStrato == null ? 0 : elevazioneStrato;
  const ids = Array.isArray(parete.idApertureMaster) ? parete.idApertureMaster : [];
  let sum = 0;
  for (const rawId of ids) {
    const id = String(rawId ?? "").trim();
    if (!id) continue;
    const ap = apertureById.get(id);
    if (!ap) continue;
    const largh = Number(ap.largh ?? ap.lunghezza ?? 0);
    if (!Number.isFinite(largh) || largh < 0) continue;
    const hInclusaRaw = altezzaInclusaNelloStratoConElevazione(elev, altezzaStrato, ap);
    const hInclusa = Number((hInclusaRaw ?? 0).toFixed(2));
    sum += mqAperturaConPercentuale(largh, hInclusa, ap.percentuale, 2);
  }
  return Number(sum.toFixed(2));
}

/**
 * @param {string} flagKey es. "rivestimento" | "rustico" | "civile" | "gesso" | "zoccolo"
 * @param {{ stratoNote?: string }} [opts] se `stratoNote` è valorizzato, H e elevazione
 *   arrivano dallo strato con quella nota (es. zoccolino), come in VANI.
 * @returns {{ piano: string, locale: string, riferimento: string, lunghezza: number|null, altezza: number|null, mqLordi: number|null, mqNetti: number|null }[]}
 */
export function buildParetiFlagRowsFromStorage(flagKey, opts = {}) {
  const key = String(flagKey ?? "").trim();
  if (!key) return [];
  const stratoNote = typeof opts.stratoNote === "string" ? opts.stratoNote.trim() : "";

  let items = [];
  try {
    const raw = localStorage.getItem(STORAGE_VANI_REGISTRATI_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    items = Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }

  const apertureById = loadApertureMasterById();

  /** @type {{ piano: string, locale: string, riferimento: string, lunghezza: number|null, altezza: number|null, mqLordi: number|null, mqNetti: number|null }[]} */
  const rows = [];
  for (const vano of items) {
    if (!vano || typeof vano !== "object") continue;
    const piano = typeof vano.pianoNome === "string" && vano.pianoNome.trim() ? vano.pianoNome.trim() : "-";
    for (const blocco of iterLocaliVano(vano)) {
      const locale =
        typeof blocco.nomeLocale === "string" && blocco.nomeLocale.trim()
          ? blocco.nomeLocale.trim()
          : "-";
      for (const pa of blocco.pareti) {
        if (!pa || typeof pa !== "object") continue;
        if (!pa[key]) continue;
        const metriche = calcolaMetrichePareteFlag(pa, stratoNote, apertureById);
        rows.push({
          piano,
          locale,
          riferimento:
            typeof pa.riferimento === "string" && pa.riferimento.trim()
              ? pa.riferimento.trim()
              : "-",
          ...metriche,
        });
      }
    }
  }

  return rows.sort(
    (a, b) =>
      a.piano.localeCompare(b.piano, "it", { sensitivity: "base" }) ||
      a.locale.localeCompare(b.locale, "it", { sensitivity: "base" }) ||
      a.riferimento.localeCompare(b.riferimento, "it", { sensitivity: "base" }),
  );
}

export function buildRivestimentiRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("rivestimento", { stratoNote: "rivestimento" });
}

export function buildRivestimentiElevazioneRowsFromStorage() {
  return buildParetiFlagRowsFromEsterniStorage("rivestimentoEsterno", {
    stratoNote: "rivestimento esterno",
    origine: "ELEVAZIONE",
  });
}

export function buildRivestimentiPerimetraliRowsFromStorage() {
  return buildParetiFlagRowsFromEsterniStorage("rivestimentoEsterno", {
    stratoNote: "rivestimento esterno",
    origine: "PERIMETRALI",
  });
}

export function buildIntonacoRusticoRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("rustico", { stratoNote: "rustico" });
}

/**
 * Flag esterni: schede registrate PERIMETRALI e/o ELEVAZIONE.
 * `locale` contiene la zona/facciata.
 * @param {string} flagKey es. "rusticoEsterno" | "civileEsterno" | "rivestimentoEsterno"
 * @param {{ stratoNote?: string, origine?: "PERIMETRALI" | "ELEVAZIONE" }} [opts]
 */
export function buildParetiFlagRowsFromEsterniStorage(flagKey, opts = {}) {
  const key = String(flagKey ?? "").trim();
  if (!key) return [];
  const stratoNote = typeof opts.stratoNote === "string" ? opts.stratoNote.trim() : "";
  const origineFiltro = String(opts.origine ?? "").trim().toUpperCase();
  const apertureById = loadApertureMasterById();
  const fonti = [
    { origine: "PERIMETRALI", items: loadRegistratiItems(STORAGE_PERIM_REGISTRATI_KEY) },
    { origine: "ELEVAZIONE", items: loadRegistratiItems(STORAGE_ELEV_REGISTRATI_KEY) },
  ].filter((fonte) => !origineFiltro || fonte.origine === origineFiltro);
  /** @type {{ piano: string, locale: string, riferimento: string, origine: string, lunghezza: number|null, altezza: number|null, mqLordi: number|null, mqNetti: number|null }[]} */
  const rows = [];
  for (const fonte of fonti) {
    for (const scheda of fonte.items) {
      if (!scheda || typeof scheda !== "object") continue;
      const piano =
        typeof scheda.pianoNome === "string" && scheda.pianoNome.trim()
          ? scheda.pianoNome.trim()
          : "-";
      const zona =
        typeof scheda.zonaNome === "string" && scheda.zonaNome.trim()
          ? scheda.zonaNome.trim()
          : "-";
      const pareti = Array.isArray(scheda.pareti) ? scheda.pareti : [];
      for (const pa of pareti) {
        if (!pa || typeof pa !== "object") continue;
        if (!pa[key]) continue;
        const metriche = calcolaMetrichePareteFlag(pa, stratoNote, apertureById);
        rows.push({
          piano,
          locale: zona,
          origine: fonte.origine,
          riferimento:
            typeof pa.riferimento === "string" && pa.riferimento.trim()
              ? pa.riferimento.trim()
              : "-",
          ...metriche,
        });
      }
    }
  }
  return rows.sort(
    (a, b) =>
      a.piano.localeCompare(b.piano, "it", { sensitivity: "base" }) ||
      a.origine.localeCompare(b.origine, "it", { sensitivity: "base" }) ||
      a.locale.localeCompare(b.locale, "it", { sensitivity: "base" }) ||
      a.riferimento.localeCompare(b.riferimento, "it", { sensitivity: "base" }),
  );
}

export function buildIntonacoRusticoEsternoRowsFromStorage() {
  return buildParetiFlagRowsFromEsterniStorage("rusticoEsterno", { stratoNote: "rustico esterno" });
}

export function buildIntonacoCivileRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("civile", { stratoNote: "civile" });
}

export function buildIntonacoCivileEsternoRowsFromStorage() {
  return buildParetiFlagRowsFromEsterniStorage("civileEsterno", { stratoNote: "civile esterno" });
}

export function buildGessoRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("gesso", { stratoNote: "gesso" });
}

export function buildZoccoloRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("zoccolo", { stratoNote: "zoccolino" });
}
