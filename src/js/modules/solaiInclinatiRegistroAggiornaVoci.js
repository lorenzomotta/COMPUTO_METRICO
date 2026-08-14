/**
 * Dopo «REGISTRA SOLAIO INCLINATO»:
 * - crea voci se manca la voce breve;
 * - scrive SEMIAUTOMATICA con marker `solaiInclinatiSchedaId`;
 * - area con formula falda; CANALE → canaleGronda + grondaCanaleValore.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";
import { areaHaTrave, mqDiAreaFalda } from "./solaiInclinatiSuperfici.js";
import { testoFormulaFalda, parseDimFalda } from "./solaiInclinatiFalda.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_MQ = "mq.";
const UNITA_MC = "mc.";
const TIPO_SOLAIO = "SOLAIO_INCLINATO";
const TIPO_TRAVE = "SOLAIO_INCLINATO_TRAVE";

function abbrevKey(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("it-IT");
}

function parseNonNegativeDecimal3OrNull(raw) {
  return parseDimFalda(raw);
}

function isRigaSemiautoSolaiIncl(row) {
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

function creaRigaSolaioInclinato({ pianoNome, descrizione, area, strato, schedaId, attachCanale }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const desc = typeof descrizione === "string" ? descrizione.trim() : "";
  const rifArea = typeof area?.riferimento === "string" ? area.riferimento.trim() : "";
  const riferimento = ["Solaio inclinato", desc, rifArea].filter(Boolean).join(" · ");
  const nStrato =
    typeof strato?.n === "number" && Number.isFinite(strato.n) ? String(strato.n) : "";
  const nArea = typeof area?.n === "number" && Number.isFinite(area.n) ? String(area.n) : "";
  const specificaParts = [];
  if (nArea) specificaParts.push(`Area ${nArea}`);
  if (nStrato) specificaParts.push(`Strato ${nStrato}`);
  const specifica = specificaParts.join(" · ") || "Solaio inclinato";
  const pendenza = parseNonNegativeDecimal3OrNull(area?.pendenza);
  const spessoreTxt = String(strato?.spessore ?? "").trim();
  const spessore = spessoreTxt === "" ? null : parseNonNegativeDecimal3OrNull(spessoreTxt);
  const mq = mqDiAreaFalda(area);
  // In VOCI: misura1 = mq falda, misura2 = spessore (o 1) → stesso schema area/volume.
  const misura1 = mq;
  const misura2 = spessore != null ? spessore : 1;
  const misura3 = null;
  const segno = area?.segno === true;
  const numero = 1;
  const raw =
    spessore != null ? Number((mq * spessore * numero).toFixed(3)) : Number((mq * numero).toFixed(3));
  const risultato = segno ? -Math.abs(raw) : raw;
  const formulaBase = testoFormulaFalda(area?.gronda, area?.salita, area?.pendenza);
  const formula =
    spessore != null && formulaBase
      ? `(${formulaBase} * ${Number(spessore).toFixed(3)})`
      : formulaBase;
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  const grondaVal = parseNonNegativeDecimal3OrNull(area?.gronda);
  const withCanale = attachCanale === true && area?.canale === true && grondaVal != null;
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_SOLAIO,
    specifica,
    formula: formula || "",
    formulaValue: mq,
    misura1,
    misura2,
    misura3,
    canaleGronda: withCanale,
    grondaCanaleValore: withCanale ? Number(grondaVal.toFixed(3)) : null,
    numero,
    segno,
    risultato,
    apertureCollegate: [],
    solaiInclinatiSchedaId: sid,
    stratoNumero: typeof strato?.n === "number" ? strato.n : null,
    areaNumero: typeof area?.n === "number" ? area.n : null,
    faldaGronda: grondaVal,
    faldaSalita: parseNonNegativeDecimal3OrNull(area?.salita),
    faldaPendenza: pendenza,
  };
}

function labelTipiTrave(area) {
  if (area?.traveInSpessore === true) return "Trave in spessore";
  if (area?.traveInAltezza === true) return "Trave in altezza";
  return "Trave";
}

function creaRigaTraveInclinato({ pianoNome, descrizione, area, schedaId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const desc = typeof descrizione === "string" ? descrizione.trim() : "";
  const rifArea = typeof area?.riferimento === "string" ? area.riferimento.trim() : "";
  const riferimento = ["Solaio inclinato", desc, rifArea, labelTipiTrave(area)]
    .filter(Boolean)
    .join(" · ");
  const nArea = typeof area?.n === "number" && Number.isFinite(area.n) ? String(area.n) : "";
  const specifica = nArea ? `Area ${nArea} · ${labelTipiTrave(area)}` : labelTipiTrave(area);
  const mq = mqDiAreaFalda(area);
  const misura3 = parseNonNegativeDecimal3OrNull(area?.altezzaTrave);
  const h = typeof misura3 === "number" ? misura3 : 0;
  const risultato = Number((mq * h).toFixed(3));
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_TRAVE,
    specifica,
    formula: "",
    formulaValue: null,
    misura1: mq,
    misura2: 1,
    misura3,
    canaleGronda: false,
    grondaCanaleValore: null,
    numero: 1,
    segno: false,
    risultato,
    apertureCollegate: [],
    solaiInclinatiSchedaId: sid,
    areaNumero: typeof area?.n === "number" ? area.n : null,
    traveInSpessore: area?.traveInSpessore === true,
    traveInAltezza: area?.traveInAltezza === true,
  };
}

export function aggiornaVociDaSnapshotSolaiInclinati(snapshot) {
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
  if (!raw) voci = [];
  else {
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

  /** Area già usata per CANALE (una sola volta per area). */
  const canaleAreaUsata = new Set();

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
          "solaio-incl",
          String(st?.id ?? ""),
          String(area?.id ?? ""),
        ].join("|");
        if (seenMm.has(dedupeKey)) continue;
        seenMm.add(dedupeKey);
        const areaKey = String(area?.id ?? "");
        const attachCanale = area?.canale === true && !canaleAreaUsata.has(areaKey);
        if (attachCanale) canaleAreaUsata.add(areaKey);
        nuoveRigheMm.push(
          creaRigaSolaioInclinato({
            pianoNome,
            descrizione,
            area,
            strato: st,
            schedaId,
            attachCanale,
          }),
        );
      }
    }

    for (const area of aree) {
      if (!areaHaTrave(area) || area?.segno !== true) continue;
      const vb = typeof area?.vocibreveTrave === "string" ? area.vocibreveTrave.trim() : "";
      if (abbrevKey(vb) !== abbrevKey(ab)) continue;
      if (!String(area?.altezzaTrave ?? "").trim()) continue;
      const dedupeKey = ["trave-incl", String(area?.id ?? "")].join("|");
      if (seenMm.has(dedupeKey)) continue;
      seenMm.add(dedupeKey);
      nuoveRigheMm.push(
        creaRigaTraveInclinato({
          pianoNome,
          descrizione,
          area,
          schedaId,
        }),
      );
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoSolaiIncl(old)) return true;
      if (!schedaId) return true;
      const oldSid =
        typeof old.solaiInclinatiSchedaId === "string" ? old.solaiInclinatiSchedaId.trim() : "";
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

export function rimuoviRigheMisurazioniPerSchedaSolaiInclinati(schedaId) {
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
      if (!isRigaSemiautoSolaiIncl(row)) return true;
      const oldSid =
        typeof row.solaiInclinatiSchedaId === "string" ? row.solaiInclinatiSchedaId.trim() : "";
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
