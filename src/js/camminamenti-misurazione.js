/**
 * Misurazione CAMMINAMENTI — UI fullscreen.
 */

import { initCamminamentiUi, prepareVistaCamminamenti } from "./camminamenti-riferimenti.js";

const MAIN_VIEW_IDS = [
  "vista-piani",
  "vista-compilazione",
  "compilazione-altre-tipologie",
  "compilazione-scavo",
  "compilazione-misure-varie",
  "vista-voci",
  "vista-bim",
];

function hideOverlay() {
  const shell = document.getElementById("vista-camminamenti");
  if (shell) shell.hidden = true;
  document.body.classList.remove("camm-fullscreen-active");
  document.body.style.overflow = "";
}

export function dismissCamminamentiIfOpen() {
  const shell = document.getElementById("vista-camminamenti");
  if (!shell || shell.hidden) return;
  hideOverlay();
}

export function openVistaCamminamenti() {
  const vaniShell = document.getElementById("vista-vani");
  if (vaniShell) {
    vaniShell.hidden = true;
    document.body.classList.remove("vani-fullscreen-active");
  }
  const perimShell = document.getElementById("vista-perimetrali");
  if (perimShell) {
    perimShell.hidden = true;
    document.body.classList.remove("perim-fullscreen-active");
  }
  const elevShell = document.getElementById("vista-elevazione");
  if (elevShell) {
    elevShell.hidden = true;
    document.body.classList.remove("elev-fullscreen-active");
  }
  const solaiShell = document.getElementById("vista-solai-interni");
  if (solaiShell) {
    solaiShell.hidden = true;
    document.body.classList.remove("solai-fullscreen-active");
  }
  const solaiInclShell = document.getElementById("vista-solai-inclinati");
  if (solaiInclShell) {
    solaiInclShell.hidden = true;
    document.body.classList.remove("solai-incl-fullscreen-active");
  }
  const stradeShell = document.getElementById("vista-strade");
  if (stradeShell) {
    stradeShell.hidden = true;
    document.body.classList.remove("strade-fullscreen-active");
  }
  for (const id of MAIN_VIEW_IDS) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  const shell = document.getElementById("vista-camminamenti");
  if (shell) shell.hidden = false;
  document.body.classList.add("camm-fullscreen-active");
  document.body.style.overflow = "hidden";
  prepareVistaCamminamenti();
  window.requestAnimationFrame(() => {
    document.querySelector("#vista-camminamenti .camm-piano-nome")?.focus();
  });
}

export function closeVistaCamminamenti() {
  hideOverlay();
  const vistaVoci = document.getElementById("vista-voci");
  const vistaPiani = document.getElementById("vista-piani");
  const vistaCompilazione = document.getElementById("vista-compilazione");
  const vistaBim = document.getElementById("vista-bim");
  const altre = document.getElementById("compilazione-altre-tipologie");
  if (vistaPiani) vistaPiani.hidden = true;
  if (vistaCompilazione) vistaCompilazione.hidden = true;
  if (altre) altre.hidden = true;
  if (vistaVoci) vistaVoci.hidden = false;
  if (vistaBim) vistaBim.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function wireCamminamentiUi() {
  initCamminamentiUi();

  document.getElementById("btn-camm-chiudi")?.addEventListener("click", () => {
    closeVistaCamminamenti();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const shell = document.getElementById("vista-camminamenti");
    if (!shell || shell.hidden) return;
    e.preventDefault();
    closeVistaCamminamenti();
  });
}
