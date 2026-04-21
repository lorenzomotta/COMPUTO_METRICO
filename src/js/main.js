import { createCell } from "./utils/domUtils.js";
import {
  parseNumber,
  parseAnteIntero,
  parseNonNegativeDecimal2,
  fmt2,
  altezzaAperturaInclusaNelloStrato,
} from "./utils/numberUtils.js";
import {
  savePiani as savePianiStorage,
  saveMurDati as saveMurDatiStorage,
  loadPiani as loadPianiStorage,
  loadMurDati as loadMurDatiStorage,
} from "./modules/storage.js";
import {
  updateInterratoPanelSubtitle,
  updateElevazioneAttivaLabel,
  showVistaPiani,
  showVistaCompilazione,
} from "./modules/viewHelpers.js";
import { renderStratiNetti as renderStratiNettiModule } from "./modules/calcoloStratiNetti.js";

window.addEventListener("DOMContentLoaded", () => {
  const pianoFormEl = document.querySelector("#piano-form");
  const tipologiaEl = document.querySelector("#tipologia");
  const edificioEl = document.querySelector("#edificio");
  const pianoEl = document.querySelector("#piano");
  const pianiBodyEl = document.querySelector("#piani-body");
  const pianoSubmitButtonEl = pianoFormEl.querySelector("button[type='submit']");

  const stratiFormEl = document.querySelector("#strati-mur-form");
  const idstratoEl = document.querySelector("#idstrato");
  const lunghezzaEl = document.querySelector("#lunghezza");
  const altezzaEl = document.querySelector("#altezza");
  const spessoreEl = document.querySelector("#spessore");
  const idvocecapitolatoEl = document.querySelector("#idvocecapitolato");
  const murEleBodyEl = document.querySelector("#murielevazione-ele-body");
  const stratiMurBodyEl = document.querySelector("#strati-mur-body");
  const stratiSubmitButtonEl = stratiFormEl.querySelector("button[type='submit']");
  const idElevazioneAttivaEl = document.querySelector("#id-elevazione-attiva");
  const riferimentoElevazioneAttivaEl = document.querySelector("#riferimento-elevazione-attiva");
  const countMurielevazioniEl = document.querySelector("#count-murielevazioni");
  const countStratiEl = document.querySelector("#count-strati");
  const countApertureEl = document.querySelector("#count-aperture");
  const btnNuovaElevazioneEl = document.querySelector("#btn-nuova-elevazione");

  const apertureFormEl = document.querySelector("#aperture-elev-form");
  const apLocaleEl = document.querySelector("#ap-locale");
  const apLunghezzaEl = document.querySelector("#ap-lunghezza");
  const apAltezzaEl = document.querySelector("#ap-altezza");
  const apAnteEl = document.querySelector("#ap-ante");
  const apTipologiaEl = document.querySelector("#ap-tipologia");
  const apFalsotelaiEl = document.querySelector("#ap-falsotelai");
  const apHDavanzaleEl = document.querySelector("#ap-h-davanzale");
  const apIdVoceCapitolatoEl = document.querySelector("#ap-idvocecapitolato");
  const apertureElevBodyEl = document.querySelector("#aperture-elev-body");
  const apertureSubmitButtonEl = apertureFormEl.querySelector("button[type='submit']");
  const stratiNettiBodyEl = document.querySelector("#strati-netti-body");

  const vistaPianiEl = document.querySelector("#vista-piani");
  const vistaCompilazioneEl = document.querySelector("#vista-compilazione");
  const vistaVociEl = document.querySelector("#vista-voci");
  const vistaBimEl = document.querySelector("#vista-bim");
  const tornaPianiButtonEl = document.querySelector("#btn-torna-piani");
  const tornaPianiEsterniButtonEl = document.querySelector("#btn-torna-piani-esterni");
  const sidebarEsterniVariButtonEl = document.querySelector("#btn-sidebar-esterni-vari");
  const gestionePianiButtonEl = document.querySelector("#btn-gestione-piani");
  const aggiungiVoceButtonEl = document.querySelector("#btn-aggiungi-voce");
  const vediVociButtonEl = document.querySelector("#btn-vedi-voci");
  const apriPdfVociButtonEl = document.querySelector("#btn-apri-pdf-voci");
  const apriPdfVociQuantitaButtonEl = document.querySelector("#btn-apri-pdf-voci-quantita");
  const esportaXlsButtonEl = document.querySelector("#btn-esporta-xls");
  const esportaJsonButtonEl = document.querySelector("#btn-esporta-json");
  const importaComputoButtonEl = document.querySelector("#btn-importa-computo");
  const vistaBimButtonEl = document.querySelector("#btn-vista-bim");
  const importaIfcButtonEl = document.querySelector("#btn-importa-ifc");
  const exportIfcJsonButtonEl = document.querySelector("#btn-esporta-ifc-json");
  const ifcToMisureButtonEl = document.querySelector("#btn-ifc-to-misure");
  const bimViewerContainerEl = document.querySelector("#bim-viewer-container");
  const bimViewerStatusEl = document.querySelector("#bim-viewer-status");
  const bimPropsEmptyEl = document.querySelector("#bim-props-empty");
  const bimPropsContentEl = document.querySelector("#bim-props-content");
  const bimPropsMetaEl = document.querySelector("#bim-props-meta");
  const bimPropsTableEl = document.querySelector("#bim-props-table");
  const bimPropsJsonEl = document.querySelector("#bim-props-json");
  const bimTabButtons = Array.from(document.querySelectorAll(".bim-tab"));
  const compilazioneInterratoPanelEl = document.querySelector("#compilazione-interrato");
  const compilazioneEsterniPanelEl = document.querySelector("#compilazione-esterni-vari");

  const interratoSottotitoloEl = document.querySelector("#compilazione-interrato-sottotitolo");
  const esterniSottotitoloEl = document.querySelector("#compilazione-esterni-sottotitolo");
  const altreTipologiePanelEl = document.querySelector("#compilazione-altre-tipologie");
  const altreTipologieTestoEl = document.querySelector("#compilazione-altre-testo");

  const scavoFormEl = document.querySelector("#scavo-form");
  const idPlScavoEl = document.querySelector("#idplscavo");
  const scavoPianoEl = document.querySelector("#scavo-piano");
  const scavoRiferimentoEl = document.querySelector("#scavo-riferimento");
  const scavoSottraiEl = document.querySelector("#scavo-sottrai");
  const scavoMisura1El = document.querySelector("#scavo-misura1");
  const scavoMisura2El = document.querySelector("#scavo-misura2");
  const scavoFormulaEl = document.querySelector("#scavo-formula");
  const apriFormulaScavoButtonEl = document.querySelector("#btn-apri-formula-scavo");
  const scavoAltezzaEl = document.querySelector("#scavo-altezza");
  const scavoIdVoceEl = document.querySelector("#scavo-idvoce");
  const scavoBodyEl = document.querySelector("#scavo-body");
  const scavoSubmitButtonEl = scavoFormEl.querySelector("button[type='submit']");
  const countScaviEl = document.querySelector("#count-scavi");
  const sumAreaScaviEl = document.querySelector("#sum-area-scavi");
  const sumVolumeScaviEl = document.querySelector("#sum-volume-scavi");
  const corselloFormEl = document.querySelector("#corsello-form");
  const idPlCorsEl = document.querySelector("#idplcors");
  const corselloPianoEl = document.querySelector("#corsello-piano");
  const corselloRiferimentoEl = document.querySelector("#corsello-riferimento");
  const corselloSottraiEl = document.querySelector("#corsello-sottrai");
  const corselloMisura1El = document.querySelector("#corsello-misura1");
  const corselloMisura2El = document.querySelector("#corsello-misura2");
  const corselloFormulaEl = document.querySelector("#corsello-formula");
  const apriFormulaCorselloButtonEl = document.querySelector("#btn-apri-formula-corsello");
  const corselloAltezzaEl = document.querySelector("#corsello-altezza");
  const corselloIdVoceEl = document.querySelector("#corsello-idvoce");
  const corselloBodyEl = document.querySelector("#corsello-body");
  const corselloSubmitButtonEl = corselloFormEl.querySelector("button[type='submit']");
  const countCorselliEl = document.querySelector("#count-corselli");
  const camminamentiFormEl = document.querySelector("#camminamenti-form");
  const idPlCammEl = document.querySelector("#idplcamm");
  const camminamentiPianoEl = document.querySelector("#camminamenti-piano");
  const camminamentiRiferimentoEl = document.querySelector("#camminamenti-riferimento");
  const camminamentiSottraiEl = document.querySelector("#camminamenti-sottrai");
  const camminamentiMisura1El = document.querySelector("#camminamenti-misura1");
  const camminamentiMisura2El = document.querySelector("#camminamenti-misura2");
  const camminamentiFormulaEl = document.querySelector("#camminamenti-formula");
  const apriFormulaCamminamentiButtonEl = document.querySelector("#btn-apri-formula-camminamenti");
  const camminamentiAltezzaEl = document.querySelector("#camminamenti-altezza");
  const camminamentiIdVoceEl = document.querySelector("#camminamenti-idvoce");
  const camminamentiBodyEl = document.querySelector("#camminamenti-body");
  const camminamentiSubmitButtonEl = camminamentiFormEl.querySelector("button[type='submit']");
  const countCamminamentiEl = document.querySelector("#count-camminamenti");
  const sumAreaCorselliEl = document.querySelector("#sum-area-corselli");
  const sumVolumeCorselliEl = document.querySelector("#sum-volume-corselli");
  const sumAreaCamminamentiEl = document.querySelector("#sum-area-camminamenti");
  const sumVolumeCamminamentiEl = document.querySelector("#sum-volume-camminamenti");
  const misurazioniFormEl = document.querySelector("#misurazioni-form");
  const idMisurazioneEl = document.querySelector("#idmisurazione");
  const misurazioniIdVoceEl = document.querySelector("#misurazioni-idvoce");
  const misurazioniPianoEl = document.querySelector("#misurazioni-piano");
  const misurazioniRiferimentoEl = document.querySelector("#misurazioni-riferimento");
  const misurazioniFormulaEl = document.querySelector("#misurazioni-formula");
  const apriFormulaMisurazioniButtonEl = document.querySelector("#btn-apri-formula-misurazioni");
  const misurazioniNumeroEl = document.querySelector("#misurazioni-numero");
  const misurazioniSegnoEl = document.querySelector("#misurazioni-segno");
  const misurazioniBodyEl = document.querySelector("#misurazioni-body");
  const misurazioniSubmitButtonEl = misurazioniFormEl?.querySelector("button[type='submit']");
  const countMisurazioniEl = document.querySelector("#count-misurazioni");
  const formulaDialogEl = document.querySelector("#formula-dialog");
  const formulaDialogFormEl = document.querySelector("#formula-dialog-form");
  const formulaDialogTextEl = document.querySelector("#formula-dialog-text");
  const formulaDialogCancelEl = document.querySelector("#formula-dialog-cancel");
  const voceDialogEl = document.querySelector("#voce-dialog");
  const voceDialogFormEl = document.querySelector("#voce-dialog-form");
  const voceDialogCancelEl = document.querySelector("#voce-dialog-cancel");
  const voceDeleteDialogEl = document.querySelector("#voce-delete-dialog");
  const voceDeleteDialogFormEl = document.querySelector("#voce-delete-dialog-form");
  const voceDeleteCancelEl = document.querySelector("#voce-delete-cancel");
  const voceMmDeleteDialogEl = document.querySelector("#voce-mm-delete-dialog");
  const voceMmDeleteDialogFormEl = document.querySelector("#voce-mm-delete-dialog-form");
  const voceMmDeleteCancelEl = document.querySelector("#voce-mm-delete-cancel");
  const voceIdEl = document.querySelector("#voce-id");
  const vocePosizioneEl = document.querySelector("#voce-posizione");
  const voceAbbreviataEl = document.querySelector("#voce-abbreviata");
  const voceUnitaMisuraEl = document.querySelector("#voce-unita-misura");
  const vocePrezzoEl = document.querySelector("#voce-prezzo");
  const voceUnitaNuovaEl = document.querySelector("#voce-unita-nuova");
  const voceUnitaAddButtonEl = document.querySelector("#voce-unita-add");
  const voceTestoEl = document.querySelector("#voce-testo");
  const voceNoteEl = document.querySelector("#voce-note");
  const voceTipoMisuraEl = document.querySelector("#voce-tipo-misura");
  const voceBtnCercaEl = document.querySelector("#voce-btn-cerca");
  const voceMmRigaDialogEl = document.querySelector("#voce-mm-riga-dialog");
  const voceMmRigaDialogFormEl = document.querySelector("#voce-mm-riga-dialog-form");
  const voceMmRigaDialogTitleEl = document.querySelector("#voce-mm-riga-dialog-title");
  const voceMmRigaIdVoceEl = document.querySelector("#voce-mm-riga-idvoce");
  const voceMmRigaPianoEl = document.querySelector("#voce-mm-riga-piano");
  const voceMmRigaRiferimentoEl = document.querySelector("#voce-mm-riga-riferimento");
  const voceMmRigaFormulaEl = document.querySelector("#voce-mm-riga-formula");
  const voceMmRigaNumeroEl = document.querySelector("#voce-mm-riga-numero");
  const voceMmRigaSegnoEl = document.querySelector("#voce-mm-riga-segno");
  const voceMmRigaCancelEl = document.querySelector("#voce-mm-riga-cancel");
  const vociBodyEl = document.querySelector("#voci-body");
  const vociTotaleComputoEl = document.querySelector("#voci-totale-computo");
  const btnApriTutteVociEl = document.querySelector("#btn-apri-tutte-voci");
  const btnChiudiTutteVociEl = document.querySelector("#btn-chiudi-tutte-voci");

  const STORAGE_PIANI = "computo_metrico_piani";
  const STORAGE_MUR_LEGACY = "computo_metrico_murielevazione";
  const STORAGE_MUR_ELE = "computo_metrico_murielevazioni";
  const STORAGE_STRATI_MUR = "computo_metrico_strati_murielevazione";
  const STORAGE_APERTURE_ELEV = "computo_metrico_aperture_elevazione";
  const STORAGE_SCAVI_ESTERNI = "computo_metrico_esterni_vari_scavi";
  const STORAGE_CORSELLI_ESTERNI = "computo_metrico_esterni_vari_corselli";
  const STORAGE_CAMMINAMENTI_ESTERNI = "computo_metrico_esterni_vari_camminamenti";
  const STORAGE_MISURAZIONI_VARIE = "computo_metrico_misurazioni_varie";
  const STORAGE_VOCI = "computo_metrico_voci";
  const STORAGE_VOCI_UNITA_OPTIONS = "computo_metrico_voci_unita_options";
  const STORAGE_IFC_DATA = "computo_metrico_ifc_data";
  const UNITA_MISURA_DEFAULT_OPTIONS = ["ml.", "mq.", "mc", "Kg.", "a corpo", "percentuale"];
  const TIPOMISURA_VOCE_AUTOMATICA = "AUTOMATICA";
  const TIPOMISURA_VOCE_MANUALE = "MANUALE";
  const STORAGE_KEYS = {
    STORAGE_MUR_LEGACY,
    STORAGE_MUR_ELE,
    STORAGE_STRATI_MUR,
    STORAGE_APERTURE_ELEV,
    STORAGE_SCAVI_ESTERNI,
    STORAGE_CORSELLI_ESTERNI,
    STORAGE_CAMMINAMENTI_ESTERNI,
    STORAGE_MISURAZIONI_VARIE,
  };

  /** @type {{ id: number, tipologia: string, edificio: string, piano: string }[]} */
  let piani = [];
  /** @type {{ idElevazione: number, idPiano: number }[]} */
  let murielevazioni = [];
  /** @type {{ idStratoMur: number, idElevazione: number, idStrato: string, lunghezza: number, altezza: number, spessore: number, idVoceCapitolato: string }[]} */
  let stratiMurElevazione = [];
  /** @type {{ idAperturaElev: number, idElevazione: number, locale: string, lunghezza: number, altezza: number, ante: number, tipologia: string, falsotelai: boolean, hDavanzale: number, idVoceCapitolato: string }[]} */
  let apertureElevazione = [];
  /** @type {{ idPlScavo: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let scaviEsterni = [];
  /** @type {{ idPlCors: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let corselliEsterni = [];
  /** @type {{ idPlCamm: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let camminamentiEsterni = [];
  /** @type {{ idMisurazione: number, idVoce: string, piano: string, riferimento: string, formula: string, formulaValue: number|null, numero: number, segno: boolean, risultato: number }[]} */
  let misurazioniVarie = [];
  /** @type {{ idVoce: number, posizione: number, voceAbbreviata: string, unitaMisura: string, prezzo: number, tipoMisura: string, voce: string, note: string, misurazioniManuali?: { piano: string, riferimento: string, formula: string, formulaValue: number|null, numero: number, segno: boolean, risultato: number }[] }[]} */
  let voci = [];
  /** @type {string[]} */
  let vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
  /** voci manuali collassate nella tabella VOCI */
  const vociMmCollapsed = new Set();
  /** id voce in modalità focus fullscreen nella vista VOCI */
  let voceFocusId = null;

  let pianoIdCounter = 1;
  let elevazioneIdCounter = 1;
  let stratoMurIdCounter = 1;
  let aperturaElevIdCounter = 1;
  let scavoIdCounter = 1;
  let corselloIdCounter = 1;
  let camminamentiIdCounter = 1;
  let misurazioniIdCounter = 1;
  let voceIdCounter = 1;
  let editingPianoId = null;
  /** modifica riga strato */
  let editingStratoMurId = null;
  /** modifica riga apertura */
  let editingAperturaElevId = null;
  /** modifica riga scavo */
  let editingScavoId = null;
  /** modifica riga corsello */
  let editingCorselloId = null;
  /** modifica riga camminamenti */
  let editingCamminamentiId = null;
  /** modifica riga misurazioni varie */
  let editingMisurazioneId = null;
  /** modifica riga voce */
  let editingVoceId = null;
  /** contesto popup riga misurazione manuale: index null = nuova riga */
  let voceMmDialogContext = { idVoce: /** @type {number | null} */ (null), index: /** @type {number | null} */ (null) };
  /** id voce in attesa conferma eliminazione */
  let pendingDeleteVoceId = null;
  /** Eliminazione misurazione manuale in attesa di conferma nel modale */
  let pendingDeleteVoceMm = { idVoce: /** @type {number|null} */ (null), index: /** @type {number|null} */ (null) };
  /** @type {any | null} */
  let ifcDataCache = null;
  /** @type {any | null} */
  let bimSelectedElementCache = null;
  let bimActiveTab = "posizione";
  /** @type {{ loadIfcFile: (file: File) => Promise<any>, getIfcData: () => any } | null} */
  let bimViewer = null;
  /** @type {Promise<any> | null} */
  let bimViewerModulePromise = null;

  function setBimStatus(message) {
    if (bimViewerStatusEl) bimViewerStatusEl.textContent = message;
  }

  function renderBimSelectedElement(selection) {
    if (!bimPropsEmptyEl || !bimPropsContentEl || !bimPropsMetaEl || !bimPropsJsonEl) return;
    bimSelectedElementCache = selection && typeof selection === "object" ? selection : null;
    if (!selection || typeof selection !== "object") {
      bimPropsEmptyEl.hidden = false;
      bimPropsContentEl.hidden = true;
      bimPropsMetaEl.textContent = "";
      if (bimPropsTableEl) bimPropsTableEl.innerHTML = "";
      bimPropsJsonEl.textContent = "";
      return;
    }

    const ifcType = String(selection.ifcType || "N/D");
    const expressID = Number(selection.expressID || 0);
    const name = String(selection.name || "");
    const quantita = Array.isArray(selection.quantities) ? selection.quantities.length : 0;

    bimPropsMetaEl.textContent =
      `TIPO: ${ifcType} | EXPRESS ID: ${expressID}` + (name ? ` | NOME: ${name}` : "") + ` | QUANTITA: ${quantita}`;
    if (bimPropsTableEl) {
      const sections = buildBimSectionsByTab(selection, bimActiveTab);
      bimPropsTableEl.innerHTML = renderBimTabularHtml(sections);
    }
    bimPropsJsonEl.textContent = JSON.stringify(selection, null, 2);
    bimPropsEmptyEl.hidden = true;
    bimPropsContentEl.hidden = false;
    updateBimTabsUi();
  }

  function updateBimTabsUi() {
    bimTabButtons.forEach((btn) => {
      const isActive = btn.dataset.bimTab === bimActiveTab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function buildBimSectionsByTab(selection, tab) {
    const proprietaSections = [];
    const baseRows = normalizeRows([
      { name: "IfcType", value: selection.ifcType || "" },
      { name: "ExpressID", value: selection.expressID ?? "" },
      { name: "Name", value: selection.name || "" },
    ]);
    if (baseRows.length) proprietaSections.push({ name: "Elemento", rows: baseRows });

    const psetRows = extractPropertySetRows(selection.propertySets);
    psetRows.forEach((item) => {
      if (item.rows.length) proprietaSections.push({ name: item.name, rows: normalizeRows(item.rows) });
    });

    const quantityRows = normalizeRows(extractQuantityRows(selection));
    if (quantityRows.length) proprietaSections.push({ name: "Quantities", rows: quantityRows });

    const posizioneData = extractPositionRows(selection);
    const posizioneSections = [
      { name: "Location", rows: normalizeRows(posizioneData.locationRows) },
      { name: "Geometry", rows: normalizeRows(posizioneData.geometryRows) },
      { name: "Membership", rows: normalizeRows(posizioneData.membershipRows) },
    ].filter((s) => s.rows.length > 0);

    const classificazioneRows = normalizeRows(extractClassificationRows(selection));
    const classificazioneSections = classificazioneRows.length
      ? [{ name: "Classificazione", rows: classificazioneRows }]
      : [];

    const relazioniRows = normalizeRows(extractRelationRows(selection));
    const relazioniSections = relazioniRows.length ? [{ name: "Relazioni", rows: relazioniRows }] : [];

    const mapByTab = {
      proprieta: proprietaSections,
      posizione: posizioneSections,
      classificazione: classificazioneSections,
      relazioni: relazioniSections,
    };

    const selected = mapByTab[tab] || [];
    if (selected.length) return selected;

    return [
      {
        name: "Info",
        rows: [{ name: "Messaggio", value: "Nessun dato disponibile in questa sezione.", um: "" }],
      },
    ];
  }

  function normalizeRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r) => ({
        name: String(r?.name ?? "").trim(),
        value: String(r?.value ?? "").trim(),
        um: String(r?.um ?? "").trim(),
      }))
      .filter((r) => r.name !== "" || r.value !== "" || r.um !== "");
  }

  function renderBimTabularHtml(sections) {
    const body = sections
      .map((section) => {
        const header = `<tr class="bim-props-section-row"><td colspan="3">${escapeHtml(section.name || "Sezione")}</td></tr>`;
        const rows = (section.rows || [])
          .map(
            (row) =>
              `<tr><td>${escapeHtml(row.name || "")}</td><td>${escapeHtml(row.value || "")}</td><td>${escapeHtml(row.um || "")}</td></tr>`,
          )
          .join("");
        return header + rows;
      })
      .join("");

    return `<table class="bim-props-grid">
      <thead>
        <tr><th>Nome</th><th>Valore</th><th class="bim-props-col-um">U.m.</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  function extractPropertySetRows(propertySets) {
    const found = [];
    const seenGroups = new Set();

    function normalizeValue(v) {
      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) return v.map((x) => normalizeValue(x)).filter(Boolean).join(", ");
      if (typeof v === "object") {
        if ("value" in v && Object.keys(v).length <= 3) return normalizeValue(v.value);
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    }

    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }

      const groupName =
        typeof node.Name === "string" && node.Name.trim() ? node.Name.trim() : typeof node.name === "string" ? node.name.trim() : "";

      const rows = [];
      if (Array.isArray(node.HasProperties)) {
        node.HasProperties.forEach((prop) => {
          if (!prop || typeof prop !== "object") return;
          const propName = prop.Name || prop.name || "";
          const propValue =
            prop.NominalValue ??
            prop.nominalValue ??
            prop.Value ??
            prop.value ??
            prop.EnumerationValues ??
            prop.enumerationValues ??
            "";
          const valueText = normalizeValue(propValue);
          if (String(propName).trim() && valueText !== "") {
            rows.push({ name: String(propName).trim(), value: valueText });
          }
        });
      }

      // In molti IFC le quantità geometriche stanno in HasQuantities, non in HasProperties.
      if (Array.isArray(node.HasQuantities)) {
        node.HasQuantities.forEach((q) => {
          if (!q || typeof q !== "object") return;
          const qName = q.Name || q.name || "";
          const qValue =
            q.LengthValue ??
            q.AreaValue ??
            q.VolumeValue ??
            q.CountValue ??
            q.WeightValue ??
            q.TimeValue ??
            q.NominalValue ??
            q.Value ??
            q.value ??
            "";
          const valueText = normalizeValue(qValue);
          if (String(qName).trim() && valueText !== "") {
            rows.push({ name: String(qName).trim(), value: valueText });
          }
        });
      }

      if (groupName && rows.length) {
        const key = groupName.toLowerCase();
        if (!seenGroups.has(key)) {
          seenGroups.add(key);
          found.push({ name: groupName, rows });
        }
      }

      Object.values(node).forEach(walk);
    }

    walk(propertySets);
    return found;
  }

  function extractQuantityRows(selection) {
    const rows = [];
    const seen = new Set();
    const metricLabel = {
      length: "Lunghezza",
      area: "Area",
      volume: "Volume",
      count: "Numero",
      weight: "Peso",
      time: "Tempo",
    };

    if (Array.isArray(selection.quantities)) {
      selection.quantities.forEach((q) => {
        const name = q.quantityName || q.metric || "Quantity";
        const metricName = metricLabel[q.metric] || q.metric || "";
        const unit = q.unitHint || "";
        const value = `${q.value}${metricName ? ` (${metricName})` : ""}`;
        const k = String(name).toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          rows.push({ name, value, um: unit });
        }
      });
    }

    // Fallback: alcune dimensioni arrivano nelle proprietà base elemento.
    const base = selection?.properties && typeof selection.properties === "object" ? selection.properties : {};
    const baseDimensionCandidates = [
      "OverallHeight",
      "OverallWidth",
      "OverallDepth",
      "Height",
      "Width",
      "Depth",
      "Thickness",
      "NominalLength",
      "NominalWidth",
      "NominalHeight",
      "Length",
      "Area",
      "Volume",
    ];
    baseDimensionCandidates.forEach((key) => {
      const raw = base[key];
      if (raw === null || raw === undefined || raw === "") return;
      const value = typeof raw === "object" && "value" in raw ? raw.value : raw;
      const k = key.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      rows.push({ name: key, value: String(value), um: inferUmFromDimensionName(key) });
    });

    return rows;
  }

  function extractPositionRows(selection) {
    const locationRows = [];
    const geometryRows = [];
    const membershipRows = [];
    const seen = new Set();
    const root = selection?.properties && typeof selection.properties === "object" ? selection.properties : {};
    const locationInfo = selection?.locationInfo && typeof selection.locationInfo === "object" ? selection.locationInfo : null;
    const geometryInfo = selection?.geometryInfo && typeof selection.geometryInfo === "object" ? selection.geometryInfo : null;

    function addRow(targetArray, name, value, um = "") {
      const key = `${String(name).toLowerCase()}::${String(value).toLowerCase()}::${String(um).toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      targetArray.push({ name: String(name), value: String(value), um: String(um || "") });
    }

    function normalizeIfcScalar(value) {
      if (value === null || value === undefined) return "";
      if (typeof value === "object" && value !== null && "value" in value) return normalizeIfcScalar(value.value);
      if (Array.isArray(value)) {
        const parts = value.map((v) => normalizeIfcScalar(v)).filter((v) => v !== "");
        return parts.join(", ");
      }
      return String(value);
    }

    function findNodeByKeyRecursive(node, targetKey) {
      if (!node || typeof node !== "object") return null;
      if (Array.isArray(node)) {
        for (const item of node) {
          const found = findNodeByKeyRecursive(item, targetKey);
          if (found) return found;
        }
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(node, targetKey)) return node[targetKey];
      for (const value of Object.values(node)) {
        const found = findNodeByKeyRecursive(value, targetKey);
        if (found) return found;
      }
      return null;
    }

    const objectPlacement = findNodeByKeyRecursive(root, "ObjectPlacement");
    const relativePlacement = findNodeByKeyRecursive(objectPlacement, "RelativePlacement");
    const location = findNodeByKeyRecursive(relativePlacement, "Location");
    const coordinates = findNodeByKeyRecursive(location, "Coordinates");
    const axis = findNodeByKeyRecursive(relativePlacement, "Axis");
    const refDirection = findNodeByKeyRecursive(relativePlacement, "RefDirection");

    if (coordinates) {
      const coordsText = normalizeIfcScalar(coordinates);
      if (coordsText) addRow(locationRows, "Coordinate locali (X,Y,Z)", coordsText, "m");

      if (Array.isArray(coordinates)) {
        const x = normalizeIfcScalar(coordinates[0]);
        const y = normalizeIfcScalar(coordinates[1]);
        const z = normalizeIfcScalar(coordinates[2]);
        if (x) addRow(locationRows, "Global X", x, "m");
        if (y) addRow(locationRows, "Global Y", y, "m");
        if (z) addRow(locationRows, "Global Z", z, "m");
      }
    }

    const axisDir = axis ? findNodeByKeyRecursive(axis, "DirectionRatios") : null;
    const refDir = refDirection ? findNodeByKeyRecursive(refDirection, "DirectionRatios") : null;
    if (axisDir) addRow(locationRows, "Asse (DirectionRatios)", normalizeIfcScalar(axisDir));
    if (refDir) addRow(locationRows, "Direzione riferimento", normalizeIfcScalar(refDir));

    const placementRelTo = findNodeByKeyRecursive(objectPlacement, "PlacementRelTo");
    if (placementRelTo && typeof placementRelTo === "object") {
      const relName =
        normalizeIfcScalar(placementRelTo.Name) ||
        normalizeIfcScalar(placementRelTo.LongName) ||
        normalizeIfcScalar(placementRelTo.GlobalId) ||
        normalizeIfcScalar(placementRelTo.type) ||
        "";
      if (relName) addRow(membershipRows, "Relativo a", relName);
    }

    // Fallback frequenti in alcuni IFC esportati con nomi proprietari
    const fallbackKeys = [
      "Elevation",
      "RefElevation",
      "StoreyElevation",
      "ObjectType",
      "Tag",
      "GlobalId",
    ];
    fallbackKeys.forEach((key) => {
      const value = findNodeByKeyRecursive(root, key);
      const text = normalizeIfcScalar(value);
      if (!text) return;
      if (/elevation/i.test(key)) addRow(locationRows, key, text, "m");
      else if (/GlobalId|Tag|ObjectType/i.test(key)) addRow(membershipRows, key, text);
      else addRow(locationRows, key, text);
    });

    if (locationInfo) {
      if (locationInfo.project) addRow(locationRows, "Project", locationInfo.project);
      if (locationInfo.building) addRow(locationRows, "Building", locationInfo.building);
      if (locationInfo.storey) addRow(locationRows, "Storey", locationInfo.storey);
    }

    if (geometryInfo) {
      if (typeof geometryInfo.hasOwnGeometry === "boolean") {
        addRow(geometryRows, "Has Own Geometry", geometryInfo.hasOwnGeometry ? "Si" : "No");
      }
      if (Number.isFinite(geometryInfo.globalX)) addRow(geometryRows, "Global X", geometryInfo.globalX, "m");
      if (Number.isFinite(geometryInfo.globalY)) addRow(geometryRows, "Global Y", geometryInfo.globalY, "m");
      if (Number.isFinite(geometryInfo.globalZ)) addRow(geometryRows, "Global Z", geometryInfo.globalZ, "m");
      if (Number.isFinite(geometryInfo.boundingBoxLength))
        addRow(geometryRows, "Bounding Box Length", geometryInfo.boundingBoxLength, "m");
      if (Number.isFinite(geometryInfo.boundingBoxWidth))
        addRow(geometryRows, "Bounding Box Width", geometryInfo.boundingBoxWidth, "m");
      if (Number.isFinite(geometryInfo.boundingBoxHeight))
        addRow(geometryRows, "Bounding Box Height", geometryInfo.boundingBoxHeight, "m");

      const hasGlobalZ = Number.isFinite(geometryInfo.globalZ);
      const hasBBoxHeight = Number.isFinite(geometryInfo.boundingBoxHeight);
      if (hasGlobalZ && hasBBoxHeight) {
        const halfH = Number(geometryInfo.boundingBoxHeight) / 2;
        const topElevation = Number((Number(geometryInfo.globalZ) + halfH).toFixed(3));
        const bottomElevation = Number((Number(geometryInfo.globalZ) - halfH).toFixed(3));
        addRow(locationRows, "Top Elevation", topElevation, "m");
        addRow(locationRows, "Bottom Elevation", bottomElevation, "m");
        addRow(locationRows, "Global Top Elevation", topElevation, "m");
        addRow(locationRows, "Global Bottom Elevation", bottomElevation, "m");
      }
    }

    const qRows = extractQuantityRows(selection);
    qRows.forEach((row) => {
      const n = String(row.name || "").toLowerCase();
      if (n.includes("length") || n.includes("width") || n.includes("height") || n.includes("depth") || n.includes("thickness")) {
        addRow(geometryRows, row.name, row.value, row.um || inferUmFromDimensionName(row.name));
      }
    });

    return { locationRows, geometryRows, membershipRows };
  }

  function extractClassificationRows(selection) {
    const rows = [];
    const props = selection?.properties && typeof selection.properties === "object" ? selection.properties : {};
    const typeProps = selection?.typeProperties;
    const keys = ["ObjectType", "PredefinedType", "Tag", "GlobalId", "Name"];
    keys.forEach((k) => {
      const val = pickFirstRecursive(props, k) || pickFirstRecursive(typeProps, k);
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        rows.push({ name: k, value: stringifyIfcVal(val), um: "" });
      }
    });
    return dedupeRows(rows);
  }

  function extractRelationRows(selection) {
    const rows = [];
    const root = selection?.properties && typeof selection.properties === "object" ? selection.properties : {};
    const relKeys = ["ContainedInStructure", "Decomposes", "Nests", "HasAssociations", "ConnectedTo", "ConnectedFrom"];
    relKeys.forEach((key) => {
      const val = pickFirstRecursive(root, key);
      if (val !== null && val !== undefined && String(stringifyIfcVal(val)).trim() !== "") {
        rows.push({ name: key, value: stringifyIfcVal(val), um: "" });
      }
    });
    return dedupeRows(rows);
  }

  function inferUmFromDimensionName(name) {
    const s = String(name || "").toLowerCase();
    if (s.includes("area")) return "mq.";
    if (s.includes("volume")) return "mc";
    if (s.includes("length") || s.includes("width") || s.includes("height") || s.includes("depth") || s.includes("thickness"))
      return "m";
    return "";
  }

  function stringifyIfcVal(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && "value" in val) return stringifyIfcVal(val.value);
    if (Array.isArray(val)) return val.map((v) => stringifyIfcVal(v)).filter(Boolean).join(", ");
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  function pickFirstRecursive(node, targetKey) {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = pickFirstRecursive(item, targetKey);
        if (found !== null && found !== undefined) return found;
      }
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(node, targetKey)) return node[targetKey];
    for (const value of Object.values(node)) {
      const found = pickFirstRecursive(value, targetKey);
      if (found !== null && found !== undefined) return found;
    }
    return null;
  }

  function dedupeRows(rows) {
    const seen = new Set();
    return rows.filter((row) => {
      const k = `${String(row.name || "").toLowerCase()}::${String(row.value || "").toLowerCase()}::${String(row.um || "").toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function ensureBimViewer() {
    if (bimViewer) return bimViewer;
    if (!bimViewerModulePromise) {
      bimViewerModulePromise = import("./modules/bimViewer.js");
    }
    try {
      const module = await bimViewerModulePromise;
      const createBimViewer = module?.createBimViewer;
      if (typeof createBimViewer !== "function") {
        throw new Error("Factory viewer BIM non disponibile.");
      }
      bimViewer = createBimViewer(bimViewerContainerEl, setBimStatus, renderBimSelectedElement);
      return bimViewer;
    } catch (error) {
      console.error("Errore inizializzazione viewer BIM:", error);
      setBimStatus("Viewer BIM non disponibile su questo dispositivo.");
      return null;
    }
  }

  function setupBimTabs() {
    updateBimTabsUi();
    bimTabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.bimTab;
        if (!tab || tab === bimActiveTab) return;
        bimActiveTab = tab;
        updateBimTabsUi();
        if (bimSelectedElementCache) {
          renderBimSelectedElement(bimSelectedElementCache);
        }
      });
    });
  }

  /** @type {number | null} */
  let compilazionePianoId = null;
  /** elevazione selezionata per STRATIMURIELEVAZIONE */
  let currentElevazioneId = null;
  /** se impostato, in MURIELEVAZIONE si vede solo questa riga (toggle con Filtra / Mostra tutte) */
  let murFiltroSoloIdElevazione = null;

  function savePiani() {
    savePianiStorage(STORAGE_PIANI, piani);
  }

  function saveMurDati() {
    saveMurDatiStorage(
      STORAGE_KEYS,
      murielevazioni,
      stratiMurElevazione,
      apertureElevazione,
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni,
      misurazioniVarie,
    );
  }

  function loadPiani() {
    const loaded = loadPianiStorage(STORAGE_PIANI);
    piani = loaded.piani;
    pianoIdCounter = loaded.pianoIdCounter;
  }

  function loadMurDati() {
    const loaded = loadMurDatiStorage(STORAGE_KEYS, piani);
    murielevazioni = loaded.murielevazioni;
    stratiMurElevazione = loaded.stratiMurElevazione;
    apertureElevazione = loaded.apertureElevazione;
    scaviEsterni = loaded.scaviEsterni;
    corselliEsterni = loaded.corselliEsterni;
    camminamentiEsterni = loaded.camminamentiEsterni;
    misurazioniVarie = Array.isArray(loaded.misurazioniVarie) ? loaded.misurazioniVarie : [];
    elevazioneIdCounter = loaded.elevazioneIdCounter;
    stratoMurIdCounter = loaded.stratoMurIdCounter;
    aperturaElevIdCounter = loaded.aperturaElevIdCounter;
    scavoIdCounter = loaded.scavoIdCounter;
    corselloIdCounter = loaded.corselloIdCounter;
    camminamentiIdCounter = loaded.camminamentiIdCounter;
    misurazioniIdCounter =
      typeof loaded.misurazioniIdCounter === "number" ? loaded.misurazioniIdCounter : 1;
  }

  function saveVoci() {
    localStorage.setItem(STORAGE_VOCI, JSON.stringify(voci));
  }

  function saveVociUnitaOptions() {
    localStorage.setItem(STORAGE_VOCI_UNITA_OPTIONS, JSON.stringify(vociUnitaMisuraOptions));
  }

  function saveIfcData() {
    if (!ifcDataCache) {
      localStorage.removeItem(STORAGE_IFC_DATA);
      return;
    }
    localStorage.setItem(STORAGE_IFC_DATA, JSON.stringify(ifcDataCache));
  }

  function loadIfcData() {
    try {
      const raw = localStorage.getItem(STORAGE_IFC_DATA);
      if (!raw) {
        ifcDataCache = null;
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        ifcDataCache = null;
        return;
      }
      ifcDataCache = parsed;
    } catch {
      ifcDataCache = null;
    }
  }

  function loadVociUnitaOptions() {
    try {
      const raw = localStorage.getItem(STORAGE_VOCI_UNITA_OPTIONS);
      if (!raw) {
        vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
        return;
      }
      const normalized = parsed
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item !== "");
      const unique = [];
      normalized.forEach((item) => {
        if (!unique.some((u) => u.toLowerCase() === item.toLowerCase())) unique.push(item);
      });
      UNITA_MISURA_DEFAULT_OPTIONS.forEach((item) => {
        if (!unique.some((u) => u.toLowerCase() === item.toLowerCase())) unique.push(item);
      });
      vociUnitaMisuraOptions = unique.length > 0 ? unique : [...UNITA_MISURA_DEFAULT_OPTIONS];
    } catch {
      vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
    }
  }

  function renderVociUnitaOptions(selectedValue = "") {
    if (!voceUnitaMisuraEl) return;
    voceUnitaMisuraEl.innerHTML = "";
    vociUnitaMisuraOptions.forEach((optionValue) => {
      const optionEl = document.createElement("option");
      optionEl.value = optionValue;
      optionEl.textContent = optionValue;
      voceUnitaMisuraEl.appendChild(optionEl);
    });
    const fallback = vociUnitaMisuraOptions[0] || "";
    const finalValue =
      selectedValue && vociUnitaMisuraOptions.includes(selectedValue) ? selectedValue : fallback;
    voceUnitaMisuraEl.value = finalValue;
  }

  function normalizzaTipoMisuraVoce(raw) {
    const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    if (s === TIPOMISURA_VOCE_MANUALE) return TIPOMISURA_VOCE_MANUALE;
    return TIPOMISURA_VOCE_AUTOMATICA;
  }

  function normalizzaMisurazioniManualiVoce(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (m) =>
          typeof m?.piano === "string" &&
          typeof m?.riferimento === "string" &&
          typeof m?.formula === "string" &&
          (typeof m?.formulaValue === "number" || m?.formulaValue === null) &&
          typeof m?.numero === "number" &&
          Number.isInteger(m.numero) &&
          typeof m?.segno === "boolean" &&
          typeof m?.risultato === "number" &&
          Number.isFinite(m.risultato),
      )
      .map((m) => ({
        piano: m.piano,
        riferimento: m.riferimento,
        formula: m.formula,
        formulaValue: m.formulaValue,
        numero: m.numero,
        segno: m.segno === true,
        risultato: m.risultato,
      }));
  }

  function formatTotaleMisurazioniManualiIt(sum) {
    return Number(sum).toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatEuro2(value) {
    return Number(value).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function loadVoci() {
    try {
      const raw = localStorage.getItem(STORAGE_VOCI);
      if (!raw) {
        voci = [];
        voceIdCounter = 1;
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        voci = [];
        voceIdCounter = 1;
        return;
      }
      voci = parsed.filter(
        (item) => typeof item?.idVoce === "number" && typeof item?.posizione === "number",
      ).map((item) => ({
        idVoce: item.idVoce,
        posizione: item.posizione,
        voceAbbreviata: typeof item?.voceAbbreviata === "string" ? item.voceAbbreviata : "",
        unitaMisura:
          typeof item?.unitaMisura === "string" && item.unitaMisura.trim() !== ""
            ? item.unitaMisura.trim()
            : UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: parseNonNegativeDecimal2(item?.prezzo) ?? 0,
        tipoMisura: normalizzaTipoMisuraVoce(
          item?.tipoMisura ?? item?.tipomisura ?? item?.TIPOMISURA,
        ),
        misurazioniManuali: normalizzaMisurazioniManualiVoce(item.misurazioniManuali),
        voce: typeof item?.voce === "string" ? item.voce : "",
        note: typeof item?.note === "string" ? item.note : "",
      })).filter((item) => item.voce !== "");
      voci.forEach((item) => {
        if (
          item.unitaMisura &&
          !vociUnitaMisuraOptions.some((u) => u.toLowerCase() === item.unitaMisura.toLowerCase())
        ) {
          vociUnitaMisuraOptions.push(item.unitaMisura);
        }
      });
      voceIdCounter = voci.reduce((max, item) => Math.max(max, item.idVoce), 0) + 1;
    } catch {
      voci = [];
      voceIdCounter = 1;
    }
  }

  function creaNuovaElevazione(idPiano) {
    const idElevazione = elevazioneIdCounter++;
    murielevazioni.push({ idElevazione, idPiano, riferimento: "", spessore: 0 });
    saveMurDati();
    return idElevazione;
  }

  function aggiornaRiferimentoElevazione(idElevazione, riferimento) {
    murielevazioni = murielevazioni.map((e) =>
      e.idElevazione === idElevazione ? { ...e, riferimento } : e,
    );
    saveMurDati();
  }

  function aggiornaSpessoreElevazione(idElevazione, spessore) {
    murielevazioni = murielevazioni.map((e) =>
      e.idElevazione === idElevazione ? { ...e, spessore } : e,
    );
    saveMurDati();
  }

  function mostraPannelloCompilazione(tipo) {
    compilazioneInterratoPanelEl.hidden = tipo !== "interrato";
    compilazioneEsterniPanelEl.hidden = tipo !== "esterni";
    altreTipologiePanelEl.hidden = tipo !== "altre";
  }

  function openCompilazioneInterrato(piano) {
    stratiFormEl.reset();
    editingStratoMurId = null;
    setStratiFormMode();
    resetAperturaForm();
    murFiltroSoloIdElevazione = null;
    compilazionePianoId = piano.id;
    mostraPannelloCompilazione("interrato");
    const nuovaId = creaNuovaElevazione(piano.id);
    currentElevazioneId = nuovaId;
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    updateInterratoPanelSubtitle(interratoSottotitoloEl, piano);
    updateElevazioneAttivaLabel(
      idElevazioneAttivaEl,
      riferimentoElevazioneAttivaEl,
      currentElevazioneId,
      murielevazioni,
    );
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    tornaPianiButtonEl.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCompilazioneEsterniVari() {
    compilazionePianoId = null;
    currentElevazioneId = null;
    mostraPannelloCompilazione("esterni");
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    compilazioneEsterniPanelEl
      .querySelectorAll("details.collapsible-block")
      .forEach((section) => (section.open = false));
    esterniSottotitoloEl.innerHTML = "Vista indipendente ESTERNI VARI.";
    resetScavoForm();
    resetCorselloForm();
    resetCamminamentiForm();
    resetMisurazioniForm();
    renderScavi();
    renderCorselli();
    renderCamminamenti();
    renderMisurazioniVarie();
    tornaPianiEsterniButtonEl.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCompilazioneEsterniVariDaSidebar() {
    openCompilazioneEsterniVari();
  }

  function openCompilazioneAltreTipologie(piano) {
    compilazionePianoId = null;
    currentElevazioneId = null;
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    mostraPannelloCompilazione("altre");
    altreTipologieTestoEl.textContent = `La compilazione per la tipologia "${piano.tipologia}" sara' aggiunta in seguito.`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function apriVistaVoci() {
    vistaPianiEl.hidden = true;
    vistaCompilazioneEl.hidden = true;
    vistaVociEl.hidden = false;
    if (vistaBimEl) vistaBimEl.hidden = true;
    renderVoci();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function apriVistaBim() {
    vistaPianiEl.hidden = true;
    vistaCompilazioneEl.hidden = true;
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = false;
    ensureBimViewer().catch((error) => {
      console.error(error);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setPianoFormMode() {
    pianoSubmitButtonEl.textContent =
      editingPianoId === null ? "Aggiungi Piano" : "Salva Modifica";
  }

  function setStratiFormMode() {
    stratiSubmitButtonEl.textContent =
      editingStratoMurId === null ? "Aggiungi strato" : "Salva modifica strato";
    aggiornaCampoIdStratoAutomatico();
    aggiornaSuggerimentoSpessoreStrato();
  }

  function prossimoIdStratoPerElevazione(idElevazione) {
    const stratiElevazione = stratiMurElevazione.filter((item) => item.idElevazione === idElevazione);
    if (stratiElevazione.length === 0) return 1;
    const maxIdNumerico = stratiElevazione.reduce((max, item) => {
      const parsed = Number.parseInt(String(item.idStrato), 10);
      if (Number.isNaN(parsed)) return max;
      return Math.max(max, parsed);
    }, 0);
    if (maxIdNumerico > 0) return maxIdNumerico + 1;
    return stratiElevazione.length + 1;
  }

  function aggiornaCampoIdStratoAutomatico() {
    if (editingStratoMurId !== null) return;
    if (currentElevazioneId === null) {
      idstratoEl.value = "";
      return;
    }
    idstratoEl.value = String(prossimoIdStratoPerElevazione(currentElevazioneId));
  }

  function getSpessoreElevazioneAttiva() {
    const elevazione = murielevazioni.find((item) => item.idElevazione === currentElevazioneId);
    return Number(elevazione?.spessore || 0);
  }

  function calcolaSpessoreResiduoPerElevazione(idElevazione, editingId = null) {
    const elevazione = murielevazioni.find((item) => item.idElevazione === idElevazione);
    const spessoreElevazione = Number(elevazione?.spessore || 0);
    const sommaStrati = stratiMurElevazione
      .filter((item) => item.idElevazione === idElevazione && item.idStratoMur !== editingId)
      .reduce((sum, item) => sum + Number(item.spessore || 0), 0);
    return Number((spessoreElevazione - sommaStrati).toFixed(2));
  }

  function aggiornaSuggerimentoSpessoreStrato() {
    if (currentElevazioneId === null) {
      spessoreEl.value = "";
      spessoreEl.placeholder = "0.00";
      spessoreEl.removeAttribute("max");
      spessoreEl.title = "";
      return;
    }

    const residuo = calcolaSpessoreResiduoPerElevazione(currentElevazioneId, editingStratoMurId);
    const residuoNonNegativo = Math.max(0, residuo);
    spessoreEl.max = String(residuoNonNegativo);
    spessoreEl.placeholder = `Max ${fmt2(residuoNonNegativo)}`;
    spessoreEl.title = `Spessore massimo inseribile: ${fmt2(residuoNonNegativo)}`;

    if (editingStratoMurId === null && !spessoreEl.value) {
      spessoreEl.value = fmt2(residuoNonNegativo);
    }
  }

  function resetPianoForm() {
    pianoFormEl.reset();
    tipologiaEl.selectedIndex = 0;
    editingPianoId = null;
    setPianoFormMode();
    edificioEl.focus();
  }

  function resetStratiForm() {
    stratiFormEl.reset();
    editingStratoMurId = null;
    setStratiFormMode();
    lunghezzaEl.focus();
  }

  function setAperturaFormMode() {
    apertureSubmitButtonEl.textContent =
      editingAperturaElevId === null ? "Aggiungi apertura" : "Salva modifica apertura";
  }

  function resetAperturaForm() {
    apertureFormEl.reset();
    apFalsotelaiEl.value = "no";
    editingAperturaElevId = null;
    setAperturaFormMode();
  }

  function setScavoFormMode() {
    scavoSubmitButtonEl.textContent = editingScavoId === null ? "Aggiungi scavo" : "Salva modifica scavo";
    if (editingScavoId === null) {
      idPlScavoEl.value = String(scavoIdCounter);
    }
  }

  function resetScavoForm() {
    scavoFormEl.reset();
    editingScavoId = null;
    setScavoFormMode();
    updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
    scavoPianoEl.focus();
  }

  function setCorselloFormMode() {
    corselloSubmitButtonEl.textContent =
      editingCorselloId === null ? "Aggiungi corsello" : "Salva modifica corsello";
    if (editingCorselloId === null) {
      idPlCorsEl.value = String(corselloIdCounter);
    }
  }

  function resetCorselloForm() {
    corselloFormEl.reset();
    editingCorselloId = null;
    setCorselloFormMode();
    updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
    corselloPianoEl.focus();
  }

  function setCamminamentiFormMode() {
    camminamentiSubmitButtonEl.textContent =
      editingCamminamentiId === null ? "Aggiungi camminamento" : "Salva modifica camminamento";
    if (editingCamminamentiId === null) {
      idPlCammEl.value = String(camminamentiIdCounter);
    }
  }

  function resetCamminamentiForm() {
    camminamentiFormEl.reset();
    editingCamminamentiId = null;
    setCamminamentiFormMode();
    updateFormulaButtonState(camminamentiFormulaEl, apriFormulaCamminamentiButtonEl);
    camminamentiPianoEl.focus();
  }

  function setMisurazioniFormMode() {
    if (misurazioniSubmitButtonEl) {
      misurazioniSubmitButtonEl.textContent =
        editingMisurazioneId === null ? "Aggiungi misurazione" : "Salva modifica misurazione";
    }
    if (editingMisurazioneId === null) {
      idMisurazioneEl.value = String(misurazioniIdCounter);
    }
  }

  function resetMisurazioniForm() {
    if (misurazioniFormEl) misurazioniFormEl.reset();
    if (misurazioniNumeroEl) misurazioniNumeroEl.value = "1";
    editingMisurazioneId = null;
    setMisurazioniFormMode();
    updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
    misurazioniPianoEl?.focus();
  }

  /**
   * Risultato = valore formula × numero arrotondato a 2 decimali; formula vuota ⇒ fattore 1.
   * @returns {{ ok: true, formulaValue: number|null, risultato: number } | { ok: false, message: string }}
   */
  function calcolaMisurazioneVaria(formula, numero, segno) {
    const f = formula.trim();
    let formulaValue = null;
    let fattore = 1;
    if (f !== "") {
      const ev = evalFormulaValue(f);
      if (ev === null) {
        return {
          ok: false,
          message: "FORMULA non valida. Usa solo numeri, operatori (+ - * /) e parentesi.",
        };
      }
      formulaValue = ev;
      fattore = ev;
    }
    if (!Number.isInteger(numero) || numero < 0) {
      return { ok: false, message: "NUMERO deve essere un intero maggiore o uguale a zero." };
    }
    const raw = Number((fattore * numero).toFixed(2));
    const risultato = segno ? -Math.abs(raw) : raw;
    return { ok: true, formulaValue, risultato };
  }

  function resetVoceMmRigaFormFields() {
    if (voceMmRigaPianoEl) voceMmRigaPianoEl.value = "";
    if (voceMmRigaRiferimentoEl) voceMmRigaRiferimentoEl.value = "";
    if (voceMmRigaFormulaEl) voceMmRigaFormulaEl.value = "";
    if (voceMmRigaNumeroEl) voceMmRigaNumeroEl.value = "1";
    if (voceMmRigaSegnoEl) voceMmRigaSegnoEl.checked = false;
  }

  function openVoceMmRigaDialog(idVoce, index) {
    if (!voceMmRigaDialogEl) return;
    voceMmDialogContext = { idVoce, index };
    if (voceMmRigaIdVoceEl) voceMmRigaIdVoceEl.textContent = String(idVoce);
    if (voceMmRigaDialogTitleEl) {
      voceMmRigaDialogTitleEl.textContent =
        index === null ? "Nuova misurazione manuale" : "Modifica misurazione manuale";
    }
    if (index === null) {
      resetVoceMmRigaFormFields();
    } else {
      const v = voci.find((x) => x.idVoce === idVoce);
      const mm = normalizzaMisurazioniManualiVoce(v?.misurazioniManuali);
      const row = mm[index];
      if (!row) {
        window.alert("Riga non trovata.");
        return;
      }
      voceMmRigaPianoEl.value = row.piano;
      voceMmRigaRiferimentoEl.value = row.riferimento;
      voceMmRigaFormulaEl.value = row.formula;
      voceMmRigaNumeroEl.value = String(row.numero);
      voceMmRigaSegnoEl.checked = row.segno === true;
    }
    voceMmRigaDialogEl.showModal();
    setTimeout(() => voceMmRigaPianoEl?.focus(), 0);
  }

  function focusVoceMmRow(idVoce, index) {
    setTimeout(() => {
      const tr = vociBodyEl.querySelector(
        `tr.voce-mm-data-row[data-id-voce="${idVoce}"][data-mm-index="${index}"]`,
      );
      if (!tr) return;
      tr.scrollIntoView({ behavior: "smooth", block: "nearest" });
      tr.setAttribute("tabindex", "-1");
      tr.focus({ preventScroll: true });
    }, 0);
  }

  function salvaVoceMmRigaDialog() {
    const { idVoce, index } = voceMmDialogContext;
    if (idVoce === null) return;
    const piano = voceMmRigaPianoEl.value.trim();
    const riferimento = voceMmRigaRiferimentoEl.value.trim();
    const formula = voceMmRigaFormulaEl.value.trim();
    const segno = voceMmRigaSegnoEl.checked;
    const numeroParsed = Number.parseInt(voceMmRigaNumeroEl.value, 10);
    if (!piano || !riferimento) {
      window.alert("Compila PIANO e RIFERIMENTO.");
      return;
    }
    const calc = calcolaMisurazioneVaria(formula, numeroParsed, segno);
    if (!calc.ok) {
      window.alert(calc.message);
      return;
    }
    const nuovaRiga = {
      piano,
      riferimento,
      formula,
      formulaValue: calc.formulaValue,
      numero: numeroParsed,
      segno,
      risultato: calc.risultato,
    };
    let targetIndex = index;
    const shouldFocusAfterSave = index === null;
    voci = voci.map((v) => {
      if (v.idVoce !== idVoce) return v;
      let mm = [...normalizzaMisurazioniManualiVoce(v.misurazioniManuali)];
      if (index === null) {
        mm.push(nuovaRiga);
        targetIndex = mm.length - 1;
      } else if (index >= 0 && index < mm.length) {
        mm[index] = nuovaRiga;
      }
      return { ...v, misurazioniManuali: mm };
    });
    saveVoci();
    renderVoci();
    voceMmRigaDialogEl.close();
    if (shouldFocusAfterSave && targetIndex !== null && Number.isInteger(targetIndex) && targetIndex >= 0) {
      focusVoceMmRow(idVoce, targetIndex);
    }
    voceMmDialogContext = { idVoce: null, index: null };
  }

  function eliminaVoceMmRiga(idVoce, index) {
    voci = voci.map((v) => {
      if (v.idVoce !== idVoce) return v;
      const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali).filter((_, i) => i !== index);
      return { ...v, misurazioniManuali: mm };
    });
    saveVoci();
    renderVoci();
  }

  /** Inserisce una copia della misurazione subito dopo l’originale e apre il modale sulla nuova riga. */
  function duplicaVoceMmRiga(idVoce, index) {
    const v = voci.find((x) => x.idVoce === idVoce);
    if (!v) return;
    const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali);
    const row = mm[index];
    if (!row) return;
    const calc = calcolaMisurazioneVaria(row.formula, row.numero, row.segno);
    if (!calc.ok) {
      window.alert(calc.message);
      return;
    }
    const copy = {
      piano: row.piano,
      riferimento: row.riferimento,
      formula: row.formula,
      formulaValue: calc.formulaValue,
      numero: row.numero,
      segno: row.segno === true,
      risultato: calc.risultato,
    };
    voci = voci.map((vv) => {
      if (vv.idVoce !== idVoce) return vv;
      const arr = [...normalizzaMisurazioniManualiVoce(vv.misurazioniManuali)];
      arr.splice(index + 1, 0, copy);
      return { ...vv, misurazioniManuali: arr };
    });
    saveVoci();
    renderVoci();
    openVoceMmRigaDialog(idVoce, index + 1);
  }

  function resetVoceForm() {
    voceIdEl.value = String(voceIdCounter);
    vocePosizioneEl.value = String(getPrimaPosizioneVoceDisponibile());
    voceAbbreviataEl.value = "";
    renderVociUnitaOptions();
    if (vocePrezzoEl) vocePrezzoEl.value = fmt2(0);
    voceUnitaNuovaEl.value = "";
    if (voceTipoMisuraEl) voceTipoMisuraEl.value = TIPOMISURA_VOCE_AUTOMATICA;
    voceTestoEl.value = "";
    voceNoteEl.value = "";
    editingVoceId = null;
  }

  function getPrimaPosizioneVoceDisponibile() {
    const usate = new Set(
      voci
        .map((item) => Number(item.posizione))
        .filter((n) => Number.isInteger(n) && n > 0),
    );
    let posizione = 1;
    while (usate.has(posizione)) posizione += 1;
    return posizione;
  }

  function normalizzaPosizioniVoci() {
    const ordinate = [...voci].sort(
      (a, b) => a.posizione - b.posizione || a.idVoce - b.idVoce,
    );
    ordinate.forEach((item, index) => {
      item.posizione = index + 1;
    });
    voci = ordinate;
  }

  function spostaVoceAPosizione(idVoce, nuovaPosizione) {
    normalizzaPosizioniVoci();
    const corrente = [...voci];
    const idx = corrente.findIndex((item) => item.idVoce === idVoce);
    if (idx < 0) return;
    const [voce] = corrente.splice(idx, 1);
    const posClamped = Math.max(1, Math.min(nuovaPosizione, corrente.length + 1));
    corrente.splice(posClamped - 1, 0, voce);
    corrente.forEach((item, index) => {
      item.posizione = index + 1;
    });
    voci = corrente;
  }

  function exitVoceFocusMode() {
    voceFocusId = null;
    vistaVociEl?.classList.remove("voce-focus-mode");
    document.querySelector("#voce-focus-close-floating")?.remove();
    renderVoci();
  }

  function enterVoceFocusMode(idVoce) {
    const voceSelezionata = voci.find((item) => item.idVoce === idVoce);
    if (!voceSelezionata || !vistaVociEl) return;
    voceFocusId = idVoce;
    vistaVociEl.classList.add("voce-focus-mode");

    const closeButtonExisting = document.querySelector("#voce-focus-close-floating");
    if (!closeButtonExisting) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "btn-action btn-delete";
      closeButton.id = "voce-focus-close-floating";
      closeButton.textContent = "Esci da fullscreen";
      closeButton.addEventListener("click", () => {
        exitVoceFocusMode();
      });
      vistaVociEl.prepend(closeButton);
    }
    renderVoci();
  }

  function renderVoci() {
    const totaleComputo = voci.reduce((acc, item) => {
      const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali);
      const totaleQuantitaVoce = mm.reduce((sum, m) => sum + Number(m.risultato || 0), 0);
      const prezzoVoce = parseNonNegativeDecimal2(item.prezzo) ?? 0;
      return acc + totaleQuantitaVoce * prezzoVoce;
    }, 0);
    if (vociTotaleComputoEl) {
      vociTotaleComputoEl.textContent = `TOTALE COMPUTO: ${formatEuro2(totaleComputo)}`;
    }

    vociBodyEl.innerHTML = "";
    if (voci.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 8;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna voce inserita.";
      row.appendChild(cell);
      vociBodyEl.appendChild(row);
      return;
    }

    const ordinate = [...voci].sort(
      (a, b) => a.posizione - b.posizione || a.idVoce - b.idVoce,
    );
    let vociDaRenderizzare = ordinate;
    if (voceFocusId !== null) {
      const voceInFocus = ordinate.find((item) => item.idVoce === voceFocusId);
      if (!voceInFocus) {
        voceFocusId = null;
        vistaVociEl?.classList.remove("voce-focus-mode");
        document.querySelector("#voce-focus-close-floating")?.remove();
      } else {
        vociDaRenderizzare = [voceInFocus];
      }
    }
    vociDaRenderizzare.forEach((item, index) => {
      const row = document.createElement("tr");
      row.className = "voci-row-principale";
      row.dataset.idVoce = String(item.idVoce);
      row.title = "Doppio clic per aprire in fullscreen";
      row.appendChild(createCell(String(item.idVoce)));
      row.appendChild(createCell(String(item.posizione)));
      const cellVoceAbbrev = createCell(item.voceAbbreviata || "-");
      cellVoceAbbrev.title = item.voce;
      cellVoceAbbrev.classList.add("voci-cell-open-focus");
      cellVoceAbbrev.dataset.action = "open-voce-focus";
      cellVoceAbbrev.dataset.idVoce = String(item.idVoce);
      row.appendChild(cellVoceAbbrev);
      row.appendChild(createCell(item.unitaMisura || "-"));
      row.appendChild(createCell(formatEuro2(item.prezzo ?? 0)));
      row.appendChild(createCell(item.tipoMisura || TIPOMISURA_VOCE_AUTOMATICA));
      row.appendChild(createCell(item.note || "-"));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-voce";
      editButton.dataset.id = String(item.idVoce);
      editButton.textContent = "✎";
      editButton.title = "Modifica";
      editButton.setAttribute("aria-label", "Modifica");

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "btn-action btn-secondary";
      upButton.dataset.action = "move-voce-up";
      upButton.dataset.id = String(item.idVoce);
      upButton.textContent = "↑";
      upButton.title = "Sposta sopra";
      upButton.setAttribute("aria-label", "Sposta sopra");
      upButton.disabled = index === 0;

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "btn-action btn-secondary";
      downButton.dataset.action = "move-voce-down";
      downButton.dataset.id = String(item.idVoce);
      downButton.textContent = "↓";
      downButton.title = "Sposta sotto";
      downButton.setAttribute("aria-label", "Sposta sotto");
      downButton.disabled = index === vociDaRenderizzare.length - 1;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-voce";
      deleteButton.dataset.id = String(item.idVoce);
      deleteButton.textContent = "✕";
      deleteButton.title = "Elimina";
      deleteButton.setAttribute("aria-label", "Elimina");

      const isVoceManuale =
        normalizzaTipoMisuraVoce(item.tipoMisura) === TIPOMISURA_VOCE_MANUALE;

      actionsCell.append(upButton, downButton, editButton);
      actionsCell.appendChild(deleteButton);
      if (isVoceManuale) {
        const collapseMmButton = document.createElement("button");
        collapseMmButton.type = "button";
        collapseMmButton.className = "btn-action btn-secondary";
        collapseMmButton.dataset.action = "toggle-voce-mm";
        collapseMmButton.dataset.idVoce = String(item.idVoce);
        const isCollapsed = vociMmCollapsed.has(item.idVoce);
        collapseMmButton.textContent = isCollapsed ? "▸" : "▾";
        collapseMmButton.title = isCollapsed
          ? "Espandi misurazioni manuali"
          : "Collassa misurazioni manuali";
        collapseMmButton.setAttribute(
          "aria-label",
          isCollapsed ? "Espandi misurazioni manuali" : "Collassa misurazioni manuali",
        );
        actionsCell.appendChild(collapseMmButton);

        const addMmRowButton = document.createElement("button");
        addMmRowButton.type = "button";
        addMmRowButton.className = "btn-action btn-voce-mm-add";
        addMmRowButton.dataset.action = "add-voce-mm";
        addMmRowButton.dataset.idVoce = String(item.idVoce);
        addMmRowButton.textContent = "+";
        addMmRowButton.title = "Aggiungi misurazione manuale";
        addMmRowButton.setAttribute("aria-label", "Aggiungi misurazione manuale");
        actionsCell.appendChild(addMmRowButton);
      }
      row.appendChild(actionsCell);
      vociBodyEl.appendChild(row);

      const mostraMisurazioniManuali =
        isVoceManuale && (voceFocusId === item.idVoce || !vociMmCollapsed.has(item.idVoce));
      if (mostraMisurazioniManuali) {
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali);
        let sumMm = 0;
        mm.forEach((m) => {
          sumMm += Number(m.risultato || 0);
        });

        const subTr = document.createElement("tr");
        subTr.className = "voci-row-mm-nested";
        const subTd = document.createElement("td");
        subTd.colSpan = 8;

        const wrap = document.createElement("div");
        wrap.className = "voci-mm-nested-wrap";

        const tableWrap = document.createElement("div");
        tableWrap.className = "table-wrap voci-mm-table-wrap";

        const table = document.createElement("table");
        table.className = "table-voce-mm-inline";

        const thead = document.createElement("thead");
        const hr = document.createElement("tr");
        [
          "IDMIS.",
          "IDVOCE",
          "PIANO",
          "RIF.",
          "FORMULA",
          "N.°",
          "SEGNO",
          "RIS.",
          "",
        ].forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const appendSubtotalRow = (label, value, className) => {
          const trSubtotal = document.createElement("tr");
          trSubtotal.className = `voce-mm-subtotal-row ${className}`;

          const tdLabel = document.createElement("td");
          tdLabel.colSpan = 7;
          tdLabel.className = "voce-mm-subtotal-label";
          tdLabel.textContent = label;

          const tdVal = document.createElement("td");
          tdVal.className = "voce-mm-subtotal-value";
          tdVal.textContent = fmt2(value);

          const tdActions = document.createElement("td");
          tdActions.className = "voce-mm-subtotal-actions";
          tdActions.textContent = "";

          trSubtotal.append(tdLabel, tdVal, tdActions);
          tbody.appendChild(trSubtotal);
        };
        if (mm.length === 0) {
          const er = document.createElement("tr");
          const ec = document.createElement("td");
          ec.colSpan = 9;
          ec.className = "empty-cell";
          ec.textContent =
            "Nessuna misurazione. Usa il + verde dopo la X sulla riga voce (doppio clic su una riga per modificare).";
          er.appendChild(ec);
          tbody.appendChild(er);
        } else {
          /** @type {Map<string, Map<string, { m: { piano: string, riferimento: string, formula: string, formulaValue: number|null, numero: number, segno: boolean, risultato: number }, idx: number }[]>>} */
          const grouped = new Map();
          mm.forEach((m, idx) => {
            const pianoKey = (m.piano || "-").trim() || "-";
            const rifKey = (m.riferimento || "-").trim() || "-";
            if (!grouped.has(pianoKey)) grouped.set(pianoKey, new Map());
            const rifMap = grouped.get(pianoKey);
            if (!rifMap.has(rifKey)) rifMap.set(rifKey, []);
            rifMap.get(rifKey).push({ m, idx });
          });

          grouped.forEach((rifMap, pianoKey) => {
            let sumPiano = 0;
            rifMap.forEach((rows, rifKey) => {
              let sumRif = 0;
              rows.forEach(({ m, idx }) => {
                const trMm = document.createElement("tr");
                trMm.className = "voce-mm-data-row";
                trMm.dataset.idVoce = String(item.idVoce);
                trMm.dataset.mmIndex = String(idx);
                trMm.title = "Doppio clic per modificare";
                if (m.segno) trMm.classList.add("row-sottrai");
                trMm.appendChild(createCell(String(idx + 1)));
                trMm.appendChild(createCell(String(item.idVoce)));
                trMm.appendChild(createCell(m.piano || "-"));
                trMm.appendChild(createCell(m.riferimento || "-"));
                trMm.appendChild(createCell(m.formula || "-"));
                trMm.appendChild(createCell(String(m.numero)));
                trMm.appendChild(createCell(m.segno ? "-" : "+"));
                trMm.appendChild(createCell(fmt2(m.risultato)));
                const ac = document.createElement("td");
                ac.className = "actions-cell";
                const dup = document.createElement("button");
                dup.type = "button";
                dup.className = "btn-action btn-mm-dup";
                dup.dataset.action = "duplicate-voce-mm-row";
                dup.dataset.idVoce = String(item.idVoce);
                dup.dataset.mmIndex = String(idx);
                dup.textContent = "⧉";
                dup.title = "Duplica misurazione (copia i valori in una nuova riga)";
                dup.setAttribute("aria-label", "Duplica misurazione");
                const del = document.createElement("button");
                del.type = "button";
                del.className = "btn-action btn-delete btn-mm-del";
                del.dataset.action = "delete-voce-mm-row";
                del.dataset.idVoce = String(item.idVoce);
                del.dataset.mmIndex = String(idx);
                del.textContent = "✕";
                del.title = "Elimina riga";
                ac.append(dup, del);
                trMm.appendChild(ac);
                tbody.appendChild(trMm);

                const rowRis = Number(m.risultato || 0);
                sumRif += rowRis;
                sumPiano += rowRis;
              });

              appendSubtotalRow(`Totale RIFERIMENTO: ${rifKey}`, sumRif, "voce-mm-subtotal-rif");
            });

            appendSubtotalRow(`Totale PIANO: ${pianoKey}`, sumPiano, "voce-mm-subtotal-piano");
          });
        }
        table.appendChild(tbody);
        tableWrap.appendChild(table);

        const totP = document.createElement("p");
        totP.className = "voci-mm-totale";
        const strong = document.createElement("strong");
        strong.textContent = formatTotaleMisurazioniManualiIt(sumMm);
        const prezzoVoce = parseNonNegativeDecimal2(item.prezzo) ?? 0;
        const importoTotale = sumMm * prezzoVoce;
        const strongPrezzo = document.createElement("strong");
        strongPrezzo.textContent = formatEuro2(prezzoVoce);
        const strongImporto = document.createElement("strong");
        strongImporto.textContent = formatEuro2(importoTotale);
        const unitaVoce = (item.unitaMisura || "-").trim() || "-";
        totP.append(
          `TOTALE ${unitaVoce}: `,
          strong,
          " | Prezzo voce: ",
          strongPrezzo,
          " | Totale (Risultato x Prezzo): ",
          strongImporto,
        );

        wrap.append(tableWrap, totP);
        subTd.appendChild(wrap);
        subTr.appendChild(subTd);
        vociBodyEl.appendChild(subTr);
      }
    });
  }

  function chiudiTutteLeVociManuali() {
    vociMmCollapsed.clear();
    voci.forEach((item) => {
      const isVoceManuale = normalizzaTipoMisuraVoce(item.tipoMisura) === TIPOMISURA_VOCE_MANUALE;
      if (isVoceManuale) vociMmCollapsed.add(item.idVoce);
    });
    renderVoci();
  }

  function apriTutteLeVociManuali() {
    vociMmCollapsed.clear();
    renderVoci();
  }

  function evalFormulaValue(inputFormula) {
    const txt = inputFormula.trim();
    if (!txt) return null;
    const normalized = txt.replaceAll(",", ".");
    if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return null;
    try {
      const result = Function(`"use strict"; return (${normalized});`)();
      if (typeof result !== "number" || !Number.isFinite(result)) return null;
      return result;
    } catch {
      return null;
    }
  }

  function openFormulaDialog(targetInputEl) {
    formulaDialogTextEl.value = targetInputEl.value || "";
    formulaDialogEl.dataset.target = targetInputEl.id;
    formulaDialogEl.showModal();
    setTimeout(() => formulaDialogTextEl.focus(), 0);
  }

  function updateFormulaButtonState(inputEl, buttonEl) {
    if (!inputEl || !buttonEl) return;
    const hasFormula = inputEl.value.trim() !== "";
    buttonEl.textContent = hasFormula ? "MODIFICA" : "INSERISCI";
    buttonEl.classList.toggle("state-modifica", hasFormula);
    buttonEl.classList.toggle("state-inserisci", !hasFormula);
  }

  function calcolaAreaScavo(misura1, misura2, formulaValue) {
    const fattori = [misura1, misura2, formulaValue].filter((v) => v !== null);
    if (fattori.length === 0) return 0;
    return Number(fattori.reduce((acc, v) => acc * v, 1).toFixed(2));
  }

  function applySegno(valore, sottrai) {
    return sottrai ? -Math.abs(valore) : valore;
  }

  function calcolaVolume(area, altezzaOrNull) {
    const fattore = altezzaOrNull === null ? 1 : altezzaOrNull;
    return Number((area * fattore).toFixed(2));
  }

  function timestampExport() {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveFileWithPickerOrDownload(
    filename,
    content,
    mimeType,
    dialogFilters = [],
  ) {
    const blob = new Blob([content], { type: mimeType });
    // Priorita': dialog nativo Tauri (Windows "Salva con nome")
    try {
      const tauriDialogSave = window.__TAURI__?.dialog?.save;
      const tauriInvoke = window.__TAURI__?.core?.invoke;
      if (typeof tauriDialogSave === "function" && typeof tauriInvoke === "function") {
        const selectedPath = await tauriDialogSave({
          defaultPath: filename,
          filters: dialogFilters,
        });
        if (selectedPath === null) return false;
        await tauriInvoke("write_export_file", { path: selectedPath, content });
        return true;
      }
    } catch {
      // fallback su API web/picker
    }

    if ("showSaveFilePicker" in window && typeof window.showSaveFilePicker === "function") {
      try {
        const normalizedFilters = Array.isArray(dialogFilters) ? dialogFilters : [];
        const firstFilter = normalizedFilters[0];
        const extension =
          firstFilter?.extensions?.[0] || (filename.includes(".") ? filename.split(".").pop() : "");
        const description =
          firstFilter?.name || (extension ? `File ${String(extension).toUpperCase()}` : "File");
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description,
              accept: { [mimeType]: extension ? [`.${String(extension).replace(/^\./, "")}`] : [".txt"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (error) {
        if (error && typeof error === "object" && error.name === "AbortError") {
          return false;
        }
        // fallback su download classico
      }
    }
    downloadBlob(filename, blob);
    return true;
  }

  async function blobToByteArray(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(arrayBuffer));
  }

  async function openPathWithSystem(path) {
    try {
      const tauriInvoke = window.__TAURI__?.core?.invoke;
      if (typeof tauriInvoke === "function") {
        await tauriInvoke("open_file_with_system", { path });
        return true;
      }
    } catch (error) {
      console.warn("Apertura file via comando Rust non riuscita:", error);
    }

    try {
      const tauriOpener = window.__TAURI__?.opener;
      if (tauriOpener && typeof tauriOpener.openPath === "function") {
        await tauriOpener.openPath(path);
        return true;
      }
      if (tauriOpener && typeof tauriOpener.openUrl === "function") {
        await tauriOpener.openUrl(path);
        return true;
      }
    } catch (error) {
      console.warn("Apertura file con opener non riuscita:", error);
    }
    return false;
  }

  function pathToFileUrl(path) {
    const normalized = String(path || "").replaceAll("\\", "/");
    return `file:///${normalized.replace(/^\/+/, "")}`;
  }

  function fileNameFromPath(path) {
    const normalized = String(path || "").trim().replaceAll("\\", "/");
    if (!normalized) return "model.ifc";
    const parts = normalized.split("/");
    return parts[parts.length - 1] || "model.ifc";
  }

  async function openPdfTempThenAskSave(blob, fileName, dialogFilters) {
    try {
      const tauriInvoke = window.__TAURI__?.core?.invoke;
      const tauriOpener = window.__TAURI__?.opener;
      if (typeof tauriInvoke !== "function") {
        return { ok: false, reason: "API invoke Tauri non disponibile." };
      }
      const bytes = await blobToByteArray(blob);
      const tempPath = await tauriInvoke("write_temp_export_file_bytes", { fileName, bytes });
      let opened = await openPathWithSystem(tempPath);
      if (!opened && tauriOpener && typeof tauriOpener.openUrl === "function") {
        try {
          await tauriOpener.openUrl(pathToFileUrl(tempPath));
          opened = true;
        } catch (_) {
          opened = false;
        }
      }
      if (!opened && tauriOpener && typeof tauriOpener.revealItemInDir === "function") {
        try {
          await tauriOpener.revealItemInDir(tempPath);
        } catch (_) {
          // ignora: servirà solo per supporto
        }
      }
      if (!opened) {
        return {
          ok: false,
          reason: `File temporaneo creato ma apertura automatica non riuscita.\nPercorso: ${tempPath}`,
        };
      }

      return { ok: true };
    } catch (error) {
      console.warn("Apertura anteprima PDF temporanea non riuscita:", error);
      return {
        ok: false,
        reason: `Anteprima non disponibile: ${error && error.message ? error.message : String(error)}`,
      };
    }
  }

  async function saveBlobWithPickerOrDownload(
    filename,
    blob,
    mimeType,
    dialogFilters = [],
    options = {},
  ) {
    const openAfterSave = options?.openAfterSave === true;

    // Priorita': dialog nativo Tauri + scrittura bytes via Rust.
    try {
      const tauriDialogSave = window.__TAURI__?.dialog?.save;
      const tauriInvoke = window.__TAURI__?.core?.invoke;
      if (typeof tauriDialogSave === "function" && typeof tauriInvoke === "function") {
        const selectedPath = await tauriDialogSave({
          defaultPath: filename,
          filters: dialogFilters,
        });
        if (selectedPath === null) return false;
        const bytes = await blobToByteArray(blob);
        await tauriInvoke("write_export_file_bytes", { path: selectedPath, bytes });
        if (openAfterSave) {
          await openPathWithSystem(selectedPath);
        }
        return true;
      }
    } catch {
      // fallback su API web/picker
    }

    if ("showSaveFilePicker" in window && typeof window.showSaveFilePicker === "function") {
      try {
        const normalizedFilters = Array.isArray(dialogFilters) ? dialogFilters : [];
        const firstFilter = normalizedFilters[0];
        const extension =
          firstFilter?.extensions?.[0] || (filename.includes(".") ? filename.split(".").pop() : "");
        const description =
          firstFilter?.name || (extension ? `File ${String(extension).toUpperCase()}` : "File");
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description,
              accept: { [mimeType]: extension ? [`.${String(extension).replace(/^\./, "")}`] : [".bin"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (error) {
        if (error && typeof error === "object" && error.name === "AbortError") {
          return false;
        }
      }
    }

    downloadBlob(filename, blob);
    return true;
  }

  function escapeXml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function jsonRowsToWorksheetXml(rows) {
    const lines = rows.map((row) => {
      const cells = row.map((cell) => {
        const numLike = typeof cell === "number" && Number.isFinite(cell);
        const type = numLike ? "Number" : "String";
        const value = numLike ? String(cell) : escapeXml(cell);
        return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
      });
      return `<Row>${cells.join("")}</Row>`;
    });
    return `<Table>${lines.join("")}</Table>`;
  }

  let jsPdfLoadPromise = null;

  function normalizePdfText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E\u20AC]/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  async function ensureJsPdfLoaded() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    if (!jsPdfLoadPromise) {
      jsPdfLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/vendor/jspdf.umd.min.js";
        script.async = true;
        script.onload = () => {
          if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
          else reject(new Error("jsPDF caricato ma API non trovata."));
        };
        script.onerror = () => reject(new Error("Impossibile caricare jsPDF locale da /vendor."));
        document.head.appendChild(script);
      });
    }
    return jsPdfLoadPromise;
  }

  async function openVociPdf(options = {}) {
    const showPrices = options.showPrices !== false;
    const JsPDF = await ensureJsPdfLoaded();
    const doc = new JsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 12;
    const marginRight = 12;
    const marginTop = 12;
    const marginBottom = 12;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const gapAfterVoce = 2.6;
    const voceFontSize = 10;
    const voceLineH = 5.4;
    const detailFontSize = 9;
    const detailLineH = 4.9;
    const totalFontSize = 10;
    const voceColW = contentWidth * 0.32;
    const leftTextX = marginLeft + 8;
    const rightX = marginLeft + contentWidth * 0.56;
    const resultRightX = rightX + 12;
    const signX = resultRightX + 1.8;
    const partiUgualiX = rightX - 30;
    const prezzoRightX = rightX + 52;
    const totaleRightX = rightX + 84;
    const headerFontSize = 10;
    const headerBaselineY = marginTop + 3.8;
    const headerContentStartY = marginTop + 10;
    const headerPartiX = partiUgualiX;
    const headerQuantitaX = resultRightX;
    const headerPrezzoX = prezzoRightX;
    const headerTotaleX = totaleRightX;
    let y = headerContentStartY;

    const drawText = (x, yTop, text, bold = false, size = detailFontSize) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.text(normalizePdfText(text), x, yTop);
    };
    const drawTextRight = (x, yTop, text, bold = false, size = detailFontSize) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.text(normalizePdfText(text), x, yTop, { align: "right" });
    };

    const drawPageHeader = () => {
      drawText(marginLeft, headerBaselineY, "N.", false, headerFontSize);
      drawText(leftTextX, headerBaselineY, "DESCRIZIONE VOCE", false, headerFontSize);
      drawText(headerPartiX, headerBaselineY, "Parti Uguali", false, headerFontSize);
      drawTextRight(headerQuantitaX, headerBaselineY, "Quantita", false, headerFontSize);
      drawTextRight(headerPrezzoX, headerBaselineY, "Prezzo", false, headerFontSize);
      drawTextRight(headerTotaleX, headerBaselineY, "TOTALE", false, headerFontSize);
    };

    const drawJustifiedLine = (x, yTop, width, line, isLastLine, fontSize) => {
      const words = line.split(" ").filter((w) => w.trim() !== "");
      if (words.length <= 1 || isLastLine) {
        drawText(x, yTop, line, false, fontSize);
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      const wordsWidth = words.reduce((acc, w) => acc + doc.getTextWidth(w), 0);
      const freeSpace = Math.max(0, width - wordsWidth);
      const gaps = words.length - 1;
      const gap = gaps > 0 ? freeSpace / gaps : 0;
      let cx = x;
      words.forEach((w, i) => {
        doc.text(w, cx, yTop);
        cx += doc.getTextWidth(w) + (i < words.length - 1 ? gap : 0);
      });
    };

    const drawJustifiedParagraph = (text, x, yTop, width, fontSize, lineHeight) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(normalizePdfText(text), width);
      lines.forEach((line, idx) => {
        ensureSpace(lineHeight);
        drawJustifiedLine(x, y + 4, width, line, idx === lines.length - 1, fontSize);
        y += lineHeight;
      });
      return lines.length;
    };

    const ensureSpace = (needed) => {
      if (y + needed <= pageHeight - marginBottom) return;
      doc.addPage();
      drawPageHeader();
      y = headerContentStartY;
    };
    const fmtRis = (value) =>
      Number(value || 0).toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    const fmtEuroAmount = (value) =>
      Number(value || 0).toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const voices = [...voci].sort((a, b) => a.posizione - b.posizione || a.idVoce - b.idVoce);
    let totaleComplessivoComputo = 0;
    drawPageHeader();
    if (voices.length === 0) {
      drawText(marginLeft, y + 6, "Nessuna voce disponibile.", true, voceFontSize);
    } else {
      voices.forEach((item) => {
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali);
        const grouped = new Map();
        mm.forEach((m) => {
          const piano = (m.piano || "-").trim() || "-";
          const rif = (m.riferimento || "-").trim() || "-";
          if (!grouped.has(piano)) grouped.set(piano, new Map());
          const rifMap = grouped.get(piano);
          if (!rifMap.has(rif)) rifMap.set(rif, []);
          rifMap.get(rif).push(m);
        });

        ensureSpace(voceLineH);
        drawText(marginLeft, y + 4, `${item.posizione})`, false, voceFontSize);
        drawJustifiedParagraph(item.voce || "-", leftTextX, y + 4, voceColW, voceFontSize, voceLineH);
        y += gapAfterVoce;

        grouped.forEach((rifMap, piano) => {
          let sumPiano = 0;
          ensureSpace(detailLineH);
          drawText(leftTextX, y + 3.8, `PIANO: ${piano}`, false, detailFontSize);
          y += detailLineH;
          rifMap.forEach((rows, rif) => {
            let sumRif = 0;
            ensureSpace(detailLineH);
            drawText(leftTextX, y + 3.8, `RIFERIMENTO: ${rif}`, false, detailFontSize);
            y += detailLineH;
            rows.forEach((m) => {
              ensureSpace(detailLineH);
              const detailLine = `${m.formula || "-"};`;
              drawText(leftTextX, y + 3.8, detailLine, false, detailFontSize);
              drawText(partiUgualiX, y + 3.8, String(m.numero), false, detailFontSize);
              drawTextRight(resultRightX, y + 3.8, fmtRis(m.risultato), false, detailFontSize);
              drawText(signX, y + 3.8, m.segno ? "-" : "+", false, detailFontSize);
              y += detailLineH;
              const rv = Number(m.risultato || 0);
              sumRif += rv;
              sumPiano += rv;
            });
            ensureSpace(detailLineH);
            drawText(leftTextX, y + 3.8, `Totale ${rif}`, false, detailFontSize);
            drawTextRight(resultRightX, y + 3.8, fmtRis(sumRif), false, detailFontSize);
            y += detailLineH;
          });
          ensureSpace(detailLineH);
          drawText(leftTextX, y + 3.8, `Totale ${piano}`, false, detailFontSize);
          drawTextRight(resultRightX, y + 3.8, fmtRis(sumPiano), false, detailFontSize);
          y += detailLineH;
        });

        const sumMm = mm.reduce((acc, m) => acc + Number(m.risultato || 0), 0);
        const prezzo = parseNonNegativeDecimal2(item.prezzo) ?? 0;
        totaleComplessivoComputo += sumMm * prezzo;
        ensureSpace(detailLineH + 4.5);
        drawText(
          leftTextX,
          y + 4.2,
          `TOTALE VOCE (${(item.unitaMisura || "-").trim() || "-"})`,
          true,
          totalFontSize,
        );
        drawTextRight(resultRightX, y + 4.2, fmtRis(sumMm), true, totalFontSize);
        if (showPrices) {
          drawTextRight(prezzoRightX, y + 4.2, `€. ${fmtEuroAmount(prezzo)}`, true, totalFontSize);
          drawTextRight(totaleRightX, y + 4.2, `€. ${fmtEuroAmount(sumMm * prezzo)}`, true, totalFontSize);
        } else {
          drawTextRight(prezzoRightX, y + 4.2, "__________", true, totalFontSize);
          drawTextRight(totaleRightX, y + 4.2, "__________", true, totalFontSize);
        }
        y += detailLineH + 4.5;
      });

      if (showPrices) {
        ensureSpace(detailLineH + 7);
        drawText(leftTextX, y + 4.2, "TOTALE COMPLESSIVO COMPUTO", true, totalFontSize + 0.5);
        drawTextRight(
          totaleRightX,
          y + 4.2,
          `€. ${fmtEuroAmount(totaleComplessivoComputo)}`,
          true,
          totalFontSize + 0.5,
        );
        y += detailLineH + 5.5;
      }
    }

    // Pie' pagina con numerazione: "Pag. X di Y"
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      drawTextRight(
        pageWidth - marginRight,
        pageHeight - 4.5,
        `Pag. ${page} di ${totalPages}`,
        false,
        9,
      );
    }

    const fileName = showPrices
      ? `voci_layout_${timestampExport()}.pdf`
      : `voci_layout_solo_quantita_${timestampExport()}.pdf`;
    const blob = doc.output("blob");
    const pdfFilters = [{ name: "PDF", extensions: ["pdf"] }];
    const previewResult = await openPdfTempThenAskSave(blob, fileName, pdfFilters);
    if (!previewResult.ok) {
      if (previewResult.reason) {
        window.alert(previewResult.reason);
      }
      await saveBlobWithPickerOrDownload(fileName, blob, "application/pdf", pdfFilters, {
        openAfterSave: true,
      });
    }
  }

  function buildExportData() {
    const pianiRows = [
      ["IDPIANO", "TIPOLOGIA", "EDIFICIO", "PIANO"],
      ...piani.map((item) => [item.id, item.tipologia, item.edificio, item.piano]),
    ];

    const mapPiani = new Map(piani.map((p) => [p.id, `${p.tipologia} - ${p.piano}`]));
    const muriRows = [
      ["IDELEVAZIONE", "IDPIANO", "PIANO", "RIFERIMENTO", "SPESSORE"],
      ...murielevazioni.map((item) => [
        item.idElevazione,
        item.idPiano,
        mapPiani.get(item.idPiano) || "",
        item.riferimento || "",
        item.spessore,
      ]),
    ];

    const stratiRows = [
      ["IDSTRATOMUR", "IDELEVAZIONE", "IDSTRATO", "LUNGHEZZA", "ALTEZZA", "SPESSORE", "IDVOCECAPITOLATO"],
      ...stratiMurElevazione.map((item) => [
        item.idStratoMur,
        item.idElevazione,
        item.idStrato,
        item.lunghezza,
        item.altezza,
        item.spessore,
        item.idVoceCapitolato || "",
      ]),
    ];

    const apertureRows = [
      [
        "IDAPERTURAELEV",
        "IDELEVAZIONE",
        "LOCALE",
        "LUNGHEZZA",
        "ALTEZZA",
        "ANTE",
        "TIPOLOGIA",
        "FALSOTELAI",
        "H_DAVANZALE",
        "IDVOCECAPITOLATO",
      ],
      ...apertureElevazione.map((item) => [
        item.idAperturaElev,
        item.idElevazione,
        item.locale,
        item.lunghezza,
        item.altezza,
        item.ante,
        item.tipologia,
        item.falsotelai ? "SI" : "NO",
        item.hDavanzale,
        item.idVoceCapitolato || "",
      ]),
    ];

    const scavoRows = [
      ["IDPLSCAVO", "PIANO", "RIFERIMENTO", "SOTTRAI", "MISURA1", "MISURA2", "FORMULA", "AREA", "ALTEZZA", "VOLUME", "IDVOCE"],
      ...scaviEsterni.map((item) => [
        item.idPlScavo,
        item.piano,
        item.riferimento,
        item.sottrai ? "SI" : "NO",
        item.misura1 ?? "",
        item.misura2 ?? "",
        item.formula || "",
        item.area,
        item.altezza ?? "",
        item.volume,
        item.idVoce || "",
      ]),
    ];

    const corselloRows = [
      ["IDPLCORS", "PIANO", "RIFERIMENTO", "SOTTRAI", "MISURA1", "MISURA2", "FORMULA", "AREA", "SPESSORE", "VOLUME", "IDVOCE"],
      ...corselliEsterni.map((item) => [
        item.idPlCors,
        item.piano,
        item.riferimento,
        item.sottrai ? "SI" : "NO",
        item.misura1 ?? "",
        item.misura2 ?? "",
        item.formula || "",
        item.area,
        item.altezza ?? "",
        item.volume,
        item.idVoce || "",
      ]),
    ];

    const camminamentiRows = [
      ["IDPLCAMM", "PIANO", "RIFERIMENTO", "SOTTRAI", "MISURA1", "MISURA2", "FORMULA", "AREA", "SPESSORE", "VOLUME", "IDVOCE"],
      ...camminamentiEsterni.map((item) => [
        item.idPlCamm,
        item.piano,
        item.riferimento,
        item.sottrai ? "SI" : "NO",
        item.misura1 ?? "",
        item.misura2 ?? "",
        item.formula || "",
        item.area,
        item.altezza ?? "",
        item.volume,
        item.idVoce || "",
      ]),
    ];

    const misurazioniRows = [
      [
        "IDMISURAZIONE",
        "IDVOCE",
        "PIANO",
        "RIFERIMENTO",
        "FORMULA",
        "VALORE_FORMULA",
        "NUMERO",
        "SEGNO",
        "RISULTATO",
      ],
      ...misurazioniVarie.map((item) => [
        item.idMisurazione,
        item.idVoce || "",
        item.piano || "",
        item.riferimento || "",
        item.formula || "",
        item.formulaValue ?? "",
        item.numero,
        item.segno ? "SI" : "NO",
        item.risultato,
      ]),
    ];

    const vociRows = [
      ["IDVOCE", "POSIZIONE", "VOCE", "", "SEGNO", "FORMULA", "NUMERO", "UNITA'", "QUANTITA", "PREZZO_EUR", "TOTALE"],
    ];
    [...voci]
      .sort((a, b) => a.posizione - b.posizione || a.idVoce - b.idVoce)
      .forEach((item) => {
        const unita = (item.unitaMisura || "").trim();
        const prezzo = parseNonNegativeDecimal2(item.prezzo) ?? 0;
        vociRows.push([
          item.idVoce,
          item.posizione,
          item.voce,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali);
        const groupedByPiano = new Map();
        mm.forEach((m) => {
          const piano = (m.piano || "-").trim() || "-";
          const rif = (m.riferimento || "-").trim() || "-";
          if (!groupedByPiano.has(piano)) groupedByPiano.set(piano, new Map());
          const rifMap = groupedByPiano.get(piano);
          if (!rifMap.has(rif)) rifMap.set(rif, []);
          rifMap.get(rif).push(m);
        });

        let sumVoce = 0;
        groupedByPiano.forEach((rifMap, piano) => {
          vociRows.push(["", "", "", "PIANO", piano, "", "", "", "", "", ""]);
          let sumPiano = 0;
          rifMap.forEach((rows, rif) => {
            rows.forEach((m, idx) => {
              vociRows.push([
                "",
                "",
                "",
                idx === 0 ? "RIFERIMENTO" : "",
                idx === 0 ? rif : "",
                m.segno ? "-" : "+",
                m.formula || "",
                m.numero,
                "",
                Number(m.risultato || 0),
                "",
              ]);
              sumPiano += Number(m.risultato || 0);
              sumVoce += Number(m.risultato || 0);
            });
          });
          vociRows.push([
            "",
            "",
            "",
            `TOTALE QUANTITA PIANO ${piano}`,
            "",
            "",
            "",
            unita,
            Number(sumPiano.toFixed(3)),
            "",
            "",
          ]);
        });

        vociRows.push([
          "",
          "",
          "",
          "TOTALE QUANTITA VOCE",
          "",
          "",
          "",
          unita,
          Number(sumVoce.toFixed(3)),
          Number(prezzo.toFixed(2)),
          Number((sumVoce * prezzo).toFixed(2)),
        ]);
        vociRows.push(["", "", "", "", "", "", "", "", "", "", ""]);
      });

    return {
      pianiRows,
      muriRows,
      stratiRows,
      apertureRows,
      scavoRows,
      corselloRows,
      camminamentiRows,
      misurazioniRows,
      vociRows,
    };
  }

  async function loadIfcWithViewerFile(file, linkedPath = "") {
    const viewer = await ensureBimViewer();
    if (!viewer) {
      throw new Error("Viewer BIM non disponibile in questa configurazione.");
    }
    const data = await viewer.loadIfcFile(file);
    if (data && typeof data === "object") {
      if (!data.source || typeof data.source !== "object") data.source = {};
      if (linkedPath) data.source.linkedPath = linkedPath;
      data.source.fileName = data.source.fileName || file?.name || fileNameFromPath(linkedPath);
    }
    ifcDataCache = data;
    saveIfcData();
    return data;
  }

  async function loadIfcFromLinkedPath(ifcPath) {
    const tauriInvoke = window.__TAURI__?.core?.invoke;
    if (typeof tauriInvoke !== "function") {
      throw new Error("API invoke Tauri non disponibile.");
    }
    const fileName = fileNameFromPath(ifcPath);
    const bytes = await tauriInvoke("read_file_bytes", { path: ifcPath });
    const uint8 = new Uint8Array(Array.isArray(bytes) ? bytes : []);
    const file = new File([uint8], fileName, { type: "application/octet-stream" });
    return loadIfcWithViewerFile(file, ifcPath);
  }

  async function exportJson() {
    const ifcLink =
      ifcDataCache?.source?.linkedPath && typeof ifcDataCache.source.linkedPath === "string"
        ? {
            path: ifcDataCache.source.linkedPath,
            fileName: String(ifcDataCache?.source?.fileName || fileNameFromPath(ifcDataCache.source.linkedPath)),
            linkedAt:
              typeof ifcDataCache?.source?.loadedAt === "string"
                ? ifcDataCache.source.loadedAt
                : new Date().toISOString(),
          }
        : null;
    const payload = {
      exportedAt: new Date().toISOString(),
      piani,
      murielevazioni,
      stratiMurElevazione,
      apertureElevazione,
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni,
      misurazioniVarie,
      voci,
      vociUnitaMisuraOptions,
      ifcLink,
    };
    const ok = await saveFileWithPickerOrDownload(
      `computo_metrico_export_${timestampExport()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
      [{ name: "JSON", extensions: ["json"] }],
    );
    if (ok) window.alert("Esportazione JSON completata.");
  }

  async function exportIfcJson() {
    if (!ifcDataCache) {
      window.alert("Nessun dato IFC disponibile. Carica prima un file IFC.");
      return;
    }
    const ok = await saveFileWithPickerOrDownload(
      `ifc_dati_completi_${timestampExport()}.json`,
      JSON.stringify(ifcDataCache, null, 2),
      "application/json;charset=utf-8",
      [{ name: "JSON", extensions: ["json"] }],
    );
    if (ok) window.alert("Esportazione dati IFC completata.");
  }

  function aggiungiUnitaIfcSeMancanti() {
    const list = ["n", "kg", "h"];
    let changed = false;
    list.forEach((unit) => {
      if (!vociUnitaMisuraOptions.some((u) => String(u).toLowerCase() === unit.toLowerCase())) {
        vociUnitaMisuraOptions.push(unit);
        changed = true;
      }
    });
    if (changed) saveVociUnitaOptions();
  }

  function importaMisurazioniDaIfc() {
    if (!ifcDataCache || !Array.isArray(ifcDataCache.measurements) || ifcDataCache.measurements.length === 0) {
      window.alert("Nel file IFC non sono presenti misurazioni numeriche utilizzabili.");
      return;
    }

    const conferma = window.confirm(
      `Importare ${ifcDataCache.measurements.length} misurazioni IFC nella sezione MISURAZIONI VARIE?`,
    );
    if (!conferma) return;

    const nuoveMisure = ifcDataCache.measurements
      .filter((m) => typeof m?.value === "number" && Number.isFinite(m.value))
      .map((m) => {
        const roundedValue = Number(Number(m.value).toFixed(2));
        return {
          idMisurazione: misurazioniIdCounter++,
          idVoce: "",
          piano: String(m.ifcType || "IFC"),
          riferimento: String(m.riferimento || `${m.ifcType || "IFC"} | ${m.quantityName || "QUANTITA"}`),
          formula: String(roundedValue),
          formulaValue: roundedValue,
          numero: 1,
          segno: false,
          risultato: roundedValue,
        };
      });

    if (nuoveMisure.length === 0) {
      window.alert("Nessuna misurazione IFC valida trovata.");
      return;
    }

    misurazioniVarie = [...misurazioniVarie, ...nuoveMisure];
    aggiungiUnitaIfcSeMancanti();
    saveMurDati();
    renderMisurazioniVarie();
    window.alert(`Importate ${nuoveMisure.length} misurazioni da IFC.`);
  }

  async function exportXls() {
    const data = buildExportData();
    const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="GESTIONE_PIANI">${jsonRowsToWorksheetXml(data.pianiRows)}</Worksheet>
  <Worksheet ss:Name="MURI_ELEVAZIONE">${jsonRowsToWorksheetXml(data.muriRows)}</Worksheet>
  <Worksheet ss:Name="STRATI_MURI">${jsonRowsToWorksheetXml(data.stratiRows)}</Worksheet>
  <Worksheet ss:Name="APERTURE">${jsonRowsToWorksheetXml(data.apertureRows)}</Worksheet>
  <Worksheet ss:Name="SCAVO">${jsonRowsToWorksheetXml(data.scavoRows)}</Worksheet>
  <Worksheet ss:Name="CORSELLO">${jsonRowsToWorksheetXml(data.corselloRows)}</Worksheet>
  <Worksheet ss:Name="CAMMINAMENTI">${jsonRowsToWorksheetXml(data.camminamentiRows)}</Worksheet>
  <Worksheet ss:Name="MISURAZIONI_VARIE">${jsonRowsToWorksheetXml(data.misurazioniRows)}</Worksheet>
  <Worksheet ss:Name="VOCI">${jsonRowsToWorksheetXml(data.vociRows)}</Worksheet>
</Workbook>`;
    const ok = await saveFileWithPickerOrDownload(
      `computo_metrico_export_${timestampExport()}.xls`,
      workbookXml,
      "application/vnd.ms-excel;charset=utf-8",
      [{ name: "Excel 97-2003", extensions: ["xls"] }],
    );
    if (ok) window.alert("Esportazione XLS completata.");
  }

  async function importComputoFromPayload(payloadRaw) {
    const payload =
      payloadRaw && typeof payloadRaw === "object" && payloadRaw.data && typeof payloadRaw.data === "object"
        ? payloadRaw.data
        : payloadRaw;
    if (!payload || typeof payload !== "object") {
      throw new Error("File non valido.");
    }
    const linkedIfcPath =
      typeof payload?.ifcLink?.path === "string"
        ? payload.ifcLink.path
        : typeof payload?.ifc?.path === "string"
          ? payload.ifc.path
          : "";

    const pianiSource = Array.isArray(payload.piani)
      ? payload.piani
      : Array.isArray(payload.gestionePiani)
        ? payload.gestionePiani
        : [];
    const importedPiani = pianiSource
      ? pianiSource.filter(
          (item) =>
            typeof item?.id === "number" &&
            typeof item?.tipologia === "string" &&
            (typeof item?.edificio === "string" || typeof item?.edificio === "undefined") &&
            typeof item?.piano === "string",
        )
          .map((item) => ({ ...item, edificio: typeof item?.edificio === "string" ? item.edificio : "" }))
      : [];

    const murielevazioniSource = Array.isArray(payload.murielevazioni)
      ? payload.murielevazioni
      : Array.isArray(payload.murielevazione)
        ? payload.murielevazione
        : [];
    const importedMurielevazioni = murielevazioniSource
      ? murielevazioniSource.filter(
          (item) =>
            typeof item?.idElevazione === "number" &&
            typeof item?.idPiano === "number" &&
            (typeof item?.riferimento === "string" || typeof item?.riferimento === "undefined") &&
            (typeof item?.spessore === "number" || typeof item?.spessore === "undefined"),
        )
          .map((item) => ({
            ...item,
            riferimento: typeof item?.riferimento === "string" ? item.riferimento : "",
            spessore: typeof item?.spessore === "number" ? item.spessore : 0,
          }))
      : [];

    const importedStrati = Array.isArray(payload.stratiMurElevazione)
      ? payload.stratiMurElevazione.filter(
          (item) =>
            typeof item?.idStratoMur === "number" &&
            typeof item?.idElevazione === "number" &&
            typeof item?.idStrato === "string" &&
            typeof item?.lunghezza === "number" &&
            typeof item?.altezza === "number" &&
            typeof item?.spessore === "number" &&
            typeof item?.idVoceCapitolato === "string",
        )
      : [];

    const importedAperture = Array.isArray(payload.apertureElevazione)
      ? payload.apertureElevazione.filter(
          (item) =>
            typeof item?.idAperturaElev === "number" &&
            typeof item?.idElevazione === "number" &&
            typeof item?.locale === "string" &&
            typeof item?.lunghezza === "number" &&
            typeof item?.altezza === "number" &&
            typeof item?.ante === "number" &&
            typeof item?.tipologia === "string" &&
            typeof item?.falsotelai === "boolean" &&
            typeof item?.hDavanzale === "number" &&
            typeof item?.idVoceCapitolato === "string",
        )
      : [];

    const importedScavi = Array.isArray(payload.scaviEsterni)
      ? payload.scaviEsterni
          .filter(
            (item) =>
              typeof item?.idPlScavo === "number" &&
              typeof item?.piano === "string" &&
              typeof item?.riferimento === "string" &&
              (typeof item?.sottrai === "boolean" || typeof item?.sottrai === "undefined") &&
              (typeof item?.misura1 === "number" || item?.misura1 === null) &&
              (typeof item?.misura2 === "number" || item?.misura2 === null) &&
              typeof item?.formula === "string" &&
              (typeof item?.formulaValue === "number" || item?.formulaValue === null) &&
              (typeof item?.altezza === "number" || item?.altezza === null) &&
              typeof item?.area === "number" &&
              typeof item?.volume === "number" &&
              typeof item?.idVoce === "string",
          )
          .map((item) => ({ ...item, sottrai: item.sottrai === true }))
      : [];

    const importedCorselli = Array.isArray(payload.corselliEsterni)
      ? payload.corselliEsterni
          .filter(
            (item) =>
              typeof item?.idPlCors === "number" &&
              typeof item?.piano === "string" &&
              typeof item?.riferimento === "string" &&
              (typeof item?.sottrai === "boolean" || typeof item?.sottrai === "undefined") &&
              (typeof item?.misura1 === "number" || item?.misura1 === null) &&
              (typeof item?.misura2 === "number" || item?.misura2 === null) &&
              typeof item?.formula === "string" &&
              (typeof item?.formulaValue === "number" || item?.formulaValue === null) &&
              (typeof item?.altezza === "number" || item?.altezza === null) &&
              typeof item?.area === "number" &&
              typeof item?.volume === "number" &&
              typeof item?.idVoce === "string",
          )
          .map((item) => ({ ...item, sottrai: item.sottrai === true }))
      : [];

    const importedCamminamenti = Array.isArray(payload.camminamentiEsterni)
      ? payload.camminamentiEsterni
          .filter(
            (item) =>
              typeof item?.idPlCamm === "number" &&
              typeof item?.piano === "string" &&
              typeof item?.riferimento === "string" &&
              (typeof item?.sottrai === "boolean" || typeof item?.sottrai === "undefined") &&
              (typeof item?.misura1 === "number" || item?.misura1 === null) &&
              (typeof item?.misura2 === "number" || item?.misura2 === null) &&
              typeof item?.formula === "string" &&
              (typeof item?.formulaValue === "number" || item?.formulaValue === null) &&
              (typeof item?.altezza === "number" || item?.altezza === null) &&
              typeof item?.area === "number" &&
              typeof item?.volume === "number" &&
              typeof item?.idVoce === "string",
          )
          .map((item) => ({ ...item, sottrai: item.sottrai === true }))
      : [];

    const misurazioniSource = Array.isArray(payload.misurazioniVarie)
      ? payload.misurazioniVarie
      : Array.isArray(payload.misurazioni)
        ? payload.misurazioni
        : [];
    const importedMisurazioni = misurazioniSource
      ? misurazioniSource
          .filter(
            (item) =>
              typeof item?.idMisurazione === "number" &&
              (typeof item?.idVoce === "string" || typeof item?.idVoce === "number") &&
              typeof item?.formula === "string" &&
              (typeof item?.formulaValue === "number" || item?.formulaValue === null) &&
              typeof item?.numero === "number" &&
              Number.isInteger(item.numero) &&
              typeof item?.segno === "boolean" &&
              typeof item?.risultato === "number" &&
            Number.isFinite(item.risultato) &&
              (typeof item?.piano === "string" ||
                typeof item?.riferimento === "string" ||
                typeof item?.tipo === "string"),
          )
          .map((item) => {
            const piano = typeof item?.piano === "string" ? item.piano : "";
            const riferimento =
              typeof item?.riferimento === "string"
                ? item.riferimento
                : typeof item?.tipo === "string"
                  ? item.tipo
                  : "";
            return {
              idMisurazione: item.idMisurazione,
              idVoce: String(item.idVoce ?? ""),
              piano,
              riferimento,
              formula: item.formula,
              formulaValue: item.formulaValue,
              numero: item.numero,
              segno: item.segno === true,
              risultato: item.risultato,
            };
          })
      : [];

    const vociSource = Array.isArray(payload.voci)
      ? payload.voci
      : Array.isArray(payload.elencoVoci)
        ? payload.elencoVoci
        : [];
    const importedVociRaw = vociSource
      ? vociSource.filter(
          (item) =>
            typeof item?.idVoce === "number" &&
            typeof item?.posizione === "number" &&
            typeof item?.voce === "string",
        )
      : [];
    const importedVoci = importedVociRaw.map((item) => ({
      idVoce: item.idVoce,
      posizione: item.posizione,
      voceAbbreviata: typeof item?.voceAbbreviata === "string" ? item.voceAbbreviata : "",
      unitaMisura:
        typeof item?.unitaMisura === "string" && item.unitaMisura.trim() !== ""
          ? item.unitaMisura.trim()
          : UNITA_MISURA_DEFAULT_OPTIONS[0],
      prezzo: parseNonNegativeDecimal2(item?.prezzo) ?? 0,
      tipoMisura: normalizzaTipoMisuraVoce(
        item?.tipoMisura ?? item?.tipomisura ?? item?.TIPOMISURA,
      ),
      misurazioniManuali: normalizzaMisurazioniManualiVoce(item.misurazioniManuali),
      voce: item.voce,
      note: typeof item?.note === "string" ? item.note : "",
    }));

    const importedUnita = Array.isArray(payload.vociUnitaMisuraOptions)
      ? payload.vociUnitaMisuraOptions
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      : [];

    piani = importedPiani;
    murielevazioni = importedMurielevazioni;
    stratiMurElevazione = importedStrati;
    apertureElevazione = importedAperture;
    scaviEsterni = importedScavi;
    corselliEsterni = importedCorselli;
    camminamentiEsterni = importedCamminamenti;
    misurazioniVarie = importedMisurazioni;
    voci = importedVoci;

    const uniqueUnita = [];
    [...UNITA_MISURA_DEFAULT_OPTIONS, ...importedUnita, ...voci.map((v) => v.unitaMisura)].forEach(
      (item) => {
        if (!uniqueUnita.some((u) => u.toLowerCase() === item.toLowerCase())) uniqueUnita.push(item);
      },
    );
    vociUnitaMisuraOptions = uniqueUnita;

    pianoIdCounter = piani.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    elevazioneIdCounter =
      murielevazioni.reduce((max, item) => Math.max(max, item.idElevazione), 0) + 1;
    stratoMurIdCounter =
      stratiMurElevazione.reduce((max, item) => Math.max(max, item.idStratoMur), 0) + 1;
    aperturaElevIdCounter =
      apertureElevazione.reduce((max, item) => Math.max(max, item.idAperturaElev), 0) + 1;
    scavoIdCounter = scaviEsterni.reduce((max, item) => Math.max(max, item.idPlScavo), 0) + 1;
    corselloIdCounter = corselliEsterni.reduce((max, item) => Math.max(max, item.idPlCors), 0) + 1;
    camminamentiIdCounter =
      camminamentiEsterni.reduce((max, item) => Math.max(max, item.idPlCamm), 0) + 1;
    misurazioniIdCounter =
      misurazioniVarie.reduce((max, item) => Math.max(max, item.idMisurazione), 0) + 1;
    voceIdCounter = voci.reduce((max, item) => Math.max(max, item.idVoce), 0) + 1;

    normalizzaPosizioniVoci();
    editingPianoId = null;
    editingStratoMurId = null;
    editingAperturaElevId = null;
    editingScavoId = null;
    editingCorselloId = null;
    editingCamminamentiId = null;
    editingMisurazioneId = null;
    editingVoceId = null;

    const pianiValidIds = new Set(piani.map((item) => item.id));
    if (compilazionePianoId !== null && !pianiValidIds.has(compilazionePianoId)) {
      compilazionePianoId = null;
    }
    const elevazioniValidIds = new Set(murielevazioni.map((item) => item.idElevazione));
    if (currentElevazioneId !== null && !elevazioniValidIds.has(currentElevazioneId)) {
      currentElevazioneId = null;
    }
    if (murFiltroSoloIdElevazione !== null && !elevazioniValidIds.has(murFiltroSoloIdElevazione)) {
      murFiltroSoloIdElevazione = null;
    }

    savePiani();
    saveMurDati();
    saveVoci();
    saveVociUnitaOptions();

    setPianoFormMode();
    setStratiFormMode();
    setAperturaFormMode();
    setScavoFormMode();
    setCorselloFormMode();
    setCamminamentiFormMode();
    setMisurazioniFormMode();
    resetVoceForm();
    renderVociUnitaOptions();
    renderPiani();
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    renderScavi();
    renderCorselli();
    renderCamminamenti();
    renderMisurazioniVarie();
    renderVoci();

    let ifcAutoLoaded = false;
    let ifcAutoLoadMessage = "";
    if (linkedIfcPath) {
      try {
        await loadIfcFromLinkedPath(linkedIfcPath);
        ifcAutoLoaded = true;
      } catch (error) {
        ifcAutoLoaded = false;
        ifcAutoLoadMessage =
          `Impossibile caricare automaticamente IFC collegato (${linkedIfcPath}). ` +
          `Puoi ricaricarlo con "IMPORTA FILE IFC".` +
          (error && error.message ? ` Dettaglio: ${error.message}` : "");
      }
    }
    return { ifcLinkedPath: linkedIfcPath, ifcAutoLoaded, ifcAutoLoadMessage };
  }

  function renderPiani() {
    pianiBodyEl.innerHTML = "";
    if (piani.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.className = "empty-cell";
      cell.textContent = "Nessun piano inserito.";
      row.appendChild(cell);
      pianiBodyEl.appendChild(row);
      return;
    }

    piani.forEach((item) => {
      const row = document.createElement("tr");
      if (item.tipologia === "Interrato" && compilazionePianoId === item.id) {
        row.classList.add("row-compilazione-attiva");
      }
      row.appendChild(createCell(String(item.id)));
      row.appendChild(createCell(item.tipologia));
      row.appendChild(createCell(item.edificio));
      row.appendChild(createCell(item.piano));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const compilaButton = document.createElement("button");
      compilaButton.type = "button";
      compilaButton.className = "btn-action btn-compila";
      compilaButton.dataset.action = "compila-piano";
      compilaButton.dataset.id = String(item.id);
      compilaButton.textContent = "Compila";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-piano";
      editButton.dataset.id = String(item.id);
      editButton.textContent = "Modifica";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-piano";
      deleteButton.dataset.id = String(item.id);
      deleteButton.textContent = "Elimina";

      actionsCell.append(compilaButton, editButton, deleteButton);
      row.appendChild(actionsCell);
      pianiBodyEl.appendChild(row);
    });
  }

  function renderMurielevazioni() {
    murEleBodyEl.innerHTML = "";
    const totaleElevazioniPiano =
      compilazionePianoId === null
        ? 0
        : murielevazioni.filter((e) => e.idPiano === compilazionePianoId).length;
    countMurielevazioniEl.textContent = `(${totaleElevazioniPiano})`;
    if (compilazionePianoId === null) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "empty-cell";
      cell.textContent = "—";
      row.appendChild(cell);
      murEleBodyEl.appendChild(row);
      return;
    }

    const listaCompleta = murielevazioni.filter((e) => e.idPiano === compilazionePianoId);
    if (
      murFiltroSoloIdElevazione !== null &&
      !listaCompleta.some((e) => e.idElevazione === murFiltroSoloIdElevazione)
    ) {
      murFiltroSoloIdElevazione = null;
    }

    const lista =
      murFiltroSoloIdElevazione === null
        ? listaCompleta
        : listaCompleta.filter((e) => e.idElevazione === murFiltroSoloIdElevazione);

    if (listaCompleta.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna elevazione per questo piano.";
      row.appendChild(cell);
      murEleBodyEl.appendChild(row);
      return;
    }

    if (lista.length === 0) {
      murFiltroSoloIdElevazione = null;
      renderMurielevazioni();
      return;
    }

    lista.forEach((e) => {
      const row = document.createElement("tr");
      row.classList.add("mur-ele-row-selectable");
      row.dataset.elevazioneId = String(e.idElevazione);
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.setAttribute(
        "aria-label",
        `Elevazione ${e.idElevazione}, seleziona per compilare gli strati`,
      );
      if (currentElevazioneId === e.idElevazione) {
        row.classList.add("row-elevazione-selezionata");
        row.setAttribute("aria-current", "true");
      }
      row.appendChild(createCell(String(e.idElevazione)));

      const rifCell = document.createElement("td");
      rifCell.className = "td-riferimento";
      const rifInput = document.createElement("input");
      rifInput.type = "text";
      rifInput.className = "input-riferimento-elevazione";
      rifInput.placeholder = "Es: prospetto nord";
      rifInput.value = e.riferimento ?? "";
      rifInput.dataset.rifElevazione = String(e.idElevazione);
      rifInput.setAttribute("aria-label", "Riferimento elevazione");
      rifCell.appendChild(rifInput);
      row.appendChild(rifCell);

      const spCell = document.createElement("td");
      spCell.className = "td-riferimento";
      const spInput = document.createElement("input");
      spInput.type = "number";
      spInput.step = "0.01";
      spInput.min = "0";
      spInput.className = "input-spessore-elevazione";
      spInput.placeholder = "0.00";
      spInput.value = fmt2(typeof e.spessore === "number" ? e.spessore : 0);
      spInput.dataset.spessoreElevazione = String(e.idElevazione);
      spInput.setAttribute("aria-label", "Spessore elevazione");
      spCell.appendChild(spInput);
      row.appendChild(spCell);

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const filtraBtn = document.createElement("button");
      filtraBtn.type = "button";
      filtraBtn.className = "btn-action btn-filtra";
      filtraBtn.dataset.action = "filtra-mur-elevazione";
      filtraBtn.dataset.id = String(e.idElevazione);
      filtraBtn.textContent =
        murFiltroSoloIdElevazione === e.idElevazione ? "Mostra tutte" : "Filtra";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-action btn-delete";
      delBtn.dataset.action = "elimina-elevazione";
      delBtn.dataset.id = String(e.idElevazione);
      delBtn.textContent = "Elimina";

      actionsCell.append(filtraBtn, delBtn);
      row.appendChild(actionsCell);
      murEleBodyEl.appendChild(row);
    });
  }

  function renderStrati() {
    stratiMurBodyEl.innerHTML = "";
    updateElevazioneAttivaLabel(
      idElevazioneAttivaEl,
      riferimentoElevazioneAttivaEl,
      currentElevazioneId,
      murielevazioni,
    );
    const totaleStrati =
      currentElevazioneId === null
        ? 0
        : stratiMurElevazione.filter((s) => s.idElevazione === currentElevazioneId).length;
    countStratiEl.textContent = `(${totaleStrati})`;

    try {
      if (compilazionePianoId === null || currentElevazioneId === null) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-cell";
        cell.textContent =
          "Seleziona un'elevazione nella tabella MURIELEVAZIONE (o apri Compila su un piano Interrato).";
        row.appendChild(cell);
        stratiMurBodyEl.appendChild(row);
        return;
      }

      const visibili = stratiMurElevazione.filter((s) => s.idElevazione === currentElevazioneId);
      if (visibili.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-cell";
        cell.textContent = "Nessuno strato per questa elevazione.";
        row.appendChild(cell);
        stratiMurBodyEl.appendChild(row);
        return;
      }

      visibili.forEach((item) => {
        const row = document.createElement("tr");
        row.appendChild(createCell(String(item.idStratoMur)));
        row.appendChild(createCell(String(item.idElevazione)));
        row.appendChild(createCell(item.idStrato));
        row.appendChild(createCell(String(item.lunghezza)));
        row.appendChild(createCell(String(item.altezza)));
        row.appendChild(createCell(String(item.spessore)));
        row.appendChild(createCell(item.idVoceCapitolato || "-"));

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions-cell";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn-action btn-edit";
        editButton.dataset.action = "edit-strato";
        editButton.dataset.id = String(item.idStratoMur);
        editButton.textContent = "Modifica";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn-action btn-delete";
        deleteButton.dataset.action = "delete-strato";
        deleteButton.dataset.id = String(item.idStratoMur);
        deleteButton.textContent = "Elimina";

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        stratiMurBodyEl.appendChild(row);
      });

      const spessoreSomma = visibili.reduce((sum, item) => sum + Number(item.spessore || 0), 0);
      const elevazioneAttiva = murielevazioni.find((e) => e.idElevazione === currentElevazioneId);
      const spessoreElevazione = Number(elevazioneAttiva?.spessore || 0);
      const mismatch = spessoreSomma !== spessoreElevazione;

      const totalRow = document.createElement("tr");
      totalRow.className = mismatch ? "strati-total-row strati-total-error" : "strati-total-row";

      const labelCell = document.createElement("td");
      labelCell.colSpan = 5;
      labelCell.className = "strati-total-label";
      labelCell.textContent = "Totale spessori strati";

      const totaleCell = document.createElement("td");
      totaleCell.className = "strati-total-value";
      totaleCell.textContent = fmt2(spessoreSomma);

      const confrontoCell = document.createElement("td");
      confrontoCell.className = "strati-total-target";
      confrontoCell.textContent = `Spessore MURIELEVAZIONE: ${fmt2(spessoreElevazione)}`;

      const esitoCell = document.createElement("td");
      esitoCell.className = "strati-total-status";
      esitoCell.textContent = mismatch ? "⚠ ERRORE SPESSORE" : "OK";

      totalRow.appendChild(labelCell);
      totalRow.appendChild(totaleCell);
      totalRow.appendChild(confrontoCell);
      totalRow.appendChild(esitoCell);
      stratiMurBodyEl.appendChild(totalRow);
    } finally {
      renderStratiNetti();
      aggiornaSuggerimentoSpessoreStrato();
    }
  }

  function renderStratiNetti() {
    renderStratiNettiModule({
      stratiNettiBodyEl,
      compilazionePianoId,
      currentElevazioneId,
      stratiMurElevazione,
      apertureElevazione,
      createCell,
      fmt2,
      altezzaAperturaInclusaNelloStrato,
    });
  }

  function renderAperture() {
    apertureElevBodyEl.innerHTML = "";
    updateElevazioneAttivaLabel(
      idElevazioneAttivaEl,
      riferimentoElevazioneAttivaEl,
      currentElevazioneId,
      murielevazioni,
    );
    const totaleAperture =
      currentElevazioneId === null
        ? 0
        : apertureElevazione.filter((a) => a.idElevazione === currentElevazioneId).length;
    countApertureEl.textContent = `(${totaleAperture})`;

    try {
      if (compilazionePianoId === null || currentElevazioneId === null) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 11;
        cell.className = "empty-cell";
        cell.textContent =
          "Seleziona un'elevazione nella tabella MURIELEVAZIONE per gestire le aperture.";
        row.appendChild(cell);
        apertureElevBodyEl.appendChild(row);
        return;
      }

      const visibili = apertureElevazione.filter((a) => a.idElevazione === currentElevazioneId);
      if (visibili.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 11;
        cell.className = "empty-cell";
        cell.textContent = "Nessuna apertura per questa elevazione.";
        row.appendChild(cell);
        apertureElevBodyEl.appendChild(row);
        return;
      }

      visibili.forEach((item) => {
        const row = document.createElement("tr");
        row.appendChild(createCell(String(item.idAperturaElev)));
        row.appendChild(createCell(String(item.idElevazione)));
        row.appendChild(createCell(item.locale));
        row.appendChild(createCell(fmt2(item.lunghezza)));
        row.appendChild(createCell(fmt2(item.altezza)));
        row.appendChild(createCell(String(item.ante)));
        row.appendChild(createCell(item.tipologia));
        row.appendChild(createCell(item.falsotelai ? "Si" : "No"));
        row.appendChild(createCell(fmt2(item.hDavanzale)));
        row.appendChild(createCell(item.idVoceCapitolato || "-"));

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions-cell";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn-action btn-edit";
        editButton.dataset.action = "edit-apertura";
        editButton.dataset.id = String(item.idAperturaElev);
        editButton.textContent = "✎";
        editButton.title = "Modifica";
        editButton.setAttribute("aria-label", "Modifica");

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn-action btn-delete btn-delete-icon";
        deleteButton.dataset.action = "delete-apertura";
        deleteButton.dataset.id = String(item.idAperturaElev);
        deleteButton.textContent = "✕";
        deleteButton.title = "Elimina";
        deleteButton.setAttribute("aria-label", "Elimina");

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        apertureElevBodyEl.appendChild(row);
      });
    } finally {
      renderStratiNetti();
    }
  }

  function renderScavi() {
    scavoBodyEl.innerHTML = "";
    const visibili = scaviEsterni;
    countScaviEl.textContent = `(${visibili.length})`;
    const sumArea = visibili.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const sumVolume = visibili.reduce((sum, item) => sum + Number(item.volume || 0), 0);
    sumAreaScaviEl.textContent = `Mq. ${fmt2(sumArea)}`;
    sumVolumeScaviEl.textContent = `Mc. ${fmt2(sumVolume)}`;

    if (visibili.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 11;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna riga SCAVO.";
      row.appendChild(cell);
      scavoBodyEl.appendChild(row);
      return;
    }

    visibili.forEach((item) => {
      const row = document.createElement("tr");
      if (item.sottrai) row.classList.add("row-sottrai");
      row.appendChild(createCell(String(item.idPlScavo)));
      row.appendChild(createCell(item.piano));
      row.appendChild(createCell(item.riferimento));
      row.appendChild(createCell(item.misura1 === null ? "-" : fmt2(item.misura1)));
      row.appendChild(createCell(item.misura2 === null ? "-" : fmt2(item.misura2)));
      row.appendChild(createCell(item.formula || "-"));
      row.appendChild(createCell(fmt2(item.area)));
      row.appendChild(createCell(item.altezza === null ? "-" : fmt2(item.altezza)));
      row.appendChild(createCell(fmt2(item.volume)));
      row.appendChild(createCell(item.idVoce || "-"));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-scavo";
      editButton.dataset.id = String(item.idPlScavo);
      editButton.textContent = "Modifica";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-scavo";
      deleteButton.dataset.id = String(item.idPlScavo);
      deleteButton.textContent = "Elimina";

      actionsCell.append(editButton, deleteButton);
      row.appendChild(actionsCell);
      scavoBodyEl.appendChild(row);
    });
  }

  function renderCorselli() {
    corselloBodyEl.innerHTML = "";
    const visibili = corselliEsterni;
    countCorselliEl.textContent = `(${visibili.length})`;
    const sumArea = visibili.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const sumVolume = visibili.reduce((sum, item) => sum + Number(item.volume || 0), 0);
    sumAreaCorselliEl.textContent = `Mq. ${fmt2(sumArea)}`;
    sumVolumeCorselliEl.textContent = `Mc. ${fmt2(sumVolume)}`;

    if (visibili.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 11;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna riga CORSELLO.";
      row.appendChild(cell);
      corselloBodyEl.appendChild(row);
      return;
    }

    visibili.forEach((item) => {
      const row = document.createElement("tr");
      if (item.sottrai) row.classList.add("row-sottrai");
      row.appendChild(createCell(String(item.idPlCors)));
      row.appendChild(createCell(item.piano));
      row.appendChild(createCell(item.riferimento));
      row.appendChild(createCell(item.misura1 === null ? "-" : fmt2(item.misura1)));
      row.appendChild(createCell(item.misura2 === null ? "-" : fmt2(item.misura2)));
      row.appendChild(createCell(item.formula || "-"));
      row.appendChild(createCell(fmt2(item.area)));
      row.appendChild(createCell(item.altezza === null ? "-" : fmt2(item.altezza)));
      row.appendChild(createCell(fmt2(item.volume)));
      row.appendChild(createCell(item.idVoce || "-"));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-corsello";
      editButton.dataset.id = String(item.idPlCors);
      editButton.textContent = "Modifica";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-corsello";
      deleteButton.dataset.id = String(item.idPlCors);
      deleteButton.textContent = "Elimina";

      actionsCell.append(editButton, deleteButton);
      row.appendChild(actionsCell);
      corselloBodyEl.appendChild(row);
    });
  }

  function renderCamminamenti() {
    camminamentiBodyEl.innerHTML = "";
    const visibili = camminamentiEsterni;
    countCamminamentiEl.textContent = `(${visibili.length})`;
    const sumArea = visibili.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const sumVolume = visibili.reduce((sum, item) => sum + Number(item.volume || 0), 0);
    sumAreaCamminamentiEl.textContent = `Mq. ${fmt2(sumArea)}`;
    sumVolumeCamminamentiEl.textContent = `Mc. ${fmt2(sumVolume)}`;

    if (visibili.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 11;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna riga CAMMINAMENTI.";
      row.appendChild(cell);
      camminamentiBodyEl.appendChild(row);
      return;
    }

    visibili.forEach((item) => {
      const row = document.createElement("tr");
      if (item.sottrai) row.classList.add("row-sottrai");
      row.appendChild(createCell(String(item.idPlCamm)));
      row.appendChild(createCell(item.piano));
      row.appendChild(createCell(item.riferimento));
      row.appendChild(createCell(item.misura1 === null ? "-" : fmt2(item.misura1)));
      row.appendChild(createCell(item.misura2 === null ? "-" : fmt2(item.misura2)));
      row.appendChild(createCell(item.formula || "-"));
      row.appendChild(createCell(fmt2(item.area)));
      row.appendChild(createCell(item.altezza === null ? "-" : fmt2(item.altezza)));
      row.appendChild(createCell(fmt2(item.volume)));
      row.appendChild(createCell(item.idVoce || "-"));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-camminamenti";
      editButton.dataset.id = String(item.idPlCamm);
      editButton.textContent = "Modifica";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-camminamenti";
      deleteButton.dataset.id = String(item.idPlCamm);
      deleteButton.textContent = "Elimina";

      actionsCell.append(editButton, deleteButton);
      row.appendChild(actionsCell);
      camminamentiBodyEl.appendChild(row);
    });
  }

  function renderMisurazioniVarie() {
    if (!misurazioniBodyEl || !countMisurazioniEl) return;
    misurazioniBodyEl.innerHTML = "";
    const visibili = misurazioniVarie;
    countMisurazioniEl.textContent = `(${visibili.length})`;

    if (visibili.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 9;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna riga MISURAZIONI VARIE.";
      row.appendChild(cell);
      misurazioniBodyEl.appendChild(row);
      return;
    }

    visibili.forEach((item) => {
      const row = document.createElement("tr");
      if (item.segno) row.classList.add("row-sottrai");
      row.appendChild(createCell(String(item.idMisurazione)));
      row.appendChild(createCell(item.idVoce || "-"));
      row.appendChild(createCell(item.piano || "-"));
      row.appendChild(createCell(item.riferimento || "-"));
      row.appendChild(createCell(item.formula || "-"));
      row.appendChild(createCell(String(item.numero)));
      row.appendChild(createCell(item.segno ? "-" : "+"));
      row.appendChild(createCell(fmt2(item.risultato)));

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn-action btn-edit";
      editButton.dataset.action = "edit-misurazione";
      editButton.dataset.id = String(item.idMisurazione);
      editButton.textContent = "Modifica";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-misurazione";
      deleteButton.dataset.id = String(item.idMisurazione);
      deleteButton.textContent = "Elimina";

      actionsCell.append(editButton, deleteButton);
      row.appendChild(actionsCell);
      misurazioniBodyEl.appendChild(row);
    });
  }

  pianoFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const tipologia = tipologiaEl.value.trim();
    const edificio = edificioEl.value.trim();
    const piano = pianoEl.value.trim();
    if (!tipologia || !edificio || !piano) return;

    if (editingPianoId === null) {
      piani.push({ id: pianoIdCounter, tipologia, edificio, piano });
      pianoIdCounter += 1;
    } else {
      piani = piani.map((item) =>
        item.id === editingPianoId ? { ...item, tipologia, edificio, piano } : item,
      );
    }

    savePiani();
    renderPiani();
    resetPianoForm();
  });

  stratiFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    if (compilazionePianoId === null || currentElevazioneId === null) {
      window.alert("Seleziona prima un'elevazione (tabella MURIELEVAZIONE).");
      return;
    }
    const lunghezza = parseNumber(lunghezzaEl.value);
    const altezzaTrim = altezzaEl.value.trim();
    const altezza =
      altezzaTrim === "" ? null : parseNonNegativeDecimal2(altezzaEl.value);
    const spessore = parseNumber(spessoreEl.value);
    const idVoceCapitolato = idvocecapitolatoEl.value.trim();

    if (lunghezza === null || altezza === null || spessore === null) {
      return;
    }

    const spessoreElevazione = getSpessoreElevazioneAttiva();
    if (spessoreElevazione <= 0) {
      window.alert(
        "Prima di aggiungere uno strato devi inserire lo SPESSORE in MURI ELEVAZIONE.",
      );
      return;
    }

    const residuo = calcolaSpessoreResiduoPerElevazione(currentElevazioneId, editingStratoMurId);
    if (residuo <= 0) {
      window.alert("Hai gia' raggiunto lo spessore massimo della MURIELEVAZIONE.");
      return;
    }

    if (spessore > residuo) {
      window.alert(
        `Spessore non valido. Massimo inseribile: ${fmt2(residuo)} (puoi inserire anche valori minori).`,
      );
      spessoreEl.focus();
      return;
    }

    if (editingStratoMurId === null) {
      const idStrato = String(prossimoIdStratoPerElevazione(currentElevazioneId));
      stratiMurElevazione.push({
        idStratoMur: stratoMurIdCounter++,
        idElevazione: currentElevazioneId,
        idStrato,
        lunghezza,
        altezza,
        spessore,
        idVoceCapitolato,
      });
    } else {
      stratiMurElevazione = stratiMurElevazione.map((item) =>
        item.idStratoMur === editingStratoMurId
          ? { ...item, lunghezza, altezza, spessore, idVoceCapitolato }
          : item,
      );
    }

    saveMurDati();
    renderStrati();
    resetStratiForm();
  });

  apertureFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    if (compilazionePianoId === null || currentElevazioneId === null) {
      window.alert("Seleziona prima un'elevazione (tabella MURIELEVAZIONE).");
      return;
    }
    const locale = apLocaleEl.value.trim();
    const lunghezza = parseNumber(apLunghezzaEl.value);
    const altezza = parseNumber(apAltezzaEl.value);
    const ante = parseAnteIntero(apAnteEl.value);
    const tipologia = apTipologiaEl.value;
    const falsotelai = apFalsotelaiEl.value === "si";
    const hDavanzale = parseNonNegativeDecimal2(apHDavanzaleEl.value);
    const idVoceCapitolato = apIdVoceCapitolatoEl.value.trim();

    if (
      !locale ||
      lunghezza === null ||
      altezza === null ||
      ante === null ||
      !tipologia ||
      hDavanzale === null
    ) {
      return;
    }

    if (editingAperturaElevId === null) {
      apertureElevazione.push({
        idAperturaElev: aperturaElevIdCounter++,
        idElevazione: currentElevazioneId,
        locale,
        lunghezza,
        altezza,
        ante,
        tipologia,
        falsotelai,
        hDavanzale,
        idVoceCapitolato,
      });
    } else {
      apertureElevazione = apertureElevazione.map((item) =>
        item.idAperturaElev === editingAperturaElevId
          ? {
              ...item,
              locale,
              lunghezza,
              altezza,
              ante,
              tipologia,
              falsotelai,
              hDavanzale,
              idVoceCapitolato,
            }
          : item,
      );
    }

    saveMurDati();
    renderAperture();
    resetAperturaForm();
  });

  scavoFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const piano = scavoPianoEl.value.trim();
    const riferimento = scavoRiferimentoEl.value.trim();
    const sottrai = scavoSottraiEl.checked;
    const misura1 = scavoMisura1El.value.trim() === "" ? null : parseNonNegativeDecimal2(scavoMisura1El.value);
    const misura2 = scavoMisura2El.value.trim() === "" ? null : parseNonNegativeDecimal2(scavoMisura2El.value);
    const formula = scavoFormulaEl.value.trim();
    const formulaValue = evalFormulaValue(formula);
    const altezza = parseNonNegativeDecimal2(scavoAltezzaEl.value);
    const idVoce = scavoIdVoceEl.value.trim();

    if (!piano || !riferimento || altezza === null) return;
    if (misura1 === null && scavoMisura1El.value.trim() !== "") return;
    if (misura2 === null && scavoMisura2El.value.trim() !== "") return;
    if (formula && formulaValue === null) {
      window.alert("FORMULA non valida. Usa solo numeri, operatori (+ - * /) e parentesi.");
      return;
    }

    const areaBase = calcolaAreaScavo(misura1, misura2, formulaValue);
    const area = applySegno(areaBase, sottrai);
    const volume = applySegno(calcolaVolume(areaBase, altezza), sottrai);

    if (editingScavoId === null) {
      scaviEsterni.push({
        idPlScavo: scavoIdCounter++,
        piano,
        riferimento,
        sottrai,
        misura1,
        misura2,
        formula,
        formulaValue,
        area,
        altezza,
        volume,
        idVoce,
      });
    } else {
      scaviEsterni = scaviEsterni.map((item) =>
        item.idPlScavo === editingScavoId
          ? {
              ...item,
              piano,
              riferimento,
              sottrai,
              misura1,
              misura2,
              formula,
              formulaValue,
              area,
              altezza,
              volume,
              idVoce,
            }
          : item,
      );
    }

    saveMurDati();
    renderScavi();
    resetScavoForm();
    updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
  });

  corselloFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const piano = corselloPianoEl.value.trim();
    const riferimento = corselloRiferimentoEl.value.trim();
    const sottrai = corselloSottraiEl.checked;
    const misura1 =
      corselloMisura1El.value.trim() === "" ? null : parseNonNegativeDecimal2(corselloMisura1El.value);
    const misura2 =
      corselloMisura2El.value.trim() === "" ? null : parseNonNegativeDecimal2(corselloMisura2El.value);
    const formula = corselloFormulaEl.value.trim();
    const formulaValue = evalFormulaValue(formula);
    const altezza =
      corselloAltezzaEl.value.trim() === "" ? null : parseNonNegativeDecimal2(corselloAltezzaEl.value);
    const idVoce = corselloIdVoceEl.value.trim();

    if (!piano || !riferimento) return;
    if (misura1 === null && corselloMisura1El.value.trim() !== "") return;
    if (misura2 === null && corselloMisura2El.value.trim() !== "") return;
    if (formula && formulaValue === null) {
      window.alert("FORMULA non valida. Usa solo numeri, operatori (+ - * /) e parentesi.");
      return;
    }

    const areaBase = calcolaAreaScavo(misura1, misura2, formulaValue);
    const area = applySegno(areaBase, sottrai);
    const volume = applySegno(calcolaVolume(areaBase, altezza), sottrai);

    if (editingCorselloId === null) {
      corselliEsterni.push({
        idPlCors: corselloIdCounter++,
        piano,
        riferimento,
        sottrai,
        misura1,
        misura2,
        formula,
        formulaValue,
        area,
        altezza,
        volume,
        idVoce,
      });
    } else {
      corselliEsterni = corselliEsterni.map((item) =>
        item.idPlCors === editingCorselloId
          ? {
              ...item,
              piano,
              riferimento,
              sottrai,
              misura1,
              misura2,
              formula,
              formulaValue,
              area,
              altezza,
              volume,
              idVoce,
            }
          : item,
      );
    }

    saveMurDati();
    renderCorselli();
    resetCorselloForm();
    updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
  });

  camminamentiFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const piano = camminamentiPianoEl.value.trim();
    const riferimento = camminamentiRiferimentoEl.value.trim();
    const sottrai = camminamentiSottraiEl.checked;
    const misura1 =
      camminamentiMisura1El.value.trim() === ""
        ? null
        : parseNonNegativeDecimal2(camminamentiMisura1El.value);
    const misura2 =
      camminamentiMisura2El.value.trim() === ""
        ? null
        : parseNonNegativeDecimal2(camminamentiMisura2El.value);
    const formula = camminamentiFormulaEl.value.trim();
    const formulaValue = evalFormulaValue(formula);
    const altezza =
      camminamentiAltezzaEl.value.trim() === ""
        ? null
        : parseNonNegativeDecimal2(camminamentiAltezzaEl.value);
    const idVoce = camminamentiIdVoceEl.value.trim();

    if (!piano || !riferimento) return;
    if (misura1 === null && camminamentiMisura1El.value.trim() !== "") return;
    if (misura2 === null && camminamentiMisura2El.value.trim() !== "") return;
    if (formula && formulaValue === null) {
      window.alert("FORMULA non valida. Usa solo numeri, operatori (+ - * /) e parentesi.");
      return;
    }

    const areaBase = calcolaAreaScavo(misura1, misura2, formulaValue);
    const area = applySegno(areaBase, sottrai);
    const volume = applySegno(calcolaVolume(areaBase, altezza), sottrai);

    if (editingCamminamentiId === null) {
      camminamentiEsterni.push({
        idPlCamm: camminamentiIdCounter++,
        piano,
        riferimento,
        sottrai,
        misura1,
        misura2,
        formula,
        formulaValue,
        area,
        altezza,
        volume,
        idVoce,
      });
    } else {
      camminamentiEsterni = camminamentiEsterni.map((item) =>
        item.idPlCamm === editingCamminamentiId
          ? {
              ...item,
              piano,
              riferimento,
              sottrai,
              misura1,
              misura2,
              formula,
              formulaValue,
              area,
              altezza,
              volume,
              idVoce,
            }
          : item,
      );
    }

    saveMurDati();
    renderCamminamenti();
    resetCamminamentiForm();
    updateFormulaButtonState(camminamentiFormulaEl, apriFormulaCamminamentiButtonEl);
  });

  if (misurazioniFormEl) {
    misurazioniFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const idVoce = misurazioniIdVoceEl.value.trim();
      const piano = misurazioniPianoEl.value.trim();
      const riferimento = misurazioniRiferimentoEl.value.trim();
      const formula = misurazioniFormulaEl.value.trim();
      const segno = misurazioniSegnoEl.checked;
      const numeroParsed = Number.parseInt(misurazioniNumeroEl.value, 10);

      if (!piano || !riferimento) return;

      const calc = calcolaMisurazioneVaria(formula, numeroParsed, segno);
      if (!calc.ok) {
        window.alert(calc.message);
        return;
      }

      const payload = {
        idVoce,
        piano,
        riferimento,
        formula,
        formulaValue: calc.formulaValue,
        numero: numeroParsed,
        segno,
        risultato: calc.risultato,
      };

      if (editingMisurazioneId === null) {
        misurazioniVarie.push({ ...payload, idMisurazione: misurazioniIdCounter++ });
      } else {
        misurazioniVarie = misurazioniVarie.map((item) =>
          item.idMisurazione === editingMisurazioneId ? { ...item, ...payload } : item,
        );
      }

      saveMurDati();
      renderMisurazioniVarie();
      resetMisurazioniForm();
      updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
    });
  }

  apriFormulaScavoButtonEl.addEventListener("click", () => {
    openFormulaDialog(scavoFormulaEl);
  });

  apriFormulaCorselloButtonEl.addEventListener("click", () => {
    openFormulaDialog(corselloFormulaEl);
  });

  apriFormulaCamminamentiButtonEl.addEventListener("click", () => {
    openFormulaDialog(camminamentiFormulaEl);
  });

  apriFormulaMisurazioniButtonEl?.addEventListener("click", () => {
    openFormulaDialog(misurazioniFormulaEl);
  });

  formulaDialogCancelEl.addEventListener("click", () => {
    formulaDialogEl.close();
  });

  formulaDialogFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const targetId = formulaDialogEl.dataset.target;
    if (targetId === scavoFormulaEl.id) {
      scavoFormulaEl.value = formulaDialogTextEl.value.trim();
      updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
    } else if (targetId === corselloFormulaEl.id) {
      corselloFormulaEl.value = formulaDialogTextEl.value.trim();
      updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
    } else if (targetId === camminamentiFormulaEl.id) {
      camminamentiFormulaEl.value = formulaDialogTextEl.value.trim();
      updateFormulaButtonState(camminamentiFormulaEl, apriFormulaCamminamentiButtonEl);
    } else if (targetId === misurazioniFormulaEl?.id) {
      misurazioniFormulaEl.value = formulaDialogTextEl.value.trim();
      updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
    }
    formulaDialogEl.close();
  });

  voceMmRigaDialogFormEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    salvaVoceMmRigaDialog();
  });

  voceMmRigaCancelEl?.addEventListener("click", () => {
    voceMmRigaDialogEl?.close();
    voceMmDialogContext = { idVoce: null, index: null };
  });

  vociBodyEl.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    const trVoce = event.target.closest("tr.voci-row-principale");
    if (trVoce) {
      const idVoce = Number(trVoce.dataset.idVoce);
      if (Number.isNaN(idVoce)) return;
      enterVoceFocusMode(idVoce);
      return;
    }
    const tr = event.target.closest("tr.voce-mm-data-row");
    if (!tr) return;
    const idVoce = Number(tr.dataset.idVoce);
    const idx = Number(tr.dataset.mmIndex);
    if (Number.isNaN(idVoce) || Number.isNaN(idx)) return;
    openVoceMmRigaDialog(idVoce, idx);
  });

  aggiungiVoceButtonEl.addEventListener("click", () => {
    resetVoceForm();
    voceDialogEl.showModal();
    setTimeout(() => vocePosizioneEl.focus(), 0);
  });

  voceBtnCercaEl?.addEventListener("click", () => {
    try {
      sessionStorage.setItem(
        "voceDialogDraft",
        JSON.stringify({
          editingVoceId,
          idVoce: voceIdEl.value,
          posizione: vocePosizioneEl.value,
          abbreviata: voceAbbreviataEl.value,
          unitaMisura: voceUnitaMisuraEl.value,
          prezzo: vocePrezzoEl ? vocePrezzoEl.value : "",
          tipoMisura: voceTipoMisuraEl ? voceTipoMisuraEl.value : "",
          testo: voceTestoEl.value,
          note: voceNoteEl.value,
        }),
      );
    } catch (_) {
      /* ignore */
    }
    window.location.href = "cercavoce.html?from=nuova-voce&v=9";
  });

  voceDialogCancelEl.addEventListener("click", () => {
    voceDialogEl.close();
  });

  voceDeleteCancelEl.addEventListener("click", () => {
    pendingDeleteVoceId = null;
    voceDeleteDialogEl.close();
  });

  voceMmDeleteCancelEl?.addEventListener("click", () => {
    pendingDeleteVoceMm = { idVoce: null, index: null };
    voceMmDeleteDialogEl?.close();
  });

  voceMmDeleteDialogFormEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const { idVoce, index } = pendingDeleteVoceMm;
    pendingDeleteVoceMm = { idVoce: null, index: null };
    if (idVoce === null || index === null) {
      voceMmDeleteDialogEl?.close();
      return;
    }
    eliminaVoceMmRiga(idVoce, index);
    voceMmDeleteDialogEl?.close();
  });

  voceDeleteDialogFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pendingDeleteVoceId === null) {
      voceDeleteDialogEl.close();
      return;
    }
    const id = pendingDeleteVoceId;
    pendingDeleteVoceId = null;
    voci = voci.filter((item) => item.idVoce !== id);
    if (voceFocusId === id) exitVoceFocusMode();
    if (editingVoceId === id) resetVoceForm();
    normalizzaPosizioniVoci();
    saveVoci();
    renderVoci();
    voceDeleteDialogEl.close();
  });

  voceDialogFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const posizione = Number.parseInt(vocePosizioneEl.value, 10);
    const voceAbbreviata = voceAbbreviataEl.value.trim();
    const unitaMisura = voceUnitaMisuraEl.value.trim();
    const prezzo = parseNonNegativeDecimal2(vocePrezzoEl?.value ?? "");
    const tipoMisura = normalizzaTipoMisuraVoce(voceTipoMisuraEl?.value);
    const voce = voceTestoEl.value.trim();
    const note = voceNoteEl.value.trim();
    if (Number.isNaN(posizione) || posizione < 1 || !voce || prezzo === null) return;
    const voceEsistente = editingVoceId !== null ? voci.find((v) => v.idVoce === editingVoceId) : null;
    const misurazioniManualiSalvate =
      tipoMisura === TIPOMISURA_VOCE_MANUALE
        ? normalizzaMisurazioniManualiVoce(voceEsistente?.misurazioniManuali)
        : [];
    if (editingVoceId === null) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata,
        unitaMisura,
        prezzo,
        tipoMisura,
        voce,
        note,
        misurazioniManuali: [],
      });
      spostaVoceAPosizione(newId, posizione);
    } else {
      voci = voci.map((item) =>
        item.idVoce === editingVoceId
          ? {
              ...item,
              voceAbbreviata,
              unitaMisura,
              prezzo,
              tipoMisura,
              voce,
              note,
              misurazioniManuali: misurazioniManualiSalvate,
            }
          : item,
      );
      spostaVoceAPosizione(editingVoceId, posizione);
    }
    normalizzaPosizioniVoci();
    saveVoci();
    renderVoci();
    resetVoceForm();
    voceDialogEl.close();
  });

  vociBodyEl.addEventListener("click", (event) => {
    const openFocusCell = event.target.closest("td.voci-cell-open-focus[data-id-voce]");
    if (openFocusCell && !event.target.closest("button")) {
      const idVoce = Number(openFocusCell.dataset.idVoce);
      if (!Number.isNaN(idVoce)) enterVoceFocusMode(idVoce);
      return;
    }

    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "add-voce-mm") {
      const idVoce = Number(button.dataset.idVoce);
      if (!Number.isNaN(idVoce)) openVoceMmRigaDialog(idVoce, null);
      return;
    }

    if (button.dataset.action === "toggle-voce-mm") {
      const idVoce = Number(button.dataset.idVoce);
      if (Number.isNaN(idVoce)) return;
      if (vociMmCollapsed.has(idVoce)) vociMmCollapsed.delete(idVoce);
      else vociMmCollapsed.add(idVoce);
      renderVoci();
      return;
    }

    if (button.dataset.action === "duplicate-voce-mm-row") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (!Number.isNaN(idVoce) && !Number.isNaN(idx)) duplicaVoceMmRiga(idVoce, idx);
      return;
    }

    if (button.dataset.action === "delete-voce-mm-row") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (!Number.isNaN(idVoce) && !Number.isNaN(idx) && voceMmDeleteDialogEl) {
        pendingDeleteVoceMm = { idVoce, index: idx };
        voceMmDeleteDialogEl.showModal();
      }
      return;
    }

    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-voce") {
      const row = voci.find((item) => item.idVoce === id);
      if (!row) return;
      editingVoceId = id;
      voceIdEl.value = String(row.idVoce);
      vocePosizioneEl.value = String(row.posizione);
      voceAbbreviataEl.value = row.voceAbbreviata || "";
      renderVociUnitaOptions(row.unitaMisura || "");
      if (vocePrezzoEl) vocePrezzoEl.value = fmt2(row.prezzo ?? 0);
      voceUnitaNuovaEl.value = "";
      if (voceTipoMisuraEl) voceTipoMisuraEl.value = normalizzaTipoMisuraVoce(row.tipoMisura);
      voceTestoEl.value = row.voce;
      voceNoteEl.value = row.note;
      voceDialogEl.showModal();
      setTimeout(() => vocePosizioneEl.focus(), 0);
      return;
    }

    if (button.dataset.action === "delete-voce") {
      pendingDeleteVoceId = id;
      voceDeleteDialogEl.showModal();
      return;
    }

    if (button.dataset.action === "move-voce-up") {
      normalizzaPosizioniVoci();
      const row = voci.find((item) => item.idVoce === id);
      if (!row) return;
      spostaVoceAPosizione(id, row.posizione - 1);
      saveVoci();
      renderVoci();
      return;
    }

    if (button.dataset.action === "move-voce-down") {
      normalizzaPosizioniVoci();
      const row = voci.find((item) => item.idVoce === id);
      if (!row) return;
      spostaVoceAPosizione(id, row.posizione + 1);
      saveVoci();
      renderVoci();
    }
  });

  btnChiudiTutteVociEl?.addEventListener("click", () => {
    chiudiTutteLeVociManuali();
  });
  btnApriTutteVociEl?.addEventListener("click", () => {
    apriTutteLeVociManuali();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && voceFocusId !== null) {
      exitVoceFocusMode();
    }
  });

  vediVociButtonEl.addEventListener("click", () => {
    apriVistaVoci();
  });

  esportaJsonButtonEl.addEventListener("click", async () => {
    try {
      await exportJson();
    } catch (error) {
      console.error(error);
      window.alert("Esportazione JSON non riuscita.");
    }
  });

  esportaXlsButtonEl.addEventListener("click", async () => {
    try {
      await exportXls();
    } catch (error) {
      console.error(error);
      window.alert("Esportazione XLS non riuscita.");
    }
  });

  apriPdfVociButtonEl?.addEventListener("click", async () => {
    try {
      await openVociPdf({ showPrices: true });
    } catch (error) {
      console.error(error);
      window.alert("Creazione PDF non riuscita. Verifica che esista il file locale /src/vendor/jspdf.umd.min.js.");
    }
  });

  apriPdfVociQuantitaButtonEl?.addEventListener("click", async () => {
    try {
      await openVociPdf({ showPrices: false });
    } catch (error) {
      console.error(error);
      window.alert("Creazione PDF non riuscita. Verifica che esista il file locale /src/vendor/jspdf.umd.min.js.");
    }
  });

  importaComputoButtonEl.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const confirmed = window.confirm(
        "Importando il computo i dati correnti verranno sovrascritti. Continuare?",
      );
      if (!confirmed) return;
      try {
        const content = await file.text();
        const contentSafe = String(content || "").replace(/^\uFEFF/, "");
        const payload = JSON.parse(contentSafe);
        const importResult = await importComputoFromPayload(payload);
        if (importResult?.ifcLinkedPath) {
          if (importResult.ifcAutoLoaded) {
            window.alert(`Import completato con successo.\nIFC collegato caricato automaticamente: ${importResult.ifcLinkedPath}`);
          } else {
            const detail = importResult.ifcAutoLoadMessage ? `\n${importResult.ifcAutoLoadMessage}` : "";
            window.alert(`Import completato con successo, ma IFC collegato non caricato automaticamente.${detail}`);
          }
        } else {
          window.alert("Import completato con successo.");
        }
      } catch (error) {
        console.error(error);
        const detail = error && error.message ? `\nDettaglio: ${error.message}` : "";
        window.alert(`Import non riuscito: file JSON non valido o struttura dati errata.${detail}`);
      }
    });
    fileInput.click();
  });

  voceUnitaAddButtonEl.addEventListener("click", () => {
    const nuovaUnita = voceUnitaNuovaEl.value.trim();
    if (!nuovaUnita) return;
    const exists = vociUnitaMisuraOptions.some(
      (item) => item.toLowerCase() === nuovaUnita.toLowerCase(),
    );
    if (!exists) {
      vociUnitaMisuraOptions.push(nuovaUnita);
      saveVociUnitaOptions();
    }
    renderVociUnitaOptions(nuovaUnita);
    voceUnitaNuovaEl.value = "";
    voceUnitaNuovaEl.focus();
  });

  voceUnitaNuovaEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    voceUnitaAddButtonEl.click();
  });

  murEleBodyEl.addEventListener("change", (event) => {
    const input = event.target.closest("input.input-riferimento-elevazione");
    if (input) {
      const id = Number(input.dataset.rifElevazione);
      if (Number.isNaN(id)) return;
      aggiornaRiferimentoElevazione(id, input.value.trim());
      return;
    }

    const spInput = event.target.closest("input.input-spessore-elevazione");
    if (!spInput) return;
    const id = Number(spInput.dataset.spessoreElevazione);
    if (Number.isNaN(id)) return;
    const parsed = parseNonNegativeDecimal2(spInput.value);
    const spessore = parsed === null ? 0 : parsed;
    aggiornaSpessoreElevazione(id, spessore);
    spInput.value = fmt2(spessore);
    aggiornaSuggerimentoSpessoreStrato();
  });

  function selezionaElevazionePerStrati(idElevazione, opts = {}) {
    const refocusRif = opts.refocusRif === true;
    const refocusSpessore = opts.refocusSpessore === true;
    if (currentElevazioneId === idElevazione) return;

    currentElevazioneId = idElevazione;
    resetStratiForm();
    resetAperturaForm();
    renderMurielevazioni();
    renderStrati();
    renderAperture();

    if (refocusRif) {
      requestAnimationFrame(() => {
        murEleBodyEl
          .querySelector(`input.input-riferimento-elevazione[data-rif-elevazione="${idElevazione}"]`)
          ?.focus();
      });
    } else if (refocusSpessore) {
      requestAnimationFrame(() => {
        murEleBodyEl
          .querySelector(
            `input.input-spessore-elevazione[data-spessore-elevazione="${idElevazione}"]`,
          )
          ?.focus();
      });
    } else {
      lunghezzaEl.focus();
    }
  }

  murEleBodyEl.addEventListener("click", (event) => {
    const filtraBtn = event.target.closest("button[data-action='filtra-mur-elevazione']");
    if (filtraBtn) {
      event.stopPropagation();
      const id = Number(filtraBtn.dataset.id);
      if (Number.isNaN(id)) return;
      if (murFiltroSoloIdElevazione === id) {
        murFiltroSoloIdElevazione = null;
      } else {
        murFiltroSoloIdElevazione = id;
        if (currentElevazioneId !== id) {
          currentElevazioneId = id;
          resetStratiForm();
          resetAperturaForm();
          renderStrati();
          renderAperture();
        }
      }
      aggiornaSuggerimentoSpessoreStrato();
      renderMurielevazioni();
      tornaPianiButtonEl.focus();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const delBtn = event.target.closest("button[data-action='elimina-elevazione']");
    if (delBtn) {
      event.stopPropagation();
      const id = Number(delBtn.dataset.id);
      if (Number.isNaN(id)) return;
      if (!window.confirm("Eliminare questa elevazione, i suoi strati e le aperture collegate?")) return;
      murielevazioni = murielevazioni.filter((e) => e.idElevazione !== id);
      stratiMurElevazione = stratiMurElevazione.filter((s) => s.idElevazione !== id);
      apertureElevazione = apertureElevazione.filter((a) => a.idElevazione !== id);
      if (murFiltroSoloIdElevazione === id) {
        murFiltroSoloIdElevazione = null;
      }
      if (currentElevazioneId === id) {
        const restanti = murielevazioni.filter((e) => e.idPiano === compilazionePianoId);
        currentElevazioneId = restanti.length ? restanti[restanti.length - 1].idElevazione : null;
        resetStratiForm();
        resetAperturaForm();
      }
      aggiornaSuggerimentoSpessoreStrato();
      saveMurDati();
      renderMurielevazioni();
      renderStrati();
      renderAperture();
      return;
    }

    const rifInputClick = event.target.closest("input.input-riferimento-elevazione");
    if (rifInputClick) {
      const id = Number(rifInputClick.dataset.rifElevazione);
      if (Number.isNaN(id)) return;
      selezionaElevazionePerStrati(id, { refocusRif: true });
      return;
    }

    const spInputClick = event.target.closest("input.input-spessore-elevazione");
    if (spInputClick) {
      const id = Number(spInputClick.dataset.spessoreElevazione);
      if (Number.isNaN(id)) return;
      selezionaElevazionePerStrati(id, { refocusSpessore: true });
      return;
    }

    const row = event.target.closest("tr[data-elevazione-id]");
    if (!row) return;
    const id = Number(row.dataset.elevazioneId);
    if (Number.isNaN(id)) return;
    selezionaElevazionePerStrati(id);
  });

  murEleBodyEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("input, button")) return;
    const row = event.target.closest("tr[data-elevazione-id]");
    if (!row) return;
    event.preventDefault();
    const id = Number(row.dataset.elevazioneId);
    if (Number.isNaN(id)) return;
    selezionaElevazionePerStrati(id);
  });

  stratiMurBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-strato") {
      const row = stratiMurElevazione.find((item) => item.idStratoMur === id);
      if (!row) return;
      editingStratoMurId = id;
      idstratoEl.value = row.idStrato;
      lunghezzaEl.value = String(row.lunghezza);
      altezzaEl.value = String(row.altezza);
      spessoreEl.value = String(row.spessore);
      idvocecapitolatoEl.value = row.idVoceCapitolato;
      setStratiFormMode();
      lunghezzaEl.focus();
      return;
    }

    if (button.dataset.action === "delete-strato") {
      if (!window.confirm("Eliminare questo strato?")) return;
      stratiMurElevazione = stratiMurElevazione.filter((item) => item.idStratoMur !== id);
      if (editingStratoMurId === id) resetStratiForm();
      saveMurDati();
      renderStrati();
    }
  });

  apertureElevBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-apertura") {
      const row = apertureElevazione.find((item) => item.idAperturaElev === id);
      if (!row) return;
      editingAperturaElevId = id;
      apLocaleEl.value = row.locale;
      apLunghezzaEl.value = fmt2(row.lunghezza);
      apAltezzaEl.value = fmt2(row.altezza);
      apAnteEl.value = String(row.ante);
      apTipologiaEl.value = row.tipologia;
      apFalsotelaiEl.value = row.falsotelai ? "si" : "no";
      apHDavanzaleEl.value = fmt2(row.hDavanzale);
      apIdVoceCapitolatoEl.value = row.idVoceCapitolato;
      setAperturaFormMode();
      apLocaleEl.focus();
      return;
    }

    if (button.dataset.action === "delete-apertura") {
      if (!window.confirm("Eliminare questa apertura?")) return;
      apertureElevazione = apertureElevazione.filter((item) => item.idAperturaElev !== id);
      if (editingAperturaElevId === id) resetAperturaForm();
      saveMurDati();
      renderAperture();
    }
  });

  scavoBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-scavo") {
      const row = scaviEsterni.find((item) => item.idPlScavo === id);
      if (!row) return;
      editingScavoId = id;
      idPlScavoEl.value = String(row.idPlScavo);
      scavoPianoEl.value = row.piano;
      scavoRiferimentoEl.value = row.riferimento;
      scavoSottraiEl.checked = row.sottrai === true;
      scavoMisura1El.value = row.misura1 === null ? "" : fmt2(row.misura1);
      scavoMisura2El.value = row.misura2 === null ? "" : fmt2(row.misura2);
      scavoFormulaEl.value = row.formula;
      scavoAltezzaEl.value = fmt2(row.altezza);
      scavoIdVoceEl.value = row.idVoce;
      setScavoFormMode();
      updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
      scavoPianoEl.focus();
      return;
    }

    if (button.dataset.action === "delete-scavo") {
      if (!window.confirm("Eliminare questa riga SCAVO?")) return;
      scaviEsterni = scaviEsterni.filter((item) => item.idPlScavo !== id);
      if (editingScavoId === id) resetScavoForm();
      saveMurDati();
      renderScavi();
    }
  });

  corselloBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-corsello") {
      const row = corselliEsterni.find((item) => item.idPlCors === id);
      if (!row) return;
      editingCorselloId = id;
      idPlCorsEl.value = String(row.idPlCors);
      corselloPianoEl.value = row.piano;
      corselloRiferimentoEl.value = row.riferimento;
      corselloSottraiEl.checked = row.sottrai === true;
      corselloMisura1El.value = row.misura1 === null ? "" : fmt2(row.misura1);
      corselloMisura2El.value = row.misura2 === null ? "" : fmt2(row.misura2);
      corselloFormulaEl.value = row.formula;
      corselloAltezzaEl.value = fmt2(row.altezza);
      corselloIdVoceEl.value = row.idVoce;
      setCorselloFormMode();
      updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
      corselloPianoEl.focus();
      return;
    }

    if (button.dataset.action === "delete-corsello") {
      if (!window.confirm("Eliminare questa riga CORSELLO?")) return;
      corselliEsterni = corselliEsterni.filter((item) => item.idPlCors !== id);
      if (editingCorselloId === id) resetCorselloForm();
      saveMurDati();
      renderCorselli();
    }
  });

  camminamentiBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-camminamenti") {
      const row = camminamentiEsterni.find((item) => item.idPlCamm === id);
      if (!row) return;
      editingCamminamentiId = id;
      idPlCammEl.value = String(row.idPlCamm);
      camminamentiPianoEl.value = row.piano;
      camminamentiRiferimentoEl.value = row.riferimento;
      camminamentiSottraiEl.checked = row.sottrai === true;
      camminamentiMisura1El.value = row.misura1 === null ? "" : fmt2(row.misura1);
      camminamentiMisura2El.value = row.misura2 === null ? "" : fmt2(row.misura2);
      camminamentiFormulaEl.value = row.formula;
      camminamentiAltezzaEl.value = fmt2(row.altezza);
      camminamentiIdVoceEl.value = row.idVoce;
      setCamminamentiFormMode();
      updateFormulaButtonState(camminamentiFormulaEl, apriFormulaCamminamentiButtonEl);
      camminamentiPianoEl.focus();
      return;
    }

    if (button.dataset.action === "delete-camminamenti") {
      if (!window.confirm("Eliminare questa riga CAMMINAMENTI?")) return;
      camminamentiEsterni = camminamentiEsterni.filter((item) => item.idPlCamm !== id);
      if (editingCamminamentiId === id) resetCamminamentiForm();
      saveMurDati();
      renderCamminamenti();
    }
  });

  misurazioniBodyEl?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "edit-misurazione") {
      const row = misurazioniVarie.find((item) => item.idMisurazione === id);
      if (!row) return;
      editingMisurazioneId = id;
      idMisurazioneEl.value = String(row.idMisurazione);
      misurazioniIdVoceEl.value = row.idVoce;
      misurazioniPianoEl.value = row.piano ?? "";
      misurazioniRiferimentoEl.value = row.riferimento ?? "";
      misurazioniFormulaEl.value = row.formula;
      misurazioniNumeroEl.value = String(row.numero);
      misurazioniSegnoEl.checked = row.segno === true;
      setMisurazioniFormMode();
      updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
      misurazioniPianoEl?.focus();
      return;
    }

    if (button.dataset.action === "delete-misurazione") {
      if (!window.confirm("Eliminare questa riga MISURAZIONI VARIE?")) return;
      misurazioniVarie = misurazioniVarie.filter((item) => item.idMisurazione !== id);
      if (editingMisurazioneId === id) resetMisurazioniForm();
      saveMurDati();
      renderMisurazioniVarie();
    }
  });

  btnNuovaElevazioneEl.addEventListener("click", () => {
    if (compilazionePianoId === null) return;
    const nuovaId = creaNuovaElevazione(compilazionePianoId);
    currentElevazioneId = nuovaId;
    resetStratiForm();
    resetAperturaForm();
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    idstratoEl.focus();
  });

  pianiBodyEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (Number.isNaN(id)) return;

    if (button.dataset.action === "compila-piano") {
      const piano = piani.find((item) => item.id === id);
      if (!piano) return;
      if (piano.tipologia === "Interrato") {
        openCompilazioneInterrato(piano);
      } else if (piano.tipologia === "Altro") {
        openCompilazioneEsterniVari();
      } else {
        openCompilazioneAltreTipologie(piano);
      }
      renderPiani();
      return;
    }

    if (button.dataset.action === "edit-piano") {
      const row = piani.find((item) => item.id === id);
      if (!row) return;
      editingPianoId = id;
      tipologiaEl.value = row.tipologia;
      edificioEl.value = row.edificio;
      pianoEl.value = row.piano;
      setPianoFormMode();
      edificioEl.focus();
      return;
    }

    if (button.dataset.action === "delete-piano") {
      if (!window.confirm("Vuoi eliminare questo piano?")) return;
      piani = piani.filter((item) => item.id !== id);
      const eleIds = murielevazioni.filter((e) => e.idPiano === id).map((e) => e.idElevazione);
      murielevazioni = murielevazioni.filter((e) => e.idPiano !== id);
      stratiMurElevazione = stratiMurElevazione.filter((s) => !eleIds.includes(s.idElevazione));
      apertureElevazione = apertureElevazione.filter((a) => !eleIds.includes(a.idElevazione));
      if (editingPianoId === id) resetPianoForm();
      if (compilazionePianoId === id) {
        compilazionePianoId = null;
        currentElevazioneId = null;
        resetStratiForm();
        resetAperturaForm();
        resetScavoForm();
        showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
      }
      saveMurDati();
      savePiani();
      renderPiani();
      renderMurielevazioni();
      renderStrati();
      renderAperture();
      renderScavi();
      renderCorselli();
      renderCamminamenti();
      renderMisurazioniVarie();
    }
  });

  tornaPianiButtonEl.addEventListener("click", () => {
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    renderPiani();
  });

  tornaPianiEsterniButtonEl.addEventListener("click", () => {
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    renderPiani();
  });

  sidebarEsterniVariButtonEl.addEventListener("click", () => {
    openCompilazioneEsterniVariDaSidebar();
  });

  gestionePianiButtonEl.addEventListener("click", () => {
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    showVistaPiani(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    renderPiani();
  });

  vistaBimButtonEl?.addEventListener("click", () => {
    apriVistaBim();
  });

  importaIfcButtonEl?.addEventListener("click", async () => {
    try {
      const tauriDialogOpen = window.__TAURI__?.dialog?.open;
      if (typeof tauriDialogOpen === "function") {
        const selected = await tauriDialogOpen({
          multiple: false,
          filters: [{ name: "IFC", extensions: ["ifc"] }],
        });
        if (selected === null) return;
        if (typeof selected === "string" && selected.trim() !== "") {
          await loadIfcFromLinkedPath(selected);
          return;
        }
      }
    } catch (_) {
      // fallback su input file web
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".ifc";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        await loadIfcWithViewerFile(file);
      } catch (_) {
        window.alert("Caricamento IFC non riuscito. Verifica che il file sia valido.");
      }
    });
    fileInput.click();
  });

  exportIfcJsonButtonEl?.addEventListener("click", async () => {
    try {
      await exportIfcJson();
    } catch (error) {
      console.error(error);
      window.alert("Esportazione dati IFC non riuscita.");
    }
  });

  ifcToMisureButtonEl?.addEventListener("click", () => {
    importaMisurazioniDaIfc();
  });

  setupBimTabs();

  loadPiani();
  loadMurDati();
  loadVociUnitaOptions();
  loadVoci();
  loadIfcData();
  if (ifcDataCache?.source?.fileName && bimViewerStatusEl) {
    const totalEls = Number(ifcDataCache?.summary?.totalElements || 0);
    const totalMisure = Number(ifcDataCache?.summary?.totalMeasurements || 0);
    bimViewerStatusEl.textContent = `IFC in memoria: ${ifcDataCache.source.fileName} | Elementi: ${totalEls} | Misurazioni: ${totalMisure}`;
  }
  renderVociUnitaOptions();
  setPianoFormMode();
  setStratiFormMode();
  setAperturaFormMode();
  setScavoFormMode();
  setCorselloFormMode();
  setCamminamentiFormMode();
  setMisurazioniFormMode();
  updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
  updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
  updateFormulaButtonState(camminamentiFormulaEl, apriFormulaCamminamentiButtonEl);
  updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
  apFalsotelaiEl.value = "no";
  mostraPannelloCompilazione("interrato");
  vistaPianiEl.hidden = true;
  vistaCompilazioneEl.hidden = true;
  vistaVociEl.hidden = false;
  if (vistaBimEl) vistaBimEl.hidden = true;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
  updateElevazioneAttivaLabel(
    idElevazioneAttivaEl,
    riferimentoElevazioneAttivaEl,
    currentElevazioneId,
    murielevazioni,
  );
  renderPiani();
  renderMurielevazioni();
  renderStrati();
  renderAperture();
  renderScavi();
  renderCorselli();
  renderCamminamenti();
  renderMisurazioniVarie();
  renderVoci();

  (function ripristinaVoceDialogDaCercaVoce() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openVoceDialog") !== "1") return;
    const u = new URL(window.location.href);
    u.searchParams.delete("openVoceDialog");
    history.replaceState({}, "", u.pathname + (u.search || "") + u.hash);
    let draft = null;
    try {
      const raw = sessionStorage.getItem("voceDialogDraft");
      if (raw) draft = JSON.parse(raw);
    } catch (_) {
      draft = null;
    }
    sessionStorage.removeItem("voceDialogDraft");
    apriVistaVoci();
    if (draft && typeof draft === "object") {
      if (draft.editingVoceId != null && draft.editingVoceId !== "") {
        const ev = Number(draft.editingVoceId);
        editingVoceId = Number.isNaN(ev) ? null : ev;
      } else {
        editingVoceId = null;
      }
      if (draft.idVoce != null) voceIdEl.value = String(draft.idVoce);
      if (draft.posizione != null) vocePosizioneEl.value = String(draft.posizione);
      if (draft.abbreviata != null) voceAbbreviataEl.value = draft.abbreviata;
      renderVociUnitaOptions(draft.unitaMisura || "");
      if (draft.prezzo != null && vocePrezzoEl) vocePrezzoEl.value = draft.prezzo;
      if (draft.tipoMisura != null && voceTipoMisuraEl) voceTipoMisuraEl.value = draft.tipoMisura;
      if (draft.testo != null) voceTestoEl.value = draft.testo;
      if (draft.note != null) voceNoteEl.value = draft.note;
    }
    voceDialogEl.showModal();
    setTimeout(() => vocePosizioneEl?.focus(), 0);
  })();
});
