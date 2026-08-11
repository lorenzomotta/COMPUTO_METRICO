/** Legge l’archivio voci del computo e restituisce testi univoci di «voce abbreviata» ordinati. */

export const STORAGE_VOCI_ARCHIVIO_KEY = "computo_metrico_voci";

export function loadVoceAbbreviateUnicheSorted() {
  try {
    const raw = localStorage.getItem(STORAGE_VOCI_ARCHIVIO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const set = new Set();
    for (const item of parsed) {
      if (typeof item?.voceAbbreviata !== "string") continue;
      const ab = item.voceAbbreviata.trim();
      if (ab) set.add(ab);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
  } catch {
    return [];
  }
}

export function popolaDatalistVocibrevi(datalistElementId) {
  const dl = document.getElementById(datalistElementId);
  if (!dl) return;
  dl.replaceChildren();
  for (const v of loadVoceAbbreviateUnicheSorted()) {
    const opt = document.createElement("option");
    opt.value = v;
    dl.appendChild(opt);
  }
}
