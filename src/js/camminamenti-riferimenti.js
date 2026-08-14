/**
 * CAMMINAMENTI: Piano → più Riferimenti (Lato1, Lato2, note) → Strati finitura per riferimento.
 */

import {
  popolaDatalistArchivioPianiMisura,
  risolviBlurCampoPianoArchivioStorage,
} from "./modules/archivioPianiMisura.js";
import { popolaDatalistVocibrevi } from "./modules/archivioVociVocibrevi.js";
import {
  aggiornaVociDaSnapshotCamminamentoRegistrato,
  rimuoviRigheMisurazioniPerCamminamentiSchedaId,
} from "./modules/camminamentiRegistroAggiornaVoci.js";

const STORAGE_CAMMINAMENTI_REGISTRATI_KEY = "computo_metrico_camminamenti_registrati";

let pianoNome = "";
let riferimenti = [];
let nextRiferimentoId = 1;
let nextStratoId = 1;
let registrati = [];
let bozzaCollegataId = null;
let feedbackTimer = 0;
let eliminaPending = null;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseDim(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return null;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

function fmtDim(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Number(v).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function calcolaMqMc(lato1, lato2, spessore) {
  const m1 = parseDim(lato1) ?? 0;
  const m2 = parseDim(lato2) ?? 0;
  const sp = parseDim(spessore) ?? 0;
  return {
    mq: Number((m1 * m2).toFixed(3)),
    mc: Number((m1 * m2 * sp).toFixed(3)),
  };
}

/** Totali Mq/Mc per riferimento, separati per segno e netto. */
function calcolaTotaliRiferimento(rif) {
  let mqPos = 0;
  let mcPos = 0;
  let mqNeg = 0;
  let mcNeg = 0;
  for (const st of rif.strati || []) {
    const { mq, mc } = calcolaMqMc(rif.lato1, rif.lato2, st.spessore);
    if (st.segno === true) {
      mqNeg += mq;
      mcNeg += mc;
    } else {
      mqPos += mq;
      mcPos += mc;
    }
  }
  return {
    mqPos: Number(mqPos.toFixed(3)),
    mcPos: Number(mcPos.toFixed(3)),
    mqNeg: Number(mqNeg.toFixed(3)),
    mcNeg: Number(mcNeg.toFixed(3)),
    mqNetto: Number((mqPos - mqNeg).toFixed(3)),
    mcNetto: Number((mcPos - mcNeg).toFixed(3)),
  };
}

function fmtTotaleNegativo(val) {
  if (!Number.isFinite(val) || Math.abs(val) < 0.0005) return fmtDim(0);
  return `− ${fmtDim(Math.abs(val))}`;
}

function creaRigaTotaleTfoot(label, mqTesto, mcTesto, rowClass) {
  const tr = document.createElement("tr");
  tr.className = rowClass;
  const tdLabel = document.createElement("td");
  tdLabel.colSpan = 5;
  tdLabel.className = "camm-totale-label";
  tdLabel.textContent = label;
  tr.appendChild(tdLabel);
  const tdMq = document.createElement("td");
  tdMq.className = "camm-strato-calc camm-totale-mq";
  tdMq.textContent = mqTesto;
  tr.appendChild(tdMq);
  const tdMc = document.createElement("td");
  tdMc.className = "camm-strato-calc camm-totale-mc";
  tdMc.textContent = mcTesto;
  tr.appendChild(tdMc);
  const tdRest = document.createElement("td");
  tdRest.colSpan = 2;
  tr.appendChild(tdRest);
  return tr;
}

function renderTotaliTfoot(rif) {
  const tfoot = document.createElement("tfoot");
  tfoot.className = "camm-strati-tfoot";
  const t = calcolaTotaliRiferimento(rif);
  tfoot.appendChild(
    creaRigaTotaleTfoot("Totale valori positivi", fmtDim(t.mqPos), fmtDim(t.mcPos), "camm-totale-row camm-totale-row--pos"),
  );
  tfoot.appendChild(
    creaRigaTotaleTfoot(
      "Totale valori negativi",
      fmtTotaleNegativo(t.mqNeg),
      fmtTotaleNegativo(t.mcNeg),
      "camm-totale-row camm-totale-row--neg",
    ),
  );
  tfoot.appendChild(
    creaRigaTotaleTfoot(
      "Totale netto (differenza)",
      fmtDim(t.mqNetto),
      fmtDim(t.mcNetto),
      "camm-totale-row camm-totale-row--netto",
    ),
  );
  return tfoot;
}

function aggiornaTotaliRiferimentoBlock(block) {
  if (!block) return;
  const rid = Number(block.dataset.riferimentoId);
  const rif = riferimenti.find((r) => r.id === rid);
  const tfoot = block.querySelector(".camm-strati-tfoot");
  if (!rif || !tfoot) return;
  const t = calcolaTotaliRiferimento(rif);
  const rows = tfoot.querySelectorAll("tr");
  if (rows.length < 3) return;
  const mqCells = [rows[0].querySelector(".camm-totale-mq"), rows[1].querySelector(".camm-totale-mq"), rows[2].querySelector(".camm-totale-mq")];
  const mcCells = [rows[0].querySelector(".camm-totale-mc"), rows[1].querySelector(".camm-totale-mc"), rows[2].querySelector(".camm-totale-mc")];
  if (mqCells[0]) mqCells[0].textContent = fmtDim(t.mqPos);
  if (mcCells[0]) mcCells[0].textContent = fmtDim(t.mcPos);
  if (mqCells[1]) mqCells[1].textContent = fmtTotaleNegativo(t.mqNeg);
  if (mcCells[1]) mcCells[1].textContent = fmtTotaleNegativo(t.mcNeg);
  if (mqCells[2]) mqCells[2].textContent = fmtDim(t.mqNetto);
  if (mcCells[2]) mcCells[2].textContent = fmtDim(t.mcNetto);
}

function ripristinaContatori() {
  let maxR = 0;
  let maxS = 0;
  for (const rif of riferimenti) {
    if (Number.isFinite(rif.id)) maxR = Math.max(maxR, rif.id);
    for (const st of rif.strati || []) {
      if (st && Number.isFinite(st.id)) maxS = Math.max(maxS, st.id);
    }
  }
  nextRiferimentoId = maxR + 1;
  nextStratoId = maxS + 1;
}

function emptyStrato(n) {
  return {
    id: nextStratoId++,
    n,
    vocibreve: "",
    spessore: "",
    segno: false,
  };
}

function emptyRiferimento() {
  return {
    id: nextRiferimentoId++,
    riferimento: "",
    lato1: "",
    lato2: "",
    note: "",
    strati: [emptyStrato(1)],
  };
}

function resetBozzaVuota() {
  bozzaCollegataId = null;
  pianoNome = "";
  nextRiferimentoId = 1;
  nextStratoId = 1;
  riferimenti = [emptyRiferimento()];
}

function renumeraStrati(rif) {
  (rif.strati || []).forEach((st, i) => {
    st.n = i + 1;
  });
}

function caricaRegistrati() {
  try {
    const raw = localStorage.getItem(STORAGE_CAMMINAMENTI_REGISTRATI_KEY);
    if (!raw) {
      registrati = [];
      return;
    }
    const data = JSON.parse(raw);
    registrati = Array.isArray(data.items) ? data.items : [];
  } catch {
    registrati = [];
  }
}

function salvaRegistrati() {
  localStorage.setItem(
    STORAGE_CAMMINAMENTI_REGISTRATI_KEY,
    JSON.stringify({ v: 1, items: registrati }),
  );
}

function syncStateFromInputs() {
  const inpPiano = document.querySelector(".camm-piano-nome");
  if (inpPiano) pianoNome = inpPiano.value;

  document.querySelectorAll(".camm-rif-block").forEach((block) => {
    const rid = Number(block.dataset.riferimentoId);
    const rif = riferimenti.find((r) => r.id === rid);
    if (!rif) return;
    rif.riferimento = block.querySelector(".camm-rif-nome")?.value ?? "";
    rif.lato1 = block.querySelector(".camm-rif-lato1")?.value ?? "";
    rif.lato2 = block.querySelector(".camm-rif-lato2")?.value ?? "";
    rif.note = block.querySelector(".camm-rif-note")?.value ?? "";

    block.querySelectorAll(".camm-strato-row").forEach((row) => {
      const sid = Number(row.dataset.stratoId);
      const st = (rif.strati || []).find((x) => x.id === sid);
      if (!st) return;
      st.vocibreve = row.querySelector(".camm-strato-voce")?.value ?? "";
      st.spessore = row.querySelector(".camm-strato-spessore")?.value ?? "";
      st.segno = row.querySelector(".camm-strato-segno")?.checked === true;
    });
  });
}

function cloneRiferimentoPerSnapshot(rif) {
  return {
    riferimento: typeof rif.riferimento === "string" ? rif.riferimento : "",
    lato1: rif.lato1 != null ? String(rif.lato1) : "",
    lato2: rif.lato2 != null ? String(rif.lato2) : "",
    note: typeof rif.note === "string" ? rif.note : "",
    strati: (rif.strati || []).map((st) => ({
      id: typeof st.id === "number" ? st.id : 0,
      n: typeof st.n === "number" ? st.n : 1,
      vocibreve: typeof st.vocibreve === "string" ? st.vocibreve : "",
      spessore: st.spessore != null ? String(st.spessore) : "",
      segno: st.segno === true,
    })),
  };
}

function creaSnapshot(idDaRiprendere) {
  const idFinale =
    idDaRiprendere != null && String(idDaRiprendere).trim() !== ""
      ? String(idDaRiprendere).trim()
      : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: idFinale,
    pianoNome: typeof pianoNome === "string" ? pianoNome : "",
    riferimenti: riferimenti.map((r) => cloneRiferimentoPerSnapshot(r)),
  };
}

function applicaSnapshot(rec) {
  bozzaCollegataId = rec.id != null ? String(rec.id) : null;
  pianoNome = typeof rec.pianoNome === "string" ? rec.pianoNome : "";
  riferimenti = (Array.isArray(rec.riferimenti) ? rec.riferimenti : []).map((r) => ({
    id: nextRiferimentoId++,
    riferimento: typeof r.riferimento === "string" ? r.riferimento : "",
    lato1: r.lato1 != null ? String(r.lato1) : "",
    lato2: r.lato2 != null ? String(r.lato2) : "",
    note: typeof r.note === "string" ? r.note : "",
    strati: (Array.isArray(r.strati) ? r.strati : [{ vocibreve: "", spessore: "", segno: false }]).map(
      (st, i) => ({
        id: nextStratoId++,
        n: typeof st.n === "number" ? st.n : i + 1,
        vocibreve: typeof st.vocibreve === "string" ? st.vocibreve : "",
        spessore: st.spessore != null ? String(st.spessore) : "",
        segno: st.segno === true,
      }),
    ),
  }));
  if (riferimenti.length === 0) riferimenti = [emptyRiferimento()];
  ripristinaContatori();
}

function mostraFeedback(ok, msg) {
  const el = document.getElementById("camm-registra-feedback");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("camm-registra-feedback--err", !ok);
  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    el.textContent = "";
    el.classList.remove("camm-registra-feedback--err");
  }, 6000);
}

