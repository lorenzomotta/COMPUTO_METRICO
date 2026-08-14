/**
 * Archivio CAPITOLI per raggruppare le VOCI (ordine stampa 1.1, 1.2, 2.1…).
 */

export const ARCHIVIO_CAPITOLI_STORAGE_KEY = "computo_metrico_archivio_capitoli";

/** Id speciale per il gruppo «Senza capitolo» (solo UI / collapse). */
export const CAPITOLO_SENZA_KEY = "__senza__";

/**
 * @typedef {{ id: string, sequenza: number, nome: string }} Capitolo
 */

export function createCapitoloId() {
  return `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {unknown} raw
 * @returns {Capitolo | null}
 */
export function normalizzaCapitolo(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const nome = typeof raw.nome === "string" ? raw.nome.trim() : "";
  const sequenzaRaw = Number(raw.sequenza);
  const sequenza =
    Number.isFinite(sequenzaRaw) && sequenzaRaw > 0 ? Math.floor(sequenzaRaw) : 0;
  if (!id || !nome || sequenza < 1) return null;
  return { id, sequenza, nome };
}

/**
 * @param {Capitolo[]} items
 * @returns {Capitolo[]}
 */
export function sortCapitoli(items) {
  return [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => a.sequenza - b.sequenza || a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }),
  );
}

/**
 * @param {string} storageKey
 * @returns {Capitolo[]}
 */
export function loadCapitoli(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out = [];
    const seen = new Set();
    for (const item of parsed) {
      const n = normalizzaCapitolo(item);
      if (!n || seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
    }
    return sortCapitoli(out);
  } catch {
    return [];
  }
}

/**
 * @param {string} storageKey
 * @param {Capitolo[]} items
 */
export function saveCapitoli(storageKey, items) {
  localStorage.setItem(storageKey, JSON.stringify(sortCapitoli(items)));
}

/**
 * @param {Capitolo[]} capitoli
 * @param {string} id
 * @returns {Capitolo | null}
 */
export function getCapitoloById(capitoli, id) {
  const sid = String(id ?? "").trim();
  if (!sid) return null;
  return (capitoli || []).find((c) => c.id === sid) || null;
}

/**
 * Imposta la sequenza di un capitolo già esistente.
 * Se un altro capitolo ha già quel numero, i due si scambiano
 * (es. 2 → 1: l’ex capitolo 1 diventa 2).
 *
 * @param {Capitolo[]} capitoli
 * @param {string} capitoloId
 * @param {number} nuovaSequenza
 * @returns {Capitolo[]}
 */
export function applicaSequenzaConScambio(capitoli, capitoloId, nuovaSequenza) {
  const sid = String(capitoloId ?? "").trim();
  const seq = Math.floor(Number(nuovaSequenza));
  if (!sid || !Number.isFinite(seq) || seq < 1) {
    return Array.isArray(capitoli) ? [...capitoli] : [];
  }
  const list = Array.isArray(capitoli) ? capitoli : [];
  const target = list.find((c) => c.id === sid);
  if (!target) return [...list];
  const oldSeq = target.sequenza;
  if (oldSeq === seq) return [...list];
  const other = list.find((c) => c.id !== sid && c.sequenza === seq);
  return list.map((c) => {
    if (c.id === sid) return { ...c, sequenza: seq };
    if (other && c.id === other.id) return { ...c, sequenza: oldSeq };
    return c;
  });
}

/**
 * @param {string|null|undefined} capitoloId
 * @returns {string}
 */
export function capitoloGroupKey(capitoloId) {
  const sid = String(capitoloId ?? "").trim();
  return sid || CAPITOLO_SENZA_KEY;
}

/**
 * Gruppi ordinati: capitoli per sequenza, poi «Senza capitolo» in fondo.
 * Dentro ogni gruppo le voci sono ordinate per posizione / idVoce.
 *
 * @param {object[]} voci
 * @param {Capitolo[]} capitoli
 * @returns {{ key: string, capitolo: Capitolo | null, sequenzaLabel: number | null, voci: object[] }[]}
 */
export function buildVociGroupsByCapitolo(voci, capitoli) {
  const caps = sortCapitoli(capitoli || []);
  const byId = new Map(caps.map((c) => [c.id, c]));
  /** @type {Map<string, object[]>} */
  const buckets = new Map();
  for (const c of caps) buckets.set(c.id, []);
  buckets.set(CAPITOLO_SENZA_KEY, []);

  for (const v of Array.isArray(voci) ? voci : []) {
    const cid = typeof v?.capitoloId === "string" ? v.capitoloId.trim() : "";
    const key = cid && byId.has(cid) ? cid : CAPITOLO_SENZA_KEY;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(v);
  }

  const sortVoci = (arr) =>
    [...arr].sort(
      (a, b) =>
        Number(a.posizione || 0) - Number(b.posizione || 0) ||
        Number(a.idVoce || 0) - Number(b.idVoce || 0),
    );

  const groups = [];
  for (const c of caps) {
    groups.push({
      key: c.id,
      capitolo: c,
      sequenzaLabel: c.sequenza,
      voci: sortVoci(buckets.get(c.id) || []),
    });
  }
  const senza = sortVoci(buckets.get(CAPITOLO_SENZA_KEY) || []);
  if (senza.length > 0 || caps.length === 0) {
    groups.push({
      key: CAPITOLO_SENZA_KEY,
      capitolo: null,
      sequenzaLabel: null,
      voci: senza,
    });
  }
  return groups;
}

/**
 * Etichetta stampa/video: "1.2" oppure solo "2" se senza capitolo (indice locale).
 * @param {{ sequenzaLabel: number | null }} group
 * @param {number} indexInGroupZeroBased
 */
export function formatVoceNumeroCapitolo(group, indexInGroupZeroBased) {
  const n = indexInGroupZeroBased + 1;
  if (group?.sequenzaLabel != null && Number.isFinite(group.sequenzaLabel)) {
    return `${group.sequenzaLabel}.${n}`;
  }
  return String(n);
}
