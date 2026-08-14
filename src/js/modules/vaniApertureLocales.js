/**
 * Locali per il campo VANI: archivio APERTURE + locali già usati nei VANI registrati.
 * Non include aperture in compilazione muratura / IFC (evita etichette tipo "Door 1", "Opening 1").
 */

export const STORAGE_APERTURE_MASTER_KEY = "computo_metrico_aperture_master";
export const STORAGE_VANI_REGISTRATI_KEY = "computo_metrico_vani_registrati";

let cachedMaster = [];

/** Il primo argomento è ignorato (compatibilità con main); aggiorna solo l’archivio master. */
export function syncVaniApertureLocalesForPicker(_apertureElevazione, apertureMaster) {
  cachedMaster = Array.isArray(apertureMaster) ? apertureMaster : [];
}

function addLocalesFromRows(rows, set) {
  if (!Array.isArray(rows)) return;
  for (const ap of rows) {
    if (ap == null || typeof ap !== "object") continue;
    const raw = ap.locale;
    const s =
      typeof raw === "string"
        ? raw.trim()
        : raw != null && raw !== ""
          ? String(raw).trim()
          : "";
    if (s) set.add(s);
  }
}

function addLocalesFromStorageKey(key, set) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    addLocalesFromRows(parsed, set);
  } catch {
    /* ignore */
  }
}

function addLocalesFromVaniRegistrati(set) {
  try {
    const raw = localStorage.getItem(STORAGE_VANI_REGISTRATI_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const vano of items) {
      if (!vano || typeof vano !== "object") continue;
      if (Array.isArray(vano.locali)) {
        for (const blocco of vano.locali) {
          const n = typeof blocco?.nomeLocale === "string" ? blocco.nomeLocale.trim() : "";
          if (n) set.add(n);
        }
      }
      const legacy = typeof vano.nomeLocale === "string" ? vano.nomeLocale.trim() : "";
      if (legacy) set.add(legacy);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Locali distinti ordinati (archivio APERTURE + nomi locale già usati in VANI).
 * @returns {string[]}
 */
export function getUniqueLocalesForVaniPicker() {
  const set = new Set();
  addLocalesFromRows(cachedMaster, set);
  addLocalesFromStorageKey(STORAGE_APERTURE_MASTER_KEY, set);
  addLocalesFromVaniRegistrati(set);
  return [...set].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
}

function normalizeLocaleKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

function forEachApertureMaster(fn) {
  const seen = new Set();
  const take = (rows) => {
    if (!Array.isArray(rows)) return;
    for (const ap of rows) {
      if (ap == null || typeof ap !== "object") continue;
      const id = String(ap.idAperturaMaster ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      fn(ap);
    }
  };
  take(cachedMaster);
  try {
    const raw = localStorage.getItem(STORAGE_APERTURE_MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      take(Array.isArray(parsed) ? parsed : []);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Archivio APERTURE: righe il cui LOCALE coincide con `localeParete` (trim, stesso testo, maiuscole ignorate).
 * Usato da VANI: così le aperture create in PERIMETRALI con quel locale compaiono sulle pareti del vano.
 * @param {string} localeParete
 * @returns {object[]}
 */
export function getArchivioAperturePerLocale(localeParete) {
  const target = normalizeLocaleKey(localeParete);
  if (!target) return [];
  const byId = new Map();
  forEachApertureMaster((ap) => {
    if (normalizeLocaleKey(ap.locale) !== target) return;
    const id = String(ap.idAperturaMaster ?? "").trim();
    byId.set(id, ap);
  });
  return [...byId.values()].sort((a, b) =>
    String(a.idAperturaMaster).localeCompare(String(b.idAperturaMaster), "it"),
  );
}

/**
 * Aperture della facciata/zona perimetrale.
 * Preferisce il campo `zona`; in legacy (senza zona) usa `locale` come facciata.
 * @param {string} zonaFacciata
 * @returns {object[]}
 */
export function getArchivioAperturePerZona(zonaFacciata) {
  const target = normalizeLocaleKey(zonaFacciata);
  if (!target) return [];
  const byId = new Map();
  forEachApertureMaster((ap) => {
    const zona = typeof ap.zona === "string" ? ap.zona.trim() : "";
    const match = zona
      ? normalizeLocaleKey(zona) === target
      : normalizeLocaleKey(ap.locale) === target;
    if (!match) return;
    const id = String(ap.idAperturaMaster ?? "").trim();
    byId.set(id, ap);
  });
  return [...byId.values()].sort((a, b) =>
    String(a.idAperturaMaster).localeCompare(String(b.idAperturaMaster), "it"),
  );
}

/**
 * @param {string} idAperturaMaster
 * @returns {object|null}
 */
export function getAperturaMasterById(idAperturaMaster) {
  const target = String(idAperturaMaster ?? "").trim();
  if (!target) return null;
  let found = null;
  forEachApertureMaster((ap) => {
    if (found) return;
    if (String(ap.idAperturaMaster ?? "").trim() === target) found = ap;
  });
  return found;
}
