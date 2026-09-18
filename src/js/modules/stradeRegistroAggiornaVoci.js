/**
 * Dopo «REGISTRA STRADA»:
 * - crea voci MANUALE se manca la voce breve dello strato;
 * - scrive misurazioni SEMIAUTOMATICA con marker `stradeSchedaId`;
 * - per ogni strato: una riga per ogni area della zona + una riga negativa
 *   per ogni sottrazione di quello strato;
 * - sede stradale: aree automatiche Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti)
 *   per stesso riferimento (niente sottrazioni per-strato; Cordoli esclusi);
 * - manufatti: quantità in VOCI = moltiplicatore (conteggio a numero, unità n.);
 * - cordoli: quantità in VOCI a metro lineare (formula = lunghezza, unità ml.);
 * - segnaletica / fogna / luci / gas / acqua: formula × moltiplicatore;
 *   unità presa dalla voce dello strato (non forzata).
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";
import {
  TIPI_ZONA_STRADA,
  ZONA_LABELS,
  ZONA_TIPO_OGGETTO,
  evalFormulaArea,
  parseMoltiplicatoreArea,
  isZonaSedeStradale,
  isZonaManufatti,
  isZonaCordoli,
  isZonaFormulaUnitaVoce,
  areeVirtualiSede,
} from "./stradeSuperfici.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_MQ = "mq.";
const UNITA_MC = "mc.";
const UNITA_N = "n.";
const UNITA_ML = "ml.";
/** Sentinel: non forzare unità (usa quella già in VOCI / lascia vuota se nuova). */
const UNITA_DA_VOCE = null;
const TIPI_OGGETTO = new Set(Object.values(ZONA_TIPO_OGGETTO));

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

function isRigaSemiautoStrade(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return tipo === VOCE_MM_TIPO_SEMIAUTOMATICA && TIPI_OGGETTO.has(tipoOggetto);
}

function creaVoceManualeDaVocibreve({ idVoce, posizione, voceAbbreviata, unitaMisura }) {
  const ab = String(voceAbbreviata ?? "").trim();
  // Se unitaMisura è stringa (anche vuota), rispettala; altrimenti default mq.
  const unita =
    typeof unitaMisura === "string" ? unitaMisura : unitaMisura == null ? UNITA_MQ : String(unitaMisura);
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    unitaMisura: unita,
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
  };
}

function creaRigaArea({
  pianoNome,
  descrizione,
  tipoZona,
  area,
  strato,
  schedaId,
  segnoForzato,
  specificaExtra,
}) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const desc = typeof descrizione === "string" ? descrizione.trim() : "";
  const label = ZONA_LABELS[tipoZona] || tipoZona;
  const rifArea = typeof area?.riferimento === "string" ? area.riferimento.trim() : "";
  const riferimento = [label, desc, rifArea].filter(Boolean).join(" · ");
  const nStrato =
    typeof strato?.n === "number" && Number.isFinite(strato.n) ? String(strato.n) : "";
  const nArea = typeof area?.n === "number" && Number.isFinite(area.n) ? String(area.n) : "";
  const formulaTxt = String(area?.formula ?? "").trim();
  const mol = parseMoltiplicatoreArea(area?.moltiplicatore);
  const specificaParts = [];
  if (nArea) specificaParts.push(`Area ${nArea}`);
  if (nStrato) specificaParts.push(`Strato ${nStrato}`);
  const tipoMan = typeof area?.tipoManufatto === "string" ? area.tipoManufatto.trim() : "";
  if (tipoMan) specificaParts.push(tipoMan);
  if (formulaTxt) specificaParts.push(formulaTxt);
  if (!isZonaManufatti(tipoZona) && mol !== 1) specificaParts.push(`×${mol}`);
  if (specificaExtra) specificaParts.push(specificaExtra);
  const specifica = specificaParts.join(" · ") || label;
  const isManufatti = isZonaManufatti(tipoZona);
  const isCordoli = isZonaCordoli(tipoZona);
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipoZona);
  const hasMqFisso = typeof area?.mqFisso === "number" && Number.isFinite(area.mqFisso);
  const formulaVal = hasMqFisso ? Number(Math.abs(area.mqFisso).toFixed(3)) : evalFormulaArea(formulaTxt);
  let misura1;
  let misura2 = null;
  let misura3 = null;
  let numero = 1;
  if (isManufatti) {
    // Quantità in VOCI = moltiplicatore (conteggio a numero).
    if (Number.isInteger(mol) && mol >= 0) {
      misura1 = 1;
      numero = mol;
    } else {
      misura1 = Number((Number.isFinite(mol) && mol >= 0 ? mol : 1).toFixed(3));
      numero = 1;
    }
  } else if (isCordoli || isFormulaUnitaVoce) {
    // Formula × moltiplicatore; niente spessore. Unità: ml (cordoli) o dalla voce (impianti).
    const base = formulaVal == null ? 0 : Number(formulaVal.toFixed(3));
    if (Number.isInteger(mol) && mol >= 0) {
      misura1 = base;
      numero = mol;
    } else {
      misura1 = Number((base * (Number.isFinite(mol) && mol >= 0 ? mol : 1)).toFixed(3));
      numero = 1;
    }
  } else {
    misura1 = hasMqFisso
      ? Number(Math.abs(area.mqFisso).toFixed(3))
      : formulaVal == null
        ? 0
        : Number((formulaVal * mol).toFixed(3));
    const spessoreTxt = String(strato?.spessore ?? "").trim();
    misura3 = spessoreTxt === "" ? null : parseNonNegativeDecimal3OrNull(spessoreTxt);
  }
  const segno = segnoForzato === true ? true : area?.segno === true;
  const m1 = misura1;
  const raw =
    misura3 != null
      ? Number((m1 * misura3 * numero).toFixed(3))
      : Number((m1 * numero).toFixed(3));
  const risultato = segno ? -Math.abs(raw) : raw;
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: ZONA_TIPO_OGGETTO[tipoZona] || "STRADA_INGOMBRO",
    specifica,
    formula: formulaTxt,
    formulaValue: formulaVal,
    misura1,
    misura2,
    misura3,
    canaleGronda: false,
    grondaCanaleValore: null,
    numero,
    segno,
    risultato,
    apertureCollegate: [],
    stradeSchedaId: sid,
    stratoNumero: typeof strato?.n === "number" ? strato.n : null,
    areaNumero: typeof area?.n === "number" ? area.n : null,
  };
}