function renderSidebar() {
  const ul = document.getElementById("camm-sidebar-list");
  if (!ul) return;
  ul.replaceChildren();
  if (registrati.length === 0) {
    const li = document.createElement("li");
    li.className = "camm-sidebar-empty";
    li.textContent = "Nessun camminamento registrato.";
    ul.appendChild(li);
    return;
  }
  for (const item of registrati) {
    const piano = (item.pianoNome && String(item.pianoNome).trim()) || "Piano";
    const nRif = Array.isArray(item.riferimenti) ? item.riferimenti.length : 0;
    const testo = nRif > 0 ? `${piano} · ${nRif} rif.` : piano;
    const li = document.createElement("li");
    li.className = "camm-sidebar-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "camm-sidebar-item";
    btn.dataset.schedaId = String(item.id);
    btn.textContent = testo;
    btn.title = "Apri in modifica";
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-action btn-delete camm-sidebar-elimina";
    btnDel.dataset.action = "elimina-camm-registrato";
    btnDel.dataset.schedaId = String(item.id);
    btnDel.title = "Elimina";
    btnDel.setAttribute("aria-label", `Elimina ${testo}`);
    btnDel.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
    li.appendChild(btn);
    li.appendChild(btnDel);
    ul.appendChild(li);
  }
}

