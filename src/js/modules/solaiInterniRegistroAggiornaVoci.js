/**
 * Dopo «REGISTRA SOLAIO»:
 * - crea voci MANUALE se manca la voce breve (strato o trave);
 * - scrive misurazioni SEMIAUTOMATICA con marker `solaiInterniSchedaId`;
 * - se la voce esiste già, accoda le misure (sostituendo quelle della stessa scheda).
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";
import { areaHaTrave } from "./solaiInterniSuperfici.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_MQ = "mq.";
const UNITA_MC = "mc.";
const TIPO_SOLAIO = "SOLAIO_INTERNO";
const TIPO_TRAVE = "SOLAIO_TRAVE";

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

function isRigaSemiautoSolai(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return (
    tipo === VOCE_MM_TIPO_SEMIAUTOMATICA &&
    (tipoOggetto === TIPO_SOLAIO || tipoOggetto === TIPO_TRAVE)
  );
}

function creaVoceManualeDaVocibreve({ idVoce, posizione, voceAbbreviata, unitaMisura }) {
  const ab = String(voceAbbreviata ?? "").trim();
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    unitaMisura: unitaMisura || UNITA_MQ,
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
  };
}

function creaRigaSolaio({ pianoNome, descrizione, area, strato, schedaId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const desc = typeof descrizione === "string" ? descrizione.trim() : "";
  const rifArea = typeof area?.riferimento === "string" ? area.riferimento.trim() : "";
  const riferimento = ["Solaio", desc, rifArea].filter(Boolean).join(" · ");
  const nStrato =
    typeof strato?.n === "number" && Number.isFinite(strato.n) ? String(strato.n) : "";
  const nArea = typeof area?.n === "number" && Number.isFinite(area.n) ? String(area.n) : "";
  const specificaParts = [];
  if (nArea) specificaParts.push(`Area ${nArea}`);
  if (nStrato) specificaParts.push(`Strato ${nStrato}`);
  const specifica = specificaParts.join(" · ") || "Solaio interno";
  const misura1 = parseNonNegativeDecimal3OrNull(area?.lato1);
  const misura2 = parseNonNegativeDecimal3OrNull(area?.lato2);
  const spessoreTxt = String(strato?.spessore ?? "").trim();
  const misura3 = spessoreTxt === "" ? null : parseNonNegativeDecimal3OrNull(spessoreTxt);
  const segno = area?.segno === true;
  const numero = 1;
  const m1 = typeof misura1 === "number" ? misura1 : 0;
  const m2 = typeof misura2 === "number" ? misura2 : 0;
  const raw =
    misura3 != null
      ? Number((m1 * m2 * misura3 * numero).toFixed(3))
      : Number((m1 * m2 * numero).toFixed(3));
  const risultato = segno ? -Math.abs(raw) : raw;
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_SOLAIO,
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
    solaiInterniSchedaId: sid,
    stratoNumero: typeof strato?.n === "number" ? strato.n : null,
    areaNumero: typeof area?.n === "number" ? area.n : null,
  };
}

function labelTipiTrave(area) {
  const parti = [];
  if (area?.traveInSpessore === true) parti.push("Trave in spessore");
  if (area?.traveInAltezza === true) parti.push("Trave in altezza");
  return parti.join(" + ") || "Trave";
}

function creaRigaTrave({ pianoNome, descrizione, area, schedaId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const desc = typeof descrizione === "string" ? descrizione.trim() : "";
  const rifArea = typeof area?.riferimento === "string" ? area.riferimento.trim() : "";
  const riferimento = ["Solaio", desc, rifArea, labelTipiTrave(area)].filter(Boolean).join(" · ");
  const nArea = typeof area?.n === "number" && Number.isFinite(area.n) ? String(area.n) : "";
  const specifica = nArea ? `Area ${nArea} · ${labelTipiTrave(area)}` : labelTipiTrave(area);
  const misura1 = parseNonNegativeDecimal3OrNull(area?.lato1);
  const misura2 = parseNonNegativeDecimal3OrNull(area?.lato2);
  const misura3 = parseNonNegativeDecimal3OrNull(area?.altezzaTrave);
  const numero = 1;
  const m1 = typeof misura1 === "number" ? misura1 : 0;
  const m2 = typeof misura2 === "number" ? misura2 : 0;
  const m3 = typeof misura3 === "number" ? misura3 : 0;
  const risultato = Number((m1 * m2 * m3 * numero).toFixed(3));
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_TRAVE,
    specifica,
    formula: "",
    formulaValue: null,
    misura1,
    misura2,
    misura3,
    canaleGronda: false,
    grondaCanaleValore: null,
    numero,
    segno: false,
    risultato,
    apertureCollegate: [],
    solaiInterniSchedaId: sid,
    areaNumero: typeof area?.n === "number" ? area.n : null,
    traveInSpessore: area?.traveInSpessore === true,
    traveInAltezza: area?.traveInAltezza === true,
  };
}

/**
 * @param {{ id: string, pianoNome: string, descrizione?: string, aree?: object[], strati?: object[], note?: string }} snapshot
 */
