/**
 * Vista dedicata MISURE VARIE (ex sezione in ESTERNI VARI).
 */

import { dismissCamminamentiIfOpen } from "./camminamenti-misurazione.js";
import { dismissVaniIfOpen } from "./vani-misurazione.js";
import { showVistaCompilazione, showVistaPiani } from "./modules/viewHelpers.js";

/**
 * @param {{
 *   onPrepare?: () => void,
 * }} [opts]
 */
export function openVistaMisureVarie(opts = {}) {
  dismissVaniIfOpen();
  dismissCamminamentiIfOpen();

  const vistaPianiEl = document.getElementById("vista-piani");
  const vistaCompilazioneEl = document.getElementById("vista-compilazione");
  const altreTipologiePanelEl = document.getElementById("compilazione-altre-tipologie");
  const vistaVociEl = document.getElementById("vista-voci");
  const vistaBimEl = document.getElementById("vista-bim");
  const interrato = document.getElementById("compilazione-interrato");
  const esterni = document.getElementById("compilazione-esterni-vari");
  const misure = document.getElementById("compilazione-misure-varie");

  if (interrato) interrato.hidden = true;
  if (esterni) esterni.hidden = true;
  if (altreTipologiePanelEl) altreTipologiePanelEl.hidden = true;
  if (misure) misure.hidden = false;

  showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
  if (vistaVociEl) vistaVociEl.hidden = true;
  if (vistaBimEl) vistaBimEl.hidden = true;

  if (typeof opts.onPrepare === "function") opts.onPrepare();

  window.requestAnimationFrame(() => {
    document.getElementById("misurazioni-piano")?.focus();
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function closeVistaMisureVarie() {
  const misure = document.getElementById("compilazione-misure-varie");
  if (misure) misure.hidden = true;

  const vistaPianiEl = document.getElementById("vista-piani");
  const vistaCompilazioneEl = document.getElementById("vista-compilazione");
  const altreTipologiePanelEl = document.getElementById("compilazione-altre-tipologie");
  const vistaVociEl = document.getElementById("vista-voci");
  const vistaBimEl = document.getElementById("vista-bim");

  showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
  if (vistaVociEl) vistaVociEl.hidden = true;
  if (vistaBimEl) vistaBimEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

/**
 * @param {{
 *   onPrepare?: () => void,
 *   onBack?: () => void,
 * }} [opts]
 */
export function wireMisureVarieUi(opts = {}) {
  document.getElementById("btn-torna-piani-misure-varie")?.addEventListener("click", () => {
    if (typeof opts.onBack === "function") opts.onBack();
    else closeVistaMisureVarie();
  });
}
