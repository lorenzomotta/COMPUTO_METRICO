export function updateInterratoPanelSubtitle(targetEl, piano) {
  targetEl.innerHTML = `Piano selezionato: IDPIANO <strong>${piano.id}</strong> — ${piano.edificio} / ${piano.piano}`;
}

export function updateElevazioneAttivaLabel(
  idEl,
  riferimentoEl,
  currentElevazioneId,
  murielevazioni = [],
) {
  const t = currentElevazioneId === null ? "—" : String(currentElevazioneId);
  const riferimento =
    currentElevazioneId === null
      ? "—"
      : murielevazioni.find((item) => item.idElevazione === currentElevazioneId)?.riferimento?.trim() ||
        "—";
  idEl.textContent = t;
  if (riferimentoEl) riferimentoEl.textContent = riferimento;
  document.querySelectorAll(".id-elevazione-attiva-inline").forEach((el) => {
    el.textContent = t;
  });
  document.querySelectorAll(".riferimento-elevazione-attiva-inline").forEach((el) => {
    el.textContent = riferimento;
  });
}

export function showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl) {
  vistaPianiEl.hidden = false;
  vistaCompilazioneEl.hidden = true;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl) {
  vistaPianiEl.hidden = true;
  vistaCompilazioneEl.hidden = false;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
