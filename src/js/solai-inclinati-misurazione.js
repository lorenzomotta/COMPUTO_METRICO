/**
 * Misurazione speciale SOLAI INCLINATI — UI fullscreen.
 */

import { initSolaiInclinatiUi, prepareVistaSolaiInclinati } from "./solai-inclinati.js";

const MAIN_VIEW_IDS = [
  "vista-piani",
  "vista-compilazione",
  "compilazione-altre-tipologie",
  "compilazione-scavo",
  "compilazione-misure-varie",
  "vista-voci",
  "vista-bim",
];

function setSolaiInclHelpInlineOpen(open) {
  const panel = document.getElementById("solai-incl-help-inline");
  const btn = document.getElementById("btn-solai-incl-help-toggle");
  if (panel) panel.hidden = !open;
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function hideVistaSolaiInclinatiOverlay() {
  const shell = document.getElementById("vista-solai-inclinati");
  if (shell) shell.hidden = true;
  setSolaiInclHelpInlineOpen(false);
  document.body.classList.remove("solai-incl-fullscreen-active");
  document.body.style.overflow = "";
}

/** Chiude solo l’overlay se è aperto, senza cambiare le altre viste. */
export function dismissSolaiInclinatiIfOpen() {
  const shell = document.getElementById("vista-solai-inclinati");
  if (!shell || shell.hidden) return;
  hideVistaSolaiInclinatiOverlay();
}

export function openVistaSolaiInclinati() {
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
  const solaiIntShell = document.getElementById("vista-solai-interni");
  if (solaiIntShell) {
    solaiIntShell.hidden = true;
    document.body.classList.remove("solai-fullscreen-active");
  }
  for (const id of MAIN_VIEW_IDS) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  const shell = document.getElementById("vista-solai-inclinati");
  if (shell) shell.hidden = false;
  document.body.classList.add("solai-incl-fullscreen-active");
  document.body.style.overflow = "hidden";
  prepareVistaSolaiInclinati();
  window.requestAnimationFrame(() => {
    document.querySelector("#vista-solai-inclinati .solai-incl-piano-nome")?.focus();
  });
}

export function closeVistaSolaiInclinati() {
  hideVistaSolaiInclinatiOverlay();
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

export function wireSolaiInclinatiUi() {
  initSolaiInclinatiUi();

  document.getElementById("btn-solai-incl-help-toggle")?.addEventListener("click", () => {
    const panel = document.getElementById("solai-incl-help-inline");
    const next = panel ? panel.hidden : false;
    setSolaiInclHelpInlineOpen(next);
  });

  document.getElementById("btn-solai-incl-chiudi")?.addEventListener("click", () => {
    closeVistaSolaiInclinati();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const shell = document.getElementById("vista-solai-inclinati");
    if (!shell || shell.hidden) return;
    e.preventDefault();
    closeVistaSolaiInclinati();
  });
}
