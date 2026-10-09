/**
 * Schede dei moduli (VANI, pareti, solai, camminamenti) nel file del computo.
 * Ogni voce è l’oggetto salvato in localStorage, di solito { v, items }.
 */

const CHIAVI_SCHEDE = {
  vani: "computo_metrico_vani_registrati",
  perimetrali: "computo_metrico_perimetrali_registrati",
  elevazione: "computo_metrico_elevazione_registrati",
  solaiInterni: "computo_metrico_solai_interni_registrati",
  solaiInclinati: "computo_metrico_solai_inclinati_registrati",
  camminamenti: "computo_metrico_camminamenti_registrati",
};

function leggiJsonStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function leggiSchedeModuliPerExport() {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [nome, key] of Object.entries(CHIAVI_SCHEDE)) {
    out[nome] = leggiJsonStorage(key);
  }
  return out;
}

export function applicaSchedeModuliDaImport(blocco) {
  if (!blocco || typeof blocco !== "object") return;
  for (const [nome, key] of Object.entries(CHIAVI_SCHEDE)) {
    if (!Object.prototype.hasOwnProperty.call(blocco, nome)) continue;
    const valore = blocco[nome];
    try {
      if (valore && typeof valore === "object") {
        localStorage.setItem(key, JSON.stringify(valore));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  }
}