function renderStratoRow(rif, st, tbody) {
  const { mq, mc } = calcolaMqMc(rif.lato1, rif.lato2, st.spessore);
  const m1 = parseDim(rif.lato1);
  const m2 = parseDim(rif.lato2);

  const tr = document.createElement("tr");
  tr.className = "camm-strato-row";
  tr.dataset.stratoId = String(st.id);

  const tdN = document.createElement("td");
  tdN.className = "camm-strato-num";
  tdN.textContent = String(st.n ?? "");
  tr.appendChild(tdN);

  const tdVoce = document.createElement("td");
  const inpVoce = document.createElement("input");
  inpVoce.type = "text";
  inpVoce.className = "camm-strato-voce";
  inpVoce.setAttribute("list", "camm-vocibrevi-datalist");
  inpVoce.placeholder = "Voce breve";
  inpVoce.autocomplete = "off";
  inpVoce.value = typeof st.vocibreve === "string" ? st.vocibreve : "";
  tdVoce.appendChild(inpVoce);
  tr.appendChild(tdVoce);

  const tdM1 = document.createElement("td");
  tdM1.className = "camm-strato-calc";
  tdM1.textContent = fmtDim(m1);
  tr.appendChild(tdM1);

  const tdM2 = document.createElement("td");
  tdM2.className = "camm-strato-calc";
  tdM2.textContent = fmtDim(m2);
  tr.appendChild(tdM2);

  const tdSp = document.createElement("td");
  const inpSp = document.createElement("input");
  inpSp.type = "number";
  inpSp.className = "camm-strato-spessore camm-in-num";
  inpSp.step = "0.001";
  inpSp.min = "0";
  inpSp.placeholder = "Sp.";
  inpSp.value = typeof st.spessore === "string" ? st.spessore : String(st.spessore ?? "");
  tdSp.appendChild(inpSp);
  tr.appendChild(tdSp);

  const tdMq = document.createElement("td");
  tdMq.className = "camm-strato-calc";
  tdMq.dataset.role = "mq";
  tdMq.textContent = fmtDim(mq);
  tr.appendChild(tdMq);

  const tdMc = document.createElement("td");
  tdMc.className = "camm-strato-calc";
  tdMc.dataset.role = "mc";
  tdMc.textContent = fmtDim(mc);
  tr.appendChild(tdMc);

  const tdSegno = document.createElement("td");
  tdSegno.className = "camm-strato-segno-cell";
  const lbl = document.createElement("label");
  lbl.className = "camm-strato-segno-label";
  lbl.title = "Riga negativa (sottrazione)";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.className = "camm-strato-segno";
  chk.checked = st.segno === true;
  chk.setAttribute("aria-label", "Sottrai strato");
  lbl.appendChild(chk);
  lbl.append(" sottrai");
  tdSegno.appendChild(lbl);
  tr.appendChild(tdSegno);

  const tdAct = document.createElement("td");
  const btnRm = document.createElement("button");
  btnRm.type = "button";
  btnRm.className = "btn-action btn-delete camm-btn-micro";
  btnRm.dataset.action = "rimuovi-strato";
  btnRm.dataset.riferimentoId = String(rif.id);
  btnRm.dataset.stratoId = String(st.id);
  btnRm.textContent = "✕";
  btnRm.title = "Rimuovi strato";
  tdAct.appendChild(btnRm);
  tr.appendChild(tdAct);

  tbody.appendChild(tr);
}

