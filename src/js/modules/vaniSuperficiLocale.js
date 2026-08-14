/**
 * Pavimento / soffitto di un locale in VANI:
 * più aree (Lato1 × Lato2, con segno − sulle aree) → mq netto;
 * gli strati (voce + spessore) usano quel mq netto. Niente elevazione né aperture.
 */

/** @typedef {'pavimento'|'soffitto'} TipoSuperficieVano */

export const TIPI_SUPERFICIE_VANO = /** @type {const} */ (["pavimento", "soffitto"]);

export const SUPERFICIE_LABELS = {
  pavimento: "Pavimento",
  soffitto: "Soffitto",
};

function parseDim(raw) {
  const txt = String(raw ?? "").trim();
  if (txt === "") return null;
  const n = Number(txt.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(3));
}

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

/** Mq di una singola area (sempre positivo; il segno è a parte). */
export function mqDiArea(area) {
  const m1 = parseDim(area?.lato1) ?? 0;
  const m2 = parseDim(area?.lato2) ?? 0;
  return Number((m1 * m2).toFixed(3));
}

/** Somma aree: positivi, negativi e netto. */
export function totaliAreeSuperficie(superficie) {
  let mqPos = 0;
  let mqNeg = 0;
  for (const area of superficie?.aree || []) {
    const mq = mqDiArea(area);
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
  const sp = parseDim(spessore) ?? 0;
  const base = Number.isFinite(mq) ? mq : 0;
  return Number((base * sp).toFixed(3));
}

export function emptyAreaSuperficie(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    riferimento: "",
    lato1: "",
    lato2: "",
    segno: false,
  };
}

export function emptyStratoSuperficie(nextId, n = 1) {
  return {
    id: typeof nextId === "function" ? nextId() : Number(nextId) || 0,
    n: Number.isFinite(n) ? n : 1,
    vocibreve: "",
    spessore: "",
  };
}

export function emptySuperficieLocale(nextId) {
  return {
    note: "",
    aree: [emptyAreaSuperficie(nextId, 1)],
    strati: [emptyStratoSuperficie(nextId, 1)],
  };
}

export function rinumeraAreeSuperficie(superficie) {
  if (!superficie || !Array.isArray(superficie.aree)) return;
  superficie.aree.forEach((a, i) => {
    a.n = i + 1;
  });
}

export function rinumeraStratiSuperficie(superficie) {
  if (!superficie || !Array.isArray(superficie.strati)) return;
  superficie.strati.forEach((st, i) => {
    st.n = i + 1;
  });
}

/**
 * Migra il vecchio formato (un solo L1/L2 in cima + segno sugli strati)
 * verso aree[] + strati senza segno.
 * @param {Record<string, unknown>} src
 * @param {() => number} nextId
 */
function migraFormatoLegacySeServe(src, nextId) {
  const hasAree = Array.isArray(src.aree) && src.aree.length > 0;
  if (hasAree) return null;

  const lato1 = src.lato1 != null && src.lato1 !== "" ? String(src.lato1) : "";
  const lato2 = src.lato2 != null && src.lato2 !== "" ? String(src.lato2) : "";
  const area = emptyAreaSuperficie(nextId, 1);
  area.lato1 = lato1;
  area.lato2 = lato2;
  // Se tutti gli strati vecchi avevano segno, l’area diventa negativa.
  const stratSrc = Array.isArray(src.strati) ? src.strati : [];
  const tuttiNeg =
    stratSrc.length > 0 &&
    stratSrc.every((st) => st && typeof st === "object" && /** @type {{segno?: unknown}} */ (st).segno === true);
  area.segno = tuttiNeg;
  return [area];
}

/**
 * @param {unknown} raw
 * @param {() => number} nextId
 */
