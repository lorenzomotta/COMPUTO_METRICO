export function parseNumber(inputValue) {
  const parsed = Number(inputValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function parseAnteIntero(inputValue) {
  const n = Number(inputValue);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return null;
  }
  return n;
}

export function parseNonNegativeDecimal2(inputValue) {
  const n = Number(inputValue);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

export function fmt2(n) {
  return Number(n).toFixed(2);
}

/**
 * Percentuale apertura (0–100). Dati vecchi o valore assente → 100 (superficie intera).
 * Valori fuori intervallo vengono limitati a 0 o 100.
 */
export function normalizzaPercentualeApertura(raw) {
  if (raw === "" || raw === undefined || raw === null) return 100;
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

/**
 * Lettura da form: vuoto → 100; fuori da 0–100 o non numerico → null.
 */
export function parsePercentualeApertura(inputValue) {
  const txt = String(inputValue ?? "").trim();
  if (txt === "") return 100;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

/** Moltiplicatore 0–1 da usare sulla superficie (100% → 1). */
export function fattorePercentualeApertura(raw) {
  return normalizzaPercentualeApertura(raw) / 100;
}

/**
 * Superficie apertura: larghezza × altezza (o H inclusa) × percentuale/100.
 */
export function mqAperturaConPercentuale(largh, altezzaOInclusa, percentuale, decimals = 2) {
  const l = Number(largh);
  const h = Number(altezzaOInclusa);
  if (!Number.isFinite(l) || !Number.isFinite(h)) return 0;
  return Number((l * h * fattorePercentualeApertura(percentuale)).toFixed(decimals));
}

/** Virgola o punto; vuoto → null (non è zero). */
function parseMetroFlexible(v) {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Altezza verticale dell’apertura che interseca la fascia dello strato [elevazione, elevazione + altezzaStrato]
 * rispetto al suolo (stesso riferimento di H davanzale).
 * @param {string|number|null|undefined} elevazioneStrato Base fascia da terra (m); campo vuoto → 0.
 * @param {string|number|null|undefined} altezzaStrato Altezza fascia strato (m).
 * @param {{ alt?: unknown, altezza?: unknown, hDav?: unknown, hDavanzale?: unknown }} apertura
 * @returns {number|null} metri di intersezione, oppure null se mancano dati numerici essenziali.
 */
export function altezzaInclusaNelloStratoConElevazione(elevazioneStrato, altezzaStrato, apertura) {
  const H = parseMetroFlexible(altezzaStrato);
  if (H === null) return null;

  const elevRaw = String(elevazioneStrato ?? "").trim();
  const E = elevRaw === "" ? 0 : parseMetroFlexible(elevazioneStrato);
  if (E === null) return null;

  const hDav = parseMetroFlexible(apertura?.hDav ?? apertura?.hDavanzale);
  const altAp = parseMetroFlexible(apertura?.alt ?? apertura?.altezza);
  if (hDav === null || altAp === null) return null;

  const lo = Math.max(E, hDav);
  const hi = Math.min(E + H, hDav + altAp);
  return Math.max(0, hi - lo);
}

/** Compatibilità muratura: elevazione strato = 0. */
export function altezzaAperturaInclusaNelloStrato(altezzaStrato, apertura) {
  const r = altezzaInclusaNelloStratoConElevazione(0, altezzaStrato, apertura);
  return r ?? 0;
}
