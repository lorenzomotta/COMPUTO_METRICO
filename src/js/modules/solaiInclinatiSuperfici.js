/**
 * Aree falda + strati per SOLAI INCLINATI.
 * Area = formula falda (Gronda × Salita × fattore pendenza), con CANALE e sottrai/travi.
 */

import { calcolaMqFalda, parseDimFalda } from "./solaiInclinatiFalda.js";

function fmtDim(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Number(v).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function fmtTotaleNegativo(v) {
  if (!Number.isFinite(v) || v === 0) return fmtDim(0);
  return `−${fmtDim(v)}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mqDiAreaFalda(area) {
  return calcolaMqFalda(area?.gronda, area?.salita, area?.pendenza);
}

export function mcTraveDiAreaFalda(area) {
  const mq = mqDiAreaFalda(area);
  const h = parseDimFalda(area?.altezzaTrave) ?? 0;
  return Number((mq * h).toFixed(3));
}

export function areaHaTrave(area) {
  return area?.traveInSpessore === true || area?.traveInAltezza === true;
}

export function totaliAreeFalda(superficie) {
  let mqPos = 0;
  let mqNeg = 0;
  for (const area of superficie?.aree || []) {
    const mq = mqDiAreaFalda(area);
    if (area?.segno === true) mqNeg += mq;
    else mqPos += mq;
  }
  return {
    mqPos: Number(mqPos.toFixed(3)),
    mqNeg: Number(mqNeg.toFixed(3)),
    mqNetto: Number((mqPos - mqNeg).toFixed(3)),
  };
}

export function calcolaMcDaMqESpessore(mq, spessore) {
  const sp = parseDimFalda(spessore) ?? 0;
  const base = Number.isFinite(mq) ? mq : 0;
  return Number((base * sp).toFixed(3));
}

export function emptyAreaFalda(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    riferimento: "",
    gronda: "",
    salita: "",
    pendenza: "",
    canale: false,
    segno: false,
    traveInSpessore: false,
    traveInAltezza: false,
    altezzaTrave: "",
    vocibreveTrave: "",
  };
}

export function emptyStratoFalda(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    vocibreve: "",
    spessore: "",
  };
}

export function emptySuperficieFalda(nextId) {
  return {
    note: "",
    aree: [emptyAreaFalda(nextId, 1)],
    strati: [emptyStratoFalda(nextId, 1)],
  };
}

export function rinumeraAreeFalda(superficie) {
  if (!superficie || !Array.isArray(superficie.aree)) return;
  superficie.aree.forEach((a, i) => {
    a.n = i + 1;
  });
}

export function rinumeraStratiFalda(superficie) {
  if (!superficie || !Array.isArray(superficie.strati)) return;
  superficie.strati.forEach((st, i) => {
    st.n = i + 1;
  });
}

export function sanificaSuperficieFalda(raw, nextId) {
  const base = emptySuperficieFalda(nextId);
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  base.note = typeof src.note === "string" ? src.note : "";

  const areeSrc = Array.isArray(src.aree) ? src.aree.filter((x) => x && typeof x === "object") : [];
  if (areeSrc.length === 0) {
    base.aree = [emptyAreaFalda(nextId, 1)];
  } else {
    base.aree = areeSrc.map((a, i) => {
      const row = /** @type {Record<string, unknown>} */ (a);
      const id =
        typeof row.id === "number" && Number.isFinite(row.id) ? row.id : nextId();
      return {
        id,
        n: i + 1,
        riferimento: typeof row.riferimento === "string" ? row.riferimento : "",
        gronda: row.gronda != null && row.gronda !== "" ? String(row.gronda) : "",
        salita: row.salita != null && row.salita !== "" ? String(row.salita) : "",
        pendenza: row.pendenza != null && row.pendenza !== "" ? String(row.pendenza) : "",
        canale: row.canale === true,
        segno: row.segno === true,
        traveInSpessore: row.traveInSpessore === true,
        traveInAltezza: row.traveInAltezza === true,
        altezzaTrave:
          row.altezzaTrave != null && row.altezzaTrave !== "" ? String(row.altezzaTrave) : "",
        vocibreveTrave: typeof row.vocibreveTrave === "string" ? row.vocibreveTrave : "",
      };
    });
  }

  const stratSrc = Array.isArray(src.strati)
    ? src.strati.filter((x) => x && typeof x === "object")
    : [];
  if (stratSrc.length === 0) {
    base.strati = [emptyStratoFalda(nextId, 1)];
  } else {
    base.strati = stratSrc.map((st, i) => {
      const row = /** @type {Record<string, unknown>} */ (st);
      const id =
        typeof row.id === "number" && Number.isFinite(row.id) ? row.id : nextId();
      return {
        id,
        n: i + 1,
        vocibreve: typeof row.vocibreve === "string" ? row.vocibreve : "",
        spessore: row.spessore != null && row.spessore !== "" ? String(row.spessore) : "",
      };
    });
  }
  return base;
}

export function cloneSuperficieFaldaPerSnapshot(superficie) {
  const src = superficie && typeof superficie === "object" ? superficie : {};
  const aree = Array.isArray(src.aree) ? src.aree : [];
  const strati = Array.isArray(src.strati) ? src.strati : [];
  return {
    note: typeof src.note === "string" ? src.note : "",
    aree: aree.map((a, i) => ({
      id: typeof a?.id === "number" ? a.id : 0,
      n: typeof a?.n === "number" && Number.isFinite(a.n) ? a.n : i + 1,
      riferimento: typeof a?.riferimento === "string" ? a.riferimento : "",
      gronda: a?.gronda != null && a.gronda !== "" ? String(a.gronda) : "",
      salita: a?.salita != null && a.salita !== "" ? String(a.salita) : "",
      pendenza: a?.pendenza != null && a.pendenza !== "" ? String(a.pendenza) : "",
      canale: a?.canale === true,
      segno: a?.segno === true,
      traveInSpessore: a?.traveInSpessore === true,
      traveInAltezza: a?.traveInAltezza === true,
      altezzaTrave: a?.altezzaTrave != null && a.altezzaTrave !== "" ? String(a.altezzaTrave) : "",
      vocibreveTrave: typeof a?.vocibreveTrave === "string" ? a.vocibreveTrave : "",
    })),
    strati: strati.map((st, i) => ({
      id: typeof st?.id === "number" ? st.id : 0,
      n: typeof st?.n === "number" && Number.isFinite(st.n) ? st.n : i + 1,
      vocibreve: typeof st?.vocibreve === "string" ? st.vocibreve : "",
      spessore: st?.spessore != null && st.spessore !== "" ? String(st.spessore) : "",
    })),
  };
}

function syncTraveUiRow(row, area, block) {
  const flags = row.querySelector(".solai-trave-flags");
  if (flags instanceof HTMLElement) flags.hidden = area?.segno !== true;
  const aid = row.dataset.areaId;
  const detail =
    block instanceof HTMLElement
      ? block.querySelector(`.solai-trave-detail-row[data-area-id="${aid}"]`)
      : null;
  if (!(detail instanceof HTMLElement)) return;
  const showDetail = area?.segno === true && areaHaTrave(area);
  detail.hidden = !showDetail;
  const tdMc = detail.querySelector('[data-role="trave-mc"]');
  if (tdMc) tdMc.textContent = showDetail ? fmtDim(mcTraveDiAreaFalda(area)) : "—";
}

function renderAreeTable(superficie, datalistId) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";
  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">Aree falda</span>`;
  wrap.appendChild(head);

  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = "vani-sup-aree-table solai-incl-aree-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>Rif.</th><th>Gronda</th><th>Salita</th><th>Pend.%</th><th>Canale</th><th>Mq falda</th><th>Sottrai / Travi</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  for (const area of superficie.aree || []) {
    const mq = mqDiAreaFalda(area);
    const tr = document.createElement("tr");
    tr.className = "vani-sup-area-row solai-incl-area-row";
    tr.dataset.areaId = String(area.id);

    const tdN = document.createElement("td");
    tdN.className = "vani-sup-strato-num";
    tdN.textContent = String(area.n ?? "");
    tr.appendChild(tdN);

    const addText = (cls, val, ph, aria) => {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = cls;
      inp.placeholder = ph;
      inp.setAttribute("aria-label", aria);
      inp.value = typeof val === "string" ? val : "";
      td.appendChild(inp);
      tr.appendChild(td);
    };
    const addNum = (cls, val, ph, aria) => {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "number";
      inp.className = `${cls} vani-in-num`;
      inp.step = "0.001";
      inp.min = "0";
      inp.placeholder = ph;
      inp.setAttribute("aria-label", aria);
      inp.value = val != null && val !== "" ? String(val) : "";
      td.appendChild(inp);
      tr.appendChild(td);
    };

    addText("solai-incl-area-rif", area.riferimento, "rif.", "Riferimento area");
    addNum("solai-incl-gronda", area.gronda, "G", "Gronda");
    addNum("solai-incl-salita", area.salita, "S", "Salita");
    addNum("solai-incl-pendenza", area.pendenza, "%", "Pendenza %");

    const tdCanale = document.createElement("td");
    tdCanale.className = "solai-incl-canale-cell";
    const lblC = document.createElement("label");
    lblC.className = "solai-incl-canale-label";
    lblC.title = "Segna gronda per archivio CANALI";
    const chkC = document.createElement("input");
    chkC.type = "checkbox";
    chkC.className = "solai-incl-canale";
    chkC.checked = area.canale === true;
    lblC.appendChild(chkC);
    lblC.append(" CANALE");
    tdCanale.appendChild(lblC);
    tr.appendChild(tdCanale);

    const tdMq = document.createElement("td");
    tdMq.className = "vani-sup-calc";
    tdMq.dataset.role = "area-mq";
    tdMq.title = "gronda × (salita × √(1+(p/100)²))";
    tdMq.textContent = area.segno === true ? fmtTotaleNegativo(mq) : fmtDim(mq);
    tr.appendChild(tdMq);

    const tdSegno = document.createElement("td");
    tdSegno.className = "solai-sottrai-cell";
    const rowCtrl = document.createElement("div");
    rowCtrl.className = "solai-sottrai-inline";
    const lbl = document.createElement("label");
    lbl.className = "vani-sup-strato-segno-label";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "vani-sup-area-segno";
    chk.checked = area.segno === true;
    lbl.appendChild(chk);
    lbl.append(" sottrai");
    rowCtrl.appendChild(lbl);

    const traveFlags = document.createElement("div");
    traveFlags.className = "solai-trave-flags";
    traveFlags.hidden = area.segno !== true;
    const lblSp = document.createElement("label");
    lblSp.className = "solai-trave-flag-label";
    lblSp.title = "Trave in spessore";
    const chkSp = document.createElement("input");
    chkSp.type = "checkbox";
    chkSp.className = "solai-trave-spessore";
    chkSp.checked = area.traveInSpessore === true;
    lblSp.appendChild(chkSp);
    lblSp.append(" tr. spess.");
    traveFlags.appendChild(lblSp);
    const lblAlt = document.createElement("label");
    lblAlt.className = "solai-trave-flag-label";
    lblAlt.title = "Trave in altezza";
    const chkAlt = document.createElement("input");
    chkAlt.type = "checkbox";
    chkAlt.className = "solai-trave-altezza-flag";
    chkAlt.checked = area.traveInAltezza === true;
    lblAlt.appendChild(chkAlt);
    lblAlt.append(" tr. alt.");
    traveFlags.appendChild(lblAlt);
    rowCtrl.appendChild(traveFlags);
    tdSegno.appendChild(rowCtrl);
    tr.appendChild(tdSegno);

    const tdAct = document.createElement("td");
    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-area-solai-incl";
    btnRm.dataset.areaId = String(area.id);
    btnRm.textContent = "✕";
    btnRm.title = "Rimuovi area";
    btnRm.disabled = (superficie.aree || []).length <= 1;
    tdAct.appendChild(btnRm);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);

    const detailTr = document.createElement("tr");
    detailTr.className = "solai-trave-detail-row";
    detailTr.dataset.areaId = String(area.id);
    detailTr.hidden = !(area.segno === true && areaHaTrave(area));
    const detailTd = document.createElement("td");
    detailTd.colSpan = 9;
    detailTd.className = "solai-trave-detail-cell";
    const campi = document.createElement("div");
    campi.className = "solai-trave-campi";
    const lblH = document.createElement("label");
    lblH.className = "solai-trave-field";
    lblH.innerHTML = "<span>H trave</span>";
    const inpH = document.createElement("input");
    inpH.type = "number";
    inpH.className = "solai-trave-altezza vani-in-num";
    inpH.step = "0.001";
    inpH.min = "0";
    inpH.placeholder = "H";
    inpH.value = area.altezzaTrave != null && area.altezzaTrave !== "" ? String(area.altezzaTrave) : "";
    lblH.appendChild(inpH);
    campi.appendChild(lblH);
    const lblVoce = document.createElement("label");
    lblVoce.className = "solai-trave-field solai-trave-field--voce";
    lblVoce.innerHTML = "<span>Voce</span>";
    const inpVoce = document.createElement("input");
    inpVoce.type = "text";
    inpVoce.className = "solai-trave-voce";
    inpVoce.setAttribute("list", datalistId);
    inpVoce.placeholder = "Voce breve trave";
    inpVoce.value = typeof area.vocibreveTrave === "string" ? area.vocibreveTrave : "";
    lblVoce.appendChild(inpVoce);
    campi.appendChild(lblVoce);
    const mcWrap = document.createElement("div");
    mcWrap.className = "solai-trave-mc-wrap";
    mcWrap.innerHTML = `<span class="solai-trave-mc-label">Mc</span>
      <strong class="vani-sup-calc" data-role="trave-mc">${
        areaHaTrave(area) ? fmtDim(mcTraveDiAreaFalda(area)) : "—"
      }</strong>
      <span class="solai-trave-mc-hint">mq falda × H</span>`;
    campi.appendChild(mcWrap);
    detailTd.appendChild(campi);
    detailTr.appendChild(detailTd);
    tbody.appendChild(detailTr);
  }

  table.appendChild(tbody);
  const t = totaliAreeFalda(superficie);
  const tfoot = document.createElement("tfoot");
  tfoot.innerHTML = `
    <tr class="vani-sup-totale-row vani-sup-totale-row--pos">
      <td colspan="6">Totale aree positive</td>
      <td class="vani-sup-calc vani-sup-totale-mq-pos">${fmtDim(t.mqPos)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--neg">
      <td colspan="6">Totale aree negative</td>
      <td class="vani-sup-calc vani-sup-totale-mq-neg">${fmtTotaleNegativo(t.mqNeg)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--netto">
      <td colspan="6">Mq netto (per gli strati)</td>
      <td class="vani-sup-calc vani-sup-totale-mq-netto">${fmtDim(t.mqNetto)}</td>
      <td colspan="2"></td>
    </tr>`;
  table.appendChild(tfoot);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

