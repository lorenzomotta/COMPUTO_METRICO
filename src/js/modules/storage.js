export function savePiani(storageKey, piani) {
  localStorage.setItem(storageKey, JSON.stringify(piani));
}

export function saveMurDati(
  keys,
  stratiMurElevazione,
  apertureElevazione,
  scaviEsterni = [],
  corselliEsterni = [],
  scivoliEsterni = [],
  camminamentiEsterni = [],
  misurazioniVarie = [],
) {
  localStorage.setItem(keys.STORAGE_STRATI_MUR, JSON.stringify(stratiMurElevazione));
  localStorage.setItem(keys.STORAGE_APERTURE_ELEV, JSON.stringify(apertureElevazione));
  localStorage.setItem(keys.STORAGE_SCAVI_ESTERNI, JSON.stringify(scaviEsterni));
  localStorage.setItem(keys.STORAGE_CORSELLI_ESTERNI, JSON.stringify(corselliEsterni));
  localStorage.setItem(keys.STORAGE_SCIVOLI_ESTERNI, JSON.stringify(scivoliEsterni));
  localStorage.setItem(keys.STORAGE_CAMMINAMENTI_ESTERNI, JSON.stringify(camminamentiEsterni));
  localStorage.setItem(keys.STORAGE_MISURAZIONI_VARIE, JSON.stringify(misurazioniVarie));
  try {
    localStorage.removeItem(keys.STORAGE_MUR_ELE);
  } catch {
    /* ignore */
  }
}

/**
 * Migra strati/apertura legacy (idElevazione) usando la mappa elevazione -> piano.
 * @param {any} s
 * @param {Map<number, number>} elevToPiano
 * @returns {any | null}
 */
function migraStratoVersoPiano(s, elevToPiano) {
  if (!s || typeof s !== "object") return null;
  if (typeof s.idPiano === "number") {
    const { idElevazione: _e, ...rest } = s;
    return rest;
  }
  if (typeof s.idElevazione === "number") {
    const idPiano = elevToPiano.get(s.idElevazione);
    if (typeof idPiano !== "number") return null;
    const { idElevazione: _e, ...rest } = s;
    return { ...rest, idPiano };
  }
  return null;
}

/**
 * @param {any} a
 * @param {Map<number, number>} elevToPiano
 */
function migraAperturaVersoPiano(a, elevToPiano) {
  if (!a || typeof a !== "object") return null;
  if (typeof a.idPiano === "number") {
    const { idElevazione: _e, ...rest } = a;
    return rest;
  }
  if (typeof a.idElevazione === "number") {
    const idPiano = elevToPiano.get(a.idElevazione);
    if (typeof idPiano !== "number") return null;
    const { idElevazione: _e, ...rest } = a;
    return { ...rest, idPiano };
  }
  return null;
}