function raccogliAbbrevDaScheda(snapshot) {
  /** @type {Map<string, { label: string, unita: string }>} */
  const abbrevs = new Map();
  for (const tipo of TIPI_ZONA_STRADA) {
    const zona = snapshot?.[tipo];
    for (const st of zona?.strati || []) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (!vb) continue;
      const key = abbrevKey(vb);
      if (!abbrevs.has(key)) {
        if (isZonaManufatti(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_N });
        } else if (isZonaCordoli(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_ML });
        } else if (isZonaFormulaUnitaVoce(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_DA_VOCE });
        } else {
          const hasSp = String(st?.spessore ?? "").trim() !== "";
          abbrevs.set(key, { label: vb, unita: hasSp ? UNITA_MC : UNITA_MQ });
        }
      }
    }
  }
  return abbrevs;
}

function raccogliRighePerVoce(snapshot, voceKey) {
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const descrizione = typeof snapshot.descrizione === "string" ? snapshot.descrizione : "";
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const righe = [];
  const seen = new Set();

  for (const tipo of TIPI_ZONA_STRADA) {
    const zona = snapshot?.[tipo];
    const aree = isZonaSedeStradale(tipo) ? areeVirtualiSede(snapshot) : Array.isArray(zona?.aree) ? zona.aree : [];
    const strati = Array.isArray(zona?.strati) ? zona.strati : [];
    for (const st of strati) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (abbrevKey(vb) !== voceKey) continue;
      for (const area of aree) {
        const hasMqFisso = typeof area?.mqFisso === "number" && Number.isFinite(area.mqFisso);
        const hasFormula = Boolean(String(area?.formula ?? "").trim());
        const hasTipoMan = Boolean(String(area?.tipoManufatto ?? "").trim());
        if (isZonaManufatti(tipo)) {
          if (!hasFormula && !hasTipoMan) continue;
        } else {
          if (!hasMqFisso && !hasFormula) continue;
          if (hasMqFisso && area.mqFisso === 0) continue;
        }
        const dedupeKey = ["area", tipo, String(st?.id ?? ""), String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: st,
            schedaId,
          }),
        );
      }
      if (isZonaSedeStradale(tipo)) continue;
      for (const sott of st?.sottrazioni || []) {
        if (!String(sott?.formula ?? "").trim()) continue;
        const dedupeKey = ["sott", tipo, String(st?.id ?? ""), String(sott?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area: sott,
            strato: st,
            schedaId,
            segnoForzato: true,
            specificaExtra: "Sottrazione strato",
          }),
        );
      }
    }
  }
  return righe;
}

/**
 * @param {{ id: string, pianoNome: string, descrizione?: string, ingombro?: object, marciapiedi?: object, aiuole?: object, parcheggi?: object, manufatti?: object, cordoli?: object, segnaletica?: object, fogna?: object, lucePubblica?: object, lucePrivata?: object, gas?: object, acqua?: object, sedeStradale?: object }} snapshot
 */
export function aggiornaVociDaSnapshotStrade(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const abbrevs = raccogliAbbrevDaScheda(snapshot);
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
    // Segnaletica / Fogna / Luci / Gas / Acqua: se la voce non esiste ancora, la creiamo
    // senza forzare l’unità (l’utente la sceglie in VOCI; se esiste già, si usa quella).
    const unitaNuova = meta.unita == null ? "" : meta.unita;
    voci.push(
      creaVoceManualeDaVocibreve({
        idVoce: nextId,
        posizione: nextPos,
        voceAbbreviata: meta.label,
        unitaMisura: unitaNuova,
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

    const meta = abbrevs.get(abbrevKey(ab));
    // Non sovrascrivere l’unità se proviene dalla voce (impianti / formula-unita-voce).
    if (meta?.unita === UNITA_N) {
      const u = String(item.unitaMisura || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      if (u === "mq." || u === "mq" || u === "mc." || u === "mc") {
        item.unitaMisura = UNITA_N;
        changed = true;
      }
    } else if (meta?.unita === UNITA_ML) {
      const u = String(item.unitaMisura || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      if (u === "mq." || u === "mq" || u === "mc." || u === "mc" || u === "n." || u === "n") {
        item.unitaMisura = UNITA_ML;
        changed = true;
      }
    }
    const nuoveRigheMm = raccogliRighePerVoce(snapshot, abbrevKey(ab));
    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoStrade(old)) return true;
      if (!schedaId) return true;
      const oldSid = typeof old.stradeSchedaId === "string" ? old.stradeSchedaId.trim() : "";
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

export function rimuoviRigheMisurazioniPerSchedaStrade(schedaId) {
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
      if (!isRigaSemiautoStrade(row)) return true;
      const oldSid = typeof row.stradeSchedaId === "string" ? row.stradeSchedaId.trim() : "";
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
