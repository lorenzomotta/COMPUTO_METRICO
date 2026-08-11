/**
 * Dopo «REGISTRA VANO»:
 * - se una «voce breve» di strato non esiste ancora in VOCI, crea la voce (MANUALE, mq.);
 * - per le voci il cui `voceAbbreviata` coincide: aggiunge righe `misurazioniManuali`
 *   SEMIAUTOMATICA (PARETE, M1/M2 dalla parete) con `apertureCollegate` dagli id scelti in VANI.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

/** Stesso valore usato in `main.js` per le righe semiautomatiche. */
const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
/** Allineato a `TIPOMISURA_VOCE_MANUALE` in main (misurazioni in `misurazioniManuali`). */
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
/** Unità tipica superfici parete; l’utente può cambiarla dopo in VOCI. */
const UNITA_MISURA_DEFAULT_VANI = "mq.";

function abbrevKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

/** Allineato a `parseNonNegativeDecimal3OrNull` in main (MISURA1/2/3). */
function parseNonNegativeDecimal3OrNull(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return null;
  const normalized = txt.replaceAll(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

function mmFactorOrOne(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

/** Come `calcolaMisurazioneVoceSemiautomatica` in main (M2/M3 null → fattore 1). */
function calcolaRisultatoSemiautomatico(misura1, misura2, misura3, numero, segno) {
  if (!Number.isInteger(numero) || numero < 0) return 0;
  const raw = Number(
    (mmFactorOrOne(misura1) * mmFactorOrOne(misura2) * mmFactorOrOne(misura3) * numero).toFixed(3),
  );
  return segno ? -Math.abs(raw) : raw;
}

function buildApertureCollegateRefsFromParete(parete) {
  const ids = Array.isArray(parete.idApertureMaster) ? parete.idApertureMaster : [];
  return ids
    .map((id) => String(id ?? "").trim())
    .filter(Boolean)
    .map((id) => ({ idAperturaMaster: id }));
}

function isRigaSemiautoParete(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return tipo === VOCE_MM_TIPO_SEMIAUTOMATICA && tipoOggetto === "PARETE";
}

/**
 * Riga misurazione compatibile con `normalizzaMisurazioniManualiVoce` in main.
 * @param {{ pianoNome: string, parete: object, vaniVanoId: string }} opts
 */
function creaRigaMisurazioneSemiautomaticaParete({ pianoNome, parete, strato, vaniVanoId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const riferimento = typeof parete.riferimento === "string" ? parete.riferimento.trim() : "";
  const locale = typeof parete.nomeLocale === "string" ? parete.nomeLocale.trim() : "";
  const specifica = `${locale}${locale && riferimento ? " + " : ""}${riferimento}`.trim();
  const misura1 = parseNonNegativeDecimal3OrNull(parete.lunghezza);
  const stratoAltezza = parseNonNegativeDecimal3OrNull(strato?.altezza);
  const stratoElevazione = parseNonNegativeDecimal3OrNull(strato?.elevazione);
  const misura2 = stratoAltezza ?? parseNonNegativeDecimal3OrNull(parete.altezza);
  const misura3 = null;
  const numero = 1;
  const segno = false;
  const risultato = calcolaRisultatoSemiautomatico(misura1, misura2, misura3, numero, segno);
  const vid = typeof vaniVanoId === "string" ? vaniVanoId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: "PARETE",
    specifica,
    formula: "",
    formulaValue: null,
    misura1,
    misura2,
    misura3,
    canaleGronda: false,
    grondaCanaleValore: null,
    numero,
    segno,
    risultato,
    apertureCollegate: buildApertureCollegateRefsFromParete(parete),
    vaniVanoId: vid,
    stratoAltezza,
    stratoElevazione,
  };
}

/** Snapshot vano: `locali[]` oppure legacy `nomeLocale` + `pareti`. */
function iterSnapshotLocali(snapshot) {
  if (Array.isArray(snapshot.locali) && snapshot.locali.length > 0) {
    return snapshot.locali.map((blocco) => ({
      nomeLocale: typeof blocco.nomeLocale === "string" ? blocco.nomeLocale : "",
      pareti: Array.isArray(blocco.pareti) ? blocco.pareti : [],
    }));
  }
  return [
    {
      nomeLocale: typeof snapshot.nomeLocale === "string" ? snapshot.nomeLocale : "",
      pareti: Array.isArray(snapshot.pareti) ? snapshot.pareti : [],
    },
  ];
}

/**
 * Crea una voce MANUALE minima compatibile con `loadVoci` in main
 * (`voce` non può essere vuota, altrimenti viene scartata al reload).
 * @param {{ idVoce: number, posizione: number, voceAbbreviata: string }} opts
 */
function creaVoceManualeDaVocibreve({ idVoce, posizione, voceAbbreviata }) {
  const ab = String(voceAbbreviata ?? "").trim();
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    unitaMisura: UNITA_MISURA_DEFAULT_VANI,
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
  };
}

/**
 * Legge/scrive `computo_metrico_voci`; non modifica più il campo `note`.
 * Se manca la voce con quella abbreviata, la crea al momento della registrazione.
 * @param {object} snapshot Output di `creaSnapshotRegistrato` (con `locali[]` o legacy).
 */
export function aggiornaNoteVociDaSnapshotVanoRegistrato(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const vanoId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const blocchiLocali = iterSnapshotLocali(snapshot);

  /** @type {Map<string, string>} chiave normalizzata → testo originale della voce breve */
  const abbrevsConStrato = new Map();
  for (const blocco of blocchiLocali) {
    for (const parete of blocco.pareti) {
      const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
      for (const st of strat) {
        const vb = typeof st.vocibreve === "string" ? st.vocibreve.trim() : "";
        if (!vb) continue;
        const key = abbrevKey(vb);
        if (!abbrevsConStrato.has(key)) abbrevsConStrato.set(key, vb);
      }
    }
  }

  if (abbrevsConStrato.size === 0) return;

  let raw;
  try {
    raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
  } catch {
    return;
  }

  let voci;
  if (!raw) {
    voci = [];
  } else {
    try {
      voci = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(voci)) return;
  }

  let changed = false;

  const keysGiaPresenti = new Set();
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (ab) keysGiaPresenti.add(abbrevKey(ab));
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

  for (const [key, label] of abbrevsConStrato) {
    if (keysGiaPresenti.has(key)) continue;
    voci.push(
      creaVoceManualeDaVocibreve({
        idVoce: nextId,
        posizione: nextPos,
        voceAbbreviata: label,
      }),
    );
    keysGiaPresenti.add(key);
    nextId += 1;
    nextPos += 1;
    changed = true;
  }

  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (!ab || !abbrevsConStrato.has(abbrevKey(ab))) continue;

    const seenMm = new Set();
    const nuoveRigheMm = [];
    for (const blocco of blocchiLocali) {
      const nomeLocaleBlocco = typeof blocco.nomeLocale === "string" ? blocco.nomeLocale : "";
      for (const parete of blocco.pareti) {
        const rif = typeof parete.riferimento === "string" ? parete.riferimento : "";
        const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
        strat.forEach((st, stIdx) => {
          const vb = typeof st?.vocibreve === "string" ? st.vocibreve : "";
          if (abbrevKey(vb) !== abbrevKey(ab)) return;
          const dedupeKey = [
            abbrevKey(rif),
            abbrevKey(pianoNome),
            abbrevKey(nomeLocaleBlocco),
            String(st?.id ?? ""),
            String(stIdx),
          ].join("|");
          if (seenMm.has(dedupeKey)) return;
          seenMm.add(dedupeKey);
          nuoveRigheMm.push(
            creaRigaMisurazioneSemiautomaticaParete({
              pianoNome,
              parete: { ...parete, nomeLocale: nomeLocaleBlocco },
              strato: st,
              vaniVanoId: vanoId,
            }),
          );
        });
      }
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestoVano = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoParete(old)) return true;
      if (!vanoId) return true;
      const oldVid = typeof old.vaniVanoId === "string" ? old.vaniVanoId.trim() : "";
      return oldVid !== vanoId;
    });
    const mmAggiornate = [...mmSenzaQuestoVano, ...nuoveRigheMm];
    if (JSON.stringify(mmAggiornate) !== JSON.stringify(mmCorrenti)) {
      changed = true;
      item.misurazioniManuali = mmAggiornate;
    }
  }

  if (!changed) return;

  try {
    localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  } catch {
    /* ignore */
  }
}

/**
 * Quando un vano viene eliminato dall’elenco VANI, rimuove le righe `misurazioniManuali`
 * semiautomatiche PARETE con `vaniVanoId` uguale a quell’id (stesso storage delle voci).
 * @param {string} vanoId
 */
export function rimuoviRigheMisurazioniPerVanoId(vanoId) {
  const vid = String(vanoId ?? "").trim();
  if (!vid) return;

  let raw;
  try {
    raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let voci;
  try {
    voci = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(voci)) return;

  let changed = false;
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const filtered = mm.filter((row) => {
      if (!isRigaSemiautoParete(row)) return true;
      const oldVid = typeof row.vaniVanoId === "string" ? row.vaniVanoId.trim() : "";
      return oldVid !== vid;
    });
    if (filtered.length !== mm.length) {
      changed = true;
      item.misurazioniManuali = filtered;
    }
  }

  if (!changed) return;

  try {
    localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  } catch {
    /* ignore */
  }
}