function renderRiferimentoBlock(rif, host) {
  const block = document.createElement("div");
  block.className = "camm-rif-block card-like";
  block.dataset.riferimentoId = String(rif.id);

  const head = document.createElement("div");
  head.className = "camm-rif-head";
  head.innerHTML = `
    <div class="camm-rif-fields">
      <label class="camm-field"><span>Riferimento</span>
        <input type="text" class="camm-rif-nome" value="${escapeHtml(rif.riferimento)}" placeholder="rif." /></label>
      <label class="camm-field"><span>Lato 1</span>
        <input type="number" class="camm-rif-lato1 camm-in-num" step="0.001" min="0" value="${escapeHtml(rif.lato1)}" placeholder="m" /></label>
      <label class="camm-field"><span>Lato 2</span>
        <input type="number" class="camm-rif-lato2 camm-in-num" step="0.001" min="0" value="${escapeHtml(rif.lato2)}" placeholder="m" /></label>
      <label class="camm-field camm-field--note"><span>Note</span>
        <input type="text" class="camm-rif-note" value="${escapeHtml(rif.note)}" placeholder="Note" /></label>
    </div>
    <div class="camm-rif-actions">
      <button type="button" class="btn-action btn-secondary camm-btn-mini" data-action="aggiungi-strato" data-riferimento-id="${rif.id}">+ Strato</button>
      <button type="button" class="btn-action btn-delete camm-btn-mini" data-action="rimuovi-riferimento" data-riferimento-id="${rif.id}" title="Rimuovi riferimento">✕ Rif.</button>
    </div>`;

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap camm-strati-table-wrap";
  const table = document.createElement("table");
  table.className = "table camm-strati-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>VOCE</th><th>M1</th><th>M2</th><th>Spess.</th><th>Mq</th><th>Mc</th><th>Sottrai</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");
  tbody.className = "camm-strati-tbody";
  for (const st of rif.strati || []) renderStratoRow(rif, st, tbody);
  table.appendChild(tbody);
  table.appendChild(renderTotaliTfoot(rif));
  tableWrap.appendChild(table);

  block.appendChild(head);
  block.appendChild(tableWrap);
  host.appendChild(block);
}

