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
