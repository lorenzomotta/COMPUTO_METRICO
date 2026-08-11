/**
 * Misurazione speciale VANI — UI fullscreen (vano + pareti + aperture archivio).
 */

import { initVaniParetiUi, prepareVistaVaniPareti } from "./vani-pareti.js";

const MAIN_VIEW_IDS = [
  "vista-piani",
  "vista-compilazione",
  "compilazione-altre-tipologie",
  "vista-voci",
  "vista-bim",
];

function setVaniHelpInlineOpen(open) {
  const panel = document.getElementById("vani-help-inline");
  const btn = document.getElementById("btn-vani-help-toggle");
  if (panel) panel.hidden = !open;
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function hideVistaVaniOverlay() {
  const shell = document.getElementById("vista-vani");
  if (shell) shell.hidden = true;
  setVaniHelpInlineOpen(false);
  document.body.classList.remove("vani-fullscreen-active");
  document.body.style.overflow = "";
}

/** Chiude solo l’overlay se è aperto, senza cambiare le altre viste (es. passaggio a Piani o Compilazione). */
export function dismissVaniIfOpen() {
  const shell = document.getElementById("vista-vani");
  if (!shell || shell.hidden) return;
  hideVistaVaniOverlay();
}

export function openVistaVani() {
  const cammShell = document.getElementById("vista-camminamenti");
  if (cammShell) {
    cammShell.hidden = true;
    document.body.classList.remove("camm-fullscreen-active");
  }
  for (const id of MAIN_VIEW_IDS) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  const shell = document.getElementById("vista-vani");
  if (shell) shell.hidden = false;
  document.body.classList.add("vani-fullscreen-active");
  document.body.style.overflow = "hidden";
  prepareVistaVaniPareti();
  window.requestAnimationFrame(() => {
    document.querySelector("#vista-vani .vani-piano-nome")?.focus();
  });
}

/** Chiude VANI e torna alla vista predefinita dell’app (solo VOCI), come all’avvio. */
export function closeVistaVani() {
  hideVistaVaniOverlay();
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

export function wireVaniUi() {
  initVaniParetiUi();

  document.getElementById("btn-vani-help-toggle")?.addEventListener("click", () => {
    const panel = document.getElementById("vani-help-inline");
    const next = panel ? panel.hidden : false;
    setVaniHelpInlineOpen(next);
  });

  document.getElementById("btn-vani-chiudi")?.addEventListener("click", () => {
    closeVistaVani();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const shell = document.getElementById("vista-vani");
    if (!shell || shell.hidden) return;
    e.preventDefault();
    closeVistaVani();
  });
}
