/**
 * Dopo «REGISTRA STRADA»:
 * - crea una voce MANUALE per ogni voce breve dello strato e per ogni strada/tratto;
 * - scrive misurazioni SEMIAUTOMATICA con marker `stradeSchedaId`;
 * - per ogni strato: una riga per ogni area della zona + una riga negativa
 *   per ogni sottrazione di quello strato;
 * - sede stradale: aree automatiche Ingombro − (Marciapiedi + Aiuole + Parcheggi + Manufatti)
 *   per stesso riferimento (niente sottrazioni per-strato; Cordoli esclusi);
 * - reinterro: aree automatiche Ingombro − Volume occupato, per stesso riferimento;
 * - manufatti: una voce per tipo; quantità = N° pezzi (la formula toglie mq dalla Sede);
 * - fogna, allacci fogna, luci, gas, acqua, telefonica, cordoli e segnaletica:
 *   spunta USA accesa → in VOCI entra la Quantità; spenta → entra il Risultato;
 * - varie: una voce per tipo; quantità = formula × pezzi; l’unità si sceglie in VOCI;
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";
import {
  TIPI_ZONA_STRADA,
  ZONA_LABELS,
  ZONA_TIPO_OGGETTO,
  evalFormulaArea,
  parseMoltiplicatoreArea,
  isZonaSedeStradale,
  isZonaReinterro,
  isZonaReinterroCalcolo,
  isZonaManufatti,
  isZonaComeManufatti,
  isZonaCordoli,
  isZonaSegnaletica,
  isZonaVarie,
  isZonaFormulaUnitaVoce,
  areaUsaQuantitaInVoci,
  areeVirtualiSede,
  areeVirtualiReinterro,
  normalizzaTipoManufatto,
  normalizzaTipoImpianto,
  normalizzaTipoCordolo,
  normalizzaTipoSegnaletica,
  normalizzaTipoVarie,
  larghezzaArea,
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

/** In VOCI la voce breve degli impianti è «tipo (sezione)». Nella casella Tipo resta solo il tipo. */
export function voceBreveDaTipoZona(tipoZona, nomeTipo) {
  const nome = String(nomeTipo ?? "").trim().replace(/\s+/g, " ");
  if (!nome || !isZonaComeManufatti(tipoZona)) return nome;
  const sezione = ZONA_LABELS[tipoZona] || tipoZona;
  return `${nome} (${sezione})`;
}

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

function creaVoceManualeDaVocibreve({
  idVoce,
  posizione,
  voceAbbreviata,
  unitaMisura,
  riferimento,
  stradaTratto,
  stradeSchedaId,
}) {
  const ab = String(voceAbbreviata ?? "").trim();
  // Se unitaMisura è stringa (anche vuota), rispettala; altrimenti default mq.
  const unita =
    typeof unitaMisura === "string" ? unitaMisura : unitaMisura == null ? UNITA_MQ : String(unitaMisura);
  return {
    idVoce,
    posizione,
    voceAbbreviata: ab,
    riferimento: typeof riferimento === "string" ? riferimento.trim() : "",
    unitaMisura: unita,
    prezzo: 0,
    tipoMisura: TIPOMISURA_VOCE_MANUALE,
    voce: ab,
    note: "",
    misurazioniManuali: [],
    stradaTratto: typeof stradaTratto === "string" ? stradaTratto.trim() : "",
    stradeSchedaId: typeof stradeSchedaId === "string" ? stradeSchedaId.trim() : "",
  };
}

/** Vero se la voce ha già misure di un'altra strada. */
function schedaDiversaNellaVoce(item, schedaId) {
  const mm = Array.isArray(item?.misurazioniManuali) ? item.misurazioniManuali : [];
  for (const row of mm) {
    if (!isRigaSemiautoStrade(row)) continue;
    const oldSid = typeof row?.stradeSchedaId === "string" ? row.stradeSchedaId.trim() : "";
    if (oldSid && oldSid !== schedaId) return true;
  }
  return false;
}

/**
 * Stessa voce breve può esistere una volta per ogni strada/tratto.
 * Prima cerca la voce già legata a questa scheda, poi una voce vecchia
 * che non mescola un'altra strada (così resta il capitolo già scelto).
 */
function trovaVocePerStratoStrada(voci, labelKey, schedaId, stradaTratto) {
  const stesse = voci.filter((item) => item && abbrevKey(item.voceAbbreviata) === labelKey);
  const perScheda = stesse.find((item) => {
    const sid = String(item.stradeSchedaId || "").trim();
    return Boolean(schedaId) && sid === schedaId;
  });
  if (perScheda) return perScheda;

  const nomeKey = abbrevKey(stradaTratto);
  if (nomeKey) {
    const perNome = stesse.find((item) => {
      const sid = String(item.stradeSchedaId || "").trim();
      if (sid) return false;
      return abbrevKey(item.stradaTratto) === nomeKey && !schedaDiversaNellaVoce(item, schedaId);
    });
    if (perNome) return perNome;
  }

  return (
    stesse.find((item) => {
      const sid = String(item.stradeSchedaId || "").trim();
      const st = String(item.stradaTratto || "").trim();
      if (sid || st) return false;
      return !schedaDiversaNellaVoce(item, schedaId);
    }) || null
  );
}

