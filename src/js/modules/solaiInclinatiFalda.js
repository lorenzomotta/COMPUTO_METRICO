/**
 * Calcolo area falda (come in misurazioni VOCI → Formula falda).
 * mq = gronda × (salita × sqrt(1 + (pendenza%/100)²))
 */

function parseDim(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return null;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

function formatFixed3ForFormula(raw) {
  const n = parseDim(raw);
  if (n === null) return "";
  return n.toFixed(3);
}

/** Fattore √(1 + p²) con p = pendenza/100. */
export function fattorePendenzaFalda(pendenzaPct) {
  const p = parseDim(pendenzaPct) ?? 0;
  const f = p / 100;
  return Math.sqrt(1 + f * f);
}

/** Area falda in mq. */
export function calcolaMqFalda(gronda, salita, pendenzaPct) {
  const g = parseDim(gronda) ?? 0;
  const s = parseDim(salita) ?? 0;
  const radq = fattorePendenzaFalda(pendenzaPct);
  return Number((g * (s * radq)).toFixed(3));
}

/** Testo formula come nel dialog «Formula falda». */
export function testoFormulaFalda(gronda, salita, pendenzaPct) {
  const g = formatFixed3ForFormula(gronda);
  const s = formatFixed3ForFormula(salita);
  if (!g || !s) return "";
  const radq = Number(fattorePendenzaFalda(pendenzaPct).toFixed(6)).toString();
  return `(${g} * (${s} * ${radq}))`;
}

export function parseDimFalda(raw) {
  return parseDim(raw);
}
