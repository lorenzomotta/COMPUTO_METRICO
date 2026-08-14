/**
 * Dopo «REGISTRA ELEVAZIONE»:
 * - crea voci MANUALE (mq.) se manca la voce breve dello strato;
 * - se una parete ha Fondazione, crea/aggiorna voce «FONDAZIONE CONTINUA» (mc.)
 *   con volume = lunghezza × larghezza × altezza;
 * - scrive misurazioni SEMIAUTOMATICA con marker `elevazioneSchedaId`.
 */

import { STORAGE_VOCI_ARCHIVIO_KEY } from "./archivioVociVocibrevi.js";

const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
const TIPOMISURA_VOCE_MANUALE = "MANUALE";
const UNITA_MQ = "mq.";
const UNITA_MC = "mc.";
const TIPO_PARETE = "PARETE_ELEVAZIONE";
const TIPO_FONDAZIONE = "ELEVAZIONE_FONDAZIONE";
const VOCE_FONDAZIONE_CONTINUA = "FONDAZIONE CONTINUA";

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

function isRigaSemiautoElevazione(row) {
  if (!row || typeof row !== "object") return false;
  const tipo = String(row.tipo ?? "").trim().toUpperCase();
  const tipoOggetto = String(row.tipoOggetto ?? "").trim().toUpperCase();
  return (
    tipo === VOCE_MM_TIPO_SEMIAUTOMATICA &&
    (tipoOggetto === TIPO_PARETE || tipoOggetto === TIPO_FONDAZIONE)
  );
}

function creaRigaParete({ pianoNome, zonaNome, parete, strato, schedaId }) {
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
    tipoOggetto: TIPO_PARETE,
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
    elevazioneSchedaId: sid,
    stratoAltezza,
    stratoElevazione,
  };
}

function creaRigaFondazione({ pianoNome, zonaNome, parete, schedaId }) {
  const piano = typeof pianoNome === "string" ? pianoNome : "";
  const zona = typeof zonaNome === "string" ? zonaNome.trim() : "";
  const riferimento = typeof parete.riferimento === "string" ? parete.riferimento.trim() : "";
  const specifica = `${zona}${zona && riferimento ? " + " : ""}${riferimento} · Fondazione`.trim();
  const misura1 = parseNonNegativeDecimal3OrNull(parete.lunghezza);
  const misura2 = parseNonNegativeDecimal3OrNull(parete.fondazioneLarghezza);
  const misura3 = parseNonNegativeDecimal3OrNull(parete.fondazioneAltezza);
  const numero = 1;
  const segno = false;
  const risultato = calcolaRisultatoSemiautomatico(misura1, misura2, misura3, numero, segno);
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  return {
    tipo: VOCE_MM_TIPO_SEMIAUTOMATICA,
    piano,
    riferimento,
    tipoOggetto: TIPO_FONDAZIONE,
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
    elevazioneSchedaId: sid,
  };
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

function loadVoci() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
  } catch {
    return null;
  }
  if (!raw) return [];
  try {
    const voci = JSON.parse(raw);
    return Array.isArray(voci) ? voci : null;
  } catch {
    return null;
  }
}

function saveVoci(voci) {
  try {
    localStorage.setItem(STORAGE_VOCI_ARCHIVIO_KEY, JSON.stringify(voci));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  } catch {
    /* ignore */
  }
}

function ensureVoce({ voci, label, unitaMisura, keysGiaPresenti, counters }) {
  const key = abbrevKey(label);
  if (keysGiaPresenti.has(key)) return;
  voci.push(
    creaVoceManualeDaVocibreve({
      idVoce: counters.nextId,
      posizione: counters.nextPos,
      voceAbbreviata: label,
      unitaMisura,
    }),
  );
  keysGiaPresenti.add(key);
  counters.nextId += 1;
  counters.nextPos += 1;
}