/** Strato n di una zona → nome voce breve attuale. Serve a riconoscere un cambio di nome. */
function mappaNomeStratoCorrente(snapshot) {
  const map = new Map();
  for (const tipo of TIPI_ZONA_STRADA) {
    if (isZonaReinterro(tipo)) continue;
    const tipoOggetto = ZONA_TIPO_OGGETTO[tipo];
    if (!tipoOggetto) continue;
    for (const st of snapshot?.[tipo]?.strati || []) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      const n = typeof st?.n === "number" && Number.isFinite(st.n) ? st.n : null;
      if (!vb || n == null) continue;
      map.set(`${tipoOggetto}|${n}`, vb);
    }
  }
  return map;
}

function voceSoloDiQuestaScheda(item, schedaId) {
  const sidVoce = String(item?.stradeSchedaId || "").trim();
  if (sidVoce && sidVoce !== schedaId) return false;
  const mm = Array.isArray(item?.misurazioniManuali) ? item.misurazioniManuali : [];
  let haQuesta = sidVoce === schedaId;
  for (const row of mm) {
    if (!isRigaSemiautoStrade(row)) continue;
    const sid = String(row?.stradeSchedaId || "").trim();
    if (sid && sid !== schedaId) return false;
    if (sid === schedaId) haQuesta = true;
  }
  return haQuesta;
}

function voceConStessoNomeNellaScheda(voci, labelKey, schedaId, eccetto) {
  return voci.some((item) => {
    if (!item || item === eccetto) return false;
    if (abbrevKey(item.voceAbbreviata) !== labelKey) return false;
    return String(item.stradeSchedaId || "").trim() === schedaId;
  });
}

function voceHaDatiUtente(voce) {
  const prezzo = Number(voce?.prezzo);
  const testo = String(voce?.voce || "").trim();
  const ab = String(voce?.voceAbbreviata || "").trim();
  const note = String(voce?.note || "").trim();
  const cap = String(voce?.capitoloId || "").trim();
  return (
    (Number.isFinite(prezzo) && prezzo !== 0) ||
    (testo !== "" && abbrevKey(testo) !== abbrevKey(ab)) ||
    note !== "" ||
    cap !== ""
  );
}
function applicaNuovoNomeVoce(voce, nuovo) {
  const vecchio = String(voce.voceAbbreviata || "").trim();
  if (abbrevKey(voce.voce) === abbrevKey(vecchio)) voce.voce = nuovo;
  voce.voceAbbreviata = nuovo;
}

function togliRigheDiScheda(item, schedaId) {
  const mm = Array.isArray(item?.misurazioniManuali) ? item.misurazioniManuali : [];
  const filtrati = mm.filter((row) => {
    if (!isRigaSemiautoStrade(row)) return true;
    return String(row?.stradeSchedaId || "").trim() !== schedaId;
  });
  if (filtrati.length === mm.length) return false;
  item.misurazioniManuali = filtrati;
  return true;
}

/**
 * Se in Misurazione strade cambi il nome di uno strato, la voce già creata
 * per quella strada viene rinominata. Non ne nasce una seconda.
 */
function sistemaNomiStratoCambiati(voci, snapshot, schedaId, abbrevs) {
  if (!schedaId) return false;
  const perStrato = mappaNomeStratoCorrente(snapshot);
  const orfane = () =>
    voci.filter((item) => {
      if (!item || !voceSoloDiQuestaScheda(item, schedaId)) return false;
      const ab = abbrevKey(item.voceAbbreviata);
      return ab !== "" && !abbrevs.has(ab);
    });

  let changed = false;
  const giaRinominate = new Set();

  for (const voce of orfane()) {
    const mm = Array.isArray(voce.misurazioniManuali) ? voce.misurazioniManuali : [];
    const nomi = new Set();
    for (const row of mm) {
      if (!isRigaSemiautoStrade(row)) continue;
      if (String(row?.stradeSchedaId || "").trim() !== schedaId) continue;
      const n = typeof row?.stratoNumero === "number" ? row.stratoNumero : null;
      const tipo = String(row?.tipoOggetto || "").trim().toUpperCase();
      if (n == null || !tipo) continue;
      const label = perStrato.get(`${tipo}|${n}`);
      if (label) nomi.add(label);
    }
    if (nomi.size !== 1) continue;
    const nuovo = [...nomi][0];
    const keyNuovo = abbrevKey(nuovo);
    if (!abbrevs.has(keyNuovo)) continue;
    const gia = voci.find(
      (item) =>
        item &&
        item !== voce &&
        abbrevKey(item.voceAbbreviata) === keyNuovo &&
        String(item.stradeSchedaId || "").trim() === schedaId,
    );
    if (gia && voceHaDatiUtente(gia)) continue;
    if (gia) {
      const idx = voci.indexOf(gia);
      if (idx >= 0) voci.splice(idx, 1);
    }
    applicaNuovoNomeVoce(voce, nuovo);
    giaRinominate.add(voce);
    changed = true;
  }

  const ancoraOrfane = orfane().filter((voce) => !giaRinominate.has(voce));
  const nomiSenzaVoce = [];
  for (const [key, meta] of abbrevs) {
    if (trovaVocePerStratoStrada(voci, key, schedaId, "")) continue;
    nomiSenzaVoce.push(meta.label);
  }
  if (ancoraOrfane.length === 1 && nomiSenzaVoce.length === 1) {
    const nuovo = nomiSenzaVoce[0];
    if (!voceConStessoNomeNellaScheda(voci, abbrevKey(nuovo), schedaId, ancoraOrfane[0])) {
      applicaNuovoNomeVoce(ancoraOrfane[0], nuovo);
      giaRinominate.add(ancoraOrfane[0]);
      changed = true;
    }
  }

  for (let i = voci.length - 1; i >= 0; i -= 1) {
    const voce = voci[i];
    if (!voce || giaRinominate.has(voce) || !voceSoloDiQuestaScheda(voce, schedaId)) continue;
    if (abbrevs.has(abbrevKey(voce.voceAbbreviata))) continue;
    togliRigheDiScheda(voce, schedaId);
    const mm = Array.isArray(voce.misurazioniManuali) ? voce.misurazioniManuali : [];
    if (mm.length === 0 && !voceHaDatiUtente(voce)) {
      voci.splice(i, 1);
      changed = true;
    }
  }
  return changed;
}