function renderStratiTable(superficie, datalistId) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";
  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `<span class="vani-sup-section-title">Strati solaio</span>`;
  wrap.appendChild(head);
  const mqNetto = totaliAreeFalda(superficie).mqNetto;
  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = "vani-sup-strati-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>VOCE</th><th>Mq netto</th><th>Spess.</th><th>Calcolo</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  for (const st of superficie.strati || []) {
    const spTxt = String(st.spessore ?? "").trim();
    const hasSp = spTxt !== "";
    const calcolo = hasSp ? calcolaMcDaMqESpessore(mqNetto, st.spessore) : mqNetto;
    const tr = document.createElement("tr");
    tr.className = "vani-sup-strato-row";
    tr.dataset.stratoId = String(st.id);
    const tdN = document.createElement("td");
    tdN.className = "vani-sup-strato-num";
    tdN.textContent = String(st.n ?? "");
    tr.appendChild(tdN);
    const tdVoce = document.createElement("td");
    const inpVoce = document.createElement("input");
    inpVoce.type = "text";
    inpVoce.className = "vani-sup-strato-voce";
    inpVoce.setAttribute("list", datalistId);
    inpVoce.placeholder = "Voce breve";
    inpVoce.value = typeof st.vocibreve === "string" ? st.vocibreve : "";
    tdVoce.appendChild(inpVoce);
    tr.appendChild(tdVoce);
    const tdMq = document.createElement("td");
    tdMq.className = "vani-sup-calc";
    tdMq.dataset.role = "strato-mq";
    tdMq.textContent = fmtDim(mqNetto);
    tr.appendChild(tdMq);
    const tdSp = document.createElement("td");
    const inpSp = document.createElement("input");
    inpSp.type = "number";
    inpSp.className = "vani-sup-strato-spessore vani-in-num";
    inpSp.step = "0.001";
    inpSp.min = "0";
    inpSp.placeholder = "Sp.";
    inpSp.value = st.spessore != null && st.spessore !== "" ? String(st.spessore) : "";
    tdSp.appendChild(inpSp);
    tr.appendChild(tdSp);
    const tdMc = document.createElement("td");
    tdMc.className = "vani-sup-calc";
    tdMc.dataset.role = "strato-calcolo";
    tdMc.textContent = fmtDim(calcolo);
    tr.appendChild(tdMc);
    const tdAct = document.createElement("td");
    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-strato-solai-incl";
    btnRm.dataset.stratoId = String(st.id);
    btnRm.textContent = "✕";
    btnRm.disabled = (superficie.strati || []).length <= 1;
    tdAct.appendChild(btnRm);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

