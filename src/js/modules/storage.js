export function savePiani(storageKey, piani) {
  localStorage.setItem(storageKey, JSON.stringify(piani));
}

export function saveMurDati(
  keys,
  murielevazioni,
  stratiMurElevazione,
  apertureElevazione,
  scaviEsterni = [],
  corselliEsterni = [],
  camminamentiEsterni = [],
  misurazioniVarie = [],
) {
  localStorage.setItem(keys.STORAGE_MUR_ELE, JSON.stringify(murielevazioni));
  localStorage.setItem(keys.STORAGE_STRATI_MUR, JSON.stringify(stratiMurElevazione));
  localStorage.setItem(keys.STORAGE_APERTURE_ELEV, JSON.stringify(apertureElevazione));
  localStorage.setItem(keys.STORAGE_SCAVI_ESTERNI, JSON.stringify(scaviEsterni));
  localStorage.setItem(keys.STORAGE_CORSELLI_ESTERNI, JSON.stringify(corselliEsterni));
  localStorage.setItem(keys.STORAGE_CAMMINAMENTI_ESTERNI, JSON.stringify(camminamentiEsterni));
  localStorage.setItem(keys.STORAGE_MISURAZIONI_VARIE, JSON.stringify(misurazioniVarie));
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

export function loadMurDati(keys, piani) {
  let murielevazioni = [];
  let stratiMurElevazione = [];
  let apertureElevazione = [];
  let scaviEsterni = [];
  let corselliEsterni = [];
  let camminamentiEsterni = [];
  let misurazioniVarie = [];

  try {
    const rawE = localStorage.getItem(keys.STORAGE_MUR_ELE);
    const rawS = localStorage.getItem(keys.STORAGE_STRATI_MUR);
    const rawA = localStorage.getItem(keys.STORAGE_APERTURE_ELEV);
    if (rawE && rawS) {
      const parsedE = JSON.parse(rawE);
      const parsedS = JSON.parse(rawS);
      if (Array.isArray(parsedE) && Array.isArray(parsedS)) {
        murielevazioni = parsedE
          .filter((e) => typeof e?.idElevazione === "number" && typeof e?.idPiano === "number")
          .map((e) => ({
            idElevazione: e.idElevazione,
            idPiano: e.idPiano,
            riferimento: typeof e.riferimento === "string" ? e.riferimento : "",
            spessore: typeof e.spessore === "number" ? e.spessore : 0,
          }));
        stratiMurElevazione = parsedS.filter(
          (s) =>
            typeof s?.idStratoMur === "number" &&
            typeof s?.idElevazione === "number" &&
            typeof s?.idStrato === "string" &&
            typeof s?.lunghezza === "number" &&
            typeof s?.altezza === "number" &&
            typeof s?.spessore === "number" &&
            typeof s?.idVoceCapitolato === "string",
        );
        if (rawA) {
          const parsedA = JSON.parse(rawA);
          apertureElevazione = Array.isArray(parsedA)
            ? parsedA.filter(
                (a) =>
                  typeof a?.idAperturaElev === "number" &&
                  typeof a?.idElevazione === "number" &&
                  typeof a?.locale === "string" &&
                  typeof a?.lunghezza === "number" &&
                  typeof a?.altezza === "number" &&
                  typeof a?.ante === "number" &&
                  typeof a?.tipologia === "string" &&
                  typeof a?.falsotelai === "boolean" &&
                  typeof a?.hDavanzale === "number" &&
                  typeof a?.idVoceCapitolato === "string",
              )
            : [];
        }
        const rawScavi = localStorage.getItem(keys.STORAGE_SCAVI_ESTERNI);
        if (rawScavi) {
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
        }
        const rawCorselli = localStorage.getItem(keys.STORAGE_CORSELLI_ESTERNI);
        if (rawCorselli) {
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
        }
        const rawCamminamenti = localStorage.getItem(keys.STORAGE_CAMMINAMENTI_ESTERNI);
        if (rawCamminamenti) {
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
        }
      }
    }
  } catch {
    murielevazioni = [];
    stratiMurElevazione = [];
    apertureElevazione = [];
    scaviEsterni = [];
    corselliEsterni = [];
    camminamentiEsterni = [];
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

  if (murielevazioni.length === 0 && stratiMurElevazione.length === 0) {
    const migrated = migrateFromLegacy(keys, piani);
    murielevazioni = migrated.murielevazioni;
    stratiMurElevazione = migrated.stratiMurElevazione;
  }

  const elevazioneIdCounter =
    murielevazioni.reduce((max, e) => Math.max(max, e.idElevazione), 0) + 1;
  const stratoMurIdCounter =
    stratiMurElevazione.reduce((max, s) => Math.max(max, s.idStratoMur), 0) + 1;
  const aperturaElevIdCounter =
    apertureElevazione.reduce((max, a) => Math.max(max, a.idAperturaElev), 0) + 1;
  const scavoIdCounter = scaviEsterni.reduce((max, s) => Math.max(max, s.idPlScavo), 0) + 1;
  const corselloIdCounter = corselliEsterni.reduce((max, c) => Math.max(max, c.idPlCors), 0) + 1;
  const camminamentiIdCounter =
    camminamentiEsterni.reduce((max, c) => Math.max(max, c.idPlCamm), 0) + 1;
  const misurazioniIdCounter =
    misurazioniVarie.reduce((max, m) => Math.max(max, m.idMisurazione), 0) + 1;

  return {
    murielevazioni,
    stratiMurElevazione,
    apertureElevazione,
    scaviEsterni,
    corselliEsterni,
    camminamentiEsterni,
    misurazioniVarie,
    elevazioneIdCounter,
    stratoMurIdCounter,
    aperturaElevIdCounter,
    scavoIdCounter,
    corselloIdCounter,
    camminamentiIdCounter,
    misurazioniIdCounter,
  };
}

function migrateFromLegacy(keys, piani) {
  const murielevazioni = [];
  const stratiMurElevazione = [];
  let elevazioneIdCounter = 1;
  let stratoMurIdCounter = 1;

  try {
    const raw = localStorage.getItem(keys.STORAGE_MUR_LEGACY);
    if (!raw) return { murielevazioni, stratiMurElevazione };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return { murielevazioni, stratiMurElevazione };

    const interrati = piani.filter((p) => p.tipologia === "Interrato");
    const fallbackPianoId = interrati[0]?.id;

    parsed.forEach((item) => {
      if (
        typeof item?.idElevazione !== "number" ||
        typeof item?.idStrato !== "string" ||
        typeof item?.lunghezza !== "number" ||
        typeof item?.altezza !== "number" ||
        typeof item?.spessore !== "number" ||
        typeof item?.idVoceCapitolato !== "string"
      ) {
        return;
      }
      const idPiano = typeof item.idPiano === "number" ? item.idPiano : fallbackPianoId;
      if (idPiano === undefined) return;

      const newEleId = elevazioneIdCounter++;
      murielevazioni.push({ idElevazione: newEleId, idPiano, riferimento: "", spessore: 0 });
      stratiMurElevazione.push({
        idStratoMur: stratoMurIdCounter++,
        idElevazione: newEleId,
        idStrato: item.idStrato,
        lunghezza: item.lunghezza,
        altezza: item.altezza,
        spessore: item.spessore,
        idVoceCapitolato: item.idVoceCapitolato,
      });
    });

    saveMurDati(keys, murielevazioni, stratiMurElevazione, [], [], [], [], []);
  } catch {
    return { murielevazioni: [], stratiMurElevazione: [] };
  }

  return { murielevazioni, stratiMurElevazione };
}