function renderGerarchia() {
  const host = document.getElementById("camm-gerarchia-host");
  if (!host) return;
  host.replaceChildren();

  const head = document.createElement("div");
  head.className = "camm-piano-head";
  head.innerHTML = `
    <span class="camm-piano-tag">Piano</span>
    <input type="text" class="camm-piano-nome" list="datalist-piani-misura-archivio" autocomplete="off"
      placeholder="Scegli o scrivi piano" value="${escapeHtml(pianoNome)}" aria-label="Piano" />
    <button type="button" class="btn-action btn-secondary camm-btn-mini" data-action="apri-dialog-nuova-voce"
      title="Nuova voce nel computo">AGGIUNGI VOCE</button>
    <button type="button" class="btn-action btn-secondary camm-btn-mini" data-action="aggiungi-riferimento">
      + Riferimento</button>`;
  host.appendChild(head);

  const rifHost = document.createElement("div");
  rifHost.className = "camm-riferimenti-host";
  for (const rif of riferimenti) renderRiferimentoBlock(rif, rifHost);
  host.appendChild(rifHost);

  popolaDatalistVocibrevi("camm-vocibrevi-datalist");
  popolaDatalistArchivioPianiMisura();
}

function aggiornaCalcoliStratoRow(row, rif) {
  const sp = row.querySelector(".camm-strato-spessore")?.value ?? "";
  const { mq, mc } = calcolaMqMc(rif.lato1, rif.lato2, sp);
  const tdMq = row.querySelector('[data-role="mq"]');
  const tdMc = row.querySelector('[data-role="mc"]');
  const m1 = parseDim(rif.lato1);
  const m2 = parseDim(rif.lato2);
  const tdM1 = row.cells[2];
  const tdM2 = row.cells[3];
  if (tdM1) tdM1.textContent = fmtDim(m1);
  if (tdM2) tdM2.textContent = fmtDim(m2);
  if (tdMq) tdMq.textContent = fmtDim(mq);
  if (tdMc) tdMc.textContent = fmtDim(mc);
  const block = row.closest(".camm-rif-block");
  aggiornaTotaliRiferimentoBlock(block);
}

