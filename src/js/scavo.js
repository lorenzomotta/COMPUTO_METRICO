/**
 * Vista dedicata SCAVO (ex sezione in ESTERNI VARI).
 */

import { dismissCamminamentiIfOpen } from "./camminamenti-misurazione.js";
import { dismissPerimetraliIfOpen } from "./perimetrali-misurazione.js";
import { dismissSolaiInterniIfOpen } from "./solai-interni-misurazione.js";
import { dismissSolaiInclinatiIfOpen } from "./solai-inclinati-misurazione.js";
import { dismissVaniIfOpen } from "./vani-misurazione.js";
import { showVistaCompilazione } from "./modules/viewHelpers.js";

/**
 * @param {{
 *   onPrepare?: () => void,
 * }} [opts]
 */
export function openVistaScavo(opts = {}) {
  dismissVaniIfOpen();
  dismissPerimetraliIfOpen();
  dismissSolaiInterniIfOpen();
  dismissSolaiInclinatiIfOpen();
  dismissCamminamentiIfOpen();

  const vistaPianiEl = document.getElementById("vista-piani");
  const vistaCompilazioneEl = document.getElementById("vista-compilazione");
  const altreTipologiePanelEl = document.getElementById("compilazione-altre-tipologie");
  const vistaVociEl = document.getElementById("vista-voci");
  const vistaBimEl = document.getElementById("vista-bim");
  const interrato = document.getElementById("compilazione-interrato");
  const esterni = document.getElementById("compilazione-esterni-vari");
  const misure = document.getElementById("compilazione-misure-varie");
  const scavo = document.getElementById("compilazione-scavo");

  if (interrato) interrato.hidden = true;
  if (esterni) esterni.hidden = true;
  if (altreTipologiePanelEl) altreTipologiePanelEl.hidden = true;
  if (misure) misure.hidden = true;
  if (scavo) scavo.hidden = false;

  showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
  if (vistaVociEl) vistaVociEl.hidden = true;
  if (vistaBimEl) vistaBimEl.hidden = true;

  if (typeof opts.onPrepare === "function") opts.onPrepare();

  window.requestAnimationFrame(() => {
    document.getElementById("scavo-piano")?.focus();
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function closeVistaScavo() {
  const scavo = document.getElementById("compilazione-scavo");
  if (scavo) scavo.hidden = true;

  const vistaPianiEl = document.getElementById("vista-piani");
  const vistaCompilazioneEl = document.getElementById("vista-compilazione");
  const vistaVociEl = document.getElementById("vista-voci");
  const vistaBimEl = document.getElementById("vista-bim");

  if (vistaPianiEl) vistaPianiEl.hidden = true;
  if (vistaCompilazioneEl) vistaCompilazioneEl.hidden = true;
  if (vistaVociEl) vistaVociEl.hidden = false;
  if (vistaBimEl) vistaBimEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

/** Nasconde il pannello SCAVO se aperto (senza cambiare le altre viste). */
export function dismissScavoIfOpen() {
  const scavo = document.getElementById("compilazione-scavo");
  if (scavo) scavo.hidden = true;
}

/**
 * @param {{
 *   onPrepare?: () => void,
 *   onBack?: () => void,
 * }} [opts]
 */
export function wireScavoUi(opts = {}) {
  document.getElementById("btn-torna-piani-scavo")?.addEventListener("click", () => {
    if (typeof opts.onBack === "function") opts.onBack();
    else closeVistaScavo();
  });
}
