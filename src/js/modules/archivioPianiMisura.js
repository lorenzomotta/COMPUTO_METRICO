/** Normalizza il nome piano per confronti e salvataggio (trim + spazi interni). */
export function canonicalPianoMisuraNome(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Chiave case-insensitive per evitare duplicati tipo "Terra" / "terra". */
export function pianoMisuraDedupKey(raw) {
  const c = canonicalPianoMisuraNome(raw);
  return c.toLowerCase();
}

/**
 * @param {Map<string, string>} map chiave lower → testo canonico da mostrare
 * @param {string} raw
 */
export function mergeNomePianoInMap(map, raw) {
  const c = canonicalPianoMisuraNome(raw);
  if (!c) return false;
  const k = c.toLowerCase();
  if (map.has(k)) return false;
  map.set(k, c);
  return true;
}

/** @param {Map<string, string>} map */
export function sortedUniquePianiNomiFromMap(map) {
  return [...map.values()].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
}

export function collectPianiStringheDaMurData({
  misurazioniVarie,
  scaviEsterni,
  corselliEsterni,
  scivoliEsterni,
  camminamentiEsterni,
  voci,
}) {
  const out = [];
  const push = (s) => {
    const c = canonicalPianoMisuraNome(s);
    if (c) out.push(c);
  };
  for (const m of misurazioniVarie || []) push(m?.piano);
  for (const m of scaviEsterni || []) push(m?.piano);
  for (const m of corselliEsterni || []) push(m?.piano);
  for (const m of scivoliEsterni || []) push(m?.piano);
  for (const m of camminamentiEsterni || []) push(m?.piano);
  for (const v of voci || []) {
    const mm = v?.misurazioniManuali;
    if (!Array.isArray(mm)) continue;
    for (const row of mm) push(row?.piano);
  }
  return out;
}

export function loadArchivioPianiMisuraArray(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map();
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      mergeNomePianoInMap(map, item);
    }
    return sortedUniquePianiNomiFromMap(map);
  } catch {
    return [];
  }
}

export function saveArchivioPianiMisuraArray(storageKey, nomi) {
  localStorage.setItem(storageKey, JSON.stringify(nomi));
}

/** Chiave default localStorage (allineata a main.js). */
export const ARCHIVIO_PIANI_MISURA_STORAGE_KEY = "computo_metrico_archivio_piani_misura";

/** Aggiorna il datalist globale leggendo l’archivio da storage. */
export function popolaDatalistArchivioPianiMisura(storageKey, datalistId) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;
  dl.replaceChildren();
  for (const nome of loadArchivioPianiMisuraArray(storageKey)) {
    const opt = document.createElement("option");
    opt.value = nome;
    dl.appendChild(opt);
  }
}

/**
 * Aggiunge il nome all’archivio se manca (dedup case-insensitive).
 * @returns {{ canonical: string, added: boolean }}
 */
export function tryEnsurePianoInArchivio(storageKey, raw) {
  const c = canonicalPianoMisuraNome(raw);
  if (!c) return { canonical: "", added: false };
  const list = loadArchivioPianiMisuraArray(storageKey);
  const k = pianoMisuraDedupKey(c);
  const existing = list.find((x) => pianoMisuraDedupKey(x) === k);
  if (existing) return { canonical: existing, added: false };
  list.push(c);
  list.sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
  saveArchivioPianiMisuraArray(storageKey, list);
  return { canonical: c, added: true };
}

/** Allinea maiuscole al valore in archivio (blur), senza creare nuovi nomi. */
export function risolviBlurCampoPianoArchivioStorage(storageKey, inputEl) {
  if (!(inputEl instanceof HTMLInputElement)) return;
  const v = inputEl.value.trim();
  if (!v) return;
  const list = loadArchivioPianiMisuraArray(storageKey);
  const k = pianoMisuraDedupKey(v);
  const existing = list.find((x) => pianoMisuraDedupKey(x) === k);
  if (existing) inputEl.value = existing;
}