function onRegistraClick() {
  syncStateFromInputs();
  try {
    const idMod = bozzaCollegataId;
    const snap = creaSnapshot(idMod);
    if (idMod) {
      const idx = registrati.findIndex((x) => String(x.id) === String(idMod));
      if (idx >= 0) registrati[idx] = snap;
      else registrati.push(snap);
    } else {
      registrati.push(snap);
    }
    salvaRegistrati();
    aggiornaVociDaSnapshotCamminamentoRegistrato(snap);
    mostraFeedback(
      true,
      idMod
        ? "Camminamento aggiornato. Scheda azzerata per il successivo."
        : "Camminamento registrato. Scheda azzerata.",
    );
    resetBozzaVuota();
    renderGerarchia();
    renderSidebar();
  } catch {
    mostraFeedback(false, "Impossibile salvare.");
  }
}

function eliminaRegistrato(schedaId) {
  const sid = String(schedaId ?? "").trim();
  if (!sid) return;
  registrati = registrati.filter((x) => String(x.id) !== sid);
  try {
    salvaRegistrati();
  } catch {
    /* ignore */
  }
  rimuoviRigheMisurazioniPerCamminamentiSchedaId(sid);
  if (bozzaCollegataId != null && String(bozzaCollegataId) === sid) {
    bozzaCollegataId = null;
    resetBozzaVuota();
  }
  renderGerarchia();
  renderSidebar();
  mostraFeedback(true, "Camminamento eliminato.");
}

function apriModaleElimina(msg, pending) {
  eliminaPending = pending;
  const dlg = document.getElementById("camm-conferma-elimina-dialog");
  const p = document.getElementById("camm-conferma-elimina-msg");
  if (p) p.textContent = msg;
  dlg?.showModal();
}

function onHostClick(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  syncStateFromInputs();
  const action = btn.dataset.action;

  if (action === "apri-dialog-nuova-voce") {
    document.dispatchEvent(new CustomEvent("computo-apri-dialog-nuova-voce"));
    return;
  }

  if (action === "aggiungi-riferimento") {
    riferimenti.push(emptyRiferimento());
    renderGerarchia();
    return;
  }

  if (action === "rimuovi-riferimento") {
    const rid = Number(btn.dataset.riferimentoId);
    if (riferimenti.length <= 1) return;
    riferimenti = riferimenti.filter((r) => r.id !== rid);
    renderGerarchia();
    return;
  }

  if (action === "aggiungi-strato") {
    const rid = Number(btn.dataset.riferimentoId);
    const rif = riferimenti.find((r) => r.id === rid);
    if (!rif) return;
    if (!Array.isArray(rif.strati)) rif.strati = [];
    rif.strati.push(emptyStrato(rif.strati.length + 1));
    renumeraStrati(rif);
    renderGerarchia();
    return;
  }

  if (action === "rimuovi-strato") {
    const rid = Number(btn.dataset.riferimentoId);
    const sid = Number(btn.dataset.stratoId);
    const rif = riferimenti.find((r) => r.id === rid);
    if (!rif || !Array.isArray(rif.strati) || rif.strati.length <= 1) return;
    rif.strati = rif.strati.filter((s) => s.id !== sid);
    renumeraStrati(rif);
    renderGerarchia();
    return;
  }
}

