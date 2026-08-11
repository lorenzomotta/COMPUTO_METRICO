/**
 * Dopo «REGISTRA» in CAMMINAMENTI: per ogni voce con abbreviata = vocibreve strato,
 * aggiunge righe SEMIAUTOMATICA (tipoOggetto CAMMINAMENTO) con M1/M2/spessore e segno.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPO_OGGETTO_CAMMINAMENTO = "CAMMINAMENTO";

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

function normalizzaUnita(unitaRaw) {
  return String(unitaRaw ?? "")
    .trim()
    .toLowerCase();
}

function calcolaRisultatoPerUnita(unitaRaw, misura1, misura2, misura3, segno) {
  const unitaNorm = normalizzaUnita(unitaRaw);
  const m1 = typeof misura1 === "number" && Number.isFinite(misura1) ? misura1 : 0;
  const m2 = typeof misura2 === "number" && Number.isFinite(misura2) ? misura2 : 0;
  const m3 = typeof misura3 === "number" && Number.isFinite(misura3) ? misura3 : 0;
  let raw = 0;
  if (unitaNorm.includes("ml")) raw = Number((m1).toFixed(3));
  else if (unitaNorm.includes("mq")) raw = Number((m1 * m2).toFixed(3));
  else if (unitaNorm.includes("mc")) raw = Number((m1 * m2 * m3).toFixed(3));
  else raw = Number((m1 * m2 * m3).toFixed(3));
  return segno ? -Math.abs(raw) : raw;
}

function isRigaSemiautoCamminamento(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return tipo === VOCE_MM_TIPO_SEMIAUTOMATICA && tipoOggetto === TIPO_OGGETTO_CAMMINAMENTO;
}

/**
 * @param {{ pianoNome: string, riferimento: object, strato: object, schedaId: string, unitaMisura: string }} opts
 */
function creaRigaMisurazioneCamminamento({
  pianoNome,
  riferimento,
  strato,
  schedaId,
  unitaMisura,
}) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const rif = typeof riferimento.riferimento === "string" ? riferimento.riferimento.trim() : "";
  const misura1 = parseNonNegativeDecimal3OrNull(riferimento.lato1);
  const misura2 = parseNonNegativeDecimal3OrNull(riferimento.lato2);
  const misura3 = parseNonNegativeDecimal3OrNull(strato?.spessore);
  const segno = strato?.segno === true;
  const numero = 1;
  const risultato = calcolaRisultatoPerUnita(unitaMisura, misura1, misura2, misura3, segno);
  const nStrato =
    typeof strato?.n === "number" && Number.isFinite(strato.n) ? String(strato.n) : "";
  const specifica = nStrato ? `Strato ${nStrato}` : "";
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento: rif,
    tipoOggetto: TIPO_OGGETTO_CAMMINAMENTO,
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
    apertureCollegate: [],
    camminamentiSchedaId: sid,
    stratoNumero: typeof strato?.n === "number" ? strato.n : null,
  };
}

function trovaUnitaMisuraVoce(voci, abbrev) {
  const voce = voci.find(
    (v) =>
      v &&
      typeof v.voceAbbreviata === "string" &&
      abbrevKey(v.voceAbbreviata) === abbrevKey(abbrev),
  );
  return voce && typeof voce.unitaMisura === "string" ? voce.unitaMisura : "mq.";
}

/**
 * @param {object} snapshot { id, pianoNome, riferimenti[] }
 */
export function aggiornaVociDaSnapshotCamminamentoRegistrato(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const riferimenti = Array.isArray(snapshot.riferimenti) ? snapshot.riferimenti : [];

  const abbrevsConStrato = new Set();
  for (const rif of riferimenti) {
    const strat = Array.isArray(rif.strati) ? rif.strati : [];
    for (const st of strat) {
      const vb = typeof st.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (vb) abbrevsConStrato.add(abbrevKey(vb));
    }
  }
  if (abbrevsConStrato.size === 0) return;

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
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (!ab || !abbrevsConStrato.has(abbrevKey(ab))) continue;

    const unitaMisura = trovaUnitaMisuraVoce(voci, ab);
    const seenMm = new Set();
    const nuoveRigheMm = [];

    for (const rif of riferimenti) {
      const strat = Array.isArray(rif.strati) ? rif.strati : [];
      strat.forEach((st, stIdx) => {
        const vb = typeof st?.vocibreve === "string" ? st.vocibreve : "";
        if (abbrevKey(vb) !== abbrevKey(ab)) return;
        const dedupeKey = [
          abbrevKey(rif.riferimento),
          abbrevKey(pianoNome),
          String(st?.id ?? ""),
          String(stIdx),
        ].join("|");
        if (seenMm.has(dedupeKey)) return;
        seenMm.add(dedupeKey);
        nuoveRigheMm.push(
          creaRigaMisurazioneCamminamento({
            pianoNome,
            riferimento: rif,
            strato: st,
            schedaId,
            unitaMisura,
          }),
        );
      });
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoCamminamento(old)) return true;
      if (!schedaId) return true;
      const oldSid =
        typeof old.camminamentiSchedaId === "string" ? old.camminamentiSchedaId.trim() : "";
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

/**
 * @param {string} schedaId
 */
export function rimuoviRigheMisurazioniPerCamminamentiSchedaId(schedaId) {
  const sid = String(schedaId ?? "").trim();
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
    const filtered = mm.filter((row) => {
      if (!isRigaSemiautoCamminamento(row)) return true;
      const oldSid =
        typeof row.camminamentiSchedaId === "string" ? row.camminamentiSchedaId.trim() : "";
      return oldSid !== sid;
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
