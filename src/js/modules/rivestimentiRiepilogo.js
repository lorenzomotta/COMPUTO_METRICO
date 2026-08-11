/**
 * Riepilogo pareti con un flag VANI attivo (es. rivestimento, rustico).
 * MQ lordi = L × H; MQ netti = lordi − aperture (stessa logica H inclusa delle VOCI).
 */

import { altezzaInclusaNelloStratoConElevazione } from "../utils/numberUtils.js";

export const STORAGE_VANI_REGISTRATI_KEY = "computo_metrico_vani_registrati";
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

/**
 * @param {object} parete
 * @param {number|null} altezzaParete
 * @param {Map<string, object>} apertureById
 */
function calcolaMqApertureParete(parete, altezzaParete, apertureById) {
  if (altezzaParete == null) return 0;
  const ids = Array.isArray(parete.idApertureMaster) ? parete.idApertureMaster : [];
  let sum = 0;
  for (const rawId of ids) {
    const id = String(rawId ?? "").trim();
    if (!id) continue;
    const ap = apertureById.get(id);
    if (!ap) continue;
    const largh = Number(ap.largh ?? ap.lunghezza ?? 0);
    if (!Number.isFinite(largh) || largh < 0) continue;
    const hInclusaRaw = altezzaInclusaNelloStratoConElevazione(0, altezzaParete, ap);
    const hInclusa = Number((hInclusaRaw ?? 0).toFixed(2));
    sum += Number((largh * hInclusa).toFixed(2));
  }
  return Number(sum.toFixed(2));
}

/**
 * @param {string} flagKey es. "rivestimento" | "rustico" | "civile" | "gesso" | "zoccolo"
 * @returns {{ piano: string, locale: string, riferimento: string, lunghezza: number|null, altezza: number|null, mqLordi: number|null, mqNetti: number|null }[]}
 */
export function buildParetiFlagRowsFromStorage(flagKey) {
  const key = String(flagKey ?? "").trim();
  if (!key) return [];

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
        const lunghezza = parseDimensione(pa.lunghezza);
        const altezza = parseDimensione(pa.altezza);
        const mqLordi =
          lunghezza != null && altezza != null
            ? Number((lunghezza * altezza).toFixed(3))
            : null;
        const mqAperture = calcolaMqApertureParete(pa, altezza, apertureById);
        const mqNetti =
          mqLordi == null ? null : Number(Math.max(0, mqLordi - mqAperture).toFixed(3));
        rows.push({
          piano,
          locale,
          riferimento:
            typeof pa.riferimento === "string" && pa.riferimento.trim()
              ? pa.riferimento.trim()
              : "-",
          lunghezza,
          altezza,
          mqLordi,
          mqNetti,
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
  return buildParetiFlagRowsFromStorage("rivestimento");
}

export function buildIntonacoRusticoRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("rustico");
}

export function buildIntonacoCivileRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("civile");
}

export function buildZoccoloRowsFromStorage() {
  return buildParetiFlagRowsFromStorage("zoccolo");
}
