/**
 * Dopo «REGISTRA PERIMETRALE»:
 * - crea voci MANUALE (mq.) se manca la voce breve dello strato;
 * - scrive misurazioni SEMIAUTOMATICA (PARETE_PERIMETRALE) con marker `perimetraliSchedaId`.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_MISURA_DEFAULT = "mq.";
const TIPO_OGGETTO = "PARETE_PERIMETRALE";

function abbrevKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

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

function isRigaSemiautoPerimetrale(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return tipo === VOCE_MM_TIPO_SEMIAUTOMATICA && tipoOggetto === TIPO_OGGETTO;
}

function creaRigaMisurazione({ pianoNome, zonaNome, parete, strato, schedaId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const zona = typeof zonaNome === "string" ? zonaNome.trim() : "";
  const riferimento = typeof parete.riferimento === "string" ? parete.riferimento.trim() : "";
  const specifica = `${zona}${zona && riferimento ? " + " : ""}${riferimento}`.trim();
  const misura1 = parseNonNegativeDecimal3OrNull(parete.lunghezza);
  const stratoAltezza = parseNonNegativeDecimal3OrNull(strato?.altezza);
  const stratoElevazione = parseNonNegativeDecimal3OrNull(strato?.elevazione);
  const misura2 = stratoAltezza ?? parseNonNegativeDecimal3OrNull(parete.altezza);
  const misura3 = null;
  const numero = 1;
  const segno = false;
  const risultato = calcolaRisultatoSemiautomatico(misura1, misura2, misura3, numero, segno);
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_OGGETTO,
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
    perimetraliSchedaId: sid,
    stratoAltezza,
    stratoElevazione,
  };
}

function creaVoceManualeDaVocibreve({ idVoce, posizione, voceAbbreviata }) {
  const ab = String(voceAbbreviata ?? "").trim();
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    unitaMisura: UNITA_MISURA_DEFAULT,
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
  };
}

export function aggiornaVociDaSnapshotPerimetrale(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const zonaNome = typeof snapshot.zonaNome === "string" ? snapshot.zonaNome : "";
  const pareti = Array.isArray(snapshot.pareti) ? snapshot.pareti : [];

  const abbrevsConStrato = new Map();
  for (const parete of pareti) {
    const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
    for (const st of strat) {
      const vb = typeof st.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (!vb) continue;
      const key = abbrevKey(vb);
      if (!abbrevsConStrato.has(key)) abbrevsConStrato.set(key, vb);
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
    for (const parete of pareti) {
      const rif = typeof parete.riferimento === "string" ? parete.riferimento : "";
      const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
      strat.forEach((st, stIdx) => {
        const vb = typeof st?.vocibreve === "string" ? st.vocibreve : "";
        if (abbrevKey(vb) !== abbrevKey(ab)) return;
        const dedupeKey = [
          abbrevKey(rif),
          abbrevKey(pianoNome),
          abbrevKey(zonaNome),
          String(st?.id ?? ""),
          String(stIdx),
        ].join("|");
        if (seenMm.has(dedupeKey)) return;
        seenMm.add(dedupeKey);
        nuoveRigheMm.push(
          creaRigaMisurazione({
            pianoNome,
            zonaNome,
            parete,
            strato: st,
            schedaId,
          }),
        );
      });
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoPerimetrale(old)) return true;
      if (!schedaId) return true;
      const oldSid = typeof old.perimetraliSchedaId === "string" ? old.perimetraliSchedaId.trim() : "";
      return oldSid !== schedaId;
    });
    const mmAggiornate = [...mmSenzaQuestaScheda, ...nuoveRigheMm];
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

export function rimuoviRigheMisurazioniPerSchedaPerimetrale(schedaId) {
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  if (!sid) return;
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
    const filtrati = mm.filter((row) => {
      if (!isRigaSemiautoPerimetrale(row)) return true;
      const oldSid = typeof row.perimetraliSchedaId === "string" ? row.perimetraliSchedaId.trim() : "";
      return oldSid !== sid;
    });
    if (filtrati.length !== mm.length) {
      item.misurazioniManuali = filtrati;
      changed = true;
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