function onHostInput(event) {
  const t = event.target;
  if (!(t instanceof HTMLElement)) return;
  syncStateFromInputs();

  const block = t.closest(".camm-rif-block");
  const rid = Number(block?.dataset.riferimentoId);
  const rif = riferimenti.find((r) => r.id === rid);

  if (t.classList.contains("camm-rif-lato1") || t.classList.contains("camm-rif-lato2")) {
    if (!rif) return;
    block?.querySelectorAll(".camm-strato-row").forEach((row) => aggiornaCalcoliStratoRow(row, rif));
    return;
  }

  if (t.classList.contains("camm-strato-spessore")) {
    const row = t.closest(".camm-strato-row");
    if (rif && row) aggiornaCalcoliStratoRow(row, rif);
    return;
  }

  if (t.classList.contains("camm-strato-segno")) {
    aggiornaTotaliRiferimentoBlock(block);
  }
}

function onHostChange(event) {
  const t = event.target;
  if (!(t instanceof HTMLInputElement) || !t.classList.contains("camm-strato-segno")) return;
  syncStateFromInputs();
  aggiornaTotaliRiferimentoBlock(t.closest(".camm-rif-block"));
}

function onSidebarClick(event) {
  const delBtn = event.target.closest("button[data-action='elimina-camm-registrato']");
  if (delBtn) {
    event.preventDefault();
    event.stopPropagation();
    const sid = String(delBtn.dataset.schedaId ?? "").trim();
    const rec = registrati.find((x) => String(x.id) === sid);
    if (!rec) return;
    const etichetta = (rec.pianoNome && String(rec.pianoNome).trim()) || "Camminamento";
    apriModaleElimina(
      `Eliminare «${etichetta}»? Verranno rimosse anche le righe nelle VOCI collegate. L’azione non è annullabile.`,
      { kind: "registrato", schedaId: sid },
    );
    return;
  }

  const itemBtn = event.target.closest(".camm-sidebar-item");
  if (!itemBtn) return;
  const sid = String(itemBtn.dataset.schedaId ?? "").trim();
  const rec = registrati.find((x) => String(x.id) === sid);
  if (!rec) return;
  applicaSnapshot(rec);
  renderGerarchia();
  renderSidebar();
  document.getElementById("camm-gerarchia-host")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function prepareVistaCamminamenti() {
  caricaRegistrati();
  if (riferimenti.length === 0) resetBozzaVuota();
  renderGerarchia();
  renderSidebar();
}

export function initCamminamentiUi() {
  const form = document.getElementById("camm-misurazione-form");
  form?.addEventListener("click", onHostClick);
  form?.addEventListener("input", onHostInput);
  form?.addEventListener("change", onHostChange);
  form?.addEventListener(
    "blur",
    (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.classList.contains("camm-piano-nome")) {
        risolviBlurCampoPianoArchivioStorage(t);
      }
    },
    true,
  );

  document.getElementById("btn-camm-registra")?.addEventListener("click", onRegistraClick);
  document.getElementById("camm-sidebar-list")?.addEventListener("click", onSidebarClick);

  document.getElementById("camm-conferma-elimina-annulla")?.addEventListener("click", () => {
    eliminaPending = null;
    document.getElementById("camm-conferma-elimina-dialog")?.close();
  });
  document.getElementById("camm-conferma-elimina-conferma")?.addEventListener("click", () => {
    const p = eliminaPending;
    eliminaPending = null;
    document.getElementById("camm-conferma-elimina-dialog")?.close();
    if (p?.kind === "registrato" && p.schedaId) eliminaRegistrato(p.schedaId);
  });

  document.addEventListener("computo-nuovo-iniziato", () => {
    registrati = [];
    resetBozzaVuota();
    const shell = document.getElementById("vista-camminamenti");
    if (shell && !shell.hidden) {
      renderGerarchia();
      renderSidebar();
    }
  });
}
