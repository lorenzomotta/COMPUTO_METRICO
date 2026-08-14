import { dismissCamminamentiIfOpen } from "../camminamenti-misurazione.js";
import { dismissVaniIfOpen } from "../vani-misurazione.js";
import { dismissPerimetraliIfOpen } from "../perimetrali-misurazione.js";
import { dismissElevazioneIfOpen } from "../elevazione-misurazione.js";
import { dismissSolaiInterniIfOpen } from "../solai-interni-misurazione.js";
import { dismissSolaiInclinatiIfOpen } from "../solai-inclinati-misurazione.js";

function dismissOverlayMisurazioni() {
  dismissVaniIfOpen();
  dismissCamminamentiIfOpen();
  dismissPerimetraliIfOpen();
  dismissElevazioneIfOpen();
  dismissSolaiInterniIfOpen();
  dismissSolaiInclinatiIfOpen();
}

export function updateInterratoPanelSubtitle(targetEl, piano) {
  targetEl.innerHTML = `Piano selezionato: IDPIANO <strong>${piano.id}</strong> — ${piano.edificio} / ${piano.piano}`;
}

/** Aggiorna le etichette "piano in compilazione" (ID piano + riferimento muro sul piano). */
export function updateMurPianoCompilazioneLabel(
  idEl,
  riferimentoEl,
  compilazionePianoId,
  piani = [],
) {
  const p =
    compilazionePianoId === null ? null : piani.find((item) => item.id === compilazionePianoId);
  const t = compilazionePianoId === null ? "—" : String(compilazionePianoId);
  const riferimento =
    p && typeof p.murRiferimento === "string" && p.murRiferimento.trim() !== ""
      ? p.murRiferimento.trim()
      : "—";
  idEl.textContent = t;
  if (riferimentoEl) riferimentoEl.textContent = riferimento;
  document.querySelectorAll(".id-piano-compilazione-inline").forEach((el) => {
    el.textContent = t;
  });
  document.querySelectorAll(".riferimento-mur-piano-inline").forEach((el) => {
    el.textContent = riferimento;
  });
}

export function showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl) {
  dismissOverlayMisurazioni();
  vistaPianiEl.hidden = false;
  vistaCompilazioneEl.hidden = true;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl) {
  dismissOverlayMisurazioni();
  vistaPianiEl.hidden = true;
  vistaCompilazioneEl.hidden = false;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
