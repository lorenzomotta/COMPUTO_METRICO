/**
 * Locali per il campo VANI: solo dall’archivio APERTURE (sidebar),
 * stessi record salvati in `computo_metrico_aperture_master`.
 * Non include aperture in compilazione muratura / IFC (evita etichette tipo "Door 1", "Opening 1").
 */

export const STORAGE_APERTURE_MASTER_KEY = "computo_metrico_aperture_master";

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

/**
 * Locali distinti ordinati (solo archivio APERTURE in memoria + stesso dato in storage).
 * @returns {string[]}
 */
export function getUniqueLocalesForVaniPicker() {
  const set = new Set();
  addLocalesFromRows(cachedMaster, set);
  addLocalesFromStorageKey(STORAGE_APERTURE_MASTER_KEY, set);
  return [...set].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
}

function normalizeLocaleKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

/**
 * Archivio APERTURE: righe il cui LOCALE coincide con `localeParete` (trim, stesso testo, maiuscole ignorate).
 * @param {string} localeParete
 * @returns {object[]}
 */
export function getArchivioAperturePerLocale(localeParete) {
  const target = normalizeLocaleKey(localeParete);
  if (!target) return [];
  const byId = new Map();
  const take = (rows) => {
    if (!Array.isArray(rows)) return;
    for (const ap of rows) {
      if (ap == null || typeof ap !== "object") continue;
      if (normalizeLocaleKey(ap.locale) !== target) continue;
      const id = String(ap.idAperturaMaster ?? "").trim();
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, ap);
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
  return [...byId.values()].sort((a, b) =>
    String(a.idAperturaMaster).localeCompare(String(b.idAperturaMaster), "it"),
  );
}
