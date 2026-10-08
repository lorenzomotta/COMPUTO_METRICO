/**
 * CAPITOLATO: elenco dei testi del campo VOCE.
 * Una riga per ogni testo diverso. Salvare aggiorna tutte le voci brevi
 * che usano quel testo (testo, unità, prezzo).
 */

import { parseNonNegativeDecimal2 } from "../utils/numberUtils.js";

function chiaveTesto(raw) {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("it-IT");
}

function testoPulito(raw) {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sotto questa lunghezza la dicitura è ancora incompleta e non entra in capitolato. */
const LUNGHEZZA_MINIMA_TESTO = 50;

/**
 * @param {object[]} voci
 * @returns {{ chiave: string, voce: string, unitaMisura: string, prezzo: number, nBrevi: number, posizione: number }[]}
 */
export function elencoCapitolato(voci) {
  const list = Array.isArray(voci) ? voci : [];
  /** @type {Map<string, { chiave: string, voce: string, unitaMisura: string, prezzo: number, nBrevi: number, posizione: number }>} */
  const groups = new Map();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const voce = testoPulito(item.voce);
    const chiave = chiaveTesto(voce);
    if (!chiave) continue;
    const prezzo = Number(item.prezzo);
    const posizione = Number(item.posizione) || 0;
    const unita = String(item.unitaMisura ?? "").trim();
    const soloCapitolato = item.soloCapitolato === true;
    const prev = groups.get(chiave);
    if (!prev) {
      groups.set(chiave, {
        chiave,
        voce,
        unitaMisura: unita,
        prezzo: Number.isFinite(prezzo) ? prezzo : 0,
        nBrevi: soloCapitolato ? 0 : 1,
        posizione,
        haVoceBreve: !soloCapitolato,
      });
      continue;
    }
    if (!soloCapitolato) prev.nBrevi += 1;
    const prendeIlPosto =
      (!soloCapitolato && !prev.haVoceBreve) ||
      (!soloCapitolato && prev.haVoceBreve && posizione < prev.posizione) ||
      (soloCapitolato && !prev.haVoceBreve && posizione < prev.posizione);
    if (prendeIlPosto) {
      prev.posizione = posizione;
      prev.voce = voce;
      prev.unitaMisura = unita;
      prev.prezzo = Number.isFinite(prezzo) ? prezzo : prev.prezzo;
    }
    if (!soloCapitolato) prev.haVoceBreve = true;
  }
  return [...groups.values()]
    .filter((item) => item.voce.length >= LUNGHEZZA_MINIMA_TESTO)
    .sort((a, b) => a.voce.localeCompare(b.voce, "it"));
}

/**
 * @param {{
 *   getVoci: () => object[],
 *   getUnitaOptions: () => string[],
 *   onSalva: (righe: { chiaveOriginale: string, voce: string, unitaMisura: string, prezzo: number }[], nuove: { voce: string, unitaMisura: string, prezzo: number }[]) => void,
 *   onEliminaSenzaBreve?: (chiave: string) => void,
 *   onModificaVoce?: (idVoce: number) => void,
 * }} opts
 * @returns {{ aggiornaSeAperto: () => void, apriDaSessioneCerca: () => void }}
 */