function descrizioneSchedaRegistrata(schedaId) {
  const sid = String(schedaId || "").trim();
  if (!sid) return "";
  try {
    const raw = localStorage.getItem(STORAGE_STRADE_REGISTRATI_KEY);
    const data = raw ? JSON.parse(raw) : null;
    const items = Array.isArray(data?.items) ? data.items : [];
    const snap = items.find((item) => item && String(item.id || "").trim() === sid);
    return typeof snap?.descrizione === "string" ? snap.descrizione.trim() : "";
  } catch {
    return "";
  }
}

/** Se in una voce è rimasta una sola strada, scrive il suo nome nella colonna. */
function etichettaStradaSeUnaScheda(item) {
  if (!item || String(item.stradaTratto || "").trim()) return false;
  const ids = new Set();
  const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
  for (const row of mm) {
    if (!isRigaSemiautoStrade(row)) continue;
    const sid = typeof row?.stradeSchedaId === "string" ? row.stradeSchedaId.trim() : "";
    if (sid) ids.add(sid);
  }
  if (ids.size !== 1) return false;
  const sid = [...ids][0];
  const nome = descrizioneSchedaRegistrata(sid);
  if (!nome) return false;
  item.stradaTratto = nome;
  if (!String(item.stradeSchedaId || "").trim()) item.stradeSchedaId = sid;
  return true;
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
  const dimensioniTxt = String(area?.dimensioni ?? "").trim();
  const spessoreAreaTxt = String(area?.spessore ?? "").trim();
  const formulaTxt = String(area?.formula ?? "").trim() || dimensioniTxt;
  const mol = parseMoltiplicatoreArea(area?.moltiplicatore);
  const specificaParts = [];
  if (nArea) specificaParts.push(`Area ${nArea}`);
  if (nStrato) specificaParts.push(`Strato ${nStrato}`);
  const tipoMan = normalizzaTipoManufatto(area?.tipoManufatto);
  const tipoCor = normalizzaTipoCordolo(area?.tipoCordolo);
  const tipoSeg = normalizzaTipoSegnaletica(area?.tipoSegnaletica);
  const tipoVar = normalizzaTipoVarie(area?.tipoVarie);
  const tipoImp = normalizzaTipoImpianto(tipoZona, area?.tipoImpianto);
  if (tipoMan) specificaParts.push(tipoMan);
  if (tipoCor) specificaParts.push(tipoCor);
  if (tipoSeg) specificaParts.push(tipoSeg);
  if (tipoVar) specificaParts.push(tipoVar);
  if (tipoImp) specificaParts.push(voceBreveDaTipoZona(tipoZona, tipoImp));
  if (formulaTxt) specificaParts.push(formulaTxt);
  if (spessoreAreaTxt && (isZonaComeManufatti(tipoZona) || isZonaVarie(tipoZona))) {
    specificaParts.push(`sp. ${spessoreAreaTxt}`);
  }
  const isSegnaletica = isZonaSegnaletica(tipoZona);
  const lar = isSegnaletica ? larghezzaArea(area) : null;
  if (lar != null) specificaParts.push(`larg. ${lar}`);
  const soloManufatti = isZonaManufatti(tipoZona);
  if (!soloManufatti && mol !== 1) specificaParts.push(`×${mol}`);
  if (specificaExtra) specificaParts.push(specificaExtra);
  const specifica = specificaParts.join(" · ") || label;
  const isManufatti = isZonaManufatti(tipoZona);
  const isComeManufatti = isZonaComeManufatti(tipoZona);
  const isCordoli = isZonaCordoli(tipoZona);
  const isVarie = isZonaVarie(tipoZona);
  const isFormulaUnitaVoce = isZonaFormulaUnitaVoce(tipoZona) && !isSegnaletica;
  const hasMqFisso = typeof area?.mqFisso === "number" && Number.isFinite(area.mqFisso);
  const formulaVal = hasMqFisso ? Number(Math.abs(area.mqFisso).toFixed(3)) : evalFormulaArea(formulaTxt);
  const lunghezzaTxt = String(area?.lunghezza ?? "").trim();
  const lunghezzaVal = isZonaComeManufatti(tipoZona) ? evalFormulaArea(lunghezzaTxt) : null;
  const usaLunghezza = lunghezzaVal != null && lunghezzaVal > 0;
  let misura1;
  let misura2 = null;
  let misura3 = null;
  let numero = 1;
  if (isManufatti) {
    // Quantità in VOCI = moltiplicatore (conteggio a numero). La formula toglie mq dalla Sede.
    if (Number.isInteger(mol) && mol >= 0) {
      misura1 = 1;
      numero = mol;
    } else {
      misura1 = Number((Number.isFinite(mol) && mol >= 0 ? mol : 1).toFixed(3));
      numero = 1;
    }
  } else if (isSegnaletica) {
    if (areaUsaQuantitaInVoci(tipoZona, area)) {
      misura1 = Number((Number.isFinite(mol) && mol >= 0 ? mol : 1).toFixed(3));
      numero = 1;
    } else {
      const base = formulaVal == null ? 0 : Number(formulaVal.toFixed(3));
      const q = lar == null ? base : Number((base * lar).toFixed(3));
      if (Number.isInteger(mol) && mol >= 0) {
        misura1 = q;
        numero = mol;
      } else {
        misura1 = Number((q * (Number.isFinite(mol) && mol >= 0 ? mol : 1)).toFixed(3));
        numero = 1;
      }
    }
    misura2 = lar;
  } else if (isComeManufatti) {
    if (!areaUsaQuantitaInVoci(tipoZona, area)) {
      misura1 = formulaVal == null ? 0 : Number(Math.abs(formulaVal).toFixed(3));
      numero = 1;
    } else {
      // Lunghezza > 0: in VOCI va la lunghezza. Lunghezza vuota: va il numero scritto in Quantità.
      const base = usaLunghezza
        ? Number(lunghezzaVal.toFixed(3))
        : Number(parseMoltiplicatoreArea(area?.moltiplicatore).toFixed(3));
      misura1 = base;
      numero = 1;
    }
  } else if (isCordoli || isFormulaUnitaVoce || isVarie) {
    if (isCordoli && areaUsaQuantitaInVoci(tipoZona, area)) {
      misura1 = Number((Number.isFinite(mol) && mol >= 0 ? mol : 1).toFixed(3));
      numero = 1;
    } else {
      // Formula × pezzi. L’unità (ml., mq., mc.) resta quella scelta in VOCI.
      const base = formulaVal == null ? 0 : Number(formulaVal.toFixed(3));
      if (Number.isInteger(mol) && mol >= 0) {
        misura1 = base;
        numero = mol;
      } else {
        misura1 = Number((base * (Number.isFinite(mol) && mol >= 0 ? mol : 1)).toFixed(3));
        numero = 1;
      }
    }
  } else {
    misura1 = hasMqFisso
      ? Number(Math.abs(area.mqFisso).toFixed(3))
      : formulaVal == null
        ? 0
        : Number((formulaVal * mol).toFixed(3));
    if (!isZonaReinterroCalcolo(tipoZona)) {
      const spessoreTxt = String(strato?.spessore ?? "").trim();
      misura3 = spessoreTxt === "" ? null : parseNonNegativeDecimal3OrNull(spessoreTxt);
    }
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
    formula: isComeManufatti
      ? usaLunghezza
        ? lunghezzaTxt
        : String(area?.moltiplicatore ?? "").trim() || "1"
      : formulaTxt,
    formulaValue: isComeManufatti
      ? usaLunghezza
        ? Number(lunghezzaVal.toFixed(3))
        : Number(parseMoltiplicatoreArea(area?.moltiplicatore).toFixed(3))
      : formulaVal,
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

/** Spunta USA accesa: la voce di quel tipo usa l’unità n. */
function segnaUnitaDaSpuntaUsa(abbrevs, key, label, tipo, area) {
  const usa = areaUsaQuantitaInVoci(tipo, area);
  const attuale = abbrevs.get(key);
  if (!attuale) {
    abbrevs.set(key, {
      label,
      unita: usa ? UNITA_N : UNITA_DA_VOCE,
      forzaUnita: usa,
    });
    return;
  }
  if (usa) {
    attuale.unita = UNITA_N;
    attuale.forzaUnita = true;
  }
}

function raccogliAbbrevDaScheda(snapshot) {
  /** @type {Map<string, { label: string, unita: string }>} */
  const abbrevs = new Map();
  for (const tipo of TIPI_ZONA_STRADA) {
    if (isZonaReinterro(tipo)) continue;
    const zona = snapshot?.[tipo];
    if (isZonaManufatti(tipo)) {
      for (const area of zona?.aree || []) {
        const nome = normalizzaTipoManufatto(area?.tipoManufatto);
        if (!nome) continue;
        const key = abbrevKey(nome);
        if (!abbrevs.has(key)) abbrevs.set(key, { label: nome, unita: UNITA_N });
      }
      continue;
    }
    if (isZonaComeManufatti(tipo)) {
      for (const area of zona?.aree || []) {
        const nome = normalizzaTipoImpianto(tipo, area?.tipoImpianto);
        if (!nome) continue;
        const voceBreve = voceBreveDaTipoZona(tipo, nome);
        segnaUnitaDaSpuntaUsa(abbrevs, abbrevKey(voceBreve), voceBreve, tipo, area);
      }
      continue;
    }
    if (isZonaCordoli(tipo)) {
      for (const area of zona?.aree || []) {
        const nome = normalizzaTipoCordolo(area?.tipoCordolo);
        if (!nome) continue;
        segnaUnitaDaSpuntaUsa(abbrevs, abbrevKey(nome), nome, tipo, area);
      }
      continue;
    }
    if (isZonaSegnaletica(tipo)) {
      for (const area of zona?.aree || []) {
        const nome = normalizzaTipoSegnaletica(area?.tipoSegnaletica);
        if (!nome) continue;
        segnaUnitaDaSpuntaUsa(abbrevs, abbrevKey(nome), nome, tipo, area);
      }
      continue;
    }
    if (isZonaVarie(tipo)) {
      for (const area of zona?.aree || []) {
        const nome = normalizzaTipoVarie(area?.tipoVarie);
        if (!nome) continue;
        const key = abbrevKey(nome);
        if (!abbrevs.has(key)) abbrevs.set(key, { label: nome, unita: UNITA_DA_VOCE });
      }
      continue;
    }
    for (const st of zona?.strati || []) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (!vb) continue;
      const key = abbrevKey(vb);
      if (!abbrevs.has(key)) {
        if (isZonaManufatti(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_N });
        } else if (isZonaCordoli(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_DA_VOCE });
        } else if (isZonaFormulaUnitaVoce(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_DA_VOCE });
        } else if (isZonaReinterroCalcolo(tipo)) {
          abbrevs.set(key, { label: vb, unita: UNITA_MC });
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
    if (isZonaReinterro(tipo)) continue;
    const zona = snapshot?.[tipo];
    const aree = isZonaSedeStradale(tipo)
      ? areeVirtualiSede(snapshot)
      : isZonaReinterroCalcolo(tipo)
        ? areeVirtualiReinterro(snapshot)
        : Array.isArray(zona?.aree)
          ? zona.aree
          : [];
    if (isZonaManufatti(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoManufatto(area?.tipoManufatto);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        const dedupeKey = ["area", tipo, nome, String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: null,
            schedaId,
          }),
        );
      }
      continue;
    }
    if (isZonaComeManufatti(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoImpianto(tipo, area?.tipoImpianto);
        if (!nome || abbrevKey(voceBreveDaTipoZona(tipo, nome)) !== voceKey) continue;
        const dedupeKey = ["area", tipo, nome, String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: null,
            schedaId,
          }),
        );
      }
      continue;
    }
    if (isZonaCordoli(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoCordolo(area?.tipoCordolo);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        const formulaTxt = String(area?.formula ?? "").trim();
        if (!formulaTxt || evalFormulaArea(formulaTxt) == null) continue;
        const dedupeKey = ["area", tipo, nome, String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: null,
            schedaId,
          }),
        );
      }
      continue;
    }
    if (isZonaVarie(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoVarie(area?.tipoVarie);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        const formulaTxt = String(area?.formula ?? "").trim();
        if (!formulaTxt || evalFormulaArea(formulaTxt) == null) continue;
        const dedupeKey = ["area", tipo, nome, String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: null,
            schedaId,
          }),
        );
      }
      continue;
    }
    if (isZonaSegnaletica(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoSegnaletica(area?.tipoSegnaletica);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        const formulaTxt = String(area?.formula ?? "").trim();
        if (!formulaTxt || evalFormulaArea(formulaTxt) == null) continue;
        const dedupeKey = ["area", tipo, nome, String(area?.id ?? "")].join("|");
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        righe.push(
          creaRigaArea({
            pianoNome,
            descrizione,
            tipoZona: tipo,
            area,
            strato: null,
            schedaId,
          }),
        );
      }
      continue;
    }
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
      if (isZonaSedeStradale(tipo) || isZonaReinterroCalcolo(tipo)) continue;
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