export function loadMurDati(keys) {
  let stratiMurElevazione = [];
  let apertureElevazione = [];
  let scaviEsterni = [];
  let corselliEsterni = [];
  let scivoliEsterni = [];
  let camminamentiEsterni = [];
  let misurazioniVarie = [];

  /** @type {Record<number, { riferimento: string, spessore: number }>} */
  let pianoMurLegacy = {};

  try {
    const rawE = localStorage.getItem(keys.STORAGE_MUR_ELE);
    const rawS = localStorage.getItem(keys.STORAGE_STRATI_MUR);
    const rawA = localStorage.getItem(keys.STORAGE_APERTURE_ELEV);

    /** @type {{ idElevazione: number, idPiano: number, riferimento?: string, spessore?: number }[]} */
    let legacyMur = [];
    if (rawE) {
      try {
        const parsedE = JSON.parse(rawE);
        if (Array.isArray(parsedE)) {
          legacyMur = parsedE.filter(
            (e) => typeof e?.idElevazione === "number" && typeof e?.idPiano === "number",
          );
        }
      } catch {
        legacyMur = [];
      }
    }

    const elevToPiano = new Map();
    legacyMur.forEach((e) => {
      elevToPiano.set(e.idElevazione, e.idPiano);
      pianoMurLegacy[e.idPiano] = {
        riferimento: typeof e.riferimento === "string" ? e.riferimento : "",
        spessore: typeof e.spessore === "number" ? e.spessore : 0,
      };
    });

    if (rawS) {
      const parsedS = JSON.parse(rawS);
      if (Array.isArray(parsedS)) {
        stratiMurElevazione = parsedS
          .map((s) => migraStratoVersoPiano(s, elevToPiano))
          .filter(
            (s) =>
              s &&
              typeof s.idStratoMur === "number" &&
              typeof s.idPiano === "number" &&
              typeof s.idStrato === "string" &&
              typeof s.lunghezza === "number" &&
              typeof s.altezza === "number" &&
              typeof s.spessore === "number" &&
              typeof s.idVoceCapitolato === "string",
          );
      }
    }

    if (rawA) {
      try {
        const parsedA = JSON.parse(rawA);
        if (Array.isArray(parsedA)) {
          apertureElevazione = parsedA
            .map((a) => migraAperturaVersoPiano(a, elevToPiano))
            .filter(
              (a) =>
                a &&
                typeof a.idAperturaElev === "number" &&
                typeof a.idPiano === "number" &&
                typeof a.locale === "string" &&
                typeof a.lunghezza === "number" &&
                typeof a.altezza === "number" &&
                typeof a.ante === "number" &&
                typeof a.tipologia === "string" &&
                typeof a.falsotelai === "boolean" &&
                typeof a.hDavanzale === "number" &&
                typeof a.idVoceCapitolato === "string",
            );
        }
      } catch {
        apertureElevazione = [];
      }
    }

    const rawScavi = localStorage.getItem(keys.STORAGE_SCAVI_ESTERNI);
    if (rawScavi) {
      try {
        const parsedScavi = JSON.parse(rawScavi);
        scaviEsterni = Array.isArray(parsedScavi)
          ? parsedScavi.filter(
              (s) =>
                typeof s?.idPlScavo === "number" &&
                typeof s?.piano === "string" &&
                typeof s?.riferimento === "string" &&
                (typeof s?.sottrai === "boolean" || typeof s?.sottrai === "undefined") &&
                (typeof s?.misura1 === "number" || s?.misura1 === null) &&
                (typeof s?.misura2 === "number" || s?.misura2 === null) &&
                typeof s?.formula === "string" &&
                (typeof s?.formulaValue === "number" || s?.formulaValue === null) &&
                typeof s?.altezza === "number" &&
                typeof s?.area === "number" &&
                typeof s?.volume === "number" &&
                typeof s?.idVoce === "string",
            ).map((s) => ({ ...s, sottrai: s.sottrai === true }))
          : [];
      } catch {
        scaviEsterni = [];
      }
    }
    const rawCorselli = localStorage.getItem(keys.STORAGE_CORSELLI_ESTERNI);
    if (rawCorselli) {
      try {
        const parsedCorselli = JSON.parse(rawCorselli);
        corselliEsterni = Array.isArray(parsedCorselli)
          ? parsedCorselli.filter(
              (c) =>
                typeof c?.idPlCors === "number" &&
                typeof c?.piano === "string" &&
                typeof c?.riferimento === "string" &&
                (typeof c?.sottrai === "boolean" || typeof c?.sottrai === "undefined") &&
                (typeof c?.misura1 === "number" || c?.misura1 === null) &&
                (typeof c?.misura2 === "number" || c?.misura2 === null) &&
                typeof c?.formula === "string" &&
                (typeof c?.formulaValue === "number" || c?.formulaValue === null) &&
                (typeof c?.altezza === "number" || c?.altezza === null) &&
                typeof c?.area === "number" &&
                typeof c?.volume === "number" &&
                typeof c?.idVoce === "string",
            ).map((c) => ({ ...c, sottrai: c.sottrai === true }))
          : [];
      } catch {
        corselliEsterni = [];
      }
    }
    const rawScivoli = localStorage.getItem(keys.STORAGE_SCIVOLI_ESTERNI);
    if (rawScivoli) {
      try {
        const parsedScivoli = JSON.parse(rawScivoli);
        scivoliEsterni = Array.isArray(parsedScivoli)
          ? parsedScivoli.filter(
              (c) =>
                typeof c?.idPlSciv === "number" &&
                typeof c?.piano === "string" &&
                typeof c?.riferimento === "string" &&
                (typeof c?.sottrai === "boolean" || typeof c?.sottrai === "undefined") &&
                (typeof c?.misura1 === "number" || c?.misura1 === null) &&
                (typeof c?.misura2 === "number" || c?.misura2 === null) &&
                typeof c?.formula === "string" &&
                (typeof c?.formulaValue === "number" || c?.formulaValue === null) &&
                (typeof c?.altezza === "number" || c?.altezza === null) &&
                typeof c?.area === "number" &&
                typeof c?.volume === "number" &&
                typeof c?.idVoce === "string",
            ).map((c) => ({ ...c, sottrai: c.sottrai === true }))
          : [];
      } catch {
        scivoliEsterni = [];
      }
    }
    const rawCamminamenti = localStorage.getItem(keys.STORAGE_CAMMINAMENTI_ESTERNI);
    if (rawCamminamenti) {
      try {
        const parsedCamminamenti = JSON.parse(rawCamminamenti);
        camminamentiEsterni = Array.isArray(parsedCamminamenti)
          ? parsedCamminamenti.filter(
              (c) =>
                typeof c?.idPlCamm === "number" &&
                typeof c?.piano === "string" &&
                typeof c?.riferimento === "string" &&
                (typeof c?.sottrai === "boolean" || typeof c?.sottrai === "undefined") &&
                (typeof c?.misura1 === "number" || c?.misura1 === null) &&
                (typeof c?.misura2 === "number" || c?.misura2 === null) &&
                typeof c?.formula === "string" &&
                (typeof c?.formulaValue === "number" || c?.formulaValue === null) &&
                (typeof c?.altezza === "number" || c?.altezza === null) &&
                typeof c?.area === "number" &&
                typeof c?.volume === "number" &&
                typeof c?.idVoce === "string",
            ).map((c) => ({ ...c, sottrai: c.sottrai === true }))
          : [];
      } catch {
        camminamentiEsterni = [];
      }
    }
  } catch {
    stratiMurElevazione = [];
    apertureElevazione = [];
    scaviEsterni = [];
    corselliEsterni = [];
    scivoliEsterni = [];
    camminamentiEsterni = [];
    pianoMurLegacy = {};
  }

  try {
    const rawMis = localStorage.getItem(keys.STORAGE_MISURAZIONI_VARIE);
    if (rawMis) {
      const parsedMis = JSON.parse(rawMis);
      misurazioniVarie = Array.isArray(parsedMis)
        ? parsedMis
            .filter(
              (m) =>
                typeof m?.idMisurazione === "number" &&
                typeof m?.idVoce === "string" &&
                typeof m?.formula === "string" &&
                (typeof m?.formulaValue === "number" || m?.formulaValue === null) &&
                typeof m?.numero === "number" &&
                Number.isInteger(m.numero) &&
                typeof m?.segno === "boolean" &&
                typeof m?.risultato === "number" &&
                Number.isInteger(m.risultato) &&
                (typeof m?.piano === "string" ||
                  typeof m?.riferimento === "string" ||
                  typeof m?.tipo === "string"),
            )
            .map((m) => ({
              idMisurazione: m.idMisurazione,
              idVoce: m.idVoce,
              piano: typeof m?.piano === "string" ? m.piano : "",
              riferimento:
                typeof m?.riferimento === "string"
                  ? m.riferimento
                  : typeof m?.tipo === "string"
                    ? m.tipo
                    : "",
              formula: m.formula,
              formulaValue: m.formulaValue,
              numero: m.numero,
              segno: m.segno === true,
              risultato: m.risultato,
            }))
        : [];
    }
  } catch {
    misurazioniVarie = [];
  }

  const stratoMurIdCounter =
    stratiMurElevazione.reduce((max, s) => Math.max(max, s.idStratoMur), 0) + 1;
  const aperturaElevIdCounter =
    apertureElevazione.reduce((max, a) => Math.max(max, a.idAperturaElev), 0) + 1;
  const scavoIdCounter = scaviEsterni.reduce((max, s) => Math.max(max, s.idPlScavo), 0) + 1;
  const corselloIdCounter = corselliEsterni.reduce((max, c) => Math.max(max, c.idPlCors), 0) + 1;
  const scivoloIdCounter = scivoliEsterni.reduce((max, c) => Math.max(max, c.idPlSciv), 0) + 1;
  const camminamentiIdCounter =
    camminamentiEsterni.reduce((max, c) => Math.max(max, c.idPlCamm), 0) + 1;
  const misurazioniIdCounter =
    misurazioniVarie.reduce((max, m) => Math.max(max, m.idMisurazione), 0) + 1;

  return {
    stratiMurElevazione,
    apertureElevazione,
    scaviEsterni,
    corselliEsterni,
    scivoliEsterni,
    camminamentiEsterni,
    misurazioniVarie,
    pianoMurLegacy,
    stratoMurIdCounter,
    aperturaElevIdCounter,
    scavoIdCounter,
    corselloIdCounter,
    scivoloIdCounter,
    camminamentiIdCounter,
    misurazioniIdCounter,
  };
}

export function loadPiani(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { piani: [], pianoIdCounter: 1 };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { piani: [], pianoIdCounter: 1 };
    const piani = parsed.filter(
      (item) =>
        typeof item?.id === "number" &&
        typeof item?.tipologia === "string" &&
        typeof item?.edificio === "string" &&
        typeof item?.piano === "string",
    );
    const pianoIdCounter = piani.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    return { piani, pianoIdCounter };
  } catch {
    return { piani: [], pianoIdCounter: 1 };
  }
}
