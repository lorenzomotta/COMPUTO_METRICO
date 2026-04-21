export function renderStratiNetti({
  stratiNettiBodyEl,
  compilazionePianoId,
  currentElevazioneId,
  stratiMurElevazione,
  apertureElevazione,
  createCell,
  fmt2,
  altezzaAperturaInclusaNelloStrato,
}) {
  stratiNettiBodyEl.innerHTML = "";

  if (compilazionePianoId === null || currentElevazioneId === null) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 10;
    cell.className = "empty-cell";
    cell.textContent = "—";
    row.appendChild(cell);
    stratiNettiBodyEl.appendChild(row);
    return;
  }

  const strati = stratiMurElevazione.filter((s) => s.idElevazione === currentElevazioneId);
  const aperture = apertureElevazione.filter((a) => a.idElevazione === currentElevazioneId);

  if (strati.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 10;
    cell.className = "empty-cell";
    cell.textContent = "Aggiungi almeno uno strato per vedere il calcolo.";
    row.appendChild(cell);
    stratiNettiBodyEl.appendChild(row);
    return;
  }

  strati.forEach((strato) => {
    const lordo = strato.lunghezza * strato.altezza;
    const spessoreStrato = Number(strato.spessore || 0);
    const dettagli = aperture.map((ap) => {
      const hInc = altezzaAperturaInclusaNelloStrato(strato.altezza, ap);
      const m2 = ap.lunghezza * hInc;
      return { ap, hInc, m2 };
    });
    const sommaApertura = dettagli.reduce((s, d) => s + d.m2, 0);
    const netto = lordo - sommaApertura;
    const nettoPerSpessore = netto * spessoreStrato;

    const numRighe = dettagli.length > 0 ? dettagli.length : 1;

    for (let i = 0; i < numRighe; i += 1) {
      const tr = document.createElement("tr");

      if (i === 0) {
        const tdId = document.createElement("td");
        tdId.className = "cell-netto-rowspan";
        tdId.rowSpan = numRighe;
        tdId.textContent = strato.idStrato;
        tr.appendChild(tdId);

        const tdLordo = document.createElement("td");
        tdLordo.className = "cell-netto-rowspan";
        tdLordo.rowSpan = numRighe;
        tdLordo.textContent = fmt2(lordo);
        tr.appendChild(tdLordo);
      }

      if (dettagli.length === 0) {
        tr.appendChild(createCell("—"));
        tr.appendChild(createCell("—"));
        tr.appendChild(createCell("—"));
        tr.appendChild(createCell("—"));
        tr.appendChild(createCell(fmt2(0)));
      } else {
        const { ap, hInc, m2 } = dettagli[i];
        tr.appendChild(createCell(ap.locale || "—"));
        tr.appendChild(createCell(ap.tipologia || "—"));
        tr.appendChild(createCell(fmt2(ap.lunghezza)));
        tr.appendChild(createCell(fmt2(hInc)));
        tr.appendChild(createCell(fmt2(m2)));
      }

      if (i === 0) {
        const tdSpessore = document.createElement("td");
        tdSpessore.className = "cell-netto-rowspan";
        tdSpessore.rowSpan = numRighe;
        tdSpessore.textContent = fmt2(spessoreStrato);
        tr.appendChild(tdSpessore);

        const tdNetto = document.createElement("td");
        tdNetto.className = "cell-netto-rowspan";
        tdNetto.rowSpan = numRighe;
        tdNetto.textContent = fmt2(netto);
        tr.appendChild(tdNetto);

        const tdNettoPerSpessore = document.createElement("td");
        tdNettoPerSpessore.className = "cell-netto-rowspan";
        tdNettoPerSpessore.rowSpan = numRighe;
        tdNettoPerSpessore.textContent = fmt2(nettoPerSpessore);
        tr.appendChild(tdNettoPerSpessore);
      }

      stratiNettiBodyEl.appendChild(tr);
    }
  });
}