export function initCapitolato({ getVoci, getUnitaOptions, onSalva, onEliminaSenzaBreve, onModificaVoce }) {
  const openBtn = document.querySelector("#btn-capitolato");
  const dialogEl = document.querySelector("#capitolato-dialog");
  const formEl = document.querySelector("#capitolato-form");
  const filtroEl = document.querySelector("#capitolato-filtro");
  const bodyEl = document.querySelector("#capitolato-body");
  const vuotoEl = document.querySelector("#capitolato-vuoto");
  const msgEl = document.querySelector("#capitolato-msg");
  const cancelEl = document.querySelector("#capitolato-cancel");
  const aggiungiEl = document.querySelector("#capitolato-aggiungi");
  const aiutoEl = document.querySelector("#capitolato-aiuto");
  const hintEl = document.querySelector("#capitolato-hint");
  const breviDialogEl = document.querySelector("#capitolato-brevi-dialog");
  const breviVoceEl = document.querySelector("#capitolato-brevi-voce");
  const breviBodyEl = document.querySelector("#capitolato-brevi-body");
  const breviVuotoEl = document.querySelector("#capitolato-brevi-vuoto");
  const breviChiudiEl = document.querySelector("#capitolato-brevi-chiudi");
  if (!openBtn || !dialogEl || !formEl || !bodyEl) return;

  function mostraMsg(testo) {
    if (!msgEl) return;
    msgEl.hidden = !testo;
    msgEl.textContent = testo || "";
  }

  function opzioniUnita(selezionata) {
    const base = Array.isArray(getUnitaOptions?.()) ? getUnitaOptions() : [];
    const out = [];
    const seen = new Set();
    for (const raw of [...base, selezionata]) {
      const nome = String(raw ?? "").trim();
      const key = nome.toLocaleLowerCase("it-IT");
      if (!nome || seen.has(key)) continue;
      seen.add(key);
      out.push(nome);
    }
    return out;
  }

  function leggiBozzaRighe() {
    /** @type {Map<string, { voce: string, unita: string, prezzo: string }>} */
    const perChiave = new Map();
    /** @type {{ voce: string, unita: string, prezzo: string }[]} */
    const nuove = [];
    for (const tr of bodyEl.querySelectorAll("tr")) {
      const voce = tr.querySelector(".capitolato-voce")?.value ?? "";
      const unita = tr.querySelector(".capitolato-unita")?.value ?? "";
      const prezzo = tr.querySelector(".capitolato-prezzo")?.value ?? "";
      if (tr.dataset.nuova === "1") {
        nuove.push({ voce, unita, prezzo });
        continue;
      }
      const chiave = String(tr.dataset.chiave ?? "");
      if (!chiave) continue;
      perChiave.set(chiave, { voce, unita, prezzo });
    }
    return { perChiave, nuove };
  }

  function creaRiga({ chiave, voce, unita, prezzo, nBrevi, nuova }) {
    const tr = document.createElement("tr");
    if (nuova) tr.dataset.nuova = "1";
    else tr.dataset.chiave = chiave;

    const tdVoce = document.createElement("td");
    const area = document.createElement("textarea");
    area.className = "capitolato-voce";
    area.rows = 2;
    area.value = voce;
    area.setAttribute("aria-label", "Testo voce");
    tdVoce.appendChild(area);

    const tdUnita = document.createElement("td");
    const sel = document.createElement("select");
    sel.className = "capitolato-unita";
    sel.setAttribute("aria-label", "Unità di misura");
    for (const nome of opzioniUnita(unita)) {
      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    }
    if (unita) sel.value = unita;
    tdUnita.appendChild(sel);

    const tdPrezzo = document.createElement("td");
    const prezzoEl = document.createElement("input");
    prezzoEl.type = "number";
    prezzoEl.className = "capitolato-prezzo";
    prezzoEl.step = "0.01";
    prezzoEl.min = "0";
    prezzoEl.value = prezzo;
    prezzoEl.setAttribute("aria-label", "Prezzo");
    tdPrezzo.appendChild(prezzoEl);

    const tdN = document.createElement("td");
    tdN.className = "capitolato-azioni";
    if (nuova) {
      const btnTogli = document.createElement("button");
      btnTogli.type = "button";
      btnTogli.className = "btn-action btn-delete capitolato-vedi-brevi";
      btnTogli.textContent = "Togli";
      btnTogli.addEventListener("click", () => {
        tr.remove();
        if (vuotoEl && bodyEl.children.length === 0) {
          vuotoEl.hidden = false;
          vuotoEl.textContent = "Nessuna voce con un testo di almeno 50 caratteri.";
        }
      });
      tdN.appendChild(btnTogli);
    } else {
      const btnBrevi = document.createElement("button");
      btnBrevi.type = "button";
      btnBrevi.className = "btn-action btn-secondary capitolato-vedi-brevi";
      btnBrevi.textContent = `Vedi (${nBrevi})`;
      btnBrevi.setAttribute("aria-label", `Voci brevi di ${voce}`);
      btnBrevi.addEventListener("click", () => apriVociBrevi(tr));
      tdN.appendChild(btnBrevi);
      if (nBrevi === 0) {
        const btnElimina = document.createElement("button");
        btnElimina.type = "button";
        btnElimina.className = "btn-action btn-delete capitolato-vedi-brevi";
        btnElimina.textContent = "Elimina";
        btnElimina.addEventListener("click", () => {
          onEliminaSenzaBreve?.(chiave);
          tr.remove();
          if (vuotoEl && bodyEl.children.length === 0) {
            vuotoEl.hidden = false;
            vuotoEl.textContent = "Nessuna voce con un testo di almeno 50 caratteri.";
          }
        });
        tdN.appendChild(btnElimina);
      }
    }

    tr.append(tdVoce, tdUnita, tdPrezzo, tdN);
    return tr;
  }

  function renderRighe(bozza) {
    const items = elencoCapitolato(getVoci?.() || []);
    const perChiave = bozza?.perChiave;
    bodyEl.replaceChildren();
    for (const item of items) {
      const salvata = perChiave?.get(item.chiave);
      bodyEl.appendChild(
        creaRiga({
          chiave: item.chiave,
          voce: salvata ? salvata.voce : item.voce,
          unita: unitaCompatibile(salvata?.unita || item.unitaMisura),
          prezzo: salvata ? salvata.prezzo : String(item.prezzo),
          nBrevi: item.nBrevi,
          nuova: false,
        }),
      );
    }
    for (const extra of bozza?.nuove || []) {
      bodyEl.appendChild(
        creaRiga({
          voce: extra.voce,
          unita: unitaCompatibile(extra.unita),
          prezzo: extra.prezzo,
          nuova: true,
        }),
      );
    }
    const nRighe = bodyEl.children.length;
    if (vuotoEl) {
      vuotoEl.hidden = nRighe > 0;
      if (nRighe === 0) {
        vuotoEl.textContent = "Nessuna voce con un testo di almeno 50 caratteri.";
      }
    }
    applicaFiltro();
  }

  function unitaCompatibile(raw) {
    const nome = String(raw ?? "").trim();
    if (!nome) return opzioniUnita("")[0] || "";
    const opzioni = opzioniUnita(nome);
    const key = nome.toLocaleLowerCase("it-IT").replace(/\s+/g, "");
    const alias = {
      mq: "mq.",
      m2: "mq.",
      "m²": "mq.",
      mc: "mc",
      m3: "mc",
      "m³": "mc",
      ml: "ml.",
      m: "ml.",
      cad: "n.",
      cadauno: "n.",
      n: "n.",
      nr: "n.",
      kg: "Kg.",
      acorpo: "a corpo",
      "%": "percentuale",
    };
    const candidato = alias[key] || nome;
    return (
      opzioni.find((u) => u.toLocaleLowerCase("it-IT") === candidato.toLocaleLowerCase("it-IT")) ||
      nome
    );
  }

  function vaiACercaVoce() {
    const bozza = leggiBozzaRighe();
    try {
      sessionStorage.setItem(
        "capitolatoCercaDraft",
        JSON.stringify({
          perChiave: [...bozza.perChiave.entries()],
          nuove: bozza.nuove,
        }),
      );
    } catch (_) {
      /* ignore */
    }
    window.location.href = "cercavoce.html?from=capitolato&v=9";
  }

  function apriConBozza(bozza) {
    if (filtroEl) filtroEl.value = "";
    mostraMsg("");
    renderRighe(bozza);
    if (typeof dialogEl.showModal === "function" && !dialogEl.open) dialogEl.showModal();
    const primaNuova = bodyEl.querySelector('tr[data-nuova="1"] .capitolato-voce');
    setTimeout(() => (primaNuova || filtroEl)?.focus(), 0);
  }

  function apriDaSessioneCerca() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openCapitolato") !== "1") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("openCapitolato");
    history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
    let salvata = null;
    try {
      const raw = sessionStorage.getItem("capitolatoCercaDraft");
      if (raw) salvata = JSON.parse(raw);
    } catch (_) {
      salvata = null;
    }
    sessionStorage.removeItem("capitolatoCercaDraft");
    const perChiave = new Map();
    if (Array.isArray(salvata?.perChiave)) {
      for (const entry of salvata.perChiave) {
        if (!Array.isArray(entry) || entry.length < 2) continue;
        perChiave.set(String(entry[0]), entry[1]);
      }
    }
    const nuove = (Array.isArray(salvata?.nuove) ? salvata.nuove : []).map((riga) => ({
      voce: String(riga?.voce ?? ""),
      unita: unitaCompatibile(riga?.unita),
      prezzo: String(riga?.prezzo ?? "0"),
    }));
    apriConBozza({ perChiave, nuove });
  }

  function applicaFiltro() {
    const q = String(filtroEl?.value ?? "")
      .trim()
      .toLocaleLowerCase("it-IT");
    let visibili = 0;
    for (const tr of bodyEl.querySelectorAll("tr")) {
      const area = tr.querySelector(".capitolato-voce");
      const testo = String(area?.value ?? "").toLocaleLowerCase("it-IT");
      const ok = !q || testo.includes(q);
      tr.classList.toggle("is-hidden", !ok);
      if (ok) visibili += 1;
    }
    if (vuotoEl && bodyEl.children.length > 0) {
      vuotoEl.hidden = visibili > 0;
      vuotoEl.textContent = visibili > 0 ? "" : "Nessuna voce corrisponde alla ricerca.";
    }
  }

  function formatEuro(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function apriVociBrevi(riga) {
    if (!breviDialogEl || !breviBodyEl || !riga) return;
    const chiave = String(riga.dataset.chiave ?? "");
    const testoVoce = riga.querySelector(".capitolato-voce")?.value ?? "";
    const unitaRiga = String(riga.querySelector(".capitolato-unita")?.value ?? "").trim();
    const prezzoRiga = parseNonNegativeDecimal2(riga.querySelector(".capitolato-prezzo")?.value ?? "");
    const collegate = (getVoci?.() || [])
      .filter((item) => item && item.soloCapitolato !== true && chiaveTesto(item.voce) === chiave)
      .sort(
        (a, b) =>
          (Number(a.posizione) || 0) - (Number(b.posizione) || 0) ||
          (Number(a.idVoce) || 0) - (Number(b.idVoce) || 0),
      );
    if (breviVoceEl) breviVoceEl.textContent = testoPulito(testoVoce);
    breviBodyEl.replaceChildren();
    for (const item of collegate) {
      const tr = document.createElement("tr");
      const celle = [
        String(item.voceAbbreviata ?? "").trim() || "—",
        String(item.riferimento ?? "").trim() || "—",
        unitaRiga || String(item.unitaMisura ?? "").trim() || "—",
        formatEuro(prezzoRiga === null ? item.prezzo : prezzoRiga),
      ];
      for (const testo of celle) {
        const td = document.createElement("td");
        td.textContent = testo;
        tr.appendChild(td);
      }
      const tdModifica = document.createElement("td");
      tdModifica.className = "capitolato-brevi-modifica";
      const btnModifica = document.createElement("button");
      btnModifica.type = "button";
      btnModifica.className = "btn-action btn-edit capitolato-matita";
      btnModifica.textContent = "✎";
      const nomeBreve = String(item.voceAbbreviata ?? "").trim() || "voce breve";
      btnModifica.title = "Modifica associazione";
      btnModifica.setAttribute("aria-label", `Modifica associazione di ${nomeBreve}`);
      btnModifica.addEventListener("click", () => {
        if (breviDialogEl?.open) breviDialogEl.close();
        onModificaVoce?.(Number(item.idVoce));
      });
      tdModifica.appendChild(btnModifica);
      tr.appendChild(tdModifica);
      breviBodyEl.appendChild(tr);
    }
    if (breviVuotoEl) breviVuotoEl.hidden = collegate.length > 0;
    if (typeof breviDialogEl.showModal === "function") breviDialogEl.showModal();
  }

  function nascondiAiuto() {
    if (hintEl) hintEl.hidden = true;
    aiutoEl?.setAttribute("aria-expanded", "false");
  }

  function apri() {
    if (filtroEl) filtroEl.value = "";
    nascondiAiuto();
    mostraMsg("");
    renderRighe();
    if (typeof dialogEl.showModal === "function") dialogEl.showModal();
    setTimeout(() => filtroEl?.focus(), 0);
  }

  function chiudi() {
    if (dialogEl.open) dialogEl.close();
  }

  openBtn.addEventListener("click", () => apri());
  aiutoEl?.addEventListener("click", () => {
    const aperto = hintEl ? hintEl.hidden : true;
    if (hintEl) hintEl.hidden = !aperto;
    aiutoEl.setAttribute("aria-expanded", aperto ? "true" : "false");
  });
  aggiungiEl?.addEventListener("click", () => vaiACercaVoce());
  cancelEl?.addEventListener("click", () => chiudi());
  breviChiudiEl?.addEventListener("click", () => {
    if (breviDialogEl?.open) breviDialogEl.close();
  });
  dialogEl.addEventListener("close", () => {
    nascondiAiuto();
    if (breviDialogEl?.open) breviDialogEl.close();
  });
  filtroEl?.addEventListener("input", () => applicaFiltro());

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    mostraMsg("");
    /** @type {{ chiaveOriginale: string, voce: string, unitaMisura: string, prezzo: number }[]} */
    const righe = [];
    /** @type {{ voce: string, unitaMisura: string, prezzo: number }[]} */
    const nuove = [];
    let errore = "";
    for (const tr of bodyEl.querySelectorAll("tr")) {
      tr.classList.remove("is-invalid");
      const nuova = tr.dataset.nuova === "1";
      const chiaveOriginale = String(tr.dataset.chiave ?? "");
      const voce = testoPulito(tr.querySelector(".capitolato-voce")?.value);
      const unitaMisura = String(tr.querySelector(".capitolato-unita")?.value ?? "").trim();
      const prezzo = parseNonNegativeDecimal2(tr.querySelector(".capitolato-prezzo")?.value ?? "");
      if (voce.length < LUNGHEZZA_MINIMA_TESTO || !unitaMisura || prezzo === null) {
        tr.classList.remove("is-hidden");
        tr.classList.add("is-invalid");
        errore = "Ogni riga deve avere un testo di almeno 50 caratteri, l’unità di misura e un prezzo (zero o più).";
        continue;
      }
      if (nuova) nuove.push({ voce, unitaMisura, prezzo });
      else righe.push({ chiaveOriginale, voce, unitaMisura, prezzo });
    }
    if (errore) {
      mostraMsg(errore);
      return;
    }
    onSalva?.(righe, nuove);
    chiudi();
  });

  function aggiornaSeAperto() {
    if (!dialogEl?.open) return;
    renderRighe(leggiBozzaRighe());
  }

  return { aggiornaSeAperto, apriDaSessioneCerca };
}
