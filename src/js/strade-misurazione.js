/**
 * Misurazione speciale STRADE — UI fullscreen.
 */

import { initStradeUi, prepareVistaStrade } from "./strade.js";

const MAIN_VIEW_IDS = [
  "vista-piani",
  "vista-compilazione",
  "compilazione-altre-tipologie",
  "compilazione-scavo",
  "compilazione-misure-varie",
  "vista-voci",
  "vista-bim",
];

function setStradeHelpInlineOpen(open) {
  const panel = document.getElementById("strade-help-inline");
  const btn = document.getElementById("btn-strade-help-toggle");
  if (panel) panel.hidden = !open;
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function hideVistaStradeOverlay() {
  const shell = document.getElementById("vista-strade");
  if (shell) shell.hidden = true;
  setStradeHelpInlineOpen(false);
  document.body.classList.remove("strade-fullscreen-active");
  document.body.style.overflow = "";
}

function hideAltriOverlayMisurazione() {
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
  const cammShell = document.getElementById("vista-camminamenti");
  if (cammShell) {
    cammShell.hidden = true;
    document.body.classList.remove("camm-fullscreen-active");
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
}

/** Chiude solo l’overlay se è aperto, senza cambiare le altre viste. */
export function dismissStradeIfOpen() {
  const shell = document.getElementById("vista-strade");
  if (!shell || shell.hidden) return;
  hideVistaStradeOverlay();
}

export function openVistaStrade() {
  hideAltriOverlayMisurazione();
  for (const id of MAIN_VIEW_IDS) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  const shell = document.getElementById("vista-strade");
  if (shell) shell.hidden = false;
  document.body.classList.add("strade-fullscreen-active");
  document.body.style.overflow = "hidden";
  prepareVistaStrade();
  window.requestAnimationFrame(() => {
    document.querySelector("#vista-strade .strade-piano-nome")?.focus();
  });
}

export function closeVistaStrade() {
  hideVistaStradeOverlay();
  const vistaPiani = document.getElementById("vista-piani");
  const vistaCompilazione = document.getElementById("vista-compilazione");
  const vistaVoci = document.getElementById("vista-voci");
  const vistaBim = document.getElementById("vista-bim");
  const altre = document.getElementById("compilazione-altre-tipologie");
  if (vistaPiani) vistaPiani.hidden = true;
  if (vistaCompilazione) vistaCompilazione.hidden = true;
  if (altre) altre.hidden = true;
  if (vistaVoci) vistaVoci.hidden = false;
  if (vistaBim) vistaBim.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function wireStradeUi() {
  initStradeUi();

  document.getElementById("btn-strade-help-toggle")?.addEventListener("click", () => {
    const panel = document.getElementById("strade-help-inline");
    const next = panel ? panel.hidden : false;
    setStradeHelpInlineOpen(next);
  });

  document.getElementById("btn-strade-chiudi")?.addEventListener("click", () => {
    closeVistaStrade();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const shell = document.getElementById("vista-strade");
    if (!shell || shell.hidden) return;
    e.preventDefault();
    closeVistaStrade();
  });
}