/** Testi della colonna Rif. delle aree che finiscono su questa voce. */
function elencoRiferimentiPerVoce(snapshot, voceKey) {
  const out = [];
  const push = (raw) => {
    const t = String(raw ?? "").trim();
    if (t) out.push(t);
  };
  for (const tipo of TIPI_ZONA_STRADA) {
    if (isZonaReinterro(tipo)) continue;
    const zona = snapshot?.[tipo];
    const aree = isZonaSedeStradale(tipo)
      ? areeVirtualiSede(snapshot)
      : isZonaReinterroCalcolo(tipo)
        ? areeVirtualiReinterro(snapshot)
        : Array.isArray(zona?.aree)
          ? zona.aree
          : [];
    if (isZonaManufatti(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoManufatto(area?.tipoManufatto);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        push(area?.riferimento);
      }
      continue;
    }
    if (isZonaComeManufatti(tipo)) {
      for (const area of aree) {
        const nome = normalizzaTipoImpianto(tipo, area?.tipoImpianto);
        if (!nome || abbrevKey(voceBreveDaTipoZona(tipo, nome)) !== voceKey) continue;
        push(area?.riferimento);
      }
      continue;
    }
    if (isZonaCordoli(tipo) || isZonaVarie(tipo) || isZonaSegnaletica(tipo)) {
      for (const area of aree) {
        const nome = isZonaCordoli(tipo)
          ? normalizzaTipoCordolo(area?.tipoCordolo)
          : isZonaVarie(tipo)
            ? normalizzaTipoVarie(area?.tipoVarie)
            : normalizzaTipoSegnaletica(area?.tipoSegnaletica);
        if (!nome || abbrevKey(nome) !== voceKey) continue;
        const formulaTxt = String(area?.formula ?? "").trim();
        if (!formulaTxt || evalFormulaArea(formulaTxt) == null) continue;
        push(area?.riferimento);
      }
      continue;
    }
    const strati = Array.isArray(zona?.strati) ? zona.strati : [];
    for (const st of strati) {
      const vb = typeof st?.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (abbrevKey(vb) !== voceKey) continue;
      for (const area of aree) {
        const hasMqFisso = typeof area?.mqFisso === "number" && Number.isFinite(area.mqFisso);
        const hasFormula = Boolean(String(area?.formula ?? "").trim());
        if (!hasMqFisso && !hasFormula) continue;
        if (hasMqFisso && area.mqFisso === 0) continue;
        push(area?.riferimento);
      }
      if (isZonaSedeStradale(tipo) || isZonaReinterroCalcolo(tipo)) continue;
      for (const sott of st?.sottrazioni || []) {
        if (!String(sott?.formula ?? "").trim()) continue;
        push(sott?.riferimento);
      }
    }
  }
  return out;
}