export function renderSolaiInclinatiPanel({ superficie, datalistId = "solai-incl-vocibrevi-datalist" }) {
  const surf =
    superficie && typeof superficie === "object" ? superficie : emptySuperficieFalda(() => 0);
  const block = document.createElement("div");
  block.className = "vani-sup-block solai-incl-sup-block";
  const head = document.createElement("div");
  head.className = "vani-sup-head";
  head.innerHTML = `
    <div class="vani-sup-fields">
      <span class="vani-sup-title">Solaio inclinato</span>
      <label class="vani-sup-field vani-sup-field--note"><span>Note</span>
        <input type="text" class="vani-sup-note" value="${escapeHtml(surf.note || "")}" placeholder="Note" /></label>
    </div>`;
  const hint = document.createElement("p");
  hint.className = "vani-sup-hint";
  hint.textContent =
    "Ogni area usa la formula falda: Gronda × (Salita × √(1+(Pendenza%/100)²)). Spunta CANALE per portare la gronda in archivio CANALI. Con «sottrai» puoi aggiungere travi (mc = mq falda × H).";
  block.appendChild(head);
  block.appendChild(hint);
  block.appendChild(renderAreeTable(surf, datalistId));
  block.appendChild(renderStratiTable(surf, datalistId));
  return block;
}