export function sanificaSuperficieLocale(raw, nextId) {
  const base = emptySuperficieLocale(nextId);
  if (!raw || typeof raw !== "object") return base;
  const src = /** @type {Record<string, unknown>} */ (raw);
  base.note = typeof src.note === "string" ? src.note : "";

  const legacyAree = migraFormatoLegacySeServe(src, nextId);
  const areeSrc = legacyAree
    ? legacyAree
    : Array.isArray(src.aree)
      ? src.aree.filter((x) => x && typeof x === "object")
      : [];

  if (areeSrc.length === 0) {
    base.aree = [emptyAreaSuperficie(nextId, 1)];
  } else {
    base.aree = areeSrc.map((a, i) => {
      const row = /** @type {Record<string, unknown>} */ (a);
      const id =
        typeof row.id === "number" && Number.isFinite(row.id) ? row.id : nextId();
      return {
        id,
        n: i + 1,
        riferimento: typeof row.riferimento === "string" ? row.riferimento : "",
        lato1: row.lato1 != null && row.lato1 !== "" ? String(row.lato1) : "",
        lato2: row.lato2 != null && row.lato2 !== "" ? String(row.lato2) : "",
        segno: row.segno === true,
      };
    });
  }

  const stratSrc = Array.isArray(src.strati) ? src.strati.filter((x) => x && typeof x === "object") : [];
  if (stratSrc.length === 0) {
    base.strati = [emptyStratoSuperficie(nextId, 1)];
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

export function cloneSuperficiePerSnapshot(superficie) {
  const src = superficie && typeof superficie === "object" ? superficie : {};
  const aree = Array.isArray(src.aree) ? src.aree : [];
  const strati = Array.isArray(src.strati) ? src.strati : [];
  // Snapshot sempre nel formato nuovo (anche se in memoria c’era solo legacy già sanificato).
  return {
    note: typeof src.note === "string" ? src.note : "",
    aree: aree.map((a, i) => ({
      id: typeof a?.id === "number" ? a.id : 0,
      n: typeof a?.n === "number" && Number.isFinite(a.n) ? a.n : i + 1,
      riferimento: typeof a?.riferimento === "string" ? a.riferimento : "",
      lato1: a?.lato1 != null && a.lato1 !== "" ? String(a.lato1) : "",
      lato2: a?.lato2 != null && a.lato2 !== "" ? String(a.lato2) : "",
      segno: a?.segno === true,
    })),
    strati: strati.map((st, i) => ({
      id: typeof st?.id === "number" ? st.id : 0,
      n: typeof st?.n === "number" && Number.isFinite(st.n) ? st.n : i + 1,
      vocibreve: typeof st?.vocibreve === "string" ? st.vocibreve : "",
      spessore: st?.spessore != null && st.spessore !== "" ? String(st.spessore) : "",
    })),
  };
}

function renderAreeTable(tipo, superficie, localeId) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `
    <span class="vani-sup-section-title">Aree</span>`;
  wrap.appendChild(head);

  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = "vani-sup-aree-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>Rif.</th><th>Lato 1</th><th>Lato 2</th><th>Mq</th><th>Sottrai</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");
  tbody.className = "vani-sup-aree-tbody";

  for (const area of superficie.aree || []) {
    const mq = mqDiArea(area);
    const tr = document.createElement("tr");
    tr.className = "vani-sup-area-row";
    tr.dataset.areaId = String(area.id);

    const tdN = document.createElement("td");
    tdN.className = "vani-sup-strato-num";
    tdN.textContent = String(area.n ?? "");
    tr.appendChild(tdN);

    const tdRif = document.createElement("td");
    const inpRif = document.createElement("input");
    inpRif.type = "text";
    inpRif.className = "vani-sup-area-rif";
    inpRif.placeholder = "rif.";
    inpRif.setAttribute("aria-label", "Riferimento area");
    inpRif.value = typeof area.riferimento === "string" ? area.riferimento : "";
    tdRif.appendChild(inpRif);
    tr.appendChild(tdRif);

    const tdL1 = document.createElement("td");
    const inpL1 = document.createElement("input");
    inpL1.type = "number";
    inpL1.className = "vani-sup-area-lato1 vani-in-num";
    inpL1.step = "0.001";
    inpL1.min = "0";
    inpL1.max = "99.999";
    inpL1.placeholder = "L1";
    inpL1.setAttribute("aria-label", "Lato 1 area");
    inpL1.value = area.lato1 != null && area.lato1 !== "" ? String(area.lato1) : "";
    tdL1.appendChild(inpL1);
    tr.appendChild(tdL1);

    const tdL2 = document.createElement("td");
    const inpL2 = document.createElement("input");
    inpL2.type = "number";
    inpL2.className = "vani-sup-area-lato2 vani-in-num";
    inpL2.step = "0.001";
    inpL2.min = "0";
    inpL2.max = "99.999";
    inpL2.placeholder = "L2";
    inpL2.setAttribute("aria-label", "Lato 2 area");
    inpL2.value = area.lato2 != null && area.lato2 !== "" ? String(area.lato2) : "";
    tdL2.appendChild(inpL2);
    tr.appendChild(tdL2);

    const tdMq = document.createElement("td");
    tdMq.className = "vani-sup-calc";
    tdMq.dataset.role = "area-mq";
    tdMq.textContent = area.segno === true ? fmtTotaleNegativo(mq) : fmtDim(mq);
    tr.appendChild(tdMq);

    const tdSegno = document.createElement("td");
    tdSegno.className = "vani-sup-strato-segno-cell";
    const lbl = document.createElement("label");
    lbl.className = "vani-sup-strato-segno-label";
    lbl.title = "Area negativa (sottrazione)";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "vani-sup-area-segno";
    chk.checked = area.segno === true;
    chk.setAttribute("aria-label", "Sottrai area");
    lbl.appendChild(chk);
    lbl.append(" sottrai");
    tdSegno.appendChild(lbl);
    tr.appendChild(tdSegno);

    const tdAct = document.createElement("td");
    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-area-superficie";
    btnRm.dataset.tipoSuperficie = tipo;
    btnRm.dataset.localeId = String(localeId);
    btnRm.dataset.areaId = String(area.id);
    btnRm.textContent = "✕";
    btnRm.title = "Rimuovi area";
    btnRm.disabled = (superficie.aree || []).length <= 1;
    tdAct.appendChild(btnRm);
    tr.appendChild(tdAct);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  const t = totaliAreeSuperficie(superficie);
  const tfoot = document.createElement("tfoot");
  tfoot.className = "vani-sup-aree-tfoot";
  tfoot.innerHTML = `
    <tr class="vani-sup-totale-row vani-sup-totale-row--pos">
      <td colspan="4">Totale aree positive</td>
      <td class="vani-sup-calc vani-sup-totale-mq-pos">${fmtDim(t.mqPos)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--neg">
      <td colspan="4">Totale aree negative</td>
      <td class="vani-sup-calc vani-sup-totale-mq-neg">${fmtTotaleNegativo(t.mqNeg)}</td>
      <td colspan="2"></td>
    </tr>
    <tr class="vani-sup-totale-row vani-sup-totale-row--netto">
      <td colspan="4">Mq netto (per gli strati)</td>
      <td class="vani-sup-calc vani-sup-totale-mq-netto">${fmtDim(t.mqNetto)}</td>
      <td colspan="2"></td>
    </tr>`;
  table.appendChild(tfoot);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  return wrap;
}

function renderStratiTable(tipo, superficie, localeId) {
  const wrap = document.createElement("div");
  wrap.className = "vani-sup-section";

  const head = document.createElement("div");
  head.className = "vani-sup-section-head";
  head.innerHTML = `
    <span class="vani-sup-section-title">Strati</span>`;
  wrap.appendChild(head);

  const mqNetto = totaliAreeSuperficie(superficie).mqNetto;
  const tableWrap = document.createElement("div");
  tableWrap.className = "vani-sup-table-wrap";
  const table = document.createElement("table");
  table.className = "vani-sup-strati-table";
  table.innerHTML = `<thead><tr>
    <th>N°</th><th>VOCE</th><th>Mq netto</th><th>Spess.</th><th>Calcolo</th><th></th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");
  tbody.className = "vani-sup-strati-tbody";

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
    inpVoce.setAttribute("list", "vani-vocibrevi-datalist");
    inpVoce.placeholder = "Voce breve";
    inpVoce.autocomplete = "off";
    inpVoce.setAttribute("aria-label", "Voce breve strato");
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
    inpSp.max = "9.999";
    inpSp.placeholder = "Sp.";
    inpSp.title = "Spessore strato (m)";
    inpSp.setAttribute("aria-label", "Spessore strato");
    inpSp.value = st.spessore != null && st.spessore !== "" ? String(st.spessore) : "";
    tdSp.appendChild(inpSp);
    tr.appendChild(tdSp);

    const tdMc = document.createElement("td");
    tdMc.className = "vani-sup-calc";
    tdMc.dataset.role = "strato-calcolo";
    tdMc.title = hasSp ? "Volume (mq × spessore)" : "Area (mq netto, senza spessore)";
    tdMc.textContent = fmtDim(calcolo);
    tr.appendChild(tdMc);

    const tdAct = document.createElement("td");
    const btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn-action btn-delete vani-btn-micro";
    btnRm.dataset.action = "rimuovi-strato-superficie";
    btnRm.dataset.tipoSuperficie = tipo;
    btnRm.dataset.localeId = String(localeId);
    btnRm.dataset.stratoId = String(st.id);
    btnRm.textContent = "✕";
    btnRm.title = "Rimuovi strato";
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

/**
 * Pannello pavimento o soffitto per un locale.
 * @param {{ tipo: TipoSuperficieVano, locale: { id: number, nomeLocale?: string, pavimento?: object, soffitto?: object }, escapeHtmlFn?: (s: string) => string }} opts
 */
export function renderSuperficieLocalePanel({ tipo, locale, escapeHtmlFn = escapeHtml }) {
  const superficie =
    locale[tipo] && typeof locale[tipo] === "object"
      ? locale[tipo]
      : emptySuperficieLocale(() => 0);
  const label = SUPERFICIE_LABELS[tipo] || tipo;
  const nomeLoc = typeof locale.nomeLocale === "string" ? locale.nomeLocale.trim() : "";

  const block = document.createElement("div");
  block.className = "vani-sup-block";
  block.dataset.tipoSuperficie = tipo;
  block.dataset.localeId = String(locale.id);

  const head = document.createElement("div");
  head.className = "vani-sup-head";
  const titolo = nomeLoc ? `${label} · ${nomeLoc}` : label;
  head.innerHTML = `
    <div class="vani-sup-fields">
      <span class="vani-sup-title">${escapeHtmlFn(titolo)}</span>
      <label class="vani-sup-field vani-sup-field--note"><span>Note</span>
        <input type="text" class="vani-sup-note" value="${escapeHtmlFn(superficie.note || "")}" placeholder="Note" aria-label="Note ${escapeHtmlFn(label)}" /></label>
    </div>`;

  const hint = document.createElement("p");
  hint.className = "vani-sup-hint";
  hint.textContent =
    "Aggiungi una o più aree (Lato 1 × Lato 2). Il segno − sottrae quell’area. Il mq netto va sugli strati: senza spessore in voce conta l’area, con spessore conta il volume.";

  block.appendChild(head);
  block.appendChild(hint);
  block.appendChild(renderAreeTable(tipo, superficie, locale.id));
  block.appendChild(renderStratiTable(tipo, superficie, locale.id));
  return block;
}

/** Legge i campi DOM del blocco e aggiorna l’oggetto superficie in memoria. */
export function syncSuperficieDaBlock(block, superficie) {
  if (!(block instanceof HTMLElement) || !superficie) return;
  const note = block.querySelector(".vani-sup-note");
  if (note instanceof HTMLInputElement) superficie.note = note.value;

  if (!Array.isArray(superficie.aree)) superficie.aree = [];
  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = superficie.aree.find((x) => x.id === aid);
    if (!area) return;
    const rif = row.querySelector(".vani-sup-area-rif");
    const l1 = row.querySelector(".vani-sup-area-lato1");
    const l2 = row.querySelector(".vani-sup-area-lato2");
    const segno = row.querySelector(".vani-sup-area-segno");
    if (rif instanceof HTMLInputElement) area.riferimento = rif.value;
    if (l1 instanceof HTMLInputElement) area.lato1 = l1.value;
    if (l2 instanceof HTMLInputElement) area.lato2 = l2.value;
    if (segno instanceof HTMLInputElement) area.segno = segno.checked;
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

/** Aggiorna mq aree, totali e mq/mc strati senza ricostruire tutta la pagina. */
export function aggiornaCalcoliSuperficieBlock(block, superficie) {
  if (!(block instanceof HTMLElement) || !superficie) return;

  block.querySelectorAll(".vani-sup-area-row").forEach((row) => {
    const aid = Number(row.dataset.areaId);
    const area = (superficie.aree || []).find((x) => x.id === aid);
    if (!area) return;
    const mq = mqDiArea(area);
    const tdMq = row.querySelector('[data-role="area-mq"]');
    if (tdMq) tdMq.textContent = area.segno === true ? fmtTotaleNegativo(mq) : fmtDim(mq);
  });

  const t = totaliAreeSuperficie(superficie);
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
    if (tdCalc) {
      tdCalc.textContent = fmtDim(calcolo);
      tdCalc.title = hasSp ? "Volume (mq × spessore)" : "Area (mq netto, senza spessore)";
    }
  });
}

/**
 * Max id tra aree e strati nelle superfici dei locali (per ripristinare il contatore).
 * @param {object[]} locali
 */
export function maxIdStratiSuperficiNeiLocali(locali) {
  let max = 0;
  for (const l of locali || []) {
    for (const tipo of TIPI_SUPERFICIE_VANO) {
      const surf = l?.[tipo];
      for (const a of surf?.aree || []) {
        if (a && Number.isFinite(a.id)) max = Math.max(max, a.id);
      }
      for (const st of surf?.strati || []) {
        if (st && Number.isFinite(st.id)) max = Math.max(max, st.id);
      }
    }
  }
  return max;
}