export function aggiornaVociDaSnapshotSolaiInterni(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const descrizione = typeof snapshot.descrizione === "string" ? snapshot.descrizione : "";
  const aree = Array.isArray(snapshot.aree) ? snapshot.aree : [];
  const strati = Array.isArray(snapshot.strati) ? snapshot.strati : [];

  /** @type {Map<string, { label: string, unita: string }>} */
  const abbrevs = new Map();

  for (const st of strati) {
    const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
    if (!vb) continue;
    const key = abbrevKey(vb);
    if (!abbrevs.has(key)) {
      const hasSp = String(st?.spessore ?? "").trim() !== "";
      abbrevs.set(key, { label: vb, unita: hasSp ? UNITA_MC : UNITA_MQ });
    }
  }

  for (const area of aree) {
    if (!areaHaTrave(area) || area?.segno !== true) continue;
    const vb = typeof area?.vocibreveTrave === "string" ? area.vocibreveTrave.trim() : "";
    if (!vb) continue;
    const key = abbrevKey(vb);
    if (!abbrevs.has(key)) abbrevs.set(key, { label: vb, unita: UNITA_MC });
  }

  if (abbrevs.size === 0) return;

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

  for (const [key, meta] of abbrevs) {
    if (keysGiaPresenti.has(key)) continue;
    voci.push(
      creaVoceManualeDaVocibreve({
        idVoce: nextId,
        posizione: nextPos,
        voceAbbreviata: meta.label,
        unitaMisura: meta.unita,
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
    if (!ab || !abbrevs.has(abbrevKey(ab))) continue;

    const seenMm = new Set();
    const nuoveRigheMm = [];

    for (const st of strati) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (abbrevKey(vb) !== abbrevKey(ab)) continue;
      for (const area of aree) {
        const dedupeKey = [
          "solaio",
          String(st?.id ?? ""),
          String(area?.id ?? ""),
          String(st?.n ?? ""),
          String(area?.n ?? ""),
        ].join("|");
        if (seenMm.has(dedupeKey)) continue;
        seenMm.add(dedupeKey);
        nuoveRigheMm.push(
          creaRigaSolaio({
            pianoNome,
            descrizione,
            area,
            strato: st,
            schedaId,
          }),
        );
      }
    }

    for (const area of aree) {
      if (!areaHaTrave(area) || area?.segno !== true) continue;
      const vb = typeof area?.vocibreveTrave === "string" ? area.vocibreveTrave.trim() : "";
      if (abbrevKey(vb) !== abbrevKey(ab)) continue;
      const h = String(area?.altezzaTrave ?? "").trim();
      if (!h) continue;
      const dedupeKey = ["trave", String(area?.id ?? ""), String(area?.n ?? "")].join("|");
      if (seenMm.has(dedupeKey)) continue;
      seenMm.add(dedupeKey);
      nuoveRigheMm.push(
        creaRigaTrave({
          pianoNome,
          descrizione,
          area,
          schedaId,
        }),
      );
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoSolai(old)) return true;
      if (!schedaId) return true;
      const oldSid =
        typeof old.solaiInterniSchedaId === "string" ? old.solaiInterniSchedaId.trim() : "";
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

export function rimuoviRigheMisurazioniPerSchedaSolaiInterni(schedaId) {
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
      if (!isRigaSemiautoSolai(row)) return true;
      const oldSid =
        typeof row.solaiInterniSchedaId === "string" ? row.solaiInterniSchedaId.trim() : "";
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
