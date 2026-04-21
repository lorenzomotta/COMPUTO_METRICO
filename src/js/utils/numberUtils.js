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

export function altezzaAperturaInclusaNelloStrato(altezzaStrato, apertura) {
  return Math.min(
    apertura.altezza,
    Math.max(0, altezzaStrato - apertura.hDavanzale),
  );
}