export function syncSolaiInclinatiDaBlock(block, superficie) {
  if (!(block instanceof HTMLElement) || !superficie) return;
  const note = block.querySelector(".vani-sup-note");
  if (note instanceof HTMLInputElement) superficie.note = note.value;
  if (!Array.isArray(superficie.aree)) superficie.aree = [];
  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = superficie.aree.find((x) => x.id === aid);
    if (!area) return;
    const rif = row.querySelector(".solai-incl-area-rif");
    const g = row.querySelector(".solai-incl-gronda");
    const s = row.querySelector(".solai-incl-salita");
    const p = row.querySelector(".solai-incl-pendenza");
    const canale = row.querySelector(".solai-incl-canale");
    const segno = row.querySelector(".vani-sup-area-segno");
    const traveSp = row.querySelector(".solai-trave-spessore");
    const traveAlt = row.querySelector(".solai-trave-altezza-flag");
    const detail = block.querySelector(`.solai-trave-detail-row[data-area-id="${aid}"]`);
    const hTrave = detail?.querySelector(".solai-trave-altezza");
    const voceTrave = detail?.querySelector(".solai-trave-voce");
    if (rif instanceof HTMLInputElement) area.riferimento = rif.value;
    if (g instanceof HTMLInputElement) area.gronda = g.value;
    if (s instanceof HTMLInputElement) area.salita = s.value;
    if (p instanceof HTMLInputElement) area.pendenza = p.value;
    if (canale instanceof HTMLInputElement) area.canale = canale.checked;
    if (segno instanceof HTMLInputElement) area.segno = segno.checked;
    if (traveSp instanceof HTMLInputElement) area.traveInSpessore = traveSp.checked;
    if (traveAlt instanceof HTMLInputElement) area.traveInAltezza = traveAlt.checked;
    if (hTrave instanceof HTMLInputElement) area.altezzaTrave = hTrave.value;
    if (voceTrave instanceof HTMLInputElement) area.vocibreveTrave = voceTrave.value;
    if (!area.segno) {
      area.traveInSpessore = false;
      area.traveInAltezza = false;
    }
  });
  if (!Array.isArray(superficie.strati)) superficie.strati = [];
  block.querySelectorAll(".vani-sup-strato-row").forEach((row) => {
    const sid = Number(row.dataset.stratoId);
    const st = superficie.strati.find((x) => x.id === sid);
    if (!st) return;
    const voce = row.querySelector(".vani-sup-strato-voce");
    const sp = row.querySelector(".vani-sup-strato-spessore");
    if (voce instanceof HTMLInputElement) st.vocibreve = voce.value;
    if (sp instanceof HTMLInputElement) st.spessore = sp.value;
  });
}

