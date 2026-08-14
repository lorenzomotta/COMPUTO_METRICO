/**
 * Misurazione speciale PERIMETRALI — UI fullscreen (pareti perimetrali + aperture).
 */

import { initPerimetraliParetiUi, prepareVistaPerimetraliPareti } from "./perimetrali-pareti.js";

const MAIN_VIEW_IDS = [
  "vista-piani",
  "vista-compilazione",
  "compilazione-altre-tipologie",
  "compilazione-scavo",
  "compilazione-misure-varie",
  "vista-elevazione",
  "vista-voci",
  "vista-bim",
];

function setPerimHelpInlineOpen(open) {
  const panel = document.getElementById("perim-help-inline");
  const btn = document.getElementById("btn-perim-help-toggle");
  if (panel) panel.hidden = !open;
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function hideVistaPerimetraliOverlay() {
  const shell = document.getElementById("vista-perimetrali");
  if (shell) shell.hidden = true;
  setPerimHelpInlineOpen(false);
  document.body.classList.remove("perim-fullscreen-active");
  document.body.style.overflow = "";
}

/** Chiude solo l’overlay se è aperto, senza cambiare le altre viste. */
export function dismissPerimetraliIfOpen() {
  const shell = document.getElementById("vista-perimetrali");
  if (!shell || shell.hidden) return;
  hideVistaPerimetraliOverlay();
}

export function openVistaPerimetrali() {
  const vaniShell = document.getElementById("vista-vani");
  if (vaniShell) {
    vaniShell.hidden = true;
    document.body.classList.remove("vani-fullscreen-active");
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
  for (const id of MAIN_VIEW_IDS) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  const shell = document.getElementById("vista-perimetrali");
  if (shell) shell.hidden = false;
  document.body.classList.add("perim-fullscreen-active");
  document.body.style.overflow = "hidden";
  prepareVistaPerimetraliPareti();
  window.requestAnimationFrame(() => {
    document.querySelector("#vista-perimetrali .perim-piano-nome")?.focus();
  });
}

export function closeVistaPerimetrali() {
  hideVistaPerimetraliOverlay();
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

export function wirePerimetraliUi() {
  initPerimetraliParetiUi();

  document.getElementById("btn-perim-help-toggle")?.addEventListener("click", () => {
    const panel = document.getElementById("perim-help-inline");
    const next = panel ? panel.hidden : false;
    setPerimHelpInlineOpen(next);
  });

  document.getElementById("btn-perim-chiudi")?.addEventListener("click", () => {
    closeVistaPerimetrali();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const shell = document.getElementById("vista-perimetrali");
    if (!shell || shell.hidden) return;
    e.preventDefault();
    closeVistaPerimetrali();
  });
}
