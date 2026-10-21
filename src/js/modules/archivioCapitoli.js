/**
 * Archivio CAPITOLI per raggruppare le VOCI.
 * Un capitolo può avere sotto di sé fino a due livelli
 * (es. STRADA INTERNA → OPERE STRADALI → MARCIAPIEDI).
 * La voce punta sempre a un solo capitolo o livello.
 */

export const ARCHIVIO_CAPITOLI_STORAGE_KEY = "computo_metrico_archivio_capitoli";

/** Id speciale per il gruppo «Senza capitolo» (solo UI / collapse). */
export const CAPITOLO_SENZA_KEY = "__senza__";

/** 0 = capitolo, 1 = primo livello, 2 = secondo livello. */
export const PROFONDITA_MASSIMA = 2;

/**
 * @typedef {{ id: string, sequenza: number, nome: string, padreId: string }} Capitolo
 */

export function createCapitoloId() {
  return `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** @param {Capitolo | null | undefined} capitolo */
export function padreIdCapitolo(capitolo) {
  return String(capitolo?.padreId || "").trim();
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
  let padreId = typeof raw.padreId === "string" ? raw.padreId.trim() : "";
  if (padreId === id) padreId = "";
  return { id, sequenza, nome, padreId };
}

/**
 * Toglie padri inesistenti, i giri e i livelli oltre il secondo.
 * @param {Capitolo[]} items
 * @returns {Capitolo[]}
 */
export function sanitizzaCapitoli(items) {
  const list = (Array.isArray(items) ? items : []).map((c) => ({
    ...c,
    padreId: padreIdCapitolo(c),
  }));
  const ids = new Set(list.map((c) => c.id));
  for (const c of list) {
    if (!c.padreId || c.padreId === c.id || !ids.has(c.padreId)) c.padreId = "";
  }
  const byId = new Map(list.map((c) => [c.id, c]));
  for (const c of list) {
    const visti = new Set([c.id]);
    let padre = c.padreId;
    while (padre) {
      if (visti.has(padre)) {
        c.padreId = "";
        break;
      }
      visti.add(padre);
      padre = padreIdCapitolo(byId.get(padre));
    }
  }
  for (let giro = 0; giro < 8; giro += 1) {
    let cambiato = false;
    for (const c of list) {
      if (profonditaCapitolo(list, c.id) > PROFONDITA_MASSIMA) {
        c.padreId = "";
        cambiato = true;
      }
    }
    if (!cambiato) break;
  }
  return list;
}

/**
 * Ordine dell’albero: prima il capitolo, poi i suoi livelli.
 * @param {Capitolo[]} items
 * @returns {Capitolo[]}
 */
export function sortCapitoli(items) {
  const list = sanitizzaCapitoli(items);
  /** @type {Map<string, Capitolo[]>} */
  const perPadre = new Map();
  for (const c of list) {
    const key = padreIdCapitolo(c);
    if (!perPadre.has(key)) perPadre.set(key, []);
    perPadre.get(key).push(c);
  }
  for (const gruppo of perPadre.values()) {
    gruppo.sort(
      (a, b) => a.sequenza - b.sequenza || a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }),
    );
  }
  /** @type {Capitolo[]} */
  const out = [];
  const visita = (padreId) => {
    for (const c of perPadre.get(padreId) || []) {
      out.push(c);
      visita(c.id);
    }
  };
  visita("");
  return out;
}

/**
 * Dal capitolo verso l’alto: prima il padre diretto.
 * @param {Capitolo[]} capitoli
 * @param {string} id
 * @returns {string[]}
 */
export function catenaPadri(capitoli, id) {
  const byId = new Map((capitoli || []).map((c) => [c.id, c]));
  /** @type {string[]} */
  const chain = [];
  const visti = new Set();
  let cur = byId.get(String(id || "").trim());
  while (cur && padreIdCapitolo(cur)) {
    if (visti.has(cur.id)) break;
    visti.add(cur.id);
    const pid = padreIdCapitolo(cur);
    if (!byId.has(pid)) break;
    chain.push(pid);
    cur = byId.get(pid);
  }
  return chain;
}

/**
 * @param {Capitolo[]} capitoli
 * @param {string} id
 * @returns {number}
 */
export function profonditaCapitolo(capitoli, id) {
  return catenaPadri(capitoli, id).length;
}

/**
 * Quanti piani di livelli ci sono sotto questo nodo (0 se non ha figli).
 * @param {Capitolo[]} capitoli
 * @param {string} id
 * @returns {number}
 */
export function altezzaSottoalbero(capitoli, id) {
  const sid = String(id || "").trim();
  const figli = (capitoli || []).filter((c) => padreIdCapitolo(c) === sid);
  if (!figli.length) return 0;
  return 1 + Math.max(...figli.map((f) => altezzaSottoalbero(capitoli, f.id)));
}

/**
 * Si può mettere questo nodo sotto quel padre senza superare i due livelli.
 * Padre vuoto = diventa un capitolo principale.
 * @param {Capitolo[]} capitoli
 * @param {string} nodoId
 * @param {string} nuovoPadreId
 */
export function puoMettereSotto(capitoli, nodoId, nuovoPadreId) {
  const padre = String(nuovoPadreId || "").trim();
  const nodo = String(nodoId || "").trim();
  if (!padre) return true;
  if (nodo && padre === nodo) return false;
  if (nodo && catenaPadri(capitoli, padre).includes(nodo)) return false;
  const extra = nodo ? altezzaSottoalbero(capitoli, nodo) : 0;
  return profonditaCapitolo(capitoli, padre) + 1 + extra <= PROFONDITA_MASSIMA;
}

/**
 * Numero del percorso, es. "1.2.3". Vuoto se il capitolo non c’è.
 * @param {Capitolo[]} capitoli
 * @param {string} id
 */
export function numeroPercorsoCapitolo(capitoli, id) {
  const byId = new Map((capitoli || []).map((c) => [c.id, c]));
  const self = byId.get(String(id || "").trim());
  if (!self) return "";
  const padri = catenaPadri(capitoli, self.id).reverse();
  const parti = [];
  for (const pid of padri) {
    const p = byId.get(pid);
    if (p) parti.push(String(p.sequenza));
  }
  parti.push(String(self.sequenza));
  return parti.join(".");
}

/**
 * Questo id e tutti i livelli che stanno sotto.
 * @param {Capitolo[]} capitoli
 * @param {string} id
 * @returns {string[]}
 */
export function idCapitoloEDiscendenti(capitoli, id) {
  const sid = String(id || "").trim();
  if (!sid) return [];
  /** @type {string[]} */
  const out = [];
  const visita = (corrente) => {
    out.push(corrente);
    for (const c of capitoli || []) {
      if (padreIdCapitolo(c) === corrente) visita(c.id);
    }
  };
  visita(sid);
  return out;
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
 * Imposta la sequenza tra i fratelli (stesso padre).
 * Se un fratello ha già quel numero, i due si scambiano.
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
  const padre = padreIdCapitolo(target);
  const other = list.find(
    (c) => c.id !== sid && padreIdCapitolo(c) === padre && c.sequenza === seq,
  );
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
 * Gruppi in ordine di albero. sequenzaLabel è il percorso ("1" oppure "1.2").
 * Le voci stanno nel gruppo del capitolo o livello a cui sono assegnate.
 *
 * @param {object[]} voci
 * @param {Capitolo[]} capitoli
 * @returns {{ key: string, capitolo: Capitolo | null, sequenzaLabel: string | null, profondita: number, antenati: string[], padreKey: string, voci: object[] }[]}
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
    const antenati = catenaPadri(caps, c.id).reverse();
    groups.push({
      key: c.id,
      capitolo: c,
      sequenzaLabel: numeroPercorsoCapitolo(caps, c.id),
      profondita: antenati.length,
      antenati,
      padreKey: padreIdCapitolo(c),
      voci: sortVoci(buckets.get(c.id) || []),
    });
  }
  const senza = sortVoci(buckets.get(CAPITOLO_SENZA_KEY) || []);
  if (senza.length > 0 || caps.length === 0) {
    groups.push({
      key: CAPITOLO_SENZA_KEY,
      capitolo: null,
      sequenzaLabel: null,
      profondita: 0,
      antenati: [],
      padreKey: "",
      voci: senza,
    });
  }
  return groups;
}

/**
 * Tiene i gruppi che hanno voci, e i capitoli sopra di loro
 * (così si vede l’intestazione anche se le voci stanno in un livello).
 * @param {{ key: string, antenati?: string[], voci: object[] }[]} groups
 */
export function filtraGruppiConContenuto(groups) {
  const lista = Array.isArray(groups) ? groups : [];
  return lista.filter((g) => {
    if (g.voci.length > 0) return true;
    if (g.key === CAPITOLO_SENZA_KEY) return false;
    return lista.some((altro) => altro.voci.length > 0 && (altro.antenati || []).includes(g.key));
  });
}

/**
 * Etichetta stampa/elenco: "1.2" oppure "1.2.3" se c’è un livello.
 * Senza capitolo resta solo il numero della voce.
 * @param {{ sequenzaLabel: string | number | null }} group
 * @param {number} indexInGroupZeroBased
 */
export function formatVoceNumeroCapitolo(group, indexInGroupZeroBased) {
  const n = indexInGroupZeroBased + 1;
  const label = group?.sequenzaLabel;
  if (label != null && String(label).trim() !== "") {
    return `${label}.${n}`;
  }
  return String(n);
}