export function aggiornaCalcoliSolaiInclinatiBlock(block, superficie) {
  if (!(block instanceof HTMLElement) || !superficie) return;
  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = (superficie.aree || []).find((x) => x.id === aid);
    if (!area) return;
    const mq = mqDiAreaFalda(area);
    const tdMq = row.querySelector('[data-role="area-mq"]');
    if (tdMq) tdMq.textContent = area.segno === true ? fmtTotaleNegativo(mq) : fmtDim(mq);
    syncTraveUiRow(row, area, block);
  });
  const t = totaliAreeFalda(superficie);
  const pos = block.querySelector(".vani-sup-totale-mq-pos");
  const neg = block.querySelector(".vani-sup-totale-mq-neg");
  const netto = block.querySelector(".vani-sup-totale-mq-netto");
  if (pos) pos.textContent = fmtDim(t.mqPos);
  if (neg) neg.textContent = fmtTotaleNegativo(t.mqNeg);
  if (netto) netto.textContent = fmtDim(t.mqNetto);
  block.querySelectorAll(".vani-sup-strato-row").forEach((row) => {
    const sid = Number(row.dataset.stratoId);
    const st = (superficie.strati || []).find((x) => x.id === sid);
    const sp = row.querySelector(".vani-sup-strato-spessore")?.value ?? st?.spessore ?? "";
    const hasSp = String(sp).trim() !== "";
    const calcolo = hasSp ? calcolaMcDaMqESpessore(t.mqNetto, sp) : t.mqNetto;
    const tdMq = row.querySelector('[data-role="strato-mq"]');
    const tdCalc = row.querySelector('[data-role="strato-calcolo"]');
    if (tdMq) tdMq.textContent = fmtDim(t.mqNetto);
    if (tdCalc) tdCalc.textContent = fmtDim(calcolo);
  });
}