function testoRiferimentiUnici(lista) {
  const seen = new Set();
  const out = [];
  for (const raw of lista) {
    const t = String(raw ?? "").trim();
    if (!t) continue;
    const key = t.toLocaleLowerCase("it-IT");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.join(" · ");
}

const STORAGE_STRADE_REGISTRATI_KEY = "computo_metrico_strade_registrati";

/**
 * Riferimento da mostrare in ASSOCIA VOCE.
 * Se sulla voce è già stato salvato, resta quello.
 * Altrimenti prende il Rif. scritto in Misurazione STRADE.
 * @param {{ voceAbbreviata?: string, riferimento?: string, misurazioniManuali?: object[] }} voce
 */
export function riferimentoPerAssociaVoceDaStrade(voce) {
  const salvato = typeof voce?.riferimento === "string" ? voce.riferimento.trim() : "";
  if (salvato) return salvato;
  const mm = Array.isArray(voce?.misurazioniManuali) ? voce.misurazioniManuali : [];
  const ids = new Set();
  for (const row of mm) {
    if (!isRigaSemiautoStrade(row)) continue;
    const sid = typeof row?.stradeSchedaId === "string" ? row.stradeSchedaId.trim() : "";
    if (sid) ids.add(sid);
  }
  if (ids.size === 0) return "";
  let items = [];
  try {
    const raw = localStorage.getItem(STORAGE_STRADE_REGISTRATI_KEY);
    const data = raw ? JSON.parse(raw) : null;
    items = Array.isArray(data?.items) ? data.items : [];
  } catch {
    return "";
  }
  const key = abbrevKey(voce?.voceAbbreviata);
  const testi = [];
  for (const snap of items) {
    const id = snap?.id != null ? String(snap.id).trim() : "";
    if (!ids.has(id)) continue;
    testi.push(...elencoRiferimentiPerVoce(snap, key));
  }
  return testoRiferimentiUnici(testi);
}

/**
 * @param {{ id: string, pianoNome: string, descrizione?: string, ingombro?: object, marciapiedi?: object, aiuole?: object, parcheggi?: object, manufatti?: object, cordoli?: object, segnaletica?: object, fogna?: object, allacciFogna?: object, lucePubblica?: object, lucePrivata?: object, gas?: object, acqua?: object, telefonica?: object, sedeStradale?: object }} snapshot
 */
function allineaVociBreviImpianto(snapshot) {
  for (const tipo of TIPI_ZONA_STRADA) {
    if (!isZonaComeManufatti(tipo)) continue;
    const tipoOggetto = ZONA_TIPO_OGGETTO[tipo] || "";
    const visti = new Set();
    for (const area of snapshot?.[tipo]?.aree || []) {
      const nome = normalizzaTipoImpianto(tipo, area?.tipoImpianto);
      if (!nome || visti.has(abbrevKey(nome))) continue;
      visti.add(abbrevKey(nome));
      const estesa = voceBreveDaTipoZona(tipo, nome);
      if (abbrevKey(estesa) === abbrevKey(nome)) continue;
      rinominaVoceTipoStrade(nome, estesa, tipoOggetto);
    }
  }
}

export function aggiornaVociDaSnapshotStrade(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return { righe: 0, vociAggiornate: 0 };
  allineaVociBreviImpianto(snapshot);
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const abbrevs = raccogliAbbrevDaScheda(snapshot);
  if (abbrevs.size === 0) return { righe: 0, vociAggiornate: 0 };

  let raw;
  try {
    raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
  } catch {
    return { righe: 0, vociAggiornate: 0 };
  }

  let voci;
  if (!raw) {
    voci = [];
  } else {
    try {
      voci = JSON.parse(raw);
    } catch {
      return { righe: 0, vociAggiornate: 0 };
    }
    if (!Array.isArray(voci)) return { righe: 0, vociAggiornate: 0 };
  }

  let changed = false;
  let righeScritte = 0;

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

  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const filtrati = mm.filter((row) => {
      if (!isRigaSemiautoStrade(row)) return true;
      const tipoOg = String(row?.tipoOggetto ?? "").trim().toUpperCase();
      const tipiDaRiscrivere = new Set([
        "STRADA_MANUFATTO",
        "STRADA_CORDOLI",
        "STRADA_SEGNALETICA",
        "STRADA_VARIE",
        "STRADA_FOGNA",
        "STRADA_ALLACCI_FOGNA",
        "STRADA_LUCE_PUBBLICA",
        "STRADA_LUCE_PRIVATA",
        "STRADA_GAS",
        "STRADA_ACQUA",
        "STRADA_TELEFONICA",
      ]);
      if (!tipiDaRiscrivere.has(tipoOg)) return true;
      if (!schedaId) return true;
      const oldSid = typeof row.stradeSchedaId === "string" ? row.stradeSchedaId.trim() : "";
      return oldSid !== schedaId;
    });
    if (filtrati.length !== mm.length) {
      item.misurazioniManuali = filtrati;
      changed = true;
    }
  }

  const stradaTratto =
    typeof snapshot.descrizione === "string" ? snapshot.descrizione.trim() : "";

  if (sistemaNomiStratoCambiati(voci, snapshot, schedaId, abbrevs)) changed = true;

  for (const [key, meta] of abbrevs) {
    let item = trovaVocePerStratoStrada(voci, key, schedaId, stradaTratto);
    if (!item) {
      // Fogna, cordoli, segnaletica, varie: voce nuova parte da mq.; se esiste già, l’unità scelta resta.
      const unitaNuova = meta.unita == null ? UNITA_MQ : meta.unita;
      item = creaVoceManualeDaVocibreve({
        idVoce: nextId,
        posizione: nextPos,
        voceAbbreviata: meta.label,
        unitaMisura: unitaNuova,
        riferimento: testoRiferimentiUnici(elencoRiferimentiPerVoce(snapshot, key)),
        stradaTratto,
        stradeSchedaId: schedaId,
      });
      voci.push(item);
      nextId += 1;
      nextPos += 1;
      changed = true;
    } else {
      if (String(item.stradaTratto || "") !== stradaTratto) {
        item.stradaTratto = stradaTratto;
        changed = true;
      }
      if (schedaId && String(item.stradeSchedaId || "") !== schedaId) {
        item.stradeSchedaId = schedaId;
        changed = true;
      }
    }

    // Spunta USA: l’unità diventa n. Anche se in VOCI era già mq., ml. o mc.
    if (meta?.forzaUnita === true && meta.unita === UNITA_N) {
      if (String(item.unitaMisura || "").trim() !== UNITA_N) {
        item.unitaMisura = UNITA_N;
        changed = true;
      }
    } else if (meta?.unita === UNITA_N) {
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
    } else if (meta?.unita === UNITA_MQ) {
      const u = String(item.unitaMisura || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      if (u === "" || u === "ml." || u === "ml" || u === "n." || u === "n" || u === "mc." || u === "mc") {
        item.unitaMisura = UNITA_MQ;
        changed = true;
      }
    }
    const nuoveRigheMm = raccogliRighePerVoce(snapshot, key);
    righeScritte += nuoveRigheMm.length;
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
    const rifAuto = testoRiferimentiUnici(elencoRiferimentiPerVoce(snapshot, key));
    if (rifAuto && !String(item.riferimento ?? "").trim()) {
      item.riferimento = rifAuto;
      changed = true;
    }
  }

  for (const item of voci) {
    if (etichettaStradaSeUnaScheda(item)) changed = true;
  }

  if (!changed) return { righe: righeScritte, vociAggiornate: abbrevs.size };
  try {
    localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  } catch {
    return { righe: 0, vociAggiornate: 0 };
  }
  return { righe: righeScritte, vociAggiornate: abbrevs.size };
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

function loadVociArchivio() {
  try {
    const raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function saveVociArchivio(voci) {
  localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  }
}

function sostituisciNomeInSpecifica(specifica, vecchio, nuovo) {
  const key = abbrevKey(vecchio);
  const parts = String(specifica ?? "").split(" · ");
  let changed = false;
  const out = parts.map((p) => {
    if (abbrevKey(p) === key) {
      changed = true;
      return nuovo;
    }
    return p;
  });
  return { text: changed ? out.join(" · ") : String(specifica ?? ""), changed };
}

function rigaDiQuestoTipo(row, tipoOggetto) {
  return (
    isRigaSemiautoStrade(row) &&
    String(row?.tipoOggetto ?? "").trim().toUpperCase() === tipoOggetto
  );
}

/** Vero se nelle VOCI c’è già una voce o una misurazione di questo tipo con quel nome. */
export function tipoStradeUsatoNelComputo(nome, tipoOggetto) {
  const key = abbrevKey(nome);
  const tipo = String(tipoOggetto ?? "").trim().toUpperCase();
  if (!key || !tipo) return false;
  const voci = loadVociArchivio();
  if (!Array.isArray(voci)) return false;
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    for (const row of mm) {
      if (!rigaDiQuestoTipo(row, tipo)) continue;
      const parts = String(row?.specifica ?? "").split(" · ");
      if (parts.some((p) => abbrevKey(p) === key)) return true;
    }
    if (abbrevKey(item.voceAbbreviata) !== key) continue;
    const questi = mm.filter((row) => rigaDiQuestoTipo(row, tipo));
    const altriStrade = mm.filter((row) => isRigaSemiautoStrade(row) && !rigaDiQuestoTipo(row, tipo));
    if (questi.length > 0) return true;
    if (altriStrade.length === 0) return true;
  }
  return false;
}

/**
 * Aggiorna il nome della voce e la dicitura dentro le misurazioni di quella scheda.
 * Se la stessa voce contiene anche misurazioni di un’altra scheda, sposta solo queste.
 */
function stessaStradaDellaVoce(a, b) {
  const sa = String(a?.stradeSchedaId || "").trim();
  const sb = String(b?.stradeSchedaId || "").trim();
  if (sa || sb) return sa === sb;
  return abbrevKey(a?.stradaTratto) === abbrevKey(b?.stradaTratto);
}

export function rinominaVoceTipoStrade(nomeVecchio, nomeNuovo, tipoOggetto) {
  const keyOld = abbrevKey(nomeVecchio);
  const keyNew = abbrevKey(nomeNuovo);
  const tipo = String(tipoOggetto ?? "").trim().toUpperCase();
  if (!keyOld || !keyNew || keyOld === keyNew || !tipo) return { ok: true, aggiornata: false };
  const voci = loadVociArchivio();
  if (!Array.isArray(voci)) return { ok: false, aggiornata: false };
  const sources = voci.filter((item) => item && abbrevKey(item.voceAbbreviata) === keyOld);
  if (sources.length === 0) return { ok: true, aggiornata: false };

  const patchRows = (rows) => {
    for (const row of rows) {
      const spec = sostituisciNomeInSpecifica(row.specifica, nomeVecchio, nomeNuovo);
      if (spec.changed) row.specifica = spec.text;
    }
  };

  let nextId =
    voci.reduce((max, item) => {
      const id = typeof item?.idVoce === "number" && Number.isFinite(item.idVoce) ? item.idVoce : 0;
      return Math.max(max, id);
    }, 0) + 1;
  let nextPos =
    voci.reduce((max, item) => {
      const p = typeof item?.posizione === "number" && Number.isFinite(item.posizione) ? item.posizione : 0;
      return Math.max(max, p);
    }, 0) + 1;
  let aggiornata = false;

  for (const source of sources) {
    const mm = Array.isArray(source.misurazioniManuali) ? source.misurazioniManuali : [];
    const questi = mm.filter((row) => rigaDiQuestoTipo(row, tipo));
    const altriStrade = mm.filter((row) => isRigaSemiautoStrade(row) && !rigaDiQuestoTipo(row, tipo));
    if (questi.length === 0) continue;

    let dest =
      voci.find(
        (item) =>
          item &&
          item !== source &&
          abbrevKey(item.voceAbbreviata) === keyNew &&
          stessaStradaDellaVoce(item, source),
      ) || null;
    if (altriStrade.length === 0 && !dest) {
      source.voceAbbreviata = nomeNuovo;
      if (abbrevKey(source.voce) === keyOld) source.voce = nomeNuovo;
      patchRows(questi);
      aggiornata = true;
      continue;
    }

    if (!dest) {
      dest = creaVoceManualeDaVocibreve({
        idVoce: nextId,
        posizione: nextPos,
        voceAbbreviata: nomeNuovo,
        unitaMisura: typeof source.unitaMisura === "string" ? source.unitaMisura : UNITA_MQ,
        riferimento: "",
        stradaTratto: typeof source.stradaTratto === "string" ? source.stradaTratto : "",
        stradeSchedaId: typeof source.stradeSchedaId === "string" ? source.stradeSchedaId : "",
      });
      dest.prezzo = typeof source.prezzo === "number" && Number.isFinite(source.prezzo) ? source.prezzo : 0;
      dest.voce = nomeNuovo;
      if (typeof source.capitoloId === "string") dest.capitoloId = source.capitoloId;
      voci.push(dest);
      nextId += 1;
      nextPos += 1;
    }
    patchRows(questi);
    source.misurazioniManuali = mm.filter((row) => !questi.includes(row));
    const destMm = Array.isArray(dest.misurazioniManuali) ? dest.misurazioniManuali : [];
    dest.misurazioniManuali = [...destMm, ...questi];
    aggiornata = true;
  }

  if (!aggiornata) return { ok: true, aggiornata: false };
  try {
    saveVociArchivio(voci);
  } catch {
    return { ok: false, aggiornata: false };
  }
  return { ok: true, aggiornata: true };
}