export function aggiornaVociDaSnapshotElevazione(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const schedaId =
    snapshot.id != null && String(snapshot.id).trim() !== "" ? String(snapshot.id).trim() : "";
  const pianoNome = typeof snapshot.pianoNome === "string" ? snapshot.pianoNome : "";
  const zonaNome = typeof snapshot.zonaNome === "string" ? snapshot.zonaNome : "";
  const pareti = Array.isArray(snapshot.pareti) ? snapshot.pareti : [];

  const abbrevsConStrato = new Map();
  let haFondazione = false;
  for (const parete of pareti) {
    if (parete?.fondazione === true) haFondazione = true;
    const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
    for (const st of strat) {
      const vb = typeof st.vocibreve === "string" ? st.vocibreve.trim() : "";
      if (!vb) continue;
      const key = abbrevKey(vb);
      if (!abbrevsConStrato.has(key)) abbrevsConStrato.set(key, vb);
    }
  }
  if (abbrevsConStrato.size === 0 && !haFondazione) return;

  const voci = loadVoci();
  if (!voci) return;

  let changed = false;
  const keysGiaPresenti = new Set();
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (ab) keysGiaPresenti.add(abbrevKey(ab));
  }

  const counters = {
    nextId:
      voci.reduce((max, item) => {
        const id = typeof item?.idVoce === "number" && Number.isFinite(item.idVoce) ? item.idVoce : 0;
        return Math.max(max, id);
      }, 0) + 1,
    nextPos:
      voci.reduce((max, item) => {
        const p =
          typeof item?.posizione === "number" && Number.isFinite(item.posizione) ? item.posizione : 0;
        return Math.max(max, p);
      }, 0) + 1,
  };

  const sizeBefore = keysGiaPresenti.size;
  for (const [, label] of abbrevsConStrato) {
    ensureVoce({
      voci,
      label,
      unitaMisura: UNITA_MQ,
      keysGiaPresenti,
      counters,
    });
  }
  if (haFondazione) {
    ensureVoce({
      voci,
      label: VOCE_FONDAZIONE_CONTINUA,
      unitaMisura: UNITA_MC,
      keysGiaPresenti,
      counters,
    });
  }
  if (keysGiaPresenti.size !== sizeBefore) changed = true;

  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
    if (!ab) continue;
    const keyAb = abbrevKey(ab);
    const isFondazioneVoce = keyAb === abbrevKey(VOCE_FONDAZIONE_CONTINUA);
    const isStratoVoce = abbrevsConStrato.has(keyAb);
    if (!isFondazioneVoce && !isStratoVoce) continue;
    if (isFondazioneVoce && !haFondazione) {
      // se la scheda non ha più fondazioni, togli solo le righe di questa scheda
    }

    const seenMm = new Set();
    const nuoveRigheMm = [];

    if (isStratoVoce) {
      for (const parete of pareti) {
        const rif = typeof parete.riferimento === "string" ? parete.riferimento : "";
        const strat = Array.isArray(parete.stratifinitura) ? parete.stratifinitura : [];
        strat.forEach((st, stIdx) => {
          const vb = typeof st?.vocibreve === "string" ? st.vocibreve : "";
          if (abbrevKey(vb) !== keyAb) return;
          const dedupeKey = [
            "parete",
            abbrevKey(rif),
            abbrevKey(pianoNome),
            abbrevKey(zonaNome),
            String(st?.id ?? ""),
            String(stIdx),
          ].join("|");
          if (seenMm.has(dedupeKey)) return;
          seenMm.add(dedupeKey);
          nuoveRigheMm.push(
            creaRigaParete({
              pianoNome,
              zonaNome,
              parete,
              strato: st,
              schedaId,
            }),
          );
        });
      }
    }

    if (isFondazioneVoce && haFondazione) {
      for (const parete of pareti) {
        if (parete?.fondazione !== true) continue;
        const rif = typeof parete.riferimento === "string" ? parete.riferimento : "";
        const dedupeKey = ["fond", abbrevKey(rif), abbrevKey(pianoNome), abbrevKey(zonaNome)].join(
          "|",
        );
        if (seenMm.has(dedupeKey)) continue;
        seenMm.add(dedupeKey);
        nuoveRigheMm.push(
          creaRigaFondazione({
            pianoNome,
            zonaNome,
            parete,
            schedaId,
          }),
        );
      }
    }

    const mmCorrenti = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const mmSenzaQuestaScheda = mmCorrenti.filter((old) => {
      if (!isRigaSemiautoElevazione(old)) return true;
      if (!schedaId) return true;
      const oldSid = typeof old.elevazioneSchedaId === "string" ? old.elevazioneSchedaId.trim() : "";
      return oldSid !== schedaId;
    });

    // Per voci non collegate a questa scheda (es. fondazione disattivata), aggiorna solo rimozione
    const deveScrivereNuove =
      (isStratoVoce && abbrevsConStrato.has(keyAb)) || (isFondazioneVoce && haFondazione);
    const mmAggiornate = deveScrivereNuove
      ? [...mmSenzaQuestaScheda, ...nuoveRigheMm]
      : mmSenzaQuestaScheda;

    if (JSON.stringify(mmAggiornate) !== JSON.stringify(mmCorrenti)) {
      changed = true;
      item.misurazioniManuali = mmAggiornate;
    }
  }

  // Se fondazione era su questa scheda e ora non c'è più, ripulisci comunque le righe fondazione della scheda
  if (!haFondazione && schedaId) {
    for (const item of voci) {
      if (item == null || typeof item !== "object") continue;
      const ab = typeof item.voceAbbreviata === "string" ? item.voceAbbreviata.trim() : "";
      if (abbrevKey(ab) !== abbrevKey(VOCE_FONDAZIONE_CONTINUA)) continue;
      const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
      const filtrati = mm.filter((old) => {
        if (!isRigaSemiautoElevazione(old)) return true;
        const oldSid =
          typeof old.elevazioneSchedaId === "string" ? old.elevazioneSchedaId.trim() : "";
        if (oldSid !== schedaId) return true;
        return String(old.tipoOggetto ?? "").trim().toUpperCase() !== TIPO_FONDAZIONE;
      });
      if (filtrati.length !== mm.length) {
        item.misurazioniManuali = filtrati;
        changed = true;
      }
    }
  }

  if (!changed) return;
  saveVoci(voci);
}

export function rimuoviRigheMisurazioniPerSchedaElevazione(schedaId) {
  const sid = typeof schedaId === "string" ? schedaId.trim() : "";
  if (!sid) return;
  const voci = loadVoci();
  if (!voci) return;
  let changed = false;
  for (const item of voci) {
    if (item == null || typeof item !== "object") continue;
    const mm = Array.isArray(item.misurazioniManuali) ? item.misurazioniManuali : [];
    const filtrati = mm.filter((row) => {
      if (!isRigaSemiautoElevazione(row)) return true;
      const oldSid = typeof row.elevazioneSchedaId === "string" ? row.elevazioneSchedaId.trim() : "";
      return oldSid !== sid;
    });
    if (filtrati.length !== mm.length) {
      item.misurazioniManuali = filtrati;
      changed = true;
    }
  }
  if (!changed) return;
  saveVoci(voci);
}
