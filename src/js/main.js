import { createCell } from "./utils/domUtils.js";
import {
  parseNumber,
  parseAnteIntero,
  parseNonNegativeDecimal2,
  fmt2,
  altezzaAperturaInclusaNelloStrato,
  altezzaInclusaNelloStratoConElevazione,
} from "./utils/numberUtils.js";
import {
  savePiani as savePianiStorage,
  saveMurDati as saveMurDatiStorage,
  loadPiani as loadPianiStorage,
  loadMurDati as loadMurDatiStorage,
} from "./modules/storage.js";
import {
  updateInterratoPanelSubtitle,
  updateMurPianoCompilazioneLabel,
  showVistaPiani,
  showVistaCompilazione,
} from "./modules/viewHelpers.js";
import { renderStratiNetti as renderStratiNettiModule } from "./modules/calcoloStratiNetti.js";
import { syncVaniApertureLocalesForPicker } from "./modules/vaniApertureLocales.js";
import {
  canonicalPianoMisuraNome,
  pianoMisuraDedupKey,
  mergeNomePianoInMap,
  sortedUniquePianiNomiFromMap,
  collectPianiStringheDaMurData,
  loadArchivioPianiMisuraArray,
  saveArchivioPianiMisuraArray,
  ARCHIVIO_PIANI_MISURA_STORAGE_KEY,
  tryEnsurePianoInArchivio,
  popolaDatalistArchivioPianiMisura,
  risolviBlurCampoPianoArchivioStorage,
} from "./modules/archivioPianiMisura.js";
import {
  dismissCamminamentiIfOpen,
  openVistaCamminamenti,
  wireCamminamentiUi,
} from "./camminamenti-misurazione.js";
import { dismissVaniIfOpen, openVistaVani, wireVaniUi } from "./vani-misurazione.js";
import { openVistaMisureVarie, closeVistaMisureVarie, wireMisureVarieUi } from "./misure-varie.js";
import { buildRivestimentiRowsFromStorage, buildIntonacoRusticoRowsFromStorage, buildIntonacoCivileRowsFromStorage, buildZoccoloRowsFromStorage } from "./modules/rivestimentiRiepilogo.js";
import { popolaDatalistVocibrevi } from "./modules/archivioVociVocibrevi.js";
import { syncEsterniMisurazioniNelleVoci } from "./modules/esterniVariSyncVoci.js";
import { wireAggiornamentiAutomatici } from "./aggiornamenti.js";
import { wireTitoloConVersione } from "./versione-titolo.js";

window.addEventListener("DOMContentLoaded", () => {
  wireAggiornamentiAutomatici();
  void wireTitoloConVersione();
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
  const murParamsRiferimentoEl = document.querySelector("#mur-params-riferimento");
  const murParamsSpessoreEl = document.querySelector("#mur-params-spessore");
  const stratiMurBodyEl = document.querySelector("#strati-mur-body");
  const stratiSubmitButtonEl = stratiFormEl.querySelector("button[type='submit']");
  const idPianoCompilazioneEl = document.querySelector("#id-piano-compilazione");
  const riferimentoMurPianoEl = document.querySelector("#riferimento-mur-piano");
  const countStratiEl = document.querySelector("#count-strati");
  const countApertureEl = document.querySelector("#count-aperture");

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
  const misureVarieSidebarButtonEl = document.createElement("button");
  const sidebarLeftActionsPrimariEl = document.querySelector("#sidebar-left-actions-primari");
  const sidebarLeftActionsSecondariEl = document.querySelector("#sidebar-left-actions-secondari");
  const apertureMasterSidebarButtonEl = document.createElement("button");
  const pianiMisuraArchivioSidebarButtonEl = document.createElement("button");
  const grondeSidebarButtonEl = document.createElement("button");
  const davanzaliSidebarButtonEl = document.createElement("button");
  const soglieSidebarButtonEl = document.createElement("button");
  const falsiTelaiSidebarButtonEl = document.createElement("button");
  const falsiTelaiAllSidebarButtonEl = document.createElement("button");
  const rivestimentiSidebarButtonEl = document.createElement("button");
  const intonacoRusticoSidebarButtonEl = document.createElement("button");
  const intonacoCivileSidebarButtonEl = document.createElement("button");
  const zoccoloSidebarButtonEl = document.createElement("button");
  const vaniSidebarButtonEl = document.createElement("button");
  const aggiungiVoceButtonEl = document.querySelector("#btn-aggiungi-voce");
  const vediVociButtonEl = document.querySelector("#btn-vedi-voci");
  const apriPdfVociButtonEl = document.querySelector("#btn-apri-pdf-voci");
  const apriPdfVociQuantitaButtonEl = document.querySelector("#btn-apri-pdf-voci-quantita");
  const esportaXlsButtonEl = document.querySelector("#btn-esporta-xls");
  const esportaJsonButtonEl = document.querySelector("#btn-esporta-json");
  const importaComputoButtonEl = document.querySelector("#btn-importa-computo");
  const iniziaComputoButtonEl = document.querySelector("#btn-inizia-computo");
  const chiudiAppButtonEl = document.querySelector("#btn-chiudi-app");
  const vistaBimButtonEl = document.querySelector("#btn-vista-bim");
  const importaIfcButtonEl = document.querySelector("#btn-importa-ifc");
  const exportIfcJsonButtonEl = document.querySelector("#btn-esporta-ifc-json");
  const ifcToMisureButtonEl = document.querySelector("#btn-ifc-to-misure");
  const ifcToMuriApertureButtonEl = document.createElement("button");
  const ifcToMuriApertureUndoButtonEl = document.createElement("button");
  const ifcRiepilogoCollegamentiButtonEl = document.createElement("button");
  const ifcRiepilogoDialogEl = document.createElement("dialog");
  const ifcRiepilogoTableWrapEl = document.createElement("div");
  const ifcRiepilogoCloseButtonEl = document.createElement("button");
  const apertureMasterDialogEl = document.createElement("dialog");
  const pianiMisuraArchivioDialogEl = document.createElement("dialog");
  const useAperturaDialogEl = document.createElement("dialog");
  const confirmDeleteAperturaMasterDialogEl = document.createElement("dialog");
  const confirmEditVoceMmAperturaDialogEl = document.createElement("dialog");
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
  const compilazioneMisureVariePanelEl = document.querySelector("#compilazione-misure-varie");

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
  // CAMMINAMENTI non è più in ESTERNI VARI (modulo dedicato in sidebar).
  const sumAreaCorselliEl = document.querySelector("#sum-area-corselli");
  const sumVolumeCorselliEl = document.querySelector("#sum-volume-corselli");
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
  const voceDialogTitleEl = document.querySelector("#voce-dialog-title");
  const voceDialogSoloUnitaHintEl = document.querySelector("#voce-dialog-solo-unita-hint");
  const voceDialogSaveEl = document.querySelector("#voce-dialog-save");
  const voceDialogCancelEl = document.querySelector("#voce-dialog-cancel");
  const voceDeleteDialogEl = document.querySelector("#voce-delete-dialog");
  const voceDeleteDialogFormEl = document.querySelector("#voce-delete-dialog-form");
  const voceDeleteCancelEl = document.querySelector("#voce-delete-cancel");
  const voceMmDeleteDialogEl = document.querySelector("#voce-mm-delete-dialog");
  const voceMmDeleteDialogFormEl = document.querySelector("#voce-mm-delete-dialog-form");
  const voceMmDeleteCancelEl = document.querySelector("#voce-mm-delete-cancel");
  const chiusuraAppDialogEl = document.querySelector("#chiusura-app-dialog");
  const chiusuraAppDialogMsgEl = document.querySelector("#chiusura-app-dialog-msg");
  const iniziaComputoDialogEl = document.querySelector("#inizia-computo-dialog");
  const computoDirtyIndicatorEl = document.querySelector("#computo-dirty-indicator");
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
  const voceMmRigaTipoOggettoEl = document.querySelector("#voce-mm-riga-tipooggetto");
  const voceMmRigaSpecificaEl = document.querySelector("#voce-mm-riga-specifica");
  const voceMmRigaMisura1El = document.querySelector("#voce-mm-riga-misura1");
  const voceMmRigaMisura2El = document.querySelector("#voce-mm-riga-misura2");
  const voceMmRigaMisura3El = document.querySelector("#voce-mm-riga-misura3");
  const voceMmFieldsManualeEl = document.querySelector(".voce-mm-fields-manuale");
  const voceMmFieldsSemiautomaticaEl = document.querySelector(".voce-mm-fields-semiautomatica");
  const voceMmCopiaMisureInFormulaEl = document.querySelector("#voce-mm-copia-misure-in-formula");
  const voceMmTemplateFaldaButtonEl = document.querySelector("#voce-mm-template-falda");
  const voceMmTemplateFaldaDialogEl = document.querySelector("#voce-mm-template-falda-dialog");
  const voceMmTemplateFaldaFormEl = document.querySelector("#voce-mm-template-falda-form");
  const voceMmTemplateFaldaCancelEl = document.querySelector("#voce-mm-template-falda-cancel");
  const voceMmTemplateFaldaGrondaEl = document.querySelector("#voce-mm-template-falda-gronda");
  const voceMmTemplateFaldaSalitaEl = document.querySelector("#voce-mm-template-falda-salita");
  const voceMmTemplateFaldaPendenzaEl = document.querySelector("#voce-mm-template-falda-pendenza");
  const voceMmTemplateFaldaCanaleEl = document.querySelector("#voce-mm-template-falda-canale");
  const voceMmRisultatoPreviewEl = document.querySelector("#voce-mm-risultato-preview");
  const grondeDialogEl = document.createElement("dialog");
  const davanzaliDialogEl = document.createElement("dialog");
  const soglieDialogEl = document.createElement("dialog");
  const falsiTelaiDialogEl = document.createElement("dialog");
  const falsiTelaiAllDialogEl = document.createElement("dialog");
  const rivestimentiDialogEl = document.createElement("dialog");
  const intonacoRusticoDialogEl = document.createElement("dialog");
  const intonacoCivileDialogEl = document.createElement("dialog");
  const zoccoloDialogEl = document.createElement("dialog");
  const vociBodyEl = document.querySelector("#voci-body");
  const vociTotaleComputoEl = document.querySelector("#voci-totale-computo");
  const btnApriTutteVociEl = document.querySelector("#btn-apri-tutte-voci");
  const btnChiudiTutteVociEl = document.querySelector("#btn-chiudi-tutte-voci");
  const vociCercaAbbrevInputEl = document.querySelector("#voci-cerca-abbrev");

  const STORAGE_PIANI = "computo_metrico_piani";
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
  const STORAGE_APERTURE_MASTER = "computo_metrico_aperture_master";
  const STORAGE_ARCHIVIO_PIANI_MISURA = ARCHIVIO_PIANI_MISURA_STORAGE_KEY;
  const STORAGE_DAVANZALI_SBORDI = "computo_metrico_davanzali_sbordi";
  const STORAGE_SOGLIE_SBORDI = "computo_metrico_soglie_sbordi";
  const STORAGE_FALSITELAI_LEGNO_AGGIUNTE = "computo_metrico_falsitelai_legno_aggiunte";
  const STORAGE_FALSITELAI_ALLUMINIO_AGGIUNTE = "computo_metrico_falsitelai_alluminio_aggiunte";
  const UNITA_MISURA_DEFAULT_OPTIONS = ["ml.", "mq.", "mc", "Kg.", "a corpo", "percentuale"];
  const TIPOMISURA_VOCE_AUTOMATICA = "AUTOMATICA";
  const TIPOMISURA_VOCE_MANUALE = "MANUALE";
  const VOCE_MM_TIPO_MANUALE = "MANUALE";
  const VOCE_MM_TIPO_SEMIAUTOMATICA = "SEMIAUTOMATICA";
  const STORAGE_KEYS = {
    STORAGE_MUR_ELE,
    STORAGE_STRATI_MUR,
    STORAGE_APERTURE_ELEV,
    STORAGE_SCAVI_ESTERNI,
    STORAGE_CORSELLI_ESTERNI,
    STORAGE_CAMMINAMENTI_ESTERNI,
    STORAGE_MISURAZIONI_VARIE,
  };

  /** @type {{ id: number, tipologia: string, edificio: string, piano: string, murRiferimento?: string, murSpessore?: number }[]} */
  let piani = [];
  /** @type {{ idStratoMur: number, idPiano: number, idStrato: string, lunghezza: number, altezza: number, spessore: number, idVoceCapitolato: string }[]} */
  let stratiMurElevazione = [];
  /** @type {{ idAperturaElev: number, idPiano: number, locale: string, lunghezza: number, altezza: number, ante: number, tipologia: string, falsotelai: boolean, hDavanzale: number, idVoceCapitolato: string }[]} */
  let apertureElevazione = [];
  /** @type {{ idPlScavo: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let scaviEsterni = [];
  /** @type {{ idPlCors: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let corselliEsterni = [];
  /** @type {{ idPlCamm: number, piano: string, riferimento: string, sottrai: boolean, misura1: number|null, misura2: number|null, formula: string, formulaValue: number|null, area: number, altezza: number|null, volume: number, idVoce: string }[]} */
  let camminamentiEsterni = [];
  /** @type {{ idMisurazione: number, idVoce: string, piano: string, riferimento: string, formula: string, formulaValue: number|null, numero: number, segno: boolean, risultato: number, apertureCollegate?: { idAperturaMaster?: string, idApertura?: string, locale?: string, largh?: number, alt?: number, hDav?: number, ante?: number, tipologia?: string, falso?: string, scuro?: string, inferiata?: string, zanzariera?: string }[] }[]} */
  let misurazioniVarie = [];
  /** @type {{ idVoce: number, posizione: number, voceAbbreviata: string, unitaMisura: string, prezzo: number, tipoMisura: string, voce: string, note: string, misurazioniManuali?: { tipo?: string, piano: string, riferimento: string, tipoOggetto?: string, specifica?: string, formula: string, formulaValue: number|null, misura1?: number|null, misura2?: number|null, misura3?: number|null, canaleGronda?: boolean, grondaCanaleValore?: number|null, numero: number, segno: boolean, risultato: number, apertureCollegate?: { idAperturaMaster?: string, idApertura?: string, locale?: string, largh?: number, alt?: number, hDav?: number, ante?: number, tipologia?: string, falso?: string, scuro?: string, inferiata?: string, zanzariera?: string }[] }[] }[]} */
  let voci = [];
  /** @type {{ idAperturaMaster: string, piano: string, locale: string, largh: number, alt: number, hDav: number, ante: number, tipologia: string, falso: string, scuro: string, inferiata: string, zanzariera: string }[]} */
  let apertureMaster = [];
  /** @type {string[]} */
  let vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
  /** voci manuali collassate nella tabella VOCI */
  const vociMmCollapsed = new Set();
  /** id voce in modalità focus fullscreen nella vista VOCI */
  let voceFocusId = null;
  /** draft editor aperture collegata per riga misurazione manuale (chiave: "idVoce:mmIndex") */
  const voceMmAperturaDraftByKey = new Map();
  let apertureMasterIdCounter = 1;
  let voceMmUseAperturaContext = { idVoce: /** @type {number|null} */ (null), mmIndex: /** @type {number|null} */ (null) };
  let apertureMasterEditingId = null;
  let apertureMasterPendingDeleteId = null;

  /** Nomi piano usati in MISURAZIONI VARIE, esterni vari e righe manuali voce (lista univoca, ordinata). */
  let archivioPianiMisura = [];

  let pianoIdCounter = 1;
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
  /** Dialog voce: solo unità di misura (voci collegate a VANI). */
  let editingVoceSoloUnitaMisura = false;
  /** contesto popup riga misurazione manuale: index null = nuova riga */
  let voceMmDialogContext = { idVoce: /** @type {number | null} */ (null), index: /** @type {number | null} */ (null) };
  /** id voce in attesa conferma eliminazione */
  let pendingDeleteVoceId = null;
  /** Eliminazione misurazione manuale in attesa di conferma nel modale */
  let pendingDeleteVoceMm = { idVoce: /** @type {number|null} */ (null), index: /** @type {number|null} */ (null) };
  let voceMmTemplateFaldaMeta = { canale: false, gronda: null };
  /** @type {Record<string, number>} */
  let davanzaliSbordiByKey = {};
  /** @type {Record<string, number>} */
  let soglieSbordiByKey = {};
  /** @type {Record<string, number>} */
  let falsiTelaiLegnoAggiunteByKey = {};
  /** @type {Record<string, number>} */
  let falsiTelaiAlluminioAggiunteByKey = {};
  /** Modifica apertura collegata in attesa di conferma nel modale */
  let pendingEditVoceMmApertura = {
    idVoce: /** @type {number|null} */ (null),
    mmIndex: /** @type {number|null} */ (null),
    idAperturaMaster: /** @type {string} */ (""),
  };
  /** @type {any | null} */
  let ifcDataCache = null;
  /** @type {null | { piani: any[], stratiMurElevazione: any[], apertureElevazione: any[], stratoMurIdCounter: number, aperturaElevIdCounter: number, compilazionePianoId: number|null }} */
  let provaBimWallsBackup = null;
  /** @type {any | null} */
  let bimSelectedElementCache = null;
  let bimActiveTab = "computolore";
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

  /**
   * Per porte/finestre l'asse del bounding box spesso mappa l'altezza reale in "Length" e la
   * luce in orizzontale in "Height": in COMPUTOLORE risultano LUNGHEZZA/ALTEZZA invertite.
   * Scambiamo solo quando sembra un vano "in piedi" (lato lungo in colonna LUNGHEZZA, lato
   * corto in ALTEZZA) per non toccare finestre molto orizzontali.
   */
  function correctLunghezzaAltezzaForDoorWindow(lunghezzaStr, altezzaStr, ifcType) {
    const t = String(ifcType || "")
      .trim()
      .toUpperCase();
    if (t !== "IFCDOOR" && t !== "IFCWINDOW") {
      return { lunghezza: lunghezzaStr, altezza: altezzaStr };
    }
    const a = Number(String(lunghezzaStr).replace(",", "."));
    const b = Number(String(altezzaStr).replace(",", "."));
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= b) {
      return { lunghezza: lunghezzaStr, altezza: altezzaStr };
    }
    const hMinTipicaVano = 1.75;
    const bMaxLuceTipica = 1.6;
    if (a >= hMinTipicaVano && b < a && b <= bMaxLuceTipica) {
      return { lunghezza: altezzaStr, altezza: lunghezzaStr };
    }
    return { lunghezza: lunghezzaStr, altezza: altezzaStr };
  }

  function buildBimSectionsByTab(selection, tab) {
    const proprietaSections = [];
    const computoloreSections = [];
    const posizioneData = extractPositionRows(selection);
    const format3 = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n.toFixed(3) : "";
    };
    const baseRows = normalizeRows([
      { name: "IfcType", value: selection.ifcType || "" },
      { name: "ExpressID", value: selection.expressID ?? "" },
      { name: "Name", value: selection.name || "" },
    ]);
    if (baseRows.length) proprietaSections.push({ name: "Elemento", rows: baseRows });

    const psetRows = extractPropertySetRows(selection.propertySets);
    psetRows.forEach((item) => {
      if (!item.rows.length) return;
      const normalizedRows = normalizeRows(item.rows);
      const normalizedGroupName = String(item.name || "").trim().toLowerCase();
      // Alcuni IFC esportano il gruppo come "Pset_COMPUTOLORE" o con prefissi/suffissi.
      if (normalizedGroupName.includes("computolore")) {
        computoloreSections.push({ name: item.name, rows: normalizedRows });
        return;
      }
      proprietaSections.push({ name: item.name, rows: normalizedRows });
    });

    const findGeometryRowValue = (name) => {
      const row = (posizioneData?.geometryRows || []).find((r) => String(r?.name || "").toLowerCase() === String(name).toLowerCase());
      return row ? row.value : "";
    };
    const computedComputoloreRows = [];
    const rawL = findGeometryRowValue("Bounding Box Length");
    const rawA = findGeometryRowValue("Bounding Box Height");
    const corrected = correctLunghezzaAltezzaForDoorWindow(rawL, rawA, selection?.ifcType);
    const lunghezza = format3(corrected.lunghezza);
    const altezza = format3(corrected.altezza);
    const spessore = format3(findGeometryRowValue("Bounding Box Width"));
    if (lunghezza) computedComputoloreRows.push({ name: "LUNGHEZZA", value: lunghezza, um: "m" });
    if (altezza) computedComputoloreRows.push({ name: "ALTEZZA", value: altezza, um: "m" });
    if (spessore) computedComputoloreRows.push({ name: "SPESSORE", value: spessore, um: "m" });
    if (computedComputoloreRows.length) {
      computoloreSections.push({ name: "Dimensioni (da Geometry)", rows: computedComputoloreRows });
    }

    const quantityRows = normalizeRows(extractQuantityRows(selection));
    if (quantityRows.length) proprietaSections.push({ name: "Quantities", rows: quantityRows });

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
      computolore: computoloreSections,
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
    const IFC_TYPE_TOKEN_RE = /^IFC[A-Z0-9_]+$/;

    function normalizeValue(v) {
      function isIfcTypeToken(text) {
        const s = String(text || "").trim().toUpperCase();
        return IFC_TYPE_TOKEN_RE.test(s);
      }

      function cleanScalar(value) {
        if (value === null || value === undefined) return "";
        const out = String(value).trim();
        if (!out) return "";
        return out;
      }

      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) return v.map((x) => normalizeValue(x)).filter(Boolean).join(", ");
      if (typeof v === "object") {
        // IFC spesso incapsula il valore "umano" dentro oggetti complessi.
        // Priorita': valore effettivo -> fallback etichette/nomi
        if ("_internalValue" in v && v._internalValue !== null && v._internalValue !== undefined) {
          const internal = cleanScalar(v._internalValue);
          if (internal !== "") return internal;
        }
        if ("wrappedValue" in v && v.wrappedValue !== null && v.wrappedValue !== undefined)
          return normalizeValue(v.wrappedValue);
        if ("value" in v && v.value !== null && v.value !== undefined) return normalizeValue(v.value);
        if ("Value" in v && v.Value !== null && v.Value !== undefined) return normalizeValue(v.Value);
        if ("displayValue" in v && v.displayValue !== null && v.displayValue !== undefined)
          return normalizeValue(v.displayValue);
        if ("label" in v && v.label !== null && v.label !== undefined) {
          const candidate = normalizeValue(v.label);
          if (!isIfcTypeToken(candidate)) return candidate;
        }
        if ("Label" in v && v.Label !== null && v.Label !== undefined) {
          const candidate = normalizeValue(v.Label);
          if (!isIfcTypeToken(candidate)) return candidate;
        }
        if ("name" in v && v.name !== null && v.name !== undefined) {
          const candidate = normalizeValue(v.name);
          if (!isIfcTypeToken(candidate)) return candidate;
        }
        if ("Name" in v && v.Name !== null && v.Name !== undefined) {
          const candidate = normalizeValue(v.Name);
          if (!isIfcTypeToken(candidate)) return candidate;
        }
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    }

    function scoreDisplayValue(text) {
      const t = String(text || "").trim();
      if (!t) return -1000;
      if (IFC_TYPE_TOKEN_RE.test(t.toUpperCase())) return -500;
      if (/^\{.*\}$/.test(t)) return -50; // JSON tecnico: poco leggibile
      if (/^[+-]?\d+(?:[.,]\d+)?$/.test(t)) {
        if (t === "0" || t === "0." || t === "0,0") return 1;
        return 5;
      }
      if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(t)) return 50;
      return 10;
    }

    function extractNumericIndex(value) {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) {
        for (const item of value) {
          const idx = extractNumericIndex(item);
          if (idx !== null) return idx;
        }
        return null;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        if (value >= 0) return Math.trunc(value);
        return null;
      }
      if (typeof value === "object") {
        if ("_internalValue" in value) return extractNumericIndex(value._internalValue);
        if ("wrappedValue" in value) return extractNumericIndex(value.wrappedValue);
        if ("value" in value) return extractNumericIndex(value.value);
        if ("Value" in value) return extractNumericIndex(value.Value);
        return null;
      }
      const text = String(value).trim().replace(",", ".");
      if (!text) return null;
      const parsed = Number.parseFloat(text);
      if (!Number.isFinite(parsed) || parsed < 0) return null;
      return Math.trunc(parsed);
    }

    function extractEnumOptions(prop) {
      const optionsRaw =
        prop?.EnumerationReference?.EnumerationValues ??
        prop?.EnumerationReference?.enumerationValues ??
        prop?.enumerationReference?.EnumerationValues ??
        prop?.enumerationReference?.enumerationValues ??
        [];
      if (!Array.isArray(optionsRaw)) return [];
      return optionsRaw.map((opt) => normalizeValue(opt)).filter((text) => scoreDisplayValue(text) >= 10);
    }

    function resolveEnumeratedDisplayValue(prop) {
      const selectedRaw = prop?.EnumerationValues ?? prop?.enumerationValues;
      if (selectedRaw === null || selectedRaw === undefined) return "";
      const options = extractEnumOptions(prop);
      const selectedIndex = extractNumericIndex(selectedRaw);
      if (selectedIndex !== null && options[selectedIndex]) return options[selectedIndex];
      return "";
    }

    function pickBestPropertyValue(prop) {
      const enumDisplayValue = resolveEnumeratedDisplayValue(prop);
      if (enumDisplayValue) return enumDisplayValue;

      const candidates = [
        prop?.NominalValue,
        prop?.nominalValue,
        prop?.Value,
        prop?.value,
        prop?.EnumerationValues,
        prop?.enumerationValues,
      ];

      let best = "";
      let bestScore = -1000;
      candidates.forEach((candidate) => {
        const text = normalizeValue(candidate);
        const score = scoreDisplayValue(text);
        if (score > bestScore) {
          best = text;
          bestScore = score;
        }
      });
      return best;
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
          const valueText = pickBestPropertyValue(prop);
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
    const hitPoint = selection?.hitPoint && typeof selection.hitPoint === "object" ? selection.hitPoint : null;
    const placementDebug =
      selection?.placementDebug && typeof selection.placementDebug === "object" ? selection.placementDebug : null;
    const qRows = extractQuantityRows(selection);

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

    function toFiniteNumber(value) {
      if (value === null || value === undefined) return null;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const text = String(value).trim().replace(",", ".");
      if (!text) return null;
      const parsed = Number.parseFloat(text);
      return Number.isFinite(parsed) ? parsed : null;
    }

    function extractPlacementCoordinates(rawCoords) {
      if (!Array.isArray(rawCoords)) return { x: null, y: null, z: null };
      return {
        x: toFiniteNumber(normalizeIfcScalar(rawCoords[0])),
        y: toFiniteNumber(normalizeIfcScalar(rawCoords[1])),
        z: toFiniteNumber(normalizeIfcScalar(rawCoords[2])),
      };
    }

    function tokenizeDimensionName(name) {
      return String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }

    function findQuantityValueByAliases(aliases) {
      if (!Array.isArray(aliases) || aliases.length === 0) return null;
      for (const row of qRows) {
        const n = toFiniteNumber(row?.value);
        if (!Number.isFinite(n)) continue;
        const tokens = tokenizeDimensionName(row?.name);
        const compact = tokens.join("");
        const hasAlias = aliases.some((alias) => tokens.includes(alias) || compact.includes(alias));
        if (hasAlias) return n;
      }
      return null;
    }

    function resolveBoundingBoxDimensions(geometry) {
      const rawX = toFiniteNumber(geometry?.boundingBoxRawX);
      const rawY = toFiniteNumber(geometry?.boundingBoxRawY);
      const rawZ = toFiniteNumber(geometry?.boundingBoxRawZ);
      const candidates = [rawX, rawY, rawZ].filter((v) => Number.isFinite(v));
      if (!candidates.length) {
        return {
          length: geometry?.boundingBoxLength,
          width: geometry?.boundingBoxWidth,
          height: geometry?.boundingBoxHeight,
        };
      }

      const qLength = findQuantityValueByAliases(["length", "lunghezza", "overalllength", "nominallength"]);
      const qWidth = findQuantityValueByAliases([
        "width",
        "larghezza",
        "overallwidth",
        "nominalwidth",
        "thickness",
        "spessore",
        "depth",
        "profondita",
      ]);
      const qHeight = findQuantityValueByAliases(["height", "altezza", "overallheight", "nominalheight"]);

      const remaining = [...candidates];
      const out = { length: null, width: null, height: null };
      function pickClosest(target) {
        if (!Number.isFinite(target) || !remaining.length) return null;
        let bestIdx = -1;
        let bestDelta = Number.POSITIVE_INFINITY;
        remaining.forEach((item, idx) => {
          const delta = Math.abs(item - target);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestIdx = idx;
          }
        });
        if (bestIdx < 0) return null;
        return remaining.splice(bestIdx, 1)[0];
      }

      out.height = pickClosest(qHeight);
      out.length = pickClosest(qLength);
      out.width = pickClosest(qWidth);

      const sortedRemaining = [...remaining].sort((a, b) => a - b);
      if (!Number.isFinite(out.width) && sortedRemaining.length) out.width = sortedRemaining[0];
      if (!Number.isFinite(out.height) && sortedRemaining.length > 1) out.height = sortedRemaining[1];
      if (!Number.isFinite(out.length) && sortedRemaining.length) out.length = sortedRemaining[sortedRemaining.length - 1];

      if (!Number.isFinite(out.height)) out.height = toFiniteNumber(geometry?.boundingBoxHeight);
      if (!Number.isFinite(out.length)) out.length = toFiniteNumber(geometry?.boundingBoxLength);
      if (!Number.isFinite(out.width)) out.width = toFiniteNumber(geometry?.boundingBoxWidth);
      return out;
    }

    function readIfcEntityId(node) {
      if (node === null || node === undefined) return null;
      if (typeof node === "number" && Number.isFinite(node)) return node;
      if (typeof node !== "object") return null;
      const candidates = [node.expressID, node.expressId, node.id, node.value, node.Value, node._internalValue];
      for (const c of candidates) {
        const n = toFiniteNumber(c);
        if (Number.isFinite(n)) return Math.trunc(n);
      }
      return null;
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

    function pickDirectOrRecursive(node, preferredKeys = [], fallbackKey = "") {
      if (node && typeof node === "object") {
        for (const key of preferredKeys) {
          if (Object.prototype.hasOwnProperty.call(node, key) && node[key] !== undefined && node[key] !== null) {
            return node[key];
          }
        }
      }
      if (!fallbackKey) return null;
      return findNodeByKeyRecursive(node, fallbackKey);
    }

    const objectPlacement = findNodeByKeyRecursive(root, "ObjectPlacement");
    const relativePlacement = pickDirectOrRecursive(objectPlacement, ["RelativePlacement", "relativePlacement"], "RelativePlacement");
    const location = pickDirectOrRecursive(relativePlacement, ["Location", "location"], "Location");
    const coordinates = pickDirectOrRecursive(location, ["Coordinates", "coordinates"], "Coordinates");
    const axis = pickDirectOrRecursive(relativePlacement, ["Axis", "axis"], "Axis");
    const refDirection = pickDirectOrRecursive(relativePlacement, ["RefDirection", "refDirection"], "RefDirection");

    const placementCoords = extractPlacementCoordinates(coordinates);
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

    const placementRelTo = pickDirectOrRecursive(objectPlacement, ["PlacementRelTo", "placementRelTo"], "PlacementRelTo");
    const objectPlacementId = readIfcEntityId(objectPlacement);
    const placementRelToId = readIfcEntityId(placementRelTo);
    if (placementRelTo && typeof placementRelTo === "object") {
      const relName =
        normalizeIfcScalar(placementRelTo.Name) ||
        normalizeIfcScalar(placementRelTo.LongName) ||
        normalizeIfcScalar(placementRelTo.GlobalId) ||
        normalizeIfcScalar(placementRelTo.type) ||
        "";
      if (relName) addRow(membershipRows, "Relativo a", relName);
    }
    const resolvedObjectPlacementId = Number.isFinite(placementDebug?.objectPlacementId)
      ? placementDebug.objectPlacementId
      : objectPlacementId;
    const resolvedPlacementRelToId = Number.isFinite(placementDebug?.placementRelToId)
      ? placementDebug.placementRelToId
      : placementRelToId;
    const resolvedRelativePlacementId = Number.isFinite(placementDebug?.relativePlacementId)
      ? placementDebug.relativePlacementId
      : null;
    if (Number.isFinite(resolvedObjectPlacementId)) addRow(membershipRows, "ObjectPlacement ID", resolvedObjectPlacementId);
    if (Number.isFinite(resolvedRelativePlacementId))
      addRow(membershipRows, "RelativePlacement ID", resolvedRelativePlacementId);
    if (Number.isFinite(resolvedPlacementRelToId)) addRow(membershipRows, "PlacementRelTo ID", resolvedPlacementRelToId);

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
      if (Number.isFinite(selection?.expressID)) addRow(geometryRows, "Express ID", selection.expressID);
      if (typeof geometryInfo.hasOwnGeometry === "boolean") {
        addRow(geometryRows, "Has Own Geometry", geometryInfo.hasOwnGeometry ? "Si" : "No");
      }
      // Priorita': punto reale cliccato nel viewer -> placement istanza -> fallback geometry info.
      const resolvedGlobalX = Number.isFinite(hitPoint?.x)
        ? hitPoint.x
        : Number.isFinite(placementCoords.x)
          ? placementCoords.x
          : geometryInfo.globalX;
      const resolvedGlobalY = Number.isFinite(hitPoint?.y)
        ? hitPoint.y
        : Number.isFinite(placementCoords.y)
          ? placementCoords.y
          : geometryInfo.globalY;
      const resolvedGlobalZ = Number.isFinite(hitPoint?.z)
        ? hitPoint.z
        : Number.isFinite(placementCoords.z)
          ? placementCoords.z
          : geometryInfo.globalZ;
      const resolvedBBox = resolveBoundingBoxDimensions(geometryInfo);
      if (Number.isFinite(resolvedGlobalX)) addRow(geometryRows, "Global X", resolvedGlobalX, "m");
      if (Number.isFinite(resolvedGlobalY)) addRow(geometryRows, "Global Y", resolvedGlobalY, "m");
      if (Number.isFinite(resolvedGlobalZ)) addRow(geometryRows, "Global Z", resolvedGlobalZ, "m");
      if (Number.isFinite(resolvedBBox.length)) addRow(geometryRows, "Bounding Box Length", resolvedBBox.length, "m");
      if (Number.isFinite(resolvedBBox.width)) addRow(geometryRows, "Bounding Box Width", resolvedBBox.width, "m");
      if (Number.isFinite(resolvedBBox.height)) addRow(geometryRows, "Bounding Box Height", resolvedBBox.height, "m");

      const hasGlobalZ = Number.isFinite(resolvedGlobalZ);
      const hasBBoxHeight = Number.isFinite(resolvedBBox.height);
      if (hasGlobalZ && hasBBoxHeight) {
        const halfH = Number(resolvedBBox.height) / 2;
        const topElevation = Number((Number(resolvedGlobalZ) + halfH).toFixed(3));
        const bottomElevation = Number((Number(resolvedGlobalZ) - halfH).toFixed(3));
        addRow(locationRows, "Top Elevation", topElevation, "m");
        addRow(locationRows, "Bottom Elevation", bottomElevation, "m");
        addRow(locationRows, "Global Top Elevation", topElevation, "m");
        addRow(locationRows, "Global Bottom Elevation", bottomElevation, "m");
      }
    }

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

  /**
   * True se ci sono state modifiche dopo l'ultimo "punto sicuro" (avvio, import, export JSON).
   * Serve per chiedere conferma in chiusura (il dialog nativo del browser spesso non si vede in Tauri).
   */
  let computoModificatoPerExportJson = false;

  function updateComputoDirtyIndicator() {
    if (!computoDirtyIndicatorEl) return;
    computoDirtyIndicatorEl.hidden = !computoModificatoPerExportJson;
  }

  function segnaComputoModificatoPerExportJson() {
    computoModificatoPerExportJson = true;
    updateComputoDirtyIndicator();
  }

  function azzeraComputoModificatoPerExportJson() {
    computoModificatoPerExportJson = false;
    updateComputoDirtyIndicator();
  }

  function isElementoInFormTracciatoPerDirty(target) {
    if (!(target instanceof Element)) return false;
    const trackedFormsSelector = [
      "#piano-form",
      "#strati-mur-form",
      "#aperture-elev-form",
      "#scavo-form",
      "#corsello-form",
      "#misurazioni-form",
      "#voce-dialog-form",
      "#voce-mm-riga-dialog-form",
    ].join(", ");
    return Boolean(target.closest(trackedFormsSelector));
  }

  function savePiani() {
    savePianiStorage(STORAGE_PIANI, piani);
    segnaComputoModificatoPerExportJson();
  }

  function saveMurDati() {
    saveMurDatiStorage(
      STORAGE_KEYS,
      stratiMurElevazione,
      apertureElevazione,
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni,
      misurazioniVarie,
    );
    segnaComputoModificatoPerExportJson();
    syncVaniApertureLocalesForPicker(apertureElevazione, apertureMaster);
  }

  function loadPiani() {
    const loaded = loadPianiStorage(STORAGE_PIANI);
    piani = loaded.piani;
    pianoIdCounter = loaded.pianoIdCounter;
  }

  function loadMurDati() {
    const loaded = loadMurDatiStorage(STORAGE_KEYS);
    stratiMurElevazione = loaded.stratiMurElevazione;
    apertureElevazione = loaded.apertureElevazione;
    scaviEsterni = loaded.scaviEsterni;
    corselliEsterni = loaded.corselliEsterni;
    // Vecchio archivio «camminamenti in ESTERNI VARI» dismesso: non caricare (doppio con modulo CAMMINAMENTI).
    camminamentiEsterni = [];
    try {
      localStorage.removeItem(STORAGE_CAMMINAMENTI_ESTERNI);
    } catch {
      /* ignore */
    }
    misurazioniVarie = Array.isArray(loaded.misurazioniVarie)
      ? loaded.misurazioniVarie.map((item) => ({
          ...item,
          apertureCollegate: normalizzaApertureCollegateMisurazione(item?.apertureCollegate),
        }))
      : [];
    stratoMurIdCounter = loaded.stratoMurIdCounter;
    aperturaElevIdCounter = loaded.aperturaElevIdCounter;
    scavoIdCounter = loaded.scavoIdCounter;
    corselloIdCounter = loaded.corselloIdCounter;
    camminamentiIdCounter = loaded.camminamentiIdCounter;
    misurazioniIdCounter =
      typeof loaded.misurazioniIdCounter === "number" ? loaded.misurazioniIdCounter : 1;

    if (loaded.pianoMurLegacy && typeof loaded.pianoMurLegacy === "object") {
      let dirty = false;
      piani = piani.map((p) => {
        const leg = loaded.pianoMurLegacy[p.id];
        if (!leg) return p;
        const hasMur =
          (typeof p.murRiferimento === "string" && p.murRiferimento.trim() !== "") ||
          (typeof p.murSpessore === "number" && p.murSpessore > 0);
        if (hasMur) return p;
        dirty = true;
        return {
          ...p,
          murRiferimento: leg.riferimento,
          murSpessore: leg.spessore,
        };
      });
      if (dirty) savePiani();
    }
  }

  function loadArchivioPianiMisuraFromStorage() {
    archivioPianiMisura = loadArchivioPianiMisuraArray(STORAGE_ARCHIVIO_PIANI_MISURA);
  }

  function saveArchivioPianiMisuraToStorage() {
    saveArchivioPianiMisuraArray(STORAGE_ARCHIVIO_PIANI_MISURA, archivioPianiMisura);
    segnaComputoModificatoPerExportJson();
  }

  document.addEventListener("computo-archivio-piani-misura-changed", (ev) => {
    archivioPianiMisura = loadArchivioPianiMisuraArray(STORAGE_ARCHIVIO_PIANI_MISURA);
    popolaDatalistArchivioPianiMisura(STORAGE_ARCHIVIO_PIANI_MISURA, "datalist-piani-misura-archivio");
    if (ev.detail?.added) segnaComputoModificatoPerExportJson();
  });

  document.addEventListener("computo-voci-storage-externally-updated", () => {
    loadVoci();
    syncVoceCanali();
    renderVoci();
    segnaComputoModificatoPerExportJson();
  });

  document.addEventListener("computo-vani-richiedi-nuova-apertura", (event) => {
    const d = event.detail && typeof event.detail === "object" ? event.detail : null;
    if (!d) return;
    const parsed = parseVoceMmAperturaDraft({
      locale: d.locale,
      largh: d.largh,
      alt: d.alt,
      hDav: d.hDav,
      ante: d.ante,
      tipologia: d.tipologia,
      falso: d.falso,
      scuro: d.scuro,
      inferiata: d.inferiata,
      zanzariera: d.zanzariera,
    });
    if (!parsed) {
      window.alert(
        "Dati apertura non validi. Controlla locale, larghezza, altezza, H davanzale e ante.",
      );
      return;
    }
    const piano = typeof d.piano === "string" ? d.piano.trim() : "";
    const id = creaAperturaMasterDaDati({ ...parsed, piano });
    if (!id) {
      window.alert("Impossibile creare l’apertura.");
      return;
    }
    saveApertureMaster();
    syncVaniApertureLocalesForPicker(apertureElevazione, apertureMaster);
    syncVoceDavanzali();
    syncVoceSoglie();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
    document.dispatchEvent(
      new CustomEvent("computo-vani-apertura-creata", {
        detail: { idAperturaMaster: id, pareteId: d.pareteId },
      }),
    );
  });

  function refreshArchivioPianiMisuraDatalist() {
    popolaDatalistArchivioPianiMisura(STORAGE_ARCHIVIO_PIANI_MISURA, "datalist-piani-misura-archivio");
  }

  /**
   * Unisce nomi già in archivio con quelli usati nei dati, elimina duplicati (solo maiuscole/spazi),
   * allinea il testo salvato nelle righe al nome canonico dell’archivio.
   */
  function syncArchivioPianiMisuraCompleto() {
    const map = new Map();
    const add = (raw) => mergeNomePianoInMap(map, raw);
    for (const x of archivioPianiMisura) add(x);
    const collected = collectPianiStringheDaMurData({
      misurazioniVarie,
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni,
      voci,
    });
    for (const x of collected) add(x);

    archivioPianiMisura = sortedUniquePianiNomiFromMap(map);

    const canon = (val) => {
      const c = canonicalPianoMisuraNome(val);
      if (!c) return "";
      const k = pianoMisuraDedupKey(c);
      return map.get(k) ?? c;
    };

    let dirtyMur = false;
    misurazioniVarie = misurazioniVarie.map((m) => {
      const np = canon(m.piano);
      if (np !== m.piano) dirtyMur = true;
      return { ...m, piano: np };
    });
    scaviEsterni = scaviEsterni.map((m) => {
      const np = canon(m.piano);
      if (np !== m.piano) dirtyMur = true;
      return { ...m, piano: np };
    });
    corselliEsterni = corselliEsterni.map((m) => {
      const np = canon(m.piano);
      if (np !== m.piano) dirtyMur = true;
      return { ...m, piano: np };
    });
    camminamentiEsterni = camminamentiEsterni.map((m) => {
      const np = canon(m.piano);
      if (np !== m.piano) dirtyMur = true;
      return { ...m, piano: np };
    });

    let dirtyVoci = false;
    voci = voci.map((v) => {
      const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura);
      let rowChanged = false;
      const mm2 = mm.map((row) => {
        const np = canon(row.piano);
        if (np !== row.piano) rowChanged = true;
        return { ...row, piano: np };
      });
      if (rowChanged) dirtyVoci = true;
      return rowChanged ? { ...v, misurazioniManuali: mm2 } : v;
    });

    saveArchivioPianiMisuraToStorage();
    if (dirtyMur) saveMurDati();
    if (dirtyVoci) saveVoci();
    refreshArchivioPianiMisuraDatalist();
  }

  /** Inserisce il piano nell’archivio se manca (chiamare al salvataggio misurazione / nuovo nome). */
  function ensurePianoMisuraInArchivio(raw) {
    const r = tryEnsurePianoInArchivio(STORAGE_ARCHIVIO_PIANI_MISURA, raw);
    if (!r.canonical) return "";
    document.dispatchEvent(
      new CustomEvent("computo-archivio-piani-misura-changed", { detail: { added: r.added } }),
    );
    return r.canonical;
  }

  /** Allinea maiuscole al valore già presente in archivio (blur), senza creare nuovi nomi. */
  function risolviInputPianoMisuraSenzaAggiungere(el) {
    risolviBlurCampoPianoArchivioStorage(STORAGE_ARCHIVIO_PIANI_MISURA, el);
  }

  function countRiferimentiPianoMisura(canonicalNome) {
    const k = pianoMisuraDedupKey(canonicalNome);
    let n = 0;
    for (const m of misurazioniVarie) {
      if (pianoMisuraDedupKey(m.piano) === k) n += 1;
    }
    for (const m of scaviEsterni) {
      if (pianoMisuraDedupKey(m.piano) === k) n += 1;
    }
    for (const m of corselliEsterni) {
      if (pianoMisuraDedupKey(m.piano) === k) n += 1;
    }
    for (const m of camminamentiEsterni) {
      if (pianoMisuraDedupKey(m.piano) === k) n += 1;
    }
    for (const v of voci) {
      const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura);
      for (const row of mm) {
        if (pianoMisuraDedupKey(row.piano) === k) n += 1;
      }
    }
    return n;
  }

  /** Risolve id voce (testo come in form) → voce abbreviata. */
  function lookupVoceAbbreviataDaRefIdVoce(idVoceRef) {
    const s = String(idVoceRef ?? "").trim();
    if (!s) return null;
    const idNum = Number.parseInt(s, 10);
    const v = voci.find(
      (x) =>
        String(x.idVoce) === s ||
        (Number.isFinite(idNum) && !Number.isNaN(idNum) && x.idVoce === idNum),
    );
    if (!v) return null;
    const ab = String(v.voceAbbreviata ?? "").trim();
    return ab || `Voce ${v.idVoce}`;
  }

  /** Elenco univoco di etichette voce (abbreviate) dove il piano compare. */
  function etichetteVociCheUsanoPianoMisura(canonicalNome) {
    const k = pianoMisuraDedupKey(canonicalNome);
    const labels = new Set();

    const addDaRefVoce = (idVoceRef, messaggioSenzaCollegamento) => {
      const s = String(idVoceRef ?? "").trim();
      if (!s) {
        labels.add(messaggioSenzaCollegamento);
        return;
      }
      const ab = lookupVoceAbbreviataDaRefIdVoce(idVoceRef);
      if (ab) labels.add(ab);
      else labels.add(`ID voce «${s}» (non presente nell’elenco voci)`);
    };

    for (const m of misurazioniVarie) {
      if (pianoMisuraDedupKey(m.piano) !== k) continue;
      addDaRefVoce(m.idVoce, "Misurazioni varie (nessuna voce collegata)");
    }
    for (const m of scaviEsterni) {
      if (pianoMisuraDedupKey(m.piano) !== k) continue;
      addDaRefVoce(m.idVoce, "Scavi esterni (voce non indicata)");
    }
    for (const m of corselliEsterni) {
      if (pianoMisuraDedupKey(m.piano) !== k) continue;
      addDaRefVoce(m.idVoce, "Corselli esterni (voce non indicata)");
    }
    for (const m of camminamentiEsterni) {
      if (pianoMisuraDedupKey(m.piano) !== k) continue;
      addDaRefVoce(m.idVoce, "Camminamenti esterni (voce non indicata)");
    }
    for (const v of voci) {
      const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura);
      const usa = mm.some((row) => pianoMisuraDedupKey(row.piano) === k);
      if (!usa) continue;
      const ab = String(v.voceAbbreviata ?? "").trim();
      labels.add(ab || `Voce ${v.idVoce}`);
    }

    return [...labels].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
  }

  function messaggioPianoArchivioNonEliminabile(nomePiano) {
    const etichette = etichetteVociCheUsanoPianoMisura(nomePiano);
    if (etichette.length === 0) return "";
    const lista = etichette.join(", ");
    if (etichette.length === 1) {
      return `Il piano non è eliminabile perché è usato nella voce «${etichette[0]}».`;
    }
    return `Il piano non è eliminabile perché è usato nelle voci: ${lista}.`;
  }

  function openArchivioPianiMisuraDialog() {
    const rows =
      archivioPianiMisura.length === 0
        ? `<tr><td colspan="3" class="empty-cell">Nessun piano in archivio. Aggiungine uno qui o salvando una misurazione.</td></tr>`
        : archivioPianiMisura
            .map((nome, index) => {
              const uses = countRiferimentiPianoMisura(nome);
              return `<tr>
              <td>${escapeHtml(nome)}</td>
              <td>${uses}</td>
              <td class="actions-cell">
                <button type="button" class="btn-action btn-delete" data-action="delete-archivio-piano-misura" data-index="${index}" title="${uses > 0 ? "Se in uso, comparirà un avviso con le voci coinvolte" : "Rimuovi dall’archivio"}">🗑</button>
              </td>
            </tr>`;
            })
            .join("");
    pianiMisuraArchivioDialogEl.innerHTML = `
      <div class="ifc-riepilogo-dialog-header"><h3>Archivio PIANI (misurazioni)</h3></div>
      <p class="bim-riepilogo-note">Stesso elenco del campo PIANO nelle misurazioni: non ci sono duplicati che differiscono solo per maiuscole o spazi extra.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end;">
        <div class="field" style="flex:1;min-width:160px;margin:0;">
          <label for="archivio-piani-misura-new">Nuovo piano</label>
          <input id="archivio-piani-misura-new" type="text" placeholder="Es: INTERRATO" autocomplete="off" list="datalist-piani-misura-archivio" />
        </div>
        <button type="button" class="btn-action btn-secondary" data-action="add-archivio-piano-misura">Aggiungi</button>
      </div>
      <div class="ifc-riepilogo-table-host">
        <table class="table-voce-mm-inline" style="min-width:100%">
          <thead><tr><th>NOME</th><th>Utilizzi</th><th>AZIONI</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="padding-top:12px;display:flex;justify-content:flex-end;">
        <button type="button" class="btn-action btn-secondary" data-action="close-archivio-piani-misura">Chiudi</button>
      </div>
    `;
    pianiMisuraArchivioDialogEl.showModal();
  }

  function wireArchivioPianiMisuraComboInputs() {
    const list = [
      misurazioniPianoEl,
      scavoPianoEl,
      corselloPianoEl,
      voceMmRigaPianoEl,
    ].filter(Boolean);
    for (const el of list) {
      el.addEventListener("blur", () => risolviInputPianoMisuraSenzaAggiungere(el));
    }
  }

  function saveVoci() {
    localStorage.setItem(STORAGE_VOCI, JSON.stringify(voci));
    segnaComputoModificatoPerExportJson();
  }

  function saveApertureMaster() {
    localStorage.setItem(STORAGE_APERTURE_MASTER, JSON.stringify(apertureMaster));
    segnaComputoModificatoPerExportJson();
    syncVaniApertureLocalesForPicker(apertureElevazione, apertureMaster);
  }

  function saveVociUnitaOptions() {
    localStorage.setItem(STORAGE_VOCI_UNITA_OPTIONS, JSON.stringify(vociUnitaMisuraOptions));
    segnaComputoModificatoPerExportJson();
  }

  function saveDavanzaliSbordi() {
    localStorage.setItem(STORAGE_DAVANZALI_SBORDI, JSON.stringify(davanzaliSbordiByKey));
    segnaComputoModificatoPerExportJson();
  }

  function saveSoglieSbordi() {
    localStorage.setItem(STORAGE_SOGLIE_SBORDI, JSON.stringify(soglieSbordiByKey));
    segnaComputoModificatoPerExportJson();
  }

  function saveFalsiTelaiLegnoAggiunte() {
    localStorage.setItem(STORAGE_FALSITELAI_LEGNO_AGGIUNTE, JSON.stringify(falsiTelaiLegnoAggiunteByKey));
    segnaComputoModificatoPerExportJson();
  }

  function saveFalsiTelaiAlluminioAggiunte() {
    localStorage.setItem(
      STORAGE_FALSITELAI_ALLUMINIO_AGGIUNTE,
      JSON.stringify(falsiTelaiAlluminioAggiunteByKey),
    );
    segnaComputoModificatoPerExportJson();
  }

  function saveIfcData() {
    if (!ifcDataCache) {
      localStorage.removeItem(STORAGE_IFC_DATA);
      segnaComputoModificatoPerExportJson();
      return;
    }
    localStorage.setItem(STORAGE_IFC_DATA, JSON.stringify(ifcDataCache));
    segnaComputoModificatoPerExportJson();
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

  function loadDavanzaliSbordi() {
    try {
      const raw = localStorage.getItem(STORAGE_DAVANZALI_SBORDI);
      if (!raw) {
        davanzaliSbordiByKey = {};
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        davanzaliSbordiByKey = {};
        return;
      }
      const out = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof key !== "string" || key.trim() === "") return;
        const n = parseNonNegativeDecimal2(value);
        if (n === null) return;
        out[key] = Number(n.toFixed(2));
      });
      davanzaliSbordiByKey = out;
    } catch {
      davanzaliSbordiByKey = {};
    }
  }

  function loadSoglieSbordi() {
    try {
      const raw = localStorage.getItem(STORAGE_SOGLIE_SBORDI);
      if (!raw) {
        soglieSbordiByKey = {};
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        soglieSbordiByKey = {};
        return;
      }
      const out = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof key !== "string" || key.trim() === "") return;
        const n = parseNonNegativeDecimal2(value);
        if (n === null) return;
        out[key] = Number(n.toFixed(2));
      });
      soglieSbordiByKey = out;
    } catch {
      soglieSbordiByKey = {};
    }
  }

  function loadFalsiTelaiLegnoAggiunte() {
    try {
      const raw = localStorage.getItem(STORAGE_FALSITELAI_LEGNO_AGGIUNTE);
      if (!raw) {
        falsiTelaiLegnoAggiunteByKey = {};
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        falsiTelaiLegnoAggiunteByKey = {};
        return;
      }
      const out = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof key !== "string" || key.trim() === "") return;
        const n = parseNonNegativeDecimal2(value);
        if (n === null) return;
        out[key] = Number(n.toFixed(2));
      });
      falsiTelaiLegnoAggiunteByKey = out;
    } catch {
      falsiTelaiLegnoAggiunteByKey = {};
    }
  }

  function loadFalsiTelaiAlluminioAggiunte() {
    try {
      const raw = localStorage.getItem(STORAGE_FALSITELAI_ALLUMINIO_AGGIUNTE);
      if (!raw) {
        falsiTelaiAlluminioAggiunteByKey = {};
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        falsiTelaiAlluminioAggiunteByKey = {};
        return;
      }
      const out = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof key !== "string" || key.trim() === "") return;
        const n = parseNonNegativeDecimal2(value);
        if (n === null) return;
        out[key] = Number(n.toFixed(2));
      });
      falsiTelaiAlluminioAggiunteByKey = out;
    } catch {
      falsiTelaiAlluminioAggiunteByKey = {};
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

  function normalizzaTipoMisurazioneVoce(raw) {
    const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    if (s === VOCE_MM_TIPO_SEMIAUTOMATICA) return VOCE_MM_TIPO_SEMIAUTOMATICA;
    return VOCE_MM_TIPO_MANUALE;
  }

  function parseNonNegativeDecimal3OrNull(raw) {
    const txt = String(raw ?? "").trim();
    if (txt === "") return null;
    const normalized = txt.replaceAll(",", ".");
    if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) return null;
    return Number(n.toFixed(3));
  }

  function mmFactorOrOne(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 1;
  }

  function formatFixedOrOne(raw) {
    const txt = String(raw ?? "").trim();
    if (txt === "") return "1";
    const parsed = parseNonNegativeDecimal3OrNull(txt);
    if (parsed === null) return null;
    return Number(parsed).toFixed(3);
  }

  function formatFixed3ForFormula(raw) {
    const parsed = parseNonNegativeDecimal3OrNull(raw);
    if (parsed === null) return null;
    return Number(parsed).toFixed(3);
  }

  function calcolaMisurazioneVoceSemiautomatica(misura1, misura2, misura3, numero, segno) {
    if (!Number.isInteger(numero) || numero < 0) {
      return { ok: false, message: "NUMERO deve essere un intero maggiore o uguale a zero." };
    }
    const raw = Number((mmFactorOrOne(misura1) * mmFactorOrOne(misura2) * mmFactorOrOne(misura3) * numero).toFixed(3));
    const risultato = segno ? -Math.abs(raw) : raw;
    return { ok: true, risultato };
  }

  function calcolaRisultatoSemiautomaticoPerUnita({
    misura1,
    misura2,
    misura3,
    numero,
    segno,
    unitaNorm,
    vaniVanoId,
    camminamentiSchedaId,
    stratoAltezza,
  }) {
    if (!Number.isInteger(numero) || numero < 0) return 0;
    const daModuloSpeciale =
      (typeof vaniVanoId === "string" && vaniVanoId.trim() !== "") ||
      (typeof camminamentiSchedaId === "string" && camminamentiSchedaId.trim() !== "");
    if (!daModuloSpeciale) {
      const calc = calcolaMisurazioneVoceSemiautomatica(misura1, misura2, misura3, numero, segno);
      return calc.ok ? Number(calc.risultato || 0) : 0;
    }
    const m1 = mmFactorOrOne(misura1);
    const m2Base =
      typeof stratoAltezza === "number" && Number.isFinite(stratoAltezza) ? stratoAltezza : misura2;
    const m2 = mmFactorOrOne(m2Base);
    const m3 = mmFactorOrOne(misura3);
    let raw = 0;
    if (unitaNorm.includes("ml")) raw = Number((m1 * numero).toFixed(3));
    else if (unitaNorm.includes("mq")) raw = Number((m1 * m2 * numero).toFixed(3));
    else if (unitaNorm.includes("mc")) raw = Number((m1 * m2 * m3 * numero).toFixed(3));
    else raw = Number((m1 * m2 * m3 * numero).toFixed(3));
    return segno ? -Math.abs(raw) : raw;
  }

  function voceDerivataDaVani(item) {
    const mm = normalizzaMisurazioniManualiVoce(item?.misurazioniManuali, item?.unitaMisura);
    return mm.some((m) => {
      const daVani = typeof m?.vaniVanoId === "string" && m.vaniVanoId.trim() !== "";
      const daCamm =
        typeof m?.camminamentiSchedaId === "string" && m.camminamentiSchedaId.trim() !== "";
      const daEsterni = typeof m?.esterniKey === "string" && m.esterniKey.trim() !== "";
      return daVani || daCamm || daEsterni;
    });
  }

  function voceBloccataInVoci(item) {
    return voceDerivataDaVani(item) || isVoceSpecialeNoTotaleRiferimento(item);
  }

  function voceIdBloccataInVoci(idVoce) {
    const voce = voci.find((item) => item.idVoce === idVoce);
    return !!voce && voceBloccataInVoci(voce);
  }

  function getVoceMmRigaRisultatoPreview() {
    const formula = (voceMmRigaFormulaEl?.value || "").trim();
    const numeroParsed = Number.parseInt(voceMmRigaNumeroEl?.value || "0", 10);
    const segno = voceMmRigaSegnoEl?.checked === true;
    const misura1 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura1El?.value);
    const misura2 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura2El?.value);
    const misura3 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura3El?.value);
    const hasSemiData =
      (voceMmRigaTipoOggettoEl?.value || "").trim() !== "" ||
      (voceMmRigaSpecificaEl?.value || "").trim() !== "" ||
      (voceMmRigaMisura1El?.value || "").trim() !== "" ||
      (voceMmRigaMisura2El?.value || "").trim() !== "" ||
      (voceMmRigaMisura3El?.value || "").trim() !== "";
    const hasFormula = formula !== "";
    const tipo = hasFormula && !hasSemiData ? VOCE_MM_TIPO_MANUALE : VOCE_MM_TIPO_SEMIAUTOMATICA;
    if (!Number.isInteger(numeroParsed) || numeroParsed < 0) {
      return { ok: false, risultato: 0 };
    }
    if (tipo === VOCE_MM_TIPO_MANUALE) {
      const calc = calcolaMisurazioneVaria(formula, numeroParsed, segno);
      if (!calc.ok) return { ok: false, risultato: 0 };
      return { ok: true, risultato: calc.risultato };
    }
    const calc = calcolaMisurazioneVoceSemiautomatica(misura1, misura2, misura3, numeroParsed, segno);
    if (!calc.ok) return { ok: false, risultato: 0 };
    return { ok: true, risultato: calc.risultato };
  }

  function updateVoceMmRisultatoPreview() {
    if (!voceMmRisultatoPreviewEl) return;
    const preview = getVoceMmRigaRisultatoPreview();
    const risultato = preview.ok ? preview.risultato : 0;
    const risultatoText = Number(risultato).toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    voceMmRisultatoPreviewEl.textContent = `RISULTATO: ${risultatoText}`;
    voceMmRisultatoPreviewEl.classList.toggle("is-negativo", Number(risultato) < 0);
  }

  function normalizzaMisurazioniManualiVoce(raw, unitaVoceRaw = "") {
    if (!Array.isArray(raw)) return [];
    const unitaNorm = normalizzaUnitaVoceDetrazione(unitaVoceRaw);
    return raw
      .filter(
        (m) =>
          typeof m?.piano === "string" &&
          (typeof m?.riferimento === "string" || typeof m?.specifica === "string") &&
          typeof m?.formula === "string" &&
          (typeof m?.formulaValue === "number" || m?.formulaValue === null) &&
          typeof m?.numero === "number" &&
          Number.isInteger(m.numero) &&
          typeof m?.segno === "boolean" &&
          typeof m?.risultato === "number" &&
          Number.isFinite(m.risultato),
      )
      .map((m) => {
        const tipoNorm = normalizzaTipoMisurazioneVoce(m.tipo);
        const misura1 =
          typeof m?.misura1 === "number" && Number.isFinite(m.misura1) ? Number(m.misura1.toFixed(3)) : null;
        const misura2 =
          typeof m?.misura2 === "number" && Number.isFinite(m.misura2) ? Number(m.misura2.toFixed(3)) : null;
        const misura3 =
          typeof m?.misura3 === "number" && Number.isFinite(m.misura3) ? Number(m.misura3.toFixed(3)) : null;
        const numero = m.numero;
        const segno = m.segno === true;
        const vaniVanoId = typeof m?.vaniVanoId === "string" ? m.vaniVanoId : "";
        const camminamentiSchedaId =
          typeof m?.camminamentiSchedaId === "string" ? m.camminamentiSchedaId : "";
        const esterniKey = typeof m?.esterniKey === "string" ? m.esterniKey.trim() : "";
        const stratoAltezza =
          typeof m?.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
            ? Number(m.stratoAltezza.toFixed(3))
            : null;
        const risultatoNormalizzato =
          esterniKey !== ""
            ? Number(m.risultato || 0)
            : tipoNorm === VOCE_MM_TIPO_SEMIAUTOMATICA
              ? calcolaRisultatoSemiautomaticoPerUnita({
                  misura1,
                  misura2,
                  misura3,
                  numero,
                  segno,
                  unitaNorm,
                  vaniVanoId,
                  camminamentiSchedaId,
                  stratoAltezza,
                })
              : Number(m.risultato || 0);
        return {
        tipo: tipoNorm,
        piano: m.piano,
        riferimento: m.riferimento || m.specifica || "",
        tipoOggetto: typeof m?.tipoOggetto === "string" ? m.tipoOggetto : "",
        specifica: typeof m?.specifica === "string" ? m.specifica : "",
        formula: m.formula,
        formulaValue: m.formulaValue,
        misura1,
        misura2,
        misura3,
        canaleGronda: m?.canaleGronda === true,
        grondaCanaleValore:
          typeof m?.grondaCanaleValore === "number" && Number.isFinite(m.grondaCanaleValore)
            ? Number(m.grondaCanaleValore.toFixed(3))
            : null,
        numero,
        segno,
        risultato: risultatoNormalizzato,
        apertureCollegate: normalizzaApertureCollegateRefs(m.apertureCollegate),
        vaniVanoId,
        camminamentiSchedaId,
        esterniKey,
        stratoAltezza,
        stratoElevazione:
          typeof m?.stratoElevazione === "number" && Number.isFinite(m.stratoElevazione)
            ? Number(m.stratoElevazione.toFixed(3))
            : null,
        stratoNumero:
          typeof m?.stratoNumero === "number" && Number.isFinite(m.stratoNumero) ? m.stratoNumero : null,
      };
    });
  }

  function calcolaMetricheAperturaMisurazione(apertura, m2AltVal, m3Val, stratoElevazioneVal = null) {
    const m2 = typeof m2AltVal === "number" && Number.isFinite(m2AltVal) ? m2AltVal : null;
    const m3 = typeof m3Val === "number" && Number.isFinite(m3Val) ? m3Val : 0;
    const largh = Number(apertura?.largh || 0);
    const hInclusaRaw =
      m2 === null
        ? null
        : altezzaInclusaNelloStratoConElevazione(
            typeof stratoElevazioneVal === "number" && Number.isFinite(stratoElevazioneVal)
              ? stratoElevazioneVal
              : 0,
            m2,
            apertura,
          );
    const hInclusa = Number((hInclusaRaw ?? 0).toFixed(2));
    const ml = Number((largh || 0).toFixed(2));
    const mq = Number((largh * hInclusa).toFixed(2));
    const mc = Number((mq * m3).toFixed(2));
    return { hInclusa, ml, mq, mc };
  }

  function normalizzaUnitaVoceDetrazione(unitaRaw) {
    return String(unitaRaw || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\./g, "");
  }

  function calcolaDetrazioneApertureMisurazione(misurazione, unitaNorm) {
    const mmTipo = normalizzaTipoMisurazioneVoce(misurazione?.tipo);
    if (mmTipo !== VOCE_MM_TIPO_SEMIAUTOMATICA) return 0;
    const misura2Val =
      typeof misurazione?.stratoAltezza === "number" && Number.isFinite(misurazione.stratoAltezza)
        ? Number(misurazione.stratoAltezza)
        : typeof misurazione?.misura2 === "number" && Number.isFinite(misurazione.misura2)
          ? Number(misurazione.misura2)
        : null;
    const misura3Val =
      typeof misurazione?.misura3 === "number" && Number.isFinite(misurazione.misura3)
        ? Number(misurazione.misura3)
        : null;
    let sumMq = 0;
    let sumMc = 0;
    let sumMl = 0;
    const aperture = risolviApertureCollegateRefs(misurazione?.apertureCollegate);
    aperture.forEach((apertura) => {
      const metric = calcolaMetricheAperturaMisurazione(
        apertura,
        misura2Val,
        misura3Val,
        typeof misurazione?.stratoElevazione === "number" && Number.isFinite(misurazione.stratoElevazione)
          ? Number(misurazione.stratoElevazione)
          : null,
      );
      sumMq += Number(metric.mq || 0);
      sumMc += Number(metric.mc || 0);
      sumMl += Number(metric.ml || 0);
    });
    if (unitaNorm.includes("mc")) return Number(sumMc.toFixed(2));
    if (unitaNorm.includes("mq")) return Number(sumMq.toFixed(2));
    if (unitaNorm.includes("ml")) return Number(sumMl.toFixed(2));
    return 0;
  }

  function calcolaDetrazioneApertureVoce(item, mmRows) {
    const mm = Array.isArray(mmRows)
      ? mmRows
      : normalizzaMisurazioniManualiVoce(item?.misurazioniManuali, item?.unitaMisura);
    const unitaNorm = normalizzaUnitaVoceDetrazione(item?.unitaMisura);
    const detrazione = mm.reduce(
      (sum, m) => sum + calcolaDetrazioneApertureMisurazione(m, unitaNorm),
      0,
    );
    return Number(detrazione.toFixed(2));
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
        misurazioniManuali: normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura),
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

  function loadApertureMaster() {
    try {
      const raw = localStorage.getItem(STORAGE_APERTURE_MASTER);
      if (!raw) {
        apertureMaster = [];
        apertureMasterIdCounter = 1;
        return;
      }
      const parsed = JSON.parse(raw);
      apertureMaster = normalizzaApertureMaster(parsed);
      apertureMasterIdCounter =
        apertureMaster.reduce((max, ap) => {
          const n = Number(String(ap.idAperturaMaster || "").replace("APM-", ""));
          return Number.isFinite(n) ? Math.max(max, n) : max;
        }, 0) + 1;
    } catch {
      apertureMaster = [];
      apertureMasterIdCounter = 1;
    }
  }

  function migraApertureCollegateVociSuMaster() {
    let changed = false;
    voci = voci.map((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura).map((row) => {
        const refs = normalizzaApertureCollegateRefs(row.apertureCollegate);
        if (JSON.stringify(refs) !== JSON.stringify(row.apertureCollegate || [])) changed = true;
        return { ...row, apertureCollegate: refs };
      });
      return { ...voce, misurazioniManuali: mm };
    });
    if (changed) {
      saveApertureMaster();
      saveVoci();
    }
  }

  function openApertureMasterDialog() {
    const renderOptions = (field, current, options) =>
      options
        .map(
          (opt) =>
            `<option value="${escapeHtml(opt)}" ${current === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`,
        )
        .join("");
    const buildEditableMasterRow = (idRow, ap) => `<tr class="row-edit-master-apertura" data-editing-id="${escapeHtml(idRow)}">
            <td>${escapeHtml(idRow === "__new__" ? "Nuova" : idRow)}</td>
            <td><input type="text" data-master-field="piano" value="${escapeHtml(String(ap.piano ?? ""))}" placeholder="Piano" /></td>
            <td><input type="text" data-master-field="locale" value="${escapeHtml(ap.locale)}" /></td>
            <td><input type="number" step="0.01" min="0" data-master-field="largh" value="${escapeHtml(String(ap.largh))}" /></td>
            <td><input type="number" step="0.01" min="0" data-master-field="alt" value="${escapeHtml(String(ap.alt))}" /></td>
            <td><input type="number" step="0.01" min="0" data-master-field="hDav" value="${escapeHtml(String(ap.hDav))}" /></td>
            <td><input type="number" step="1" min="0" data-master-field="ante" value="${escapeHtml(String(ap.ante))}" /></td>
            <td>
              <select data-master-field="tipologia">
                ${renderOptions("tipologia", ap.tipologia, ["FINESTRA","PORTA FINESTRA","BOCCA LUPO","FIN CANTINA","PORTONCINO","PORTA CANTINA","PORTA REI","PORTA INTERNA","SCRIGNO","BASCULANTE","SEZIONALE"])}
              </select>
            </td>
            <td><select data-master-field="falso">${renderOptions("falso", ap.falso, ["NO","ALLUMINIO","LEGNO"])}</select></td>
            <td><select data-master-field="scuro">${renderOptions("scuro", ap.scuro, ["NO","PERSIANA","TAPPARELLA"])}</select></td>
            <td><select data-master-field="inferiata">${renderOptions("inferiata", ap.inferiata, ["NO","SI"])}</select></td>
            <td><select data-master-field="zanzariera">${renderOptions("zanzariera", ap.zanzariera, ["NO","SI"])}</select></td>
            <td class="actions-cell">
              <button type="button" class="btn-action btn-secondary" data-action="${idRow === "__new__" ? "save-new-master-apertura-inline" : "save-master-apertura-inline"}" data-id="${escapeHtml(idRow)}">✓</button>
              <button type="button" class="btn-action btn-delete" data-action="cancel-edit-master-apertura" data-id="${escapeHtml(idRow)}">✕</button>
            </td>
          </tr>`;
    const righe = apertureMaster
      .map(
        (ap) => {
          const isEditing = apertureMasterEditingId === ap.idAperturaMaster;
          if (!isEditing) {
            return `<tr>
              <td>${escapeHtml(ap.idAperturaMaster)}</td>
              <td>${escapeHtml(ap.piano || "—")}</td>
              <td>${escapeHtml(ap.locale)}</td>
              <td>${fmt2(ap.largh)}</td>
              <td>${fmt2(ap.alt)}</td>
              <td>${fmt2(ap.hDav)}</td>
              <td>${escapeHtml(String(ap.ante))}</td>
              <td>${escapeHtml(ap.tipologia)}</td>
              <td>${escapeHtml(ap.falso)}</td>
              <td>${escapeHtml(ap.scuro)}</td>
              <td>${escapeHtml(ap.inferiata)}</td>
              <td>${escapeHtml(ap.zanzariera)}</td>
              <td class="actions-cell">
                <button type="button" class="btn-action btn-edit" data-action="edit-master-apertura" data-id="${escapeHtml(ap.idAperturaMaster)}">✎</button>
                <button type="button" class="btn-action btn-delete" data-action="delete-master-apertura" data-id="${escapeHtml(ap.idAperturaMaster)}">🗑</button>
              </td>
            </tr>`;
          }
          return buildEditableMasterRow(ap.idAperturaMaster, ap);
        },
      )
      .join("");
    const newRow = apertureMasterEditingId === "__new__"
      ? buildEditableMasterRow("__new__", {
          piano: "",
          locale: "",
          largh: "",
          alt: "",
          hDav: "0",
          ante: "1",
          tipologia: "FINESTRA",
          falso: "NO",
          scuro: "NO",
          inferiata: "NO",
          zanzariera: "NO",
        })
      : "";
    apertureMasterDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio APERTURE</h3></div>
      </form>
      <div style="padding:8px;">
        <button type="button" class="btn-action btn-secondary" data-action="new-master-apertura">Nuova apertura</button>
      </div>
      <div class="ifc-riepilogo-table-host">
        <table class="table-voce-mm-inline aperture-master-table">
          <thead><tr><th>ID</th><th>PIANO</th><th>LOCALE</th><th>LRGH</th><th>ALT</th><th>HDAV</th><th>ANTE</th><th>TIPOLOGIA</th><th>FALSO</th><th>SCURO</th><th>INFERIATA</th><th>ZANZARIERA</th><th>AZIONI</th></tr></thead>
          <tbody>${righe || ""}${newRow || (righe ? "" : `<tr><td colspan="13" class="empty-cell">Nessuna apertura in archivio.</td></tr>`)}</tbody>
        </table>
      </div>
      <div style="padding:8px;display:flex;justify-content:flex-end;">
        <button type="button" class="btn-action btn-secondary" data-action="close-master-aperture">Chiudi</button>
      </div>
    `;
    apertureMasterDialogEl.showModal();
  }

  function readAperturaMasterInlineDraft(idAperturaMaster) {
    const row = apertureMasterDialogEl.querySelector(
      `tr.row-edit-master-apertura[data-editing-id="${idAperturaMaster}"]`,
    );
    if (!row) return null;
    const getValue = (field) =>
      String(row.querySelector(`[data-master-field="${field}"]`)?.value || "").trim();
    const parsed = parseVoceMmAperturaDraft({
      locale: getValue("locale"),
      largh: getValue("largh"),
      alt: getValue("alt"),
      hDav: getValue("hDav"),
      ante: getValue("ante"),
      tipologia: getValue("tipologia"),
      falso: getValue("falso"),
      scuro: getValue("scuro"),
      inferiata: getValue("inferiata"),
      zanzariera: getValue("zanzariera"),
    });
    if (!parsed) return null;
    return { ...parsed, piano: getValue("piano") };
  }

  function eliminaAperturaMaster(id) {
    apertureMaster = apertureMaster.filter((ap) => ap.idAperturaMaster !== id);
    voci = voci.map((voce) => ({
      ...voce,
      misurazioniManuali: normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura).map((mm) => ({
        ...mm,
        apertureCollegate: normalizzaApertureCollegateRefs(mm.apertureCollegate).filter(
          (ref) => ref.idAperturaMaster !== id,
        ),
      })),
    }));
    apertureMasterPendingDeleteId = null;
    saveApertureMaster();
    saveVoci();
    syncVoceDavanzali();
    syncVoceSoglie();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
    openApertureMasterDialog();
  }

  function collegaAperturaMasterARigaVoce(idVoce, idx, idAperturaMaster) {
    voci = voci.map((item) => {
      if (item.idVoce !== idVoce) return item;
      const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
      if (idx < 0 || idx >= mm.length) return item;
      const row = mm[idx];
      const refs = normalizzaApertureCollegateRefs(row.apertureCollegate);
      mm[idx] = { ...row, apertureCollegate: [...refs, { idAperturaMaster }] };
      return { ...item, misurazioniManuali: mm };
    });
    saveVoci();
    renderVoci();
  }

  function openUseAperturaDialog(idVoce, mmIndex) {
    voceMmUseAperturaContext = { idVoce, mmIndex };
    const rows = apertureMaster
      .map(
        (ap) =>
          `<tr data-apertura-master-id="${escapeHtml(ap.idAperturaMaster)}">
            <td>${escapeHtml(ap.idAperturaMaster)}</td>
            <td>${escapeHtml(ap.piano || "—")}</td>
            <td>${escapeHtml(ap.locale)}</td>
            <td>${fmt2(ap.largh)}</td>
            <td>${fmt2(ap.alt)}</td>
            <td>${fmt2(ap.hDav)}</td>
            <td>${escapeHtml(String(ap.ante))}</td>
            <td>${escapeHtml(ap.tipologia)}</td>
            <td><button type="button" class="btn-action btn-secondary" data-action="use-apertura-master" data-id="${escapeHtml(ap.idAperturaMaster)}">Usa</button></td>
          </tr>`,
      )
      .join("");
    useAperturaDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Seleziona apertura da archivio</h3></div>
      </form>
      <div class="ifc-riepilogo-table-host">
        <table class="table-voce-mm-inline">
          <thead><tr><th>ID</th><th>PIANO</th><th>LOCALE</th><th>LRGH</th><th>ALT</th><th>HDAV</th><th>ANTE</th><th>TIPOLOGIA</th><th>AZIONI</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="9" class="empty-cell">Archivio APERTURE vuoto.</td></tr>`}</tbody>
        </table>
      </div>
      <div style="padding:8px;display:flex;justify-content:flex-end;">
        <button type="button" class="btn-action btn-secondary" data-action="close-use-apertura-dialog">Chiudi</button>
      </div>
    `;
    useAperturaDialogEl.showModal();
  }

  function buildArchivioGrondeRows() {
    const rows = [];
    voci.forEach((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        if (riga?.canaleGronda !== true) return;
        const grondaVal =
          typeof riga?.grondaCanaleValore === "number" && Number.isFinite(riga.grondaCanaleValore)
            ? Number(riga.grondaCanaleValore)
            : null;
        if (grondaVal === null) return;
        const riferimento = String(riga?.riferimento || "").trim() || "-";
        const piano = String(riga?.piano || "").trim() || "-";
        rows.push({ piano, riferimento, gronda: grondaVal });
      });
    });
    return rows;
  }

  function openArchivioGrondeDialog() {
    const rows = buildArchivioGrondeRows();
    const righeHtml =
      rows.length === 0
        ? `<tr><td colspan="2" class="empty-cell">Nessuna gronda in archivio.</td></tr>`
        : rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.riferimento)}</td>
                <td>${escapeHtml(fmt2(row.gronda))}</td>
              </tr>`,
            )
            .join("");
    grondeDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio GRONDE</h3></div>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>RIFERIMENTO</th><th>GRONDA</th></tr></thead>
            <tbody>${righeHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="close-gronde-dialog">Chiudi</button>
        </div>
      </form>
    `;
    grondeDialogEl.showModal();
  }

  function buildArchivioFalsiTelaiRows() {
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, altezza: number, aggiunta: number }>} */
    const map = new Map();
    voci.forEach((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          if (String(apertura?.falso || "").trim().toUpperCase() !== "LEGNO") return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const altezza = Number(apertura?.alt || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              piano,
              locale,
              larghezza,
              altezza,
              aggiunta:
                typeof falsiTelaiLegnoAggiunteByKey[key] === "number" &&
                Number.isFinite(falsiTelaiLegnoAggiunteByKey[key])
                  ? Number(falsiTelaiLegnoAggiunteByKey[key].toFixed(2))
                  : 0.1,
            });
          }
        });
      });
    });
    return [...map.values()].sort((a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale));
  }

  function openArchivioFalsiTelaiDialog() {
    const rows = buildArchivioFalsiTelaiRows();
    const righeHtml =
      rows.length === 0
        ? `<tr><td colspan="5" class="empty-cell">Nessun falso telaio legno in archivio.</td></tr>`
        : rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.piano)}</td>
                <td>${escapeHtml(row.locale)}</td>
                <td>${escapeHtml(fmt2(row.larghezza))}</td>
                <td>${escapeHtml(fmt2(row.altezza))}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(fmt2(row.aggiunta))}"
                    data-action="change-falsi-telai-aggiunta"
                    data-key="${escapeHtml(row.key)}"
                    class="voce-mm-ap-input"
                    style="max-width:90px;"
                  />
                </td>
              </tr>`,
            )
            .join("");
    falsiTelaiDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio FALSI TELAI LEGNO</h3></div>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>PIANO</th><th>LOCALE</th><th>LARGHEZZA</th><th>ALTEZZA</th><th>AGGIUNTA</th></tr></thead>
            <tbody>${righeHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="close-falsi-telai-dialog">Chiudi</button>
        </div>
      </form>
    `;
    falsiTelaiDialogEl.showModal();
  }

  function buildArchivioFalsiTelaiAlluminioRows() {
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, altezza: number, aggiunta: number }>} */
    const map = new Map();
    voci.forEach((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          if (String(apertura?.falso || "").trim().toUpperCase() !== "ALLUMINIO") return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const altezza = Number(apertura?.alt || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              piano,
              locale,
              larghezza,
              altezza,
              aggiunta:
                typeof falsiTelaiAlluminioAggiunteByKey[key] === "number" &&
                Number.isFinite(falsiTelaiAlluminioAggiunteByKey[key])
                  ? Number(falsiTelaiAlluminioAggiunteByKey[key].toFixed(2))
                  : 0.1,
            });
          }
        });
      });
    });
    return [...map.values()].sort((a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale));
  }

  function openArchivioFalsiTelaiAlluminioDialog() {
    const rows = buildArchivioFalsiTelaiAlluminioRows();
    const righeHtml =
      rows.length === 0
        ? `<tr><td colspan="5" class="empty-cell">Nessun falso telaio alluminio in archivio.</td></tr>`
        : rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.piano)}</td>
                <td>${escapeHtml(row.locale)}</td>
                <td>${escapeHtml(fmt2(row.larghezza))}</td>
                <td>${escapeHtml(fmt2(row.altezza))}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(fmt2(row.aggiunta))}"
                    data-action="change-falsi-telai-alluminio-aggiunta"
                    data-key="${escapeHtml(row.key)}"
                    class="voce-mm-ap-input"
                    style="max-width:90px;"
                  />
                </td>
              </tr>`,
            )
            .join("");
    falsiTelaiAllDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio FALSI TELAI ALLUMINIO</h3></div>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>PIANO</th><th>LOCALE</th><th>LARGHEZZA</th><th>ALTEZZA</th><th>AGGIUNTA</th></tr></thead>
            <tbody>${righeHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="close-falsi-telai-alluminio-dialog">Chiudi</button>
        </div>
      </form>
    `;
    falsiTelaiAllDialogEl.showModal();
  }

  function openRiepilogoParetiFlagDialog({
    dialogEl,
    rows,
    titolo,
    descrizione,
    emptyMessage,
    closeAction,
  }) {
    /** @type {Map<string, typeof rows>} */
    const byPiano = new Map();
    for (const row of rows) {
      if (!byPiano.has(row.piano)) byPiano.set(row.piano, []);
      byPiano.get(row.piano).push(row);
    }
    const fmtDim = (v) => (typeof v === "number" && Number.isFinite(v) ? fmt2(v) : "—");
    let tbodyHtml = "";
    if (rows.length === 0) {
      tbodyHtml = `<tr><td colspan="6" class="empty-cell">${escapeHtml(emptyMessage)}</td></tr>`;
    } else {
      for (const [piano, pianoRows] of byPiano) {
        tbodyHtml += `<tr class="bim-props-section-row"><td colspan="6">${escapeHtml(`PIANO: ${piano}`)}</td></tr>`;
        tbodyHtml += pianoRows
          .map(
            (row) => `<tr>
              <td>${escapeHtml(row.locale)}</td>
              <td>${escapeHtml(row.riferimento)}</td>
              <td>${escapeHtml(fmtDim(row.lunghezza))}</td>
              <td>${escapeHtml(fmtDim(row.altezza))}</td>
              <td>${escapeHtml(fmtDim(row.mqLordi))}</td>
              <td>${escapeHtml(fmtDim(row.mqNetti))}</td>
            </tr>`,
          )
          .join("");
      }
    }
    dialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>${escapeHtml(titolo)}</h3></div>
        <p style="padding:0 8px 8px;margin:0;font-size:0.9rem;opacity:0.85;">
          ${escapeHtml(descrizione)}
        </p>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>LOCALE</th><th>PARETE</th><th>LUNGHEZZA</th><th>ALTEZZA</th><th>MQ LORDI</th><th>MQ NETTI</th></tr></thead>
            <tbody>${tbodyHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="${escapeHtml(closeAction)}">Chiudi</button>
        </div>
      </form>
    `;
    dialogEl.showModal();
  }

  function openRiepilogoRivestimentiDialog() {
    openRiepilogoParetiFlagDialog({
      dialogEl: rivestimentiDialogEl,
      rows: buildRivestimentiRowsFromStorage(),
      titolo: "RIVESTIMENTI",
      descrizione:
        "Pareti con flag Rivestimento attivo. MQ lordi = L×H; MQ netti = lordi − aperture.",
      emptyMessage: "Nessuna parete con rivestimento nei vani registrati.",
      closeAction: "close-rivestimenti-dialog",
    });
  }

  function openRiepilogoIntonacoRusticoDialog() {
    openRiepilogoParetiFlagDialog({
      dialogEl: intonacoRusticoDialogEl,
      rows: buildIntonacoRusticoRowsFromStorage(),
      titolo: "INTONACO RUSTICO",
      descrizione:
        "Pareti con flag Rustico attivo. MQ lordi = L×H; MQ netti = lordi − aperture.",
      emptyMessage: "Nessuna parete con rustico nei vani registrati.",
      closeAction: "close-intonaco-rustico-dialog",
    });
  }

  function openRiepilogoIntonacoCivileDialog() {
    openRiepilogoParetiFlagDialog({
      dialogEl: intonacoCivileDialogEl,
      rows: buildIntonacoCivileRowsFromStorage(),
      titolo: "INTONACO CIVILE",
      descrizione:
        "Pareti con flag Civile attivo. MQ lordi = L×H; MQ netti = lordi − aperture.",
      emptyMessage: "Nessuna parete con civile nei vani registrati.",
      closeAction: "close-intonaco-civile-dialog",
    });
  }

  function openRiepilogoZoccoloDialog() {
    openRiepilogoParetiFlagDialog({
      dialogEl: zoccoloDialogEl,
      rows: buildZoccoloRowsFromStorage(),
      titolo: "ZOCCOLO",
      descrizione:
        "Pareti con flag Zoccolo attivo. MQ lordi = L×H; MQ netti = lordi − aperture.",
      emptyMessage: "Nessuna parete con zoccolo nei vani registrati.",
      closeAction: "close-zoccolo-dialog",
    });
  }

  function buildArchivioDavanzaliRows() {
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, sbordo: number }>} */
    const map = new Map();
    voci.forEach((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          const hDav = Number(apertura?.hDav || 0);
          if (!(hDav > 0)) return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              piano,
              locale,
              larghezza,
              sbordo:
                typeof davanzaliSbordiByKey[key] === "number" && Number.isFinite(davanzaliSbordiByKey[key])
                  ? Number(davanzaliSbordiByKey[key].toFixed(2))
                  : 0.05,
            });
          }
        });
      });
    });
    return [...map.values()].sort((a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale));
  }

  function trovaVoceDavanzali() {
    return voci.find(
      (item) =>
        String(item?.voceAbbreviata || "").trim().toUpperCase() === "DAVANZALI" ||
        String(item?.voce || "").trim().toUpperCase() === "DAVANZALI",
    );
  }

  function trovaVoceSoglie() {
    return voci.find(
      (item) =>
        String(item?.voceAbbreviata || "").trim().toUpperCase() === "SOGLIE" ||
        String(item?.voce || "").trim().toUpperCase() === "SOGLIE",
    );
  }

  function trovaVoceCanali() {
    return voci.find(
      (item) =>
        String(item?.voceAbbreviata || "").trim().toUpperCase() === "CANALI" ||
        String(item?.voce || "").trim().toUpperCase() === "CANALI",
    );
  }

  function trovaVoceFalsiTelaiLegno() {
    return voci.find(
      (item) =>
        String(item?.voceAbbreviata || "").trim().toUpperCase() === "FALSI TELAI LEGNO" ||
        String(item?.voce || "").trim().toUpperCase() === "FALSI TELAI LEGNO",
    );
  }

  function trovaVoceFalsiTelaiAlluminio() {
    return voci.find(
      (item) =>
        String(item?.voceAbbreviata || "").trim().toUpperCase() === "FALSI TELAI ALLUMINIO" ||
        String(item?.voce || "").trim().toUpperCase() === "FALSI TELAI ALLUMINIO",
    );
  }

  function nextVoceMmIdForRows(rows) {
    const maxId = (Array.isArray(rows) ? rows : []).reduce(
      (max, row) =>
        typeof row?.idMisurazione === "number" && Number.isFinite(row.idMisurazione)
          ? Math.max(max, row.idMisurazione)
          : max,
      0,
    );
    return maxId + 1;
  }

  function isVoceSpecialeNoTotaleRiferimento(voceItem) {
    const abbrev = String(voceItem?.voceAbbreviata || "").trim().toUpperCase();
    return (
      abbrev === "DAVANZALI" ||
      abbrev === "SOGLIE" ||
      abbrev === "CANALI" ||
      abbrev === "FALSI TELAI LEGNO" ||
      abbrev === "FALSI TELAI ALLUMINIO"
    );
  }

  function syncVoceDavanzali() {
    let voceDavanzali = trovaVoceDavanzali();
    const voceDavanzaliId = voceDavanzali?.idVoce ?? null;
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, sbordo: number }>} */
    const mapRighe = new Map();
    voci.forEach((voce) => {
      if (voceDavanzaliId !== null && voce.idVoce === voceDavanzaliId) return;
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          const hDav = Number(apertura?.hDav || 0);
          if (!(hDav > 0)) return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!mapRighe.has(key)) {
            mapRighe.set(key, {
              key,
              piano,
              locale,
              larghezza,
              sbordo:
                typeof davanzaliSbordiByKey[key] === "number" && Number.isFinite(davanzaliSbordiByKey[key])
                  ? Number(davanzaliSbordiByKey[key].toFixed(2))
                  : 0.05,
            });
          }
        });
      });
    });
    const righeDavanzali = [...mapRighe.values()].sort(
      (a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale),
    );

    if (!voceDavanzali && righeDavanzali.length > 0) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata: "DAVANZALI",
        unitaMisura: UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: 0,
        tipoMisura: TIPOMISURA_VOCE_MANUALE,
        voce: "DAVANZALI",
        note: "",
        misurazioniManuali: [],
      });
      normalizzaPosizioniVoci();
      voceDavanzali = voci.find((item) => item.idVoce === newId) || null;
    }

    if (!voceDavanzali) return;

    const mmEsistenti = normalizzaMisurazioniManualiVoce(
      voceDavanzali.misurazioniManuali,
      voceDavanzali.unitaMisura,
    );
    let nextMmId = nextVoceMmIdForRows(mmEsistenti);
    const nuoveMisurazioni = righeDavanzali.map((row) => {
      const sbordo = Number(Number(row.sbordo || 0.05).toFixed(2));
      const largh = Number(Number(row.larghezza || 0).toFixed(2));
      const formula = `${fmt2(largh)} + ${fmt2(sbordo)} + ${fmt2(sbordo)}`;
      const calc = calcolaMisurazioneVaria(formula, 1, false);
      const riferimento = String(row.locale || "").trim() || "-";
      const risultato = calc.ok ? calc.risultato : Number((largh + sbordo + sbordo).toFixed(2));
      const formulaValue = calc.ok ? calc.formulaValue : Number((largh + sbordo + sbordo).toFixed(2));
      return {
        idMisurazione: nextMmId++,
        tipo: VOCE_MM_TIPO_MANUALE,
        piano: String(row.piano || "").trim() || "-",
        riferimento,
        formula,
        formulaValue,
        numero: 1,
        segno: false,
        risultato,
        apertureCollegate: [],
      };
    });

    voci = voci.map((item) =>
      item.idVoce === voceDavanzali.idVoce
        ? {
            ...item,
            voceAbbreviata: "DAVANZALI",
            voce: "DAVANZALI",
            tipoMisura: TIPOMISURA_VOCE_MANUALE,
            misurazioniManuali: nuoveMisurazioni,
          }
        : item,
    );

    saveVoci();
    renderVoci();
  }

  function syncVoceSoglie() {
    let voceSoglie = trovaVoceSoglie();
    const voceSoglieId = voceSoglie?.idVoce ?? null;
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, sbordo: number }>} */
    const mapRighe = new Map();
    voci.forEach((voce) => {
      if (voceSoglieId !== null && voce.idVoce === voceSoglieId) return;
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          const hDav = Number(apertura?.hDav || 0);
          if (Math.abs(hDav) > 0.0001) return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!mapRighe.has(key)) {
            mapRighe.set(key, {
              key,
              piano,
              locale,
              larghezza,
              sbordo:
                typeof soglieSbordiByKey[key] === "number" && Number.isFinite(soglieSbordiByKey[key])
                  ? Number(soglieSbordiByKey[key].toFixed(2))
                  : 0.05,
            });
          }
        });
      });
    });
    const righeSoglie = [...mapRighe.values()].sort(
      (a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale),
    );

    if (!voceSoglie && righeSoglie.length > 0) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata: "SOGLIE",
        unitaMisura: UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: 0,
        tipoMisura: TIPOMISURA_VOCE_MANUALE,
        voce: "SOGLIE",
        note: "",
        misurazioniManuali: [],
      });
      normalizzaPosizioniVoci();
      voceSoglie = voci.find((item) => item.idVoce === newId) || null;
    }

    if (!voceSoglie) return;

    const mmEsistenti = normalizzaMisurazioniManualiVoce(
      voceSoglie.misurazioniManuali,
      voceSoglie.unitaMisura,
    );
    let nextMmId = nextVoceMmIdForRows(mmEsistenti);
    const nuoveMisurazioni = righeSoglie.map((row) => {
      const sbordo = Number(Number(row.sbordo || 0.05).toFixed(2));
      const largh = Number(Number(row.larghezza || 0).toFixed(2));
      const formula = `${fmt2(largh)} + ${fmt2(sbordo)} + ${fmt2(sbordo)}`;
      const calc = calcolaMisurazioneVaria(formula, 1, false);
      const riferimento = String(row.locale || "").trim() || "-";
      const risultato = calc.ok ? calc.risultato : Number((largh + sbordo + sbordo).toFixed(2));
      const formulaValue = calc.ok ? calc.formulaValue : Number((largh + sbordo + sbordo).toFixed(2));
      return {
        idMisurazione: nextMmId++,
        tipo: VOCE_MM_TIPO_MANUALE,
        piano: String(row.piano || "").trim() || "-",
        riferimento,
        formula,
        formulaValue,
        numero: 1,
        segno: false,
        risultato,
        apertureCollegate: [],
      };
    });

    voci = voci.map((item) =>
      item.idVoce === voceSoglie.idVoce
        ? {
            ...item,
            voceAbbreviata: "SOGLIE",
            voce: "SOGLIE",
            tipoMisura: TIPOMISURA_VOCE_MANUALE,
            misurazioniManuali: nuoveMisurazioni,
          }
        : item,
    );

    saveVoci();
    renderVoci();
  }

  function syncVoceCanali() {
    let voceCanali = trovaVoceCanali();
    const voceCanaliId = voceCanali?.idVoce ?? null;
    /** @type {{ piano: string, riferimento: string, gronda: number }[]} */
    const rows = [];
    voci.forEach((voce) => {
      if (voceCanaliId !== null && voce.idVoce === voceCanaliId) return;
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        if (riga?.canaleGronda !== true) return;
        const grondaVal =
          typeof riga?.grondaCanaleValore === "number" && Number.isFinite(riga.grondaCanaleValore)
            ? Number(riga.grondaCanaleValore)
            : null;
        if (grondaVal === null) return;
        rows.push({
          piano: String(riga?.piano || "").trim() || "-",
          riferimento: String(riga?.riferimento || "").trim() || "-",
          gronda: Number(grondaVal.toFixed(2)),
        });
      });
    });

    if (!voceCanali && rows.length > 0) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata: "CANALI",
        unitaMisura: UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: 0,
        tipoMisura: TIPOMISURA_VOCE_MANUALE,
        voce: "CANALI",
        note: "",
        misurazioniManuali: [],
      });
      normalizzaPosizioniVoci();
      voceCanali = voci.find((item) => item.idVoce === newId) || null;
    }

    if (!voceCanali) return;

    const mmEsistenti = normalizzaMisurazioniManualiVoce(
      voceCanali.misurazioniManuali,
      voceCanali.unitaMisura,
    );
    let nextMmId = nextVoceMmIdForRows(mmEsistenti);
    const nuoveMisurazioni = rows.map((row) => {
      const formula = fmt2(row.gronda);
      const calc = calcolaMisurazioneVaria(formula, 1, false);
      const risultato = calc.ok ? calc.risultato : Number(row.gronda.toFixed(2));
      const formulaValue = calc.ok ? calc.formulaValue : Number(row.gronda.toFixed(2));
      return {
        idMisurazione: nextMmId++,
        tipo: VOCE_MM_TIPO_MANUALE,
        piano: row.piano,
        riferimento: row.riferimento,
        formula,
        formulaValue,
        numero: 1,
        segno: false,
        risultato,
        apertureCollegate: [],
      };
    });

    voci = voci.map((item) =>
      item.idVoce === voceCanali.idVoce
        ? {
            ...item,
            voceAbbreviata: "CANALI",
            voce: "CANALI",
            tipoMisura: TIPOMISURA_VOCE_MANUALE,
            misurazioniManuali: nuoveMisurazioni,
          }
        : item,
    );

    saveVoci();
    renderVoci();
  }

  function syncVoceFalsiTelaiLegno() {
    let voceFalsi = trovaVoceFalsiTelaiLegno();
    const voceFalsiId = voceFalsi?.idVoce ?? null;
    /** @type {Map<string, { key: string, piano: string, riferimento: string, larghezza: number, altezza: number, aggiunta: number }>} */
    const mapRows = new Map();
    voci.forEach((voce) => {
      if (voceFalsiId !== null && voce.idVoce === voceFalsiId) return;
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          if (String(apertura?.falso || "").trim().toUpperCase() !== "LEGNO") return;
          const riferimento = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const altezza = Number(apertura?.alt || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${riferimento}|i:${idx}`;
          if (!mapRows.has(key)) {
            mapRows.set(key, {
              key,
              piano,
              riferimento,
              larghezza,
              altezza,
              aggiunta:
                typeof falsiTelaiLegnoAggiunteByKey[key] === "number" &&
                Number.isFinite(falsiTelaiLegnoAggiunteByKey[key])
                  ? Number(falsiTelaiLegnoAggiunteByKey[key].toFixed(2))
                  : 0.1,
            });
          }
        });
      });
    });
    const rows = [...mapRows.values()].sort(
      (a, b) => a.piano.localeCompare(b.piano) || a.riferimento.localeCompare(b.riferimento),
    );

    if (!voceFalsi && rows.length > 0) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata: "FALSI TELAI LEGNO",
        unitaMisura: UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: 0,
        tipoMisura: TIPOMISURA_VOCE_MANUALE,
        voce: "FALSI TELAI LEGNO",
        note: "",
        misurazioniManuali: [],
      });
      normalizzaPosizioniVoci();
      voceFalsi = voci.find((item) => item.idVoce === newId) || null;
    }

    if (!voceFalsi) return;

    const mmEsistenti = normalizzaMisurazioniManualiVoce(
      voceFalsi.misurazioniManuali,
      voceFalsi.unitaMisura,
    );
    let nextMmId = nextVoceMmIdForRows(mmEsistenti);
    const nuoveMisurazioni = rows.map((row) => {
      const larg = Number(Number(row.larghezza || 0).toFixed(2));
      const alt = Number(Number(row.altezza || 0).toFixed(2));
      const agg = Number(Number(row.aggiunta || 0.1).toFixed(2));
      const formula = `(${fmt2(larg)} + ${fmt2(agg)}) + 2 * (${fmt2(alt)} + ${fmt2(agg)})`;
      const calc = calcolaMisurazioneVaria(formula, 1, false);
      const risultato = calc.ok ? calc.risultato : Number(((larg + agg) + 2 * (alt + agg)).toFixed(2));
      const formulaValue = calc.ok ? calc.formulaValue : Number(((larg + agg) + 2 * (alt + agg)).toFixed(2));
      return {
        idMisurazione: nextMmId++,
        tipo: VOCE_MM_TIPO_MANUALE,
        piano: row.piano,
        riferimento: row.riferimento,
        formula,
        formulaValue,
        numero: 1,
        segno: false,
        risultato,
        apertureCollegate: [],
      };
    });

    voci = voci.map((item) =>
      item.idVoce === voceFalsi.idVoce
        ? {
            ...item,
            voceAbbreviata: "FALSI TELAI LEGNO",
            voce: "FALSI TELAI LEGNO",
            tipoMisura: TIPOMISURA_VOCE_MANUALE,
            misurazioniManuali: nuoveMisurazioni,
          }
        : item,
    );

    saveVoci();
    renderVoci();
  }

  function syncVoceFalsiTelaiAlluminio() {
    let voceFalsi = trovaVoceFalsiTelaiAlluminio();
    const voceFalsiId = voceFalsi?.idVoce ?? null;
    /** @type {Map<string, { key: string, piano: string, riferimento: string, larghezza: number, altezza: number, aggiunta: number }>} */
    const mapRows = new Map();
    voci.forEach((voce) => {
      if (voceFalsiId !== null && voce.idVoce === voceFalsiId) return;
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          if (String(apertura?.falso || "").trim().toUpperCase() !== "ALLUMINIO") return;
          const riferimento = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const altezza = Number(apertura?.alt || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${riferimento}|i:${idx}`;
          if (!mapRows.has(key)) {
            mapRows.set(key, {
              key,
              piano,
              riferimento,
              larghezza,
              altezza,
              aggiunta:
                typeof falsiTelaiAlluminioAggiunteByKey[key] === "number" &&
                Number.isFinite(falsiTelaiAlluminioAggiunteByKey[key])
                  ? Number(falsiTelaiAlluminioAggiunteByKey[key].toFixed(2))
                  : 0.1,
            });
          }
        });
      });
    });
    const rows = [...mapRows.values()].sort(
      (a, b) => a.piano.localeCompare(b.piano) || a.riferimento.localeCompare(b.riferimento),
    );

    if (!voceFalsi && rows.length > 0) {
      const newId = voceIdCounter++;
      voci.push({
        idVoce: newId,
        posizione: getPrimaPosizioneVoceDisponibile(),
        voceAbbreviata: "FALSI TELAI ALLUMINIO",
        unitaMisura: UNITA_MISURA_DEFAULT_OPTIONS[0],
        prezzo: 0,
        tipoMisura: TIPOMISURA_VOCE_MANUALE,
        voce: "FALSI TELAI ALLUMINIO",
        note: "",
        misurazioniManuali: [],
      });
      normalizzaPosizioniVoci();
      voceFalsi = voci.find((item) => item.idVoce === newId) || null;
    }

    if (!voceFalsi) return;

    const mmEsistenti = normalizzaMisurazioniManualiVoce(
      voceFalsi.misurazioniManuali,
      voceFalsi.unitaMisura,
    );
    let nextMmId = nextVoceMmIdForRows(mmEsistenti);
    const nuoveMisurazioni = rows.map((row) => {
      const larg = Number(Number(row.larghezza || 0).toFixed(2));
      const alt = Number(Number(row.altezza || 0).toFixed(2));
      const agg = Number(Number(row.aggiunta || 0.1).toFixed(2));
      const formula = `(${fmt2(larg)} + ${fmt2(agg)}) + 2 * (${fmt2(alt)} + ${fmt2(agg)})`;
      const calc = calcolaMisurazioneVaria(formula, 1, false);
      const risultato = calc.ok ? calc.risultato : Number(((larg + agg) + 2 * (alt + agg)).toFixed(2));
      const formulaValue = calc.ok ? calc.formulaValue : Number(((larg + agg) + 2 * (alt + agg)).toFixed(2));
      return {
        idMisurazione: nextMmId++,
        tipo: VOCE_MM_TIPO_MANUALE,
        piano: row.piano,
        riferimento: row.riferimento,
        formula,
        formulaValue,
        numero: 1,
        segno: false,
        risultato,
        apertureCollegate: [],
      };
    });

    voci = voci.map((item) =>
      item.idVoce === voceFalsi.idVoce
        ? {
            ...item,
            voceAbbreviata: "FALSI TELAI ALLUMINIO",
            voce: "FALSI TELAI ALLUMINIO",
            tipoMisura: TIPOMISURA_VOCE_MANUALE,
            misurazioniManuali: nuoveMisurazioni,
          }
        : item,
    );

    saveVoci();
    renderVoci();
  }

  function openArchivioDavanzaliDialog() {
    const rows = buildArchivioDavanzaliRows();
    const righeHtml =
      rows.length === 0
        ? `<tr><td colspan="4" class="empty-cell">Nessun davanzale in archivio.</td></tr>`
        : rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.piano)}</td>
                <td>${escapeHtml(row.locale)}</td>
                <td>${escapeHtml(fmt2(row.larghezza))}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(fmt2(row.sbordo))}"
                    data-action="change-davanzale-sbordo"
                    data-key="${escapeHtml(row.key)}"
                    class="voce-mm-ap-input"
                    style="max-width:90px;"
                  />
                </td>
              </tr>`,
            )
            .join("");
    davanzaliDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio DAVANZALI</h3></div>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>PIANO</th><th>LOCALE</th><th>LARGHEZZA</th><th>SBORDO</th></tr></thead>
            <tbody>${righeHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="close-davanzali-dialog">Chiudi</button>
        </div>
      </form>
    `;
    davanzaliDialogEl.showModal();
  }

  function buildArchivioSoglieRows() {
    /** @type {Map<string, { key: string, piano: string, locale: string, larghezza: number, sbordo: number }>} */
    const map = new Map();
    voci.forEach((voce) => {
      const mm = normalizzaMisurazioniManualiVoce(voce.misurazioniManuali, voce.unitaMisura);
      mm.forEach((riga) => {
        const piano = String(riga?.piano || "").trim() || "-";
        const aperture = risolviApertureCollegateRefs(riga?.apertureCollegate);
        aperture.forEach((apertura, idx) => {
          const hDav = Number(apertura?.hDav || 0);
          if (Math.abs(hDav) > 0.0001) return;
          const locale = String(apertura?.locale || "").trim() || "-";
          const larghezza = Number(apertura?.largh || 0);
          const masterId = String(apertura?.idAperturaMaster || "").trim();
          const key = masterId ? `apm:${masterId}|p:${piano}` : `row:${piano}|loc:${locale}|i:${idx}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              piano,
              locale,
              larghezza,
              sbordo:
                typeof soglieSbordiByKey[key] === "number" && Number.isFinite(soglieSbordiByKey[key])
                  ? Number(soglieSbordiByKey[key].toFixed(2))
                  : 0.05,
            });
          }
        });
      });
    });
    return [...map.values()].sort((a, b) => a.piano.localeCompare(b.piano) || a.locale.localeCompare(b.locale));
  }

  function openArchivioSoglieDialog() {
    const rows = buildArchivioSoglieRows();
    const righeHtml =
      rows.length === 0
        ? `<tr><td colspan="4" class="empty-cell">Nessuna soglia in archivio.</td></tr>`
        : rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.piano)}</td>
                <td>${escapeHtml(row.locale)}</td>
                <td>${escapeHtml(fmt2(row.larghezza))}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(fmt2(row.sbordo))}"
                    data-action="change-soglia-sbordo"
                    data-key="${escapeHtml(row.key)}"
                    class="voce-mm-ap-input"
                    style="max-width:90px;"
                  />
                </td>
              </tr>`,
            )
            .join("");
    soglieDialogEl.innerHTML = `
      <form method="dialog" class="ifc-riepilogo-dialog-form">
        <div class="ifc-riepilogo-dialog-header"><h3>Archivio SOGLIE</h3></div>
        <div class="table-wrap">
          <table class="table-voce-mm-inline">
            <thead><tr><th>PIANO</th><th>LOCALE</th><th>LARGHEZZA</th><th>SBORDO</th></tr></thead>
            <tbody>${righeHtml}</tbody>
          </table>
        </div>
        <div style="padding:8px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn-action btn-secondary" data-action="close-soglie-dialog">Chiudi</button>
        </div>
      </form>
    `;
    soglieDialogEl.showModal();
  }

  function aggiornaMurRiferimentoPiano(idPiano, riferimento) {
    piani = piani.map((p) => (p.id === idPiano ? { ...p, murRiferimento: riferimento } : p));
    savePiani();
  }

  function aggiornaMurSpessorePiano(idPiano, spessore) {
    piani = piani.map((p) => (p.id === idPiano ? { ...p, murSpessore: spessore } : p));
    savePiani();
  }

  function mostraPannelloCompilazione(tipo) {
    compilazioneInterratoPanelEl.hidden = tipo !== "interrato";
    compilazioneEsterniPanelEl.hidden = tipo !== "esterni";
    if (compilazioneMisureVariePanelEl) {
      compilazioneMisureVariePanelEl.hidden = tipo !== "misure-varie";
    }
    altreTipologiePanelEl.hidden = tipo !== "altre";
  }

  function preparaVistaMisureVarie() {
    popolaDatalistVocibrevi("datalist-voci-esterni-vari");
    resetMisurazioniForm();
    renderMisurazioniVarie();
  }

  function openCompilazioneMisureVarie() {
    compilazionePianoId = null;
    dismissVaniIfOpen();
    dismissCamminamentiIfOpen();
    openVistaMisureVarie({
      onPrepare: () => {
        mostraPannelloCompilazione("misure-varie");
        preparaVistaMisureVarie();
      },
    });
  }

  function openCompilazioneInterrato(piano) {
    stratiFormEl.reset();
    editingStratoMurId = null;
    setStratiFormMode();
    resetAperturaForm();
    compilazionePianoId = piano.id;
    mostraPannelloCompilazione("interrato");
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    updateInterratoPanelSubtitle(interratoSottotitoloEl, piano);
    updateMurPianoCompilazioneLabel(
      idPianoCompilazioneEl,
      riferimentoMurPianoEl,
      compilazionePianoId,
      piani,
    );
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    tornaPianiButtonEl.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCompilazioneEsterniVari() {
    compilazionePianoId = null;
    mostraPannelloCompilazione("esterni");
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    compilazioneEsterniPanelEl
      .querySelectorAll("details.collapsible-block")
      .forEach((section) => (section.open = false));
    esterniSottotitoloEl.innerHTML = "Vista indipendente ESTERNI VARI.";
    popolaDatalistVocibrevi("datalist-voci-esterni-vari");
    resetScavoForm();
    resetCorselloForm();
    renderScavi();
    renderCorselli();
    tornaPianiEsterniButtonEl.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function syncEsterniVersoVoci() {
    syncEsterniMisurazioniNelleVoci({
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni: [],
      misurazioniVarie,
    });
    popolaDatalistVocibrevi("datalist-voci-esterni-vari");
  }

  function openCompilazioneEsterniVariDaSidebar() {
    openCompilazioneEsterniVari();
  }

  function openCompilazioneAltreTipologie(piano) {
    compilazionePianoId = null;
    showVistaCompilazione(vistaPianiEl, vistaCompilazioneEl, altreTipologiePanelEl);
    vistaVociEl.hidden = true;
    if (vistaBimEl) vistaBimEl.hidden = true;
    mostraPannelloCompilazione("altre");
    altreTipologieTestoEl.textContent = `La compilazione per la tipologia "${piano.tipologia}" sara' aggiunta in seguito.`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function apriVistaVoci() {
    dismissVaniIfOpen();
    dismissCamminamentiIfOpen();
    vistaPianiEl.hidden = true;
    vistaCompilazioneEl.hidden = true;
    vistaVociEl.hidden = false;
    if (vistaBimEl) vistaBimEl.hidden = true;
    chiudiTutteLeVociManuali();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function apriVistaBim() {
    dismissVaniIfOpen();
    dismissCamminamentiIfOpen();
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

  function prossimoIdStratoPerPiano(idPiano) {
    const stratiPiano = stratiMurElevazione.filter((item) => item.idPiano === idPiano);
    if (stratiPiano.length === 0) return 1;
    const maxIdNumerico = stratiPiano.reduce((max, item) => {
      const parsed = Number.parseInt(String(item.idStrato), 10);
      if (Number.isNaN(parsed)) return max;
      return Math.max(max, parsed);
    }, 0);
    if (maxIdNumerico > 0) return maxIdNumerico + 1;
    return stratiPiano.length + 1;
  }

  function aggiornaCampoIdStratoAutomatico() {
    if (editingStratoMurId !== null) return;
    if (compilazionePianoId === null) {
      idstratoEl.value = "";
      return;
    }
    idstratoEl.value = String(prossimoIdStratoPerPiano(compilazionePianoId));
  }

  function getSpessoreMurPianoCorrente() {
    const p = compilazionePianoId === null ? null : piani.find((item) => item.id === compilazionePianoId);
    return Number(p?.murSpessore ?? 0);
  }

  function calcolaSpessoreResiduoPerPiano(idPiano, editingId = null) {
    const pianoRow = piani.find((item) => item.id === idPiano);
    const spessoreMur = Number(pianoRow?.murSpessore ?? 0);
    const sommaStrati = stratiMurElevazione
      .filter((item) => item.idPiano === idPiano && item.idStratoMur !== editingId)
      .reduce((sum, item) => sum + Number(item.spessore || 0), 0);
    return Number((spessoreMur - sommaStrati).toFixed(2));
  }

  function aggiornaSuggerimentoSpessoreStrato() {
    if (compilazionePianoId === null) {
      spessoreEl.value = "";
      spessoreEl.placeholder = "0.00";
      spessoreEl.removeAttribute("max");
      spessoreEl.title = "";
      return;
    }

    const residuo = calcolaSpessoreResiduoPerPiano(compilazionePianoId, editingStratoMurId);
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
    const isEdit = editingScavoId !== null;
    scavoSubmitButtonEl.textContent = "+";
    scavoSubmitButtonEl.title = isEdit ? "Salva modifica scavo" : "Aggiungi scavo";
    scavoSubmitButtonEl.setAttribute(
      "aria-label",
      isEdit ? "Salva modifica scavo" : "Aggiungi scavo",
    );
    scavoSubmitButtonEl.classList.toggle("btn-form-add-plus--edit", isEdit);
    if (!isEdit) {
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
    const isEdit = editingCorselloId !== null;
    corselloSubmitButtonEl.textContent = "+";
    corselloSubmitButtonEl.title = isEdit ? "Salva modifica corsello" : "Aggiungi corsello";
    corselloSubmitButtonEl.setAttribute(
      "aria-label",
      isEdit ? "Salva modifica corsello" : "Aggiungi corsello",
    );
    corselloSubmitButtonEl.classList.toggle("btn-form-add-plus--edit", isEdit);
    if (!isEdit) {
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
    /* CAMMINAMENTI esterni rimosso: no-op */
  }

  function resetCamminamentiForm() {
    editingCamminamentiId = null;
  }

  function renderCamminamenti() {
    /* CAMMINAMENTI esterni rimosso: no-op */
  }

  function setMisurazioniFormMode() {
    if (misurazioniSubmitButtonEl) {
      const isEdit = editingMisurazioneId !== null;
      misurazioniSubmitButtonEl.textContent = "+";
      misurazioniSubmitButtonEl.title = isEdit
        ? "Salva modifica misurazione"
        : "Aggiungi misurazione";
      misurazioniSubmitButtonEl.setAttribute(
        "aria-label",
        isEdit ? "Salva modifica misurazione" : "Aggiungi misurazione",
      );
      misurazioniSubmitButtonEl.classList.toggle("btn-form-add-plus--edit", isEdit);
    }
    if (editingMisurazioneId === null && idMisurazioneEl) {
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

  function getVoceMmAperturaDraftKey(idVoce, mmIndex) {
    return `${idVoce}:${mmIndex}`;
  }

  function createEmptyVoceMmAperturaDraft() {
    return {
      locale: "",
      largh: "",
      alt: "",
      hDav: "0",
      ante: "1",
      tipologia: "FINESTRA",
      falso: "NO",
      scuro: "NO",
      inferiata: "NO",
      zanzariera: "NO",
    };
  }

  function parseVoceMmAperturaDraft(draft) {
    const locale = String(draft?.locale || "").trim();
    const largh = parseNonNegativeDecimal2(String(draft?.largh || ""));
    const alt = parseNonNegativeDecimal2(String(draft?.alt || ""));
    const hDav = parseNonNegativeDecimal2(String(draft?.hDav || ""));
    const ante = parseAnteIntero(String(draft?.ante || ""));
    const tipologia = String(draft?.tipologia || "").trim();
    const falso = String(draft?.falso || "").trim().toUpperCase();
    const scuro = String(draft?.scuro || "").trim().toUpperCase();
    const inferiata = String(draft?.inferiata || "").trim().toUpperCase();
    const zanzariera = String(draft?.zanzariera || "").trim().toUpperCase();
    const tipologie = new Set([
      "FINESTRA",
      "PORTA FINESTRA",
      "BOCCA LUPO",
      "FIN CANTINA",
      "PORTONCINO",
      "PORTA CANTINA",
      "PORTA REI",
      "PORTA INTERNA",
      "SCRIGNO",
      "BASCULANTE",
      "SEZIONALE",
    ]);
    const falsi = new Set(["NO", "ALLUMINIO", "LEGNO"]);
    const scuri = new Set(["NO", "PERSIANA", "TAPPARELLA"]);
    const siNo = new Set(["NO", "SI"]);
    if (
      !locale ||
      largh === null ||
      alt === null ||
      hDav === null ||
      ante === null ||
      !tipologia ||
      !tipologie.has(tipologia) ||
      !falsi.has(falso) ||
      !scuri.has(scuro) ||
      !siNo.has(inferiata) ||
      !siNo.has(zanzariera)
    ) {
      return null;
    }
    return {
      locale,
      largh,
      alt,
      hDav,
      ante,
      tipologia,
      falso,
      scuro,
      inferiata,
      zanzariera,
    };
  }

  function nextAperturaMasterId() {
    const id = `APM-${String(apertureMasterIdCounter).padStart(4, "0")}`;
    apertureMasterIdCounter += 1;
    return id;
  }

  function normalizzaAperturaMasterRecord(item, fallbackId = "") {
    if (!item || typeof item !== "object") return null;
    const base = normalizzaApertureCollegateMisurazione([item])[0];
    if (!base) return null;
    const idAperturaMaster =
      typeof item?.idAperturaMaster === "string" && item.idAperturaMaster.trim() !== ""
        ? item.idAperturaMaster.trim()
        : fallbackId;
    const piano = typeof item?.piano === "string" ? item.piano.trim() : "";
    return { idAperturaMaster, ...base, piano };
  }

  function normalizzaApertureMaster(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    raw.forEach((item) => {
      const normalized = normalizzaAperturaMasterRecord(item, nextAperturaMasterId());
      if (normalized) out.push(normalized);
    });
    return out;
  }

  function creaAperturaMasterDaDati(item, forcedId = "") {
    const normalized = normalizzaAperturaMasterRecord(item);
    if (!normalized) return null;
    const created = {
      ...normalized,
      idAperturaMaster: forcedId && forcedId.trim() !== "" ? forcedId.trim() : nextAperturaMasterId(),
    };
    apertureMaster.push(created);
    return created.idAperturaMaster;
  }

  function normalizzaApertureCollegateRefs(apertureRaw) {
    if (!Array.isArray(apertureRaw)) return [];
    return apertureRaw
      .map((item) => {
        if (item && typeof item === "object" && typeof item.idAperturaMaster === "string") {
          const id = item.idAperturaMaster.trim();
          if (id !== "") {
            const exists = apertureMaster.some((ap) => ap.idAperturaMaster === id);
            if (exists) return { idAperturaMaster: id };
            const createdWithSameId = creaAperturaMasterDaDati(item, id);
            return createdWithSameId ? { idAperturaMaster: createdWithSameId } : null;
          }
        }
        const idLegacy = creaAperturaMasterDaDati(item);
        return idLegacy ? { idAperturaMaster: idLegacy } : null;
      })
      .filter(Boolean);
  }

  function risolviApertureCollegateRefs(apertureRefsRaw) {
    const refs = normalizzaApertureCollegateRefs(apertureRefsRaw);
    return refs
      .map((ref) => {
        const master = apertureMaster.find((ap) => ap.idAperturaMaster === ref.idAperturaMaster);
        if (!master) return null;
        return { ...master };
      })
      .filter(Boolean);
  }

  function normalizzaApertureCollegateMisurazione(apertureRaw) {
    if (!Array.isArray(apertureRaw)) return [];
    return apertureRaw
      .filter(
        (item) =>
          typeof item?.locale === "string" &&
          (typeof item?.largh === "number" || typeof item?.lunghezza === "number") &&
          (typeof item?.alt === "number" || typeof item?.altezza === "number") &&
          (typeof item?.hDav === "number" || typeof item?.hDavanzale === "number") &&
          typeof item?.ante === "number" &&
          Number.isInteger(item.ante) &&
          typeof item?.tipologia === "string",
      )
      .map((item) => ({
        idApertura:
          typeof item?.idApertura === "string" && item.idApertura.trim() !== ""
            ? item.idApertura
            : `AP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        locale: item.locale.trim(),
        largh: Number((Number(item.largh ?? item.lunghezza ?? 0)).toFixed(2)),
        alt: Number((Number(item.alt ?? item.altezza ?? 0)).toFixed(2)),
        hDav: Number((Number(item.hDav ?? item.hDavanzale ?? 0)).toFixed(2)),
        ante: item.ante,
        tipologia: item.tipologia.trim(),
        falso:
          typeof item?.falso === "string"
            ? item.falso.toUpperCase()
            : item?.falsotelai === true
              ? "ALLUMINIO"
              : "NO",
        scuro: typeof item?.scuro === "string" ? item.scuro.toUpperCase() : "NO",
        inferiata: typeof item?.inferiata === "string" ? item.inferiata.toUpperCase() : "NO",
        zanzariera: typeof item?.zanzariera === "string" ? item.zanzariera.toUpperCase() : "NO",
      }));
  }

  function chiediDatiAperturaMisurazione() {
    const locale = window.prompt("APERTURA - Locale", "")?.trim() ?? "";
    if (!locale) return null;
    const lunghezza = parseNonNegativeDecimal2(window.prompt("APERTURA - Lunghezza (m)", "") ?? "");
    if (lunghezza === null) return null;
    const altezza = parseNonNegativeDecimal2(window.prompt("APERTURA - Altezza (m)", "") ?? "");
    if (altezza === null) return null;
    const ante = parseAnteIntero(window.prompt("APERTURA - Numero ante (intero)", "1") ?? "");
    if (ante === null) return null;
    const tipologia = window.prompt("APERTURA - Tipologia", "PORTA")?.trim() ?? "";
    if (!tipologia) return null;
    const falsotelaiRaw = window.prompt("APERTURA - Falsotelai? (si/no)", "no")?.trim().toLowerCase() ?? "";
    if (falsotelaiRaw !== "si" && falsotelaiRaw !== "no") return null;
    const hDavanzale = parseNonNegativeDecimal2(window.prompt("APERTURA - H Davanzale (m)", "0") ?? "");
    if (hDavanzale === null) return null;
    return {
      idApertura: `AP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      locale,
      lunghezza,
      altezza,
      ante,
      tipologia,
      falsotelai: falsotelaiRaw === "si",
      hDavanzale,
      idVoceCapitolato: "",
    };
  }

  function resetVoceMmRigaFormFields() {
    if (voceMmRigaPianoEl) voceMmRigaPianoEl.value = "";
    if (voceMmRigaRiferimentoEl) voceMmRigaRiferimentoEl.value = "";
    if (voceMmRigaFormulaEl) voceMmRigaFormulaEl.value = "";
    if (voceMmRigaNumeroEl) voceMmRigaNumeroEl.value = "1";
    if (voceMmRigaSegnoEl) voceMmRigaSegnoEl.checked = false;
    if (voceMmRigaTipoOggettoEl) voceMmRigaTipoOggettoEl.value = "";
    if (voceMmRigaSpecificaEl) voceMmRigaSpecificaEl.value = "";
    if (voceMmRigaMisura1El) voceMmRigaMisura1El.value = "";
    if (voceMmRigaMisura2El) voceMmRigaMisura2El.value = "";
    if (voceMmRigaMisura3El) voceMmRigaMisura3El.value = "";
    voceMmTemplateFaldaMeta = { canale: false, gronda: null };
    toggleVoceMmFieldsByTipo(VOCE_MM_TIPO_MANUALE);
    updateVoceMmRisultatoPreview();
  }

  function toggleVoceMmFieldsByTipo(tipoRaw) {
    normalizzaTipoMisurazioneVoce(tipoRaw);
    if (voceMmFieldsManualeEl) voceMmFieldsManualeEl.hidden = false;
    if (voceMmFieldsSemiautomaticaEl) voceMmFieldsSemiautomaticaEl.hidden = false;
    syncVoceMmExclusiveFields();
  }

  function syncVoceMmExclusiveFields() {
    const formulaCompilata = (voceMmRigaFormulaEl?.value || "").trim() !== "";
    const semiCompilata =
      (voceMmRigaTipoOggettoEl?.value || "").trim() !== "" ||
      (voceMmRigaSpecificaEl?.value || "").trim() !== "" ||
      (voceMmRigaMisura1El?.value || "").trim() !== "" ||
      (voceMmRigaMisura2El?.value || "").trim() !== "" ||
      (voceMmRigaMisura3El?.value || "").trim() !== "";

    const disattivaSemi = formulaCompilata;
    const disattivaFormula = semiCompilata;

    if (voceMmRigaTipoOggettoEl) voceMmRigaTipoOggettoEl.disabled = disattivaSemi;
    if (voceMmRigaSpecificaEl) voceMmRigaSpecificaEl.disabled = disattivaSemi;
    if (voceMmRigaMisura1El) voceMmRigaMisura1El.disabled = disattivaSemi;
    if (voceMmRigaMisura2El) voceMmRigaMisura2El.disabled = disattivaSemi;
    if (voceMmRigaMisura3El) voceMmRigaMisura3El.disabled = disattivaSemi;
    if (voceMmRigaFormulaEl) voceMmRigaFormulaEl.disabled = disattivaFormula;
    updateVoceMmRisultatoPreview();
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
      const mm = normalizzaMisurazioniManualiVoce(v?.misurazioniManuali, v?.unitaMisura);
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
      if (voceMmRigaTipoOggettoEl) voceMmRigaTipoOggettoEl.value = row.tipoOggetto || "";
      if (voceMmRigaSpecificaEl) voceMmRigaSpecificaEl.value = row.specifica || "";
      if (voceMmRigaMisura1El) voceMmRigaMisura1El.value = row.misura1 === null ? "" : String(row.misura1);
      if (voceMmRigaMisura2El) voceMmRigaMisura2El.value = row.misura2 === null ? "" : String(row.misura2);
      if (voceMmRigaMisura3El) voceMmRigaMisura3El.value = row.misura3 === null ? "" : String(row.misura3);
      voceMmTemplateFaldaMeta = {
        canale: row.canaleGronda === true,
        gronda:
          typeof row.grondaCanaleValore === "number" && Number.isFinite(row.grondaCanaleValore)
            ? Number(row.grondaCanaleValore)
            : null,
      };
    }
    toggleVoceMmFieldsByTipo(VOCE_MM_TIPO_MANUALE);
    updateVoceMmRisultatoPreview();
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
    const piano = ensurePianoMisuraInArchivio(voceMmRigaPianoEl.value);
    voceMmRigaPianoEl.value = piano;
    const riferimentoManuale = voceMmRigaRiferimentoEl.value.trim();
    const formula = voceMmRigaFormulaEl.value.trim();
    const segno = voceMmRigaSegnoEl.checked;
    const numeroParsed = Number.parseInt(voceMmRigaNumeroEl.value, 10);
    const tipoOggetto = voceMmRigaTipoOggettoEl?.value.trim() || "";
    const specifica = voceMmRigaSpecificaEl?.value.trim() || "";
    const misura1 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura1El?.value);
    const misura2 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura2El?.value);
    const misura3 = parseNonNegativeDecimal3OrNull(voceMmRigaMisura3El?.value);
    const hasFormula = formula !== "";
    const hasSemiData =
      tipoOggetto !== "" ||
      specifica !== "" ||
      (voceMmRigaMisura1El?.value || "").trim() !== "" ||
      (voceMmRigaMisura2El?.value || "").trim() !== "" ||
      (voceMmRigaMisura3El?.value || "").trim() !== "";
    const tipo =
      hasFormula && !hasSemiData
        ? VOCE_MM_TIPO_MANUALE
        : hasSemiData && !hasFormula
          ? VOCE_MM_TIPO_SEMIAUTOMATICA
          : VOCE_MM_TIPO_MANUALE;
    if (!piano) {
      window.alert("Compila il campo PIANO.");
      return;
    }
    let riferimento = riferimentoManuale;
    let calc = null;
    if (hasFormula && hasSemiData) {
      window.alert("Compila solo una tipologia per riga: FORMULA oppure campi SEMIAUTOMATICA.");
      return;
    }
    if (tipo === VOCE_MM_TIPO_SEMIAUTOMATICA) {
      riferimento = specifica;
      if (!specifica || !tipoOggetto) {
        window.alert("Per SEMIAUTOMATICA compila TIPOOGGETTO e SPECIFICA.");
        return;
      }
      if ((voceMmRigaMisura1El?.value || "").trim() !== "" && misura1 === null) {
        window.alert("MISURA1 non valida: usa un numero >= 0 con max 3 decimali.");
        return;
      }
      if ((voceMmRigaMisura2El?.value || "").trim() !== "" && misura2 === null) {
        window.alert("MISURA2 non valida: usa un numero >= 0 con max 3 decimali.");
        return;
      }
      if ((voceMmRigaMisura3El?.value || "").trim() !== "" && misura3 === null) {
        window.alert("MISURA3 non valida: usa un numero >= 0 con max 3 decimali.");
        return;
      }
      calc = calcolaMisurazioneVoceSemiautomatica(misura1, misura2, misura3, numeroParsed, segno);
    } else {
      if (!riferimentoManuale) {
        window.alert("Compila PIANO e RIFERIMENTO.");
        return;
      }
      calc = calcolaMisurazioneVaria(formula, numeroParsed, segno);
    }
    if (!calc.ok) {
      window.alert(calc.message);
      return;
    }
    const nuovaRiga = {
      tipo,
      piano,
      riferimento,
      tipoOggetto: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? tipoOggetto : "",
      specifica: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? specifica : "",
      formula: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? "" : formula,
      formulaValue: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? null : calc.formulaValue,
      misura1: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura1 : null,
      misura2: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura2 : null,
      misura3: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura3 : null,
      canaleGronda:
        tipo === VOCE_MM_TIPO_MANUALE &&
        voceMmTemplateFaldaMeta.canale === true &&
        typeof voceMmTemplateFaldaMeta.gronda === "number",
      grondaCanaleValore:
        tipo === VOCE_MM_TIPO_MANUALE &&
        voceMmTemplateFaldaMeta.canale === true &&
        typeof voceMmTemplateFaldaMeta.gronda === "number"
          ? Number(voceMmTemplateFaldaMeta.gronda.toFixed(3))
          : null,
      numero: numeroParsed,
      segno,
      risultato: calc.risultato,
      apertureCollegate:
        index !== null
          ? normalizzaApertureCollegateRefs(
              normalizzaMisurazioniManualiVoce(
                voci.find((vv) => vv.idVoce === idVoce)?.misurazioniManuali,
                voci.find((vv) => vv.idVoce === idVoce)?.unitaMisura,
              )[index]?.apertureCollegate,
            )
          : [],
    };
    let targetIndex = index;
    const shouldFocusAfterSave = index === null;
    voci = voci.map((v) => {
      if (v.idVoce !== idVoce) return v;
      let mm = [...normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura)];
      if (index === null) {
        mm.push(nuovaRiga);
        targetIndex = mm.length - 1;
      } else if (index >= 0 && index < mm.length) {
        mm[index] = nuovaRiga;
      }
      return { ...v, misurazioniManuali: mm };
    });
    saveVoci();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
    voceMmRigaDialogEl.close();
    if (shouldFocusAfterSave && targetIndex !== null && Number.isInteger(targetIndex) && targetIndex >= 0) {
      focusVoceMmRow(idVoce, targetIndex);
    }
    voceMmDialogContext = { idVoce: null, index: null };
    voceMmTemplateFaldaMeta = { canale: false, gronda: null };
  }

  function eliminaVoceMmRiga(idVoce, index) {
    voci = voci.map((v) => {
      if (v.idVoce !== idVoce) return v;
      const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura).filter(
        (_, i) => i !== index,
      );
      return { ...v, misurazioniManuali: mm };
    });
    saveVoci();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
  }

  /** Inserisce una copia della misurazione subito dopo l’originale e apre il modale sulla nuova riga. */
  function duplicaVoceMmRiga(idVoce, index) {
    const v = voci.find((x) => x.idVoce === idVoce);
    if (!v) return;
    const mm = normalizzaMisurazioniManualiVoce(v.misurazioniManuali, v.unitaMisura);
    const row = mm[index];
    if (!row) return;
    const tipo = normalizzaTipoMisurazioneVoce(row.tipo);
    const calc =
      tipo === VOCE_MM_TIPO_SEMIAUTOMATICA
        ? {
            ok: true,
            risultato: calcolaRisultatoSemiautomaticoPerUnita({
              misura1: row.misura1,
              misura2: row.misura2,
              misura3: row.misura3,
              numero: row.numero,
              segno: row.segno === true,
              unitaNorm: normalizzaUnitaVoceDetrazione(v.unitaMisura),
              vaniVanoId: row.vaniVanoId,
              stratoAltezza: row.stratoAltezza,
            }),
          }
        : calcolaMisurazioneVaria(row.formula, row.numero, row.segno);
    if (!calc.ok) {
      window.alert(calc.message);
      return;
    }
    const copy = {
      tipo,
      piano: row.piano,
      riferimento: row.riferimento,
      tipoOggetto: row.tipoOggetto || "",
      specifica: row.specifica || "",
      formula: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? "" : row.formula,
      formulaValue: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? null : calc.formulaValue,
      misura1: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? row.misura1 ?? null : null,
      misura2: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? row.misura2 ?? null : null,
      misura3: tipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? row.misura3 ?? null : null,
      canaleGronda: row.canaleGronda === true,
      grondaCanaleValore:
        typeof row.grondaCanaleValore === "number" && Number.isFinite(row.grondaCanaleValore)
          ? Number(row.grondaCanaleValore.toFixed(3))
          : null,
      numero: row.numero,
      segno: row.segno === true,
      risultato: calc.risultato,
      apertureCollegate: normalizzaApertureCollegateRefs(row.apertureCollegate),
    };
    voci = voci.map((vv) => {
      if (vv.idVoce !== idVoce) return vv;
      const arr = [...normalizzaMisurazioniManualiVoce(vv.misurazioniManuali, vv.unitaMisura)];
      arr.splice(index + 1, 0, copy);
      return { ...vv, misurazioniManuali: arr };
    });
    saveVoci();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
    openVoceMmRigaDialog(idVoce, index + 1);
  }

  /** Duplica una voce completa (con misurazioni e collegamenti aperture) subito sotto l'originale. */
  function duplicaVoceCompleta(idVoce) {
    normalizzaPosizioniVoci();
    const original = voci.find((item) => item.idVoce === idVoce);
    if (!original) return;
    const newIdVoce = voceIdCounter++;
    const voceAbbreviataBase = String(original.voceAbbreviata || "").trim();
    const voceAbbreviataCopia = voceAbbreviataBase
      ? `${voceAbbreviataBase} - COPIA`
      : "COPIA";
    const mmOriginal = normalizzaMisurazioniManualiVoce(original.misurazioniManuali, original.unitaMisura);
    const mmCopy = mmOriginal.map((row) => ({
      ...row,
      apertureCollegate: normalizzaApertureCollegateRefs(row.apertureCollegate),
    }));
    const copy = {
      ...original,
      idVoce: newIdVoce,
      posizione: original.posizione + 1,
      voceAbbreviata: voceAbbreviataCopia,
      misurazioniManuali: mmCopy,
    };
    voci.push(copy);
    spostaVoceAPosizione(newIdVoce, original.posizione + 1);
    saveVoci();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
    renderVoci();
  }

  function avviaModificaVoceMmApertura(idVoce, idx, aperturaId) {
    const voce = voci.find((item) => item.idVoce === idVoce);
    const mm = normalizzaMisurazioniManualiVoce(voce?.misurazioniManuali, voce?.unitaMisura);
    const row = mm[idx];
    if (!row) return;
    const aperture = risolviApertureCollegateRefs(row.apertureCollegate);
    const src = aperture.find((apertura) => apertura.idAperturaMaster === aperturaId);
    if (!src) return;
    const key = getVoceMmAperturaDraftKey(idVoce, idx);
    voceMmAperturaDraftByKey.set(key, {
      locale: src.locale || "",
      largh: String(src.largh ?? ""),
      alt: String(src.alt ?? ""),
      hDav: String(src.hDav ?? ""),
      ante: String(src.ante ?? 1),
      tipologia: src.tipologia || "FINESTRA",
      falso: src.falso || "NO",
      scuro: src.scuro || "NO",
      inferiata: src.inferiata || "NO",
      zanzariera: src.zanzariera || "NO",
      editingAperturaMasterId: src.idAperturaMaster,
    });
    renderVoci();
  }

  const VOCE_DIALOG_CAMPI_NON_UM = [
    vocePosizioneEl,
    voceAbbreviataEl,
    vocePrezzoEl,
    voceTipoMisuraEl,
    voceTestoEl,
    voceNoteEl,
    voceBtnCercaEl,
  ];

  function setVoceDialogModalitaSoloUnitaMisura(attiva) {
    editingVoceSoloUnitaMisura = attiva;
    voceDialogEl?.classList.toggle("voce-dialog--solo-unita", attiva);
    if (voceDialogSoloUnitaHintEl) voceDialogSoloUnitaHintEl.hidden = !attiva;
    if (voceDialogSaveEl) voceDialogSaveEl.textContent = attiva ? "Salva unità" : "Salva voce";
    if (voceDialogTitleEl) {
      if (attiva) voceDialogTitleEl.textContent = "MODIFICA UNITÀ DI MISURA";
      else if (editingVoceId !== null) voceDialogTitleEl.textContent = "MODIFICA VOCE";
      else voceDialogTitleEl.textContent = "NUOVA VOCE";
    }
    VOCE_DIALOG_CAMPI_NON_UM.forEach((el) => {
      if (el) el.disabled = attiva;
    });
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
    setVoceDialogModalitaSoloUnitaMisura(false);
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
      const headerRight = vistaVociEl.querySelector(".voci-header-right");
      if (headerRight) headerRight.appendChild(closeButton);
      else vistaVociEl.prepend(closeButton);
    }
    renderVoci();
  }

  function renderVoci() {
    const totaleComputo = voci.reduce((acc, item) => {
      const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
      const totaleQuantitaVoce = mm.reduce((sum, m) => sum + Number(m.risultato || 0), 0);
      const detrazioneAperture = calcolaDetrazioneApertureVoce(item, mm);
      const totaleQuantitaVoceNetto = totaleQuantitaVoce - detrazioneAperture;
      const prezzoVoce = parseNonNegativeDecimal2(item.prezzo) ?? 0;
      return acc + totaleQuantitaVoceNetto * prezzoVoce;
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
    const qCerca = String(vociCercaAbbrevInputEl?.value ?? "")
      .trim()
      .toLowerCase();
    const filtratePerAbbrev =
      qCerca === ""
        ? ordinate
        : ordinate.filter((item) =>
            String(item.voceAbbreviata ?? "")
              .toLowerCase()
              .includes(qCerca),
          );

    let vociDaRenderizzare = filtratePerAbbrev;
    if (voceFocusId !== null) {
      const voceInFocus = filtratePerAbbrev.find((item) => item.idVoce === voceFocusId);
      if (!voceInFocus) {
        voceFocusId = null;
        vistaVociEl?.classList.remove("voce-focus-mode");
        document.querySelector("#voce-focus-close-floating")?.remove();
        vociDaRenderizzare = filtratePerAbbrev;
      } else {
        vociDaRenderizzare = [voceInFocus];
      }
    }

    const ricercaAttiva = qCerca !== "";

    if (filtratePerAbbrev.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 8;
      cell.className = "empty-cell";
      cell.textContent = "Nessuna voce corrisponde alla ricerca (voce abbreviata).";
      row.appendChild(cell);
      vociBodyEl.appendChild(row);
      return;
    }

    vociDaRenderizzare.forEach((item, index) => {
      const derivataDaVani = voceDerivataDaVani(item);
      const bloccataInVoci = voceBloccataInVoci(item);
      const row = document.createElement("tr");
      row.className = "voci-row-principale";
      row.dataset.idVoce = String(item.idVoce);
      row.title = "Doppio clic per aprire in fullscreen";
      row.appendChild(createCell(String(item.idVoce)));
      row.appendChild(createCell(String(item.posizione)));
      const cellVoceAbbrev = createCell(item.voceAbbreviata || "-");
      cellVoceAbbrev.title = item.voce;
      cellVoceAbbrev.classList.add("voci-cell-open-focus");
      if (derivataDaVani) cellVoceAbbrev.classList.add("voci-cell-from-vani");
      if (isVoceSpecialeNoTotaleRiferimento(item)) {
        cellVoceAbbrev.classList.add("voci-cell-special-voce");
      }
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
      upButton.title = ricercaAttiva
        ? "Svuota il campo Cerca per usare Sposta sopra"
        : "Sposta sopra";
      upButton.setAttribute("aria-label", "Sposta sopra");
      upButton.disabled = ricercaAttiva || index === 0;

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "btn-action btn-secondary";
      downButton.dataset.action = "move-voce-down";
      downButton.dataset.id = String(item.idVoce);
      downButton.textContent = "↓";
      downButton.title = ricercaAttiva
        ? "Svuota il campo Cerca per usare Sposta sotto"
        : "Sposta sotto";
      downButton.setAttribute("aria-label", "Sposta sotto");
      downButton.disabled = ricercaAttiva || index === vociDaRenderizzare.length - 1;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-action btn-delete";
      deleteButton.dataset.action = "delete-voce";
      deleteButton.dataset.id = String(item.idVoce);
      deleteButton.textContent = "✕";
      deleteButton.title = "Elimina";
      deleteButton.setAttribute("aria-label", "Elimina");

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "btn-action btn-secondary";
      copyButton.dataset.action = "copy-voce";
      copyButton.dataset.id = String(item.idVoce);
      copyButton.textContent = "⧉";
      copyButton.title = "Copia voce con misurazioni e aperture collegate";
      copyButton.setAttribute("aria-label", "Copia voce");

      if (bloccataInVoci) {
        const roTitle = isVoceSpecialeNoTotaleRiferimento(item)
          ? "Voce automatica: modifica solo dai relativi strumenti (qui sola lettura)"
          : "Voce da VANI/CAMMINAMENTI: modifica unità di misura con ✎ (qui sola lettura)";
        if (derivataDaVani && !isVoceSpecialeNoTotaleRiferimento(item)) {
          editButton.disabled = false;
          editButton.title =
            "Modifica unità di misura (i totali delle misurazioni da VANI si aggiornano al salvataggio)";
          copyButton.disabled = true;
          copyButton.title = "Voce da VANI: copia non disponibile";
        } else {
          [copyButton, editButton].forEach((btn) => {
            btn.disabled = true;
            btn.title = roTitle;
          });
        }
        upButton.disabled = ricercaAttiva || index === 0;
        downButton.disabled = ricercaAttiva || index === vociDaRenderizzare.length - 1;
        deleteButton.disabled = false;
        deleteButton.title = "Elimina voce";
      }

      const isVoceManuale =
        normalizzaTipoMisuraVoce(item.tipoMisura) === TIPOMISURA_VOCE_MANUALE;

      actionsCell.append(upButton, downButton, copyButton, editButton);
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
      }
      row.appendChild(actionsCell);
      vociBodyEl.appendChild(row);

      const mostraMisurazioniManuali =
        isVoceManuale && (voceFocusId === item.idVoce || !vociMmCollapsed.has(item.idVoce));
      if (mostraMisurazioniManuali) {
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        const mmTotalColumns = 14;
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
        const colgroup = document.createElement("colgroup");
        const isVoceFullscreen = voceFocusId === item.idVoce;
        const colWidths = isVoceFullscreen
          ? [48, 48, 110, 120, 120, 120, 210, 58, 58, 58, 58, 58, 58, 74]
          : [36, 36, 76, 88, 88, 88, 130, 42, 42, 42, 42, 42, 46, 52];
        colWidths.forEach((w) => {
          const col = document.createElement("col");
          col.style.width = `${w}px`;
          colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        const thead = document.createElement("thead");
        const hr = document.createElement("tr");
        [
          "IDMIS.",
          "IDVOCE",
          "TIPO",
          "PIANO",
          "TIPOOGGETTO",
          "SPECIFICA",
          "FORMULA",
          "M1",
          "M2/ALT",
          "M3",
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
          tdLabel.colSpan = Math.max(1, mmTotalColumns - 2);
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
          ec.colSpan = mmTotalColumns;
          ec.className = "empty-cell";
          ec.textContent = "Nessuna misurazione.";
          er.appendChild(ec);
          tbody.appendChild(er);
        } else {
          /** @type {Map<string, Map<string, { m: { tipo?: string, piano: string, riferimento: string, tipoOggetto?: string, specifica?: string, formula: string, formulaValue: number|null, misura1?: number|null, misura2?: number|null, misura3?: number|null, numero: number, segno: boolean, risultato: number }, idx: number }[]>>} */
          const grouped = new Map();
          const unitaNormDetrazione = normalizzaUnitaVoceDetrazione(item.unitaMisura);
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
            let sumPianoAperture = 0;
            rifMap.forEach((rows, rifKey) => {
              let sumRif = 0;
              let sumRifAperture = 0;
              rows.forEach(({ m, idx }) => {
                const trMm = document.createElement("tr");
                trMm.className = "voce-mm-data-row";
                trMm.dataset.idVoce = String(item.idVoce);
                trMm.dataset.mmIndex = String(idx);
                trMm.title = "Doppio clic per modificare";
                if (m.segno) trMm.classList.add("row-sottrai");
                const mmTipo = normalizzaTipoMisurazioneVoce(m.tipo);
                trMm.appendChild(createCell(String(idx + 1)));
                trMm.appendChild(createCell(String(item.idVoce)));
                trMm.appendChild(createCell(mmTipo));
                trMm.appendChild(createCell(m.piano || ""));
                trMm.appendChild(createCell(mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.tipoOggetto || "") : ""));
                trMm.appendChild(createCell(mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.specifica || "") : (m.riferimento || "")));
                trMm.appendChild(createCell(mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? "" : (m.formula || "")));
                trMm.appendChild(
                  createCell(mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.misura1 === null ? "" : Number(m.misura1).toFixed(3)) : ""),
                );
                trMm.appendChild(
                  createCell(mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.misura2 === null ? "" : Number(m.misura2).toFixed(3)) : ""),
                );
                const m3Cell = createCell(
                  mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA
                    ? (m.misura3 === null ? "" : Number(m.misura3).toFixed(3))
                    : "",
                );
                const m3Mancante =
                  m.misura3 === null ||
                  typeof m.misura3 !== "number" ||
                  !Number.isFinite(m.misura3);
                if (
                  mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA &&
                  unitaNormDetrazione.includes("mc") &&
                  m3Mancante
                ) {
                  m3Cell.classList.add("voce-mm-m3-missing");
                  m3Cell.title = "M3 obbligatorio per voci in mc";
                }
                trMm.appendChild(m3Cell);
                trMm.appendChild(createCell(String(m.numero)));
                trMm.appendChild(createCell(m.segno ? "-" : "+"));
                trMm.appendChild(createCell(fmt2(m.risultato)));
                const ac = document.createElement("td");
                ac.className = "actions-cell mm-actions-cell";
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

                if (!isVoceSpecialeNoTotaleRiferimento(item)) {
                  const apertureCollegate = risolviApertureCollegateRefs(m.apertureCollegate);
                  const trAp = document.createElement("tr");
                  trAp.className = "voce-mm-aperture-row";
                  const tdAp = document.createElement("td");
                  tdAp.colSpan = mmTotalColumns;
                  tdAp.className = "empty-cell voce-mm-aperture-cell";
                  const isMisurazioneDaVani =
                    typeof m?.vaniVanoId === "string" && m.vaniVanoId.trim() !== "";
                  if (isMisurazioneDaVani) {
                    const misura2Val =
                      typeof m.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
                        ? Number(m.stratoAltezza)
                        : typeof m.misura2 === "number"
                          ? Number(m.misura2)
                          : null;
                    const misura3Val =
                      typeof m.misura3 === "number" ? Number(m.misura3) : null;
                    const savedWrap = document.createElement("div");
                    savedWrap.className =
                      "voce-mm-aperture-editor-wrap voce-mm-aperture-saved-wrap voce-mm-aperture-saved-wrap--vani";
                    const savedHead = document.createElement("div");
                    savedHead.className = "voce-mm-aperture-editor-head";
                    ["Lungh. apertura (m)", "h inclusa (m)", "ML netti (m)", "Mq netti (m²)"].forEach(
                      (label) => {
                        const cell = document.createElement("div");
                        cell.className = "voce-mm-ap-col-label";
                        cell.textContent = label;
                        savedHead.appendChild(cell);
                      },
                    );
                    savedWrap.appendChild(savedHead);

                    if (apertureCollegate.length === 0) {
                      const emptyText = document.createElement("div");
                      emptyText.className = "voce-mm-aperture-empty";
                      emptyText.textContent = "Nessuna apertura";
                      tdAp.appendChild(savedWrap);
                      tdAp.appendChild(emptyText);
                    } else {
                      apertureCollegate.forEach((apertura) => {
                        const row = document.createElement("div");
                        row.className = "voce-mm-aperture-editor-inputs voce-mm-aperture-saved-row";
                        const pushTextCell = (text, extraClass = "") => {
                          const c = document.createElement("div");
                          c.className = `voce-mm-ap-col-input voce-mm-ap-saved-cell ${extraClass}`.trim();
                          c.textContent = text;
                          row.appendChild(c);
                        };
                        const metric = calcolaMetricheAperturaMisurazione(
                          apertura,
                          mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura2Val : null,
                          mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura3Val : null,
                          mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.stratoElevazione ?? null) : null,
                        );
                        pushTextCell(fmt2(metric.ml), "voce-mm-ap-metric-cell");
                        pushTextCell(fmt2(metric.hInclusa), "voce-mm-ap-metric-cell");
                        pushTextCell(fmt2(metric.ml), "voce-mm-ap-metric-cell");
                        pushTextCell(fmt2(metric.mq), "voce-mm-ap-metric-cell");
                        savedWrap.appendChild(row);
                      });
                      tdAp.appendChild(savedWrap);
                    }
                    trAp.appendChild(tdAp);
                    tbody.appendChild(trAp);
                  } else {
                  const draftKey = getVoceMmAperturaDraftKey(item.idVoce, idx);
                  const draft = voceMmAperturaDraftByKey.get(draftKey);
                  const editingAperturaMasterId = String(draft?.editingAperturaMasterId || "").trim();
                  const savedWrap = document.createElement("div");
                  savedWrap.className = "voce-mm-aperture-editor-wrap voce-mm-aperture-saved-wrap";
                  const savedHead = document.createElement("div");
                  savedHead.className = "voce-mm-aperture-editor-head";
                  [
                    "LOCALE",
                    "LRGH",
                    "ALT.",
                    "HDAV",
                    "ANTE",
                    "TIPOLOGIA",
                    "FALSO",
                    "SCURO",
                    "INFERIATA",
                    "ZANZARIERA",
                    "H INCL.",
                    "MQ",
                    "MC",
                    "AZIONI",
                  ].forEach((label) => {
                    const cell = document.createElement("div");
                    cell.className = "voce-mm-ap-col-label";
                    if (label === "AZIONI") cell.classList.add("voce-mm-ap-col-actions");
                    cell.textContent = label;
                    savedHead.appendChild(cell);
                  });
                  savedWrap.appendChild(savedHead);
                  const misura2Val =
                    typeof m.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
                      ? Number(m.stratoAltezza)
                      : typeof m.misura2 === "number"
                        ? Number(m.misura2)
                        : null;
                  const misura3Val =
                    typeof m.misura3 === "number" ? Number(m.misura3) : null;

                if (apertureCollegate.length === 0) {
                  const emptyText = document.createElement("div");
                  emptyText.className = "voce-mm-aperture-empty";
                  emptyText.textContent = "Nessuna apertura";
                  tdAp.appendChild(savedWrap);
                  tdAp.appendChild(emptyText);
                } else {
                  apertureCollegate.forEach((apertura) => {
                    if (editingAperturaMasterId && editingAperturaMasterId === apertura.idAperturaMaster) {
                      const row = document.createElement("div");
                      row.className =
                        "voce-mm-aperture-editor-inputs voce-mm-aperture-saved-row voce-mm-aperture-editing-inline";
                      const buildInputCell = (field, value, type = "text") => {
                        const c = document.createElement("div");
                        c.className = "voce-mm-ap-col-input";
                        const input = document.createElement("input");
                        input.type = type;
                        input.value = value;
                        input.className = "voce-mm-ap-input";
                        input.dataset.action = "change-voce-mm-apertura-draft";
                        input.dataset.idVoce = String(item.idVoce);
                        input.dataset.mmIndex = String(idx);
                        input.dataset.field = field;
                        c.appendChild(input);
                        row.appendChild(c);
                      };
                      const buildSelectCell = (field, value, options) => {
                        const c = document.createElement("div");
                        c.className = "voce-mm-ap-col-input";
                        const sel = document.createElement("select");
                        sel.className = "voce-mm-ap-input";
                        sel.dataset.action = "change-voce-mm-apertura-draft";
                        sel.dataset.idVoce = String(item.idVoce);
                        sel.dataset.mmIndex = String(idx);
                        sel.dataset.field = field;
                        options.forEach((opt) => {
                          const o = document.createElement("option");
                          o.value = opt;
                          o.textContent = opt;
                          sel.appendChild(o);
                        });
                        sel.value = value;
                        c.appendChild(sel);
                        row.appendChild(c);
                      };
                      buildInputCell("locale", draft?.locale || "");
                      buildInputCell("largh", draft?.largh || "", "number");
                      buildInputCell("alt", draft?.alt || "", "number");
                      buildInputCell("hDav", draft?.hDav || "", "number");
                      buildInputCell("ante", draft?.ante || "", "number");
                      buildSelectCell("tipologia", draft?.tipologia || "FINESTRA", [
                        "FINESTRA",
                        "PORTA FINESTRA",
                        "BOCCA LUPO",
                        "FIN CANTINA",
                        "PORTONCINO",
                        "PORTA CANTINA",
                        "PORTA REI",
                        "PORTA INTERNA",
                        "SCRIGNO",
                        "BASCULANTE",
                        "SEZIONALE",
                      ]);
                      buildSelectCell("falso", draft?.falso || "NO", ["NO", "ALLUMINIO", "LEGNO"]);
                      buildSelectCell("scuro", draft?.scuro || "NO", ["NO", "PERSIANA", "TAPPARELLA"]);
                      buildSelectCell("inferiata", draft?.inferiata || "NO", ["NO", "SI"]);
                      buildSelectCell("zanzariera", draft?.zanzariera || "NO", ["NO", "SI"]);
                      const metric = calcolaMetricheAperturaMisurazione(
                        apertura,
                        mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura2Val : null,
                        mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura3Val : null,
                        mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.stratoElevazione ?? null) : null,
                      );
                      const roCell = (text, extraClass = "") => {
                        const c = document.createElement("div");
                        c.className =
                          `voce-mm-ap-col-input voce-mm-ap-saved-cell ${extraClass}`.trim();
                        c.textContent = text;
                        row.appendChild(c);
                      };
                      roCell(fmt2(metric.hInclusa), "voce-mm-ap-metric-cell");
                      roCell(fmt2(metric.mq), "voce-mm-ap-metric-cell");
                      roCell(fmt2(metric.mc), "voce-mm-ap-metric-cell");

                      const actionCell = document.createElement("div");
                      actionCell.className = "voce-mm-ap-col-input voce-mm-ap-col-actions";
                      const saveBtn = document.createElement("button");
                      saveBtn.type = "button";
                      saveBtn.className = "btn-action btn-edit btn-icon-mini";
                      saveBtn.dataset.action = "save-voce-mm-apertura-draft";
                      saveBtn.dataset.idVoce = String(item.idVoce);
                      saveBtn.dataset.mmIndex = String(idx);
                      saveBtn.textContent = "✓";
                      saveBtn.title = "Salva apertura";
                      saveBtn.setAttribute("aria-label", "Salva apertura");
                      const cancelBtn = document.createElement("button");
                      cancelBtn.type = "button";
                      cancelBtn.className = "btn-action btn-delete btn-icon-mini";
                      cancelBtn.dataset.action = "cancel-voce-mm-apertura-draft";
                      cancelBtn.dataset.idVoce = String(item.idVoce);
                      cancelBtn.dataset.mmIndex = String(idx);
                      cancelBtn.textContent = "✕";
                      cancelBtn.title = "Annulla";
                      cancelBtn.setAttribute("aria-label", "Annulla");
                      actionCell.append(saveBtn, cancelBtn);
                      row.appendChild(actionCell);
                      savedWrap.appendChild(row);
                      return;
                    }
                    const row = document.createElement("div");
                    row.className = "voce-mm-aperture-editor-inputs voce-mm-aperture-saved-row";
                    const pushTextCell = (text, extraClass = "") => {
                      const c = document.createElement("div");
                      c.className =
                        `voce-mm-ap-col-input voce-mm-ap-saved-cell ${extraClass}`.trim();
                      c.textContent = text;
                      row.appendChild(c);
                    };
                    pushTextCell(apertura.locale || "");
                    pushTextCell(fmt2(apertura.largh));
                    pushTextCell(fmt2(apertura.alt));
                    pushTextCell(fmt2(apertura.hDav));
                    pushTextCell(String(apertura.ante));
                    pushTextCell(apertura.tipologia || "");
                    pushTextCell(apertura.falso || "NO");
                    pushTextCell(apertura.scuro || "NO");
                    pushTextCell(apertura.inferiata || "NO");
                    pushTextCell(apertura.zanzariera || "NO");
                    const metric = calcolaMetricheAperturaMisurazione(
                      apertura,
                      mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura2Val : null,
                      mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura3Val : null,
                      mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.stratoElevazione ?? null) : null,
                    );
                    pushTextCell(fmt2(metric.hInclusa), "voce-mm-ap-metric-cell");
                    pushTextCell(fmt2(metric.mq), "voce-mm-ap-metric-cell");
                    pushTextCell(fmt2(metric.mc), "voce-mm-ap-metric-cell");

                    const actionCell = document.createElement("div");
                    actionCell.className = "voce-mm-ap-col-input voce-mm-ap-col-actions";
                    const editAp = document.createElement("button");
                    editAp.type = "button";
                    editAp.className = "btn-action btn-edit btn-icon-mini";
                    editAp.dataset.action = "edit-voce-mm-apertura";
                    editAp.dataset.idVoce = String(item.idVoce);
                    editAp.dataset.mmIndex = String(idx);
                    editAp.dataset.aperturaId = apertura.idAperturaMaster;
                    editAp.textContent = "✎";
                    editAp.title = "Modifica apertura";
                    editAp.setAttribute("aria-label", "Modifica apertura");
                    const dupAp = document.createElement("button");
                    dupAp.type = "button";
                    dupAp.className = "btn-action btn-secondary btn-icon-mini";
                    dupAp.dataset.action = "duplicate-voce-mm-apertura";
                    dupAp.dataset.idVoce = String(item.idVoce);
                    dupAp.dataset.mmIndex = String(idx);
                    dupAp.dataset.aperturaId = apertura.idAperturaMaster;
                    dupAp.textContent = "⧉";
                    dupAp.title = "Duplica apertura";
                    dupAp.setAttribute("aria-label", "Duplica apertura");
                    const delAp = document.createElement("button");
                    delAp.type = "button";
                    delAp.className = "btn-action btn-delete btn-icon-mini";
                    delAp.dataset.action = "delete-voce-mm-apertura";
                    delAp.dataset.idVoce = String(item.idVoce);
                    delAp.dataset.mmIndex = String(idx);
                    delAp.dataset.aperturaId = apertura.idAperturaMaster;
                    delAp.textContent = "🗑";
                    delAp.title = "Elimina apertura";
                    delAp.setAttribute("aria-label", "Elimina apertura");
                    actionCell.append(editAp, dupAp, delAp);
                    row.appendChild(actionCell);
                    savedWrap.appendChild(row);
                  });
                  tdAp.appendChild(savedWrap);
                }
                  const addApBtn = document.createElement("button");
                  addApBtn.type = "button";
                  addApBtn.className = "btn-action btn-secondary btn-icon-mini";
                  addApBtn.dataset.action = "open-voce-mm-apertura-editor";
                  addApBtn.dataset.idVoce = String(item.idVoce);
                  addApBtn.dataset.mmIndex = String(idx);
                  addApBtn.textContent = "+";
                  addApBtn.title = "Nuova apertura";
                  addApBtn.setAttribute("aria-label", "Nuova apertura");
                  tdAp.appendChild(addApBtn);
                  const useApBtn = document.createElement("button");
                  useApBtn.type = "button";
                  useApBtn.className = "btn-action btn-secondary btn-icon-mini";
                  useApBtn.dataset.action = "use-voce-mm-apertura";
                  useApBtn.dataset.idVoce = String(item.idVoce);
                  useApBtn.dataset.mmIndex = String(idx);
                  useApBtn.textContent = "↳";
                  useApBtn.title = "Usa apertura esistente";
                  useApBtn.setAttribute("aria-label", "Usa apertura esistente");
                  tdAp.appendChild(useApBtn);
                  trAp.appendChild(tdAp);
                  tbody.appendChild(trAp);

                  if (draft && !editingAperturaMasterId) {
                  const trEditor = document.createElement("tr");
                  trEditor.className = "voce-mm-aperture-editor-row";
                  const tdEditor = document.createElement("td");
                  tdEditor.colSpan = mmTotalColumns;
                  tdEditor.className = "empty-cell voce-mm-aperture-editor-cell";

                  const editorWrap = document.createElement("div");
                  editorWrap.className = "voce-mm-aperture-editor-wrap";
                  const editorHeaderRow = document.createElement("div");
                  editorHeaderRow.className = "voce-mm-aperture-editor-head";
                  const editorInputRow = document.createElement("div");
                  editorInputRow.className = "voce-mm-aperture-editor-inputs";

                  const buildInput = (value, field, type = "text") => {
                    const input = document.createElement("input");
                    input.type = type;
                    input.value = value;
                    input.className = "voce-mm-ap-input";
                    input.dataset.action = "change-voce-mm-apertura-draft";
                    input.dataset.idVoce = String(item.idVoce);
                    input.dataset.mmIndex = String(idx);
                    input.dataset.field = field;
                    return input;
                  };
                  const buildSelect = (field, current, options) => {
                    const sel = document.createElement("select");
                    sel.className = "voce-mm-ap-input";
                    sel.dataset.action = "change-voce-mm-apertura-draft";
                    sel.dataset.idVoce = String(item.idVoce);
                    sel.dataset.mmIndex = String(idx);
                    sel.dataset.field = field;
                    options.forEach((opt) => {
                      const o = document.createElement("option");
                      o.value = opt;
                      o.textContent = opt;
                      sel.appendChild(o);
                    });
                    sel.value = current;
                    return sel;
                  };

                  const buildField = (labelText, control, extraClass = "") => {
                    const h = document.createElement("div");
                    h.className = `voce-mm-ap-col-label ${extraClass}`.trim();
                    h.textContent = labelText;
                    const c = document.createElement("div");
                    c.className = `voce-mm-ap-col-input ${extraClass}`.trim();
                    c.appendChild(control);
                    editorHeaderRow.appendChild(h);
                    editorInputRow.appendChild(c);
                  };

                  buildField("LOCALE", buildInput(draft.locale, "locale"));
                  buildField("LRGH", buildInput(draft.largh, "largh", "number"));
                  buildField("ALT", buildInput(draft.alt, "alt", "number"));
                  buildField("HDAV", buildInput(draft.hDav, "hDav", "number"));
                  buildField("ANTE", buildInput(draft.ante, "ante", "number"));
                  buildField(
                    "TIPOLOGIA",
                    buildSelect("tipologia", draft.tipologia, [
                      "FINESTRA",
                      "PORTA FINESTRA",
                      "BOCCA LUPO",
                      "FIN CANTINA",
                      "PORTONCINO",
                      "PORTA CANTINA",
                      "PORTA REI",
                      "PORTA INTERNA",
                      "SCRIGNO",
                      "BASCULANTE",
                      "SEZIONALE",
                    ]),
                  );
                  buildField("FALSO", buildSelect("falso", draft.falso, ["NO", "ALLUMINIO", "LEGNO"]));
                  buildField("SCURO", buildSelect("scuro", draft.scuro, ["NO", "PERSIANA", "TAPPARELLA"]));
                  buildField("INFERIATA", buildSelect("inferiata", draft.inferiata, ["NO", "SI"]));
                  buildField("ZANZARIERA", buildSelect("zanzariera", draft.zanzariera, ["NO", "SI"]));
                  const draftMetric = calcolaMetricheAperturaMisurazione(
                    {
                      largh: parseNonNegativeDecimal2(String(draft?.largh || "")) ?? 0,
                      alt: parseNonNegativeDecimal2(String(draft?.alt || "")) ?? 0,
                      hDav: parseNonNegativeDecimal2(String(draft?.hDav || "")) ?? 0,
                    },
                    mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura2Val : null,
                    mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? misura3Val : null,
                    mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA ? (m.stratoElevazione ?? null) : null,
                  );
                  const makeReadonly = (text, extraClass = "") => {
                    const d = document.createElement("div");
                    d.className = `voce-mm-ap-col-input voce-mm-ap-saved-cell ${extraClass}`.trim();
                    d.textContent = text;
                    return d;
                  };
                  buildField(
                    "H INCL.",
                    makeReadonly(fmt2(draftMetric.hInclusa), "voce-mm-ap-metric-cell"),
                  );
                  buildField("MQ", makeReadonly(fmt2(draftMetric.mq), "voce-mm-ap-metric-cell"));
                  buildField("MC", makeReadonly(fmt2(draftMetric.mc), "voce-mm-ap-metric-cell"));

                  const saveBtn = document.createElement("button");
                  saveBtn.type = "button";
                  saveBtn.className = "btn-action btn-edit btn-icon-mini";
                  saveBtn.dataset.action = "save-voce-mm-apertura-draft";
                  saveBtn.dataset.idVoce = String(item.idVoce);
                  saveBtn.dataset.mmIndex = String(idx);
                  saveBtn.textContent = "✓";
                  saveBtn.title = "Salva apertura";
                  saveBtn.setAttribute("aria-label", "Salva apertura");

                  const cancelBtn = document.createElement("button");
                  cancelBtn.type = "button";
                  cancelBtn.className = "btn-action btn-delete btn-icon-mini";
                  cancelBtn.dataset.action = "cancel-voce-mm-apertura-draft";
                  cancelBtn.dataset.idVoce = String(item.idVoce);
                  cancelBtn.dataset.mmIndex = String(idx);
                  cancelBtn.textContent = "✕";
                  cancelBtn.title = "Annulla";
                  cancelBtn.setAttribute("aria-label", "Annulla");

                  const actionHead = document.createElement("div");
                  actionHead.className = "voce-mm-ap-col-label voce-mm-ap-col-actions";
                  actionHead.textContent = "AZIONI";
                  const actionInput = document.createElement("div");
                  actionInput.className = "voce-mm-ap-col-input voce-mm-ap-col-actions";
                  actionInput.append(saveBtn, cancelBtn);
                  editorHeaderRow.appendChild(actionHead);
                  editorInputRow.appendChild(actionInput);

                  editorWrap.append(editorHeaderRow, editorInputRow);
                  tdEditor.appendChild(editorWrap);
                  trEditor.appendChild(tdEditor);
                  tbody.appendChild(trEditor);
                  }
                  }
                }

                const rowRis = Number(m.risultato || 0);
                const rowDetrazioneAperture = calcolaDetrazioneApertureMisurazione(
                  m,
                  unitaNormDetrazione,
                );
                sumRif += rowRis;
                sumRifAperture += rowDetrazioneAperture;
                sumPiano += rowRis;
                sumPianoAperture += rowDetrazioneAperture;
              });

              const sumRifNetto = sumRif - sumRifAperture;
              if (!isVoceSpecialeNoTotaleRiferimento(item)) {
                appendSubtotalRow(
                  `Totale RIFERIMENTO: ${rifKey} (Lordo ${fmt2(sumRif)} - Aperture ${fmt2(sumRifAperture)})`,
                  sumRifNetto,
                  "voce-mm-subtotal-rif",
                );
              }
            });

            const sumPianoNetto = sumPiano - sumPianoAperture;
            appendSubtotalRow(
              `Totale PIANO: ${pianoKey} (Lordo ${fmt2(sumPiano)} - Aperture ${fmt2(sumPianoAperture)})`,
              sumPianoNetto,
              "voce-mm-subtotal-piano",
            );
          });
        }
        table.appendChild(tbody);
        tableWrap.appendChild(table);

        const totP = document.createElement("p");
        totP.className = "voci-mm-totale";
        const detrazioneAperture = calcolaDetrazioneApertureVoce(item, mm);
        const sumMmNetto = sumMm - detrazioneAperture;
        const hasSemiautomatica = mm.some(
          (row) => normalizzaTipoMisurazioneVoce(row?.tipo) === VOCE_MM_TIPO_SEMIAUTOMATICA,
        );
        const quantitaFinaleVoce = hasSemiautomatica ? sumMmNetto : sumMm;
        const strong = document.createElement("strong");
        strong.textContent = formatTotaleMisurazioniManualiIt(quantitaFinaleVoce);
        const prezzoVoce = parseNonNegativeDecimal2(item.prezzo) ?? 0;
        const importoTotale = quantitaFinaleVoce * prezzoVoce;
        const strongPrezzo = document.createElement("strong");
        strongPrezzo.textContent = formatEuro2(prezzoVoce);
        const strongImporto = document.createElement("strong");
        strongImporto.textContent = formatEuro2(importoTotale);
        const unitaVoce = (item.unitaMisura || "-").trim() || "-";
        const dettaglioNetto = document.createElement("span");
        dettaglioNetto.textContent = ` (Lordo ${formatTotaleMisurazioniManualiIt(sumMm)} - Aperture ${formatTotaleMisurazioniManualiIt(detrazioneAperture)} = Netto ${formatTotaleMisurazioniManualiIt(sumMmNetto)})`;
        totP.append(
          `TOTALE ${unitaVoce}: `,
          strong,
          hasSemiautomatica ? dettaglioNetto : "",
          " | Prezzo voce: ",
          strongPrezzo,
          hasSemiautomatica ? " | Totale (Netto x Prezzo): " : " | Totale (Risultato x Prezzo): ",
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
    const fmt3 = (value) =>
      Number(value || 0).toLocaleString("it-IT", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

    const voices = [...voci].sort((a, b) => a.posizione - b.posizione || a.idVoce - b.idVoce);
    let totaleComplessivoComputo = 0;
    drawPageHeader();
    if (voices.length === 0) {
      drawText(marginLeft, y + 6, "Nessuna voce disponibile.", true, voceFontSize);
    } else {
      voices.forEach((item) => {
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        const unitaNormDetrazione = normalizzaUnitaVoceDetrazione(item.unitaMisura);
        const usaMcPerAperturePdf = unitaNormDetrazione.includes("mc");
        const usaMlPerAperturePdf = unitaNormDetrazione.includes("ml");
        const metricaAperturePdfLabel = usaMcPerAperturePdf ? "MC" : usaMlPerAperturePdf ? "ML" : "MQ";
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
          let sumPianoLordo = 0;
          let sumPianoAperture = 0;
          ensureSpace(detailLineH);
          drawText(leftTextX, y + 3.8, `PIANO: ${piano}`, false, detailFontSize);
          y += detailLineH;
          rifMap.forEach((rows, rif) => {
            let sumRifLordo = 0;
            let sumRifAperture = 0;
            ensureSpace(detailLineH);
            drawText(leftTextX, y + 3.8, `RIFERIMENTO: ${rif}`, false, detailFontSize);
            y += detailLineH;
            const haCamminamenti = rows.some(
              (row) =>
                typeof row?.camminamentiSchedaId === "string" &&
                row.camminamentiSchedaId.trim() !== "",
            );
            const righeStampa = haCamminamenti
              ? [...rows.filter((row) => !row.segno), ...rows.filter((row) => row.segno)]
              : rows;
            /** Righe aperture da stampare dopo le misure e il Totale lordo. */
            const apertureDaStampare = [];
            righeStampa.forEach((m) => {
              ensureSpace(detailLineH);
              const mmTipo = normalizzaTipoMisurazioneVoce(m.tipo);
              const misurazioneDaCamminamenti =
                typeof m?.camminamentiSchedaId === "string" && m.camminamentiSchedaId.trim() !== "";
              const misurazioneDaVani =
                typeof m?.vaniVanoId === "string" && m.vaniVanoId.trim() !== "";
              const detailLine =
                mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA
                  ? misurazioneDaCamminamenti
                    ? `${fmt3(m.misura1 ?? 1)} x ${fmt3(m.misura2 ?? 1)} x ${fmt3(m.misura3 ?? 0)};`
                    : misurazioneDaVani && usaMlPerAperturePdf
                      ? `${fmt3(m.misura1 ?? 1)};`
                      : misurazioneDaVani && !usaMcPerAperturePdf
                        ? `${fmt3(m.misura1 ?? 1)} x ${fmt3(
                            typeof m.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
                              ? m.stratoAltezza
                              : m.misura2 ?? 1,
                          )};`
                        : `${fmt3(m.misura1 ?? 1)} x ${fmt3(m.misura2 ?? 1)} x ${fmt3(m.misura3 ?? 1)};`
                  : `${m.formula || "-"};`;
              drawText(leftTextX, y + 3.8, detailLine, false, detailFontSize);
              drawText(partiUgualiX, y + 3.8, String(m.numero), false, detailFontSize);
              const rv = Number(m.risultato || 0);
              let detrazioneRigaAperture = 0;
              drawTextRight(resultRightX, y + 3.8, fmtRis(rv), false, detailFontSize);
              drawText(signX, y + 3.8, m.segno ? "-" : "+", false, detailFontSize);
              y += detailLineH;
              if (mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA) {
                const misura2Val =
                  typeof m.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
                    ? Number(m.stratoAltezza)
                    : typeof m.misura2 === "number" && Number.isFinite(m.misura2)
                      ? Number(m.misura2)
                      : null;
                const misura3Val =
                  typeof m.misura3 === "number" && Number.isFinite(m.misura3) ? Number(m.misura3) : null;
                const apertureCollegate = risolviApertureCollegateRefs(m.apertureCollegate);
                apertureCollegate.forEach((apertura) => {
                  const metriche = calcolaMetricheAperturaMisurazione(
                    apertura,
                    misura2Val,
                    misura3Val,
                    m.stratoElevazione ?? null,
                  );
                  const valoreMetrica = usaMcPerAperturePdf
                    ? metriche.mc
                    : usaMlPerAperturePdf
                      ? metriche.ml
                      : metriche.mq;
                  const valoreNum = Number(valoreMetrica || 0);
                  if (valoreNum <= 0.0001) return;
                  detrazioneRigaAperture += valoreNum;
                  apertureDaStampare.push({
                    locale: apertura.locale || "-",
                    largh: apertura.largh,
                    hInclusa: metriche.hInclusa,
                    valoreMetrica: valoreNum,
                  });
                });
              }
              sumRifAperture += detrazioneRigaAperture;
              sumRifLordo += rv;
              sumPianoLordo += rv;
              sumPianoAperture += detrazioneRigaAperture;
            });
            if (haCamminamenti) {
              const sumPos = rows
                .filter((row) => !row.segno)
                .reduce((acc, row) => acc + Math.abs(Number(row.risultato || 0)), 0);
              const sumNeg = rows
                .filter((row) => row.segno)
                .reduce((acc, row) => acc + Math.abs(Number(row.risultato || 0)), 0);
              if (sumPos > 0.0001) {
                ensureSpace(detailLineH);
                drawText(leftTextX, y + 3.8, "Totale valori positivi", false, detailFontSize);
                drawTextRight(resultRightX, y + 3.8, fmtRis(sumPos), false, detailFontSize);
                y += detailLineH;
              }
              if (sumNeg > 0.0001) {
                ensureSpace(detailLineH);
                drawText(leftTextX, y + 3.8, "Totale valori negativi", false, detailFontSize);
                drawTextRight(resultRightX, y + 3.8, `- ${fmtRis(sumNeg)}`, false, detailFontSize);
                y += detailLineH;
              }
            }
            const sumRifNetto = sumRifLordo - sumRifAperture;
            const aperturePdfFontSize = detailFontSize - 1;
            if (apertureDaStampare.length > 0) {
              ensureSpace(detailLineH);
              drawText(leftTextX, y + 3.8, "Totale lordo", false, detailFontSize);
              drawTextRight(resultRightX, y + 3.8, fmtRis(sumRifLordo), false, detailFontSize);
              y += detailLineH;
              ensureSpace(detailLineH);
              drawText(leftTextX + 1, y + 3.8, "a sottrarre aperture:", false, aperturePdfFontSize);
              y += detailLineH;
              apertureDaStampare.forEach((ap) => {
                ensureSpace(detailLineH);
                drawText(
                  leftTextX + 2,
                  y + 3.8,
                  `${ap.locale} - ${fmtRis(ap.largh)} (lrg) x ${fmtRis(ap.hInclusa)} (H incl)`,
                  false,
                  aperturePdfFontSize,
                );
                drawTextRight(
                  resultRightX,
                  y + 3.8,
                  `- ${fmtRis(ap.valoreMetrica)}`,
                  false,
                  aperturePdfFontSize,
                );
                y += detailLineH;
              });
            }
            if (Math.abs(sumRifAperture) > 0.0001) {
              ensureSpace(detailLineH);
              drawText(
                leftTextX,
                y + 3.8,
                "Totale aperture da sottrarre",
                false,
                aperturePdfFontSize,
              );
              drawTextRight(
                resultRightX,
                y + 3.8,
                `- ${fmtRis(sumRifAperture)}`,
                false,
                aperturePdfFontSize,
              );
              y += detailLineH;
            }
            if (!isVoceSpecialeNoTotaleRiferimento(item)) {
              ensureSpace(detailLineH);
              drawText(leftTextX, y + 3.8, `Totale ${rif}`, false, detailFontSize);
              drawTextRight(resultRightX, y + 3.8, fmtRis(sumRifNetto), false, detailFontSize);
              y += detailLineH;
            }
          });
          const sumPianoNetto = sumPianoLordo - sumPianoAperture;
          ensureSpace(detailLineH);
          drawText(leftTextX, y + 3.8, `Totale ${piano}`, false, detailFontSize);
          drawTextRight(resultRightX, y + 3.8, fmtRis(sumPianoNetto), false, detailFontSize);
          y += detailLineH;
        });

        const sumMm = mm.reduce((acc, m) => acc + Number(m.risultato || 0), 0);
        const detrazioneAperture = calcolaDetrazioneApertureVoce(item, mm);
        const sumMmNetto = sumMm - detrazioneAperture;
        const prezzo = parseNonNegativeDecimal2(item.prezzo) ?? 0;
        totaleComplessivoComputo += sumMmNetto * prezzo;
        ensureSpace(detailLineH + 4.5);
        drawText(
          leftTextX,
          y + 4.2,
          `TOTALE VOCE (${(item.unitaMisura || "-").trim() || "-"})`,
          true,
          totalFontSize,
        );
        drawTextRight(resultRightX, y + 4.2, fmtRis(sumMmNetto), true, totalFontSize);
        if (showPrices) {
          drawTextRight(prezzoRightX, y + 4.2, `€. ${fmtEuroAmount(prezzo)}`, true, totalFontSize);
          drawTextRight(
            totaleRightX,
            y + 4.2,
            `€. ${fmtEuroAmount(sumMmNetto * prezzo)}`,
            true,
            totalFontSize,
          );
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
      ["IDPIANO", "TIPOLOGIA", "EDIFICIO", "PIANO", "MUR_RIFERIMENTO", "MUR_SPESSORE"],
      ...piani.map((item) => [
        item.id,
        item.tipologia,
        item.edificio,
        item.piano,
        typeof item.murRiferimento === "string" ? item.murRiferimento : "",
        typeof item.murSpessore === "number" ? item.murSpessore : "",
      ]),
    ];

    const stratiRows = [
      ["IDSTRATOMUR", "IDPIANO", "IDSTRATO", "LUNGHEZZA", "ALTEZZA", "SPESSORE", "IDVOCECAPITOLATO"],
      ...stratiMurElevazione.map((item) => [
        item.idStratoMur,
        item.idPiano,
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
        "IDPIANO",
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
        item.idPiano,
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

        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        const unitaNormDetrazione = normalizzaUnitaVoceDetrazione(item.unitaMisura);
        const usaMcPerApertureXls = unitaNormDetrazione.includes("mc");
        const usaMlPerApertureXls = unitaNormDetrazione.includes("ml");
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
            let sumRifAperture = 0;
            rows.forEach((m, idx) => {
              const mmTipo = normalizzaTipoMisurazioneVoce(m.tipo);
              const detrazioneRigaAperture = calcolaDetrazioneApertureMisurazione(m, unitaNormDetrazione);
              const risultatoRigaNetto = Number(m.risultato || 0) - detrazioneRigaAperture;
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
                Number(risultatoRigaNetto.toFixed(3)),
                "",
              ]);
              if (mmTipo === VOCE_MM_TIPO_SEMIAUTOMATICA) {
                const misura2Val =
                  typeof m.stratoAltezza === "number" && Number.isFinite(m.stratoAltezza)
                    ? Number(m.stratoAltezza)
                    : typeof m.misura2 === "number" && Number.isFinite(m.misura2)
                      ? Number(m.misura2)
                      : null;
                const misura3Val =
                  typeof m.misura3 === "number" && Number.isFinite(m.misura3) ? Number(m.misura3) : null;
                const apertureCollegate = risolviApertureCollegateRefs(m.apertureCollegate);
                apertureCollegate.forEach((apertura) => {
                  const metriche = calcolaMetricheAperturaMisurazione(
                    apertura,
                    misura2Val,
                    misura3Val,
                    m.stratoElevazione ?? null,
                  );
                  const valoreMetrica = usaMcPerApertureXls
                    ? metriche.mc
                    : usaMlPerApertureXls
                      ? metriche.ml
                      : metriche.mq;
                  vociRows.push([
                    "",
                    "",
                    "",
                    "APERTURA",
                    apertura.locale || "-",
                    "-",
                    `${fmt2(apertura.largh)} (lrg) x ${fmt2(metriche.hInclusa)} (H incl)`,
                    "",
                    "",
                    Number((-valoreMetrica).toFixed(3)),
                    "",
                  ]);
                });
              }
              sumRifAperture += detrazioneRigaAperture;
              sumPiano += risultatoRigaNetto;
              sumVoce += risultatoRigaNetto;
            });
            if (Math.abs(sumRifAperture) > 0.0001) {
              vociRows.push([
                "",
                "",
                "",
                "TOTALE APERTURE DA SOTTRARRE",
                "",
                "",
                "",
                "",
                "",
                Number((-sumRifAperture).toFixed(3)),
                "",
              ]);
            }
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
        const sumVoceNetto = sumVoce;

        vociRows.push([
          "",
          "",
          "",
          "TOTALE QUANTITA VOCE",
          "",
          "",
          "",
          unita,
          Number(sumVoceNetto.toFixed(3)),
          Number(prezzo.toFixed(2)),
          Number((sumVoceNetto * prezzo).toFixed(2)),
        ]);
        vociRows.push(["", "", "", "", "", "", "", "", "", "", ""]);
      });

    return {
      pianiRows,
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

  function buildComputoDataPayload() {
    const ifcLink =
      ifcDataCache?.source?.linkedPath && typeof ifcDataCache.source.linkedPath === "string"
        ? {
            path: ifcDataCache.source.linkedPath,
            fileName: String(
              ifcDataCache?.source?.fileName || fileNameFromPath(ifcDataCache.source.linkedPath),
            ),
            linkedAt:
              typeof ifcDataCache?.source?.loadedAt === "string" ? ifcDataCache.source.loadedAt : "",
          }
        : null;
    return {
      piani,
      stratiMurElevazione,
      apertureElevazione,
      scaviEsterni,
      corselliEsterni,
      camminamentiEsterni,
      misurazioniVarie,
      voci,
      apertureMaster,
      archivioPianiMisura: [...archivioPianiMisura],
      vociUnitaMisuraOptions,
      ifcLink,
    };
  }

  /** Dopo avvio, import riuscito o export JSON completato: niente domanda in chiusura fino a nuove modifiche. */
  function refreshComputoBaselineSnapshot() {
    azzeraComputoModificatoPerExportJson();
  }

  function mostraConfermaChiusuraApp() {
    const testo =
      "Ci sono modifiche al computo non ancora coperte da un export JSON (pulsante ESPORTA COMPUTO).\n\nVuoi chiudere comunque l'applicazione?";
    if (!chiusuraAppDialogEl || !chiusuraAppDialogMsgEl) {
      return Promise.resolve(window.confirm(testo));
    }
    chiusuraAppDialogMsgEl.textContent = testo;
    return new Promise((resolve) => {
      const onClose = () => {
        chiusuraAppDialogEl.removeEventListener("close", onClose);
        resolve(chiusuraAppDialogEl.returnValue === "ok");
      };
      chiusuraAppDialogEl.addEventListener("close", onClose);
      chiusuraAppDialogEl.showModal();
    });
  }

  function mostraConfermaIniziaNuovoComputo() {
    if (!iniziaComputoDialogEl) {
      return Promise.resolve(
        window.confirm(
          "Stai chiudendo il computo attuale per iniziarne uno nuovo. CONFERMA se hai già salvato, altrimenti ANNULLA e salva prima.",
        ),
      );
    }
    return new Promise((resolve) => {
      const onClose = () => {
        iniziaComputoDialogEl.removeEventListener("close", onClose);
        resolve(iniziaComputoDialogEl.returnValue === "ok");
      };
      iniziaComputoDialogEl.addEventListener("close", onClose);
      iniziaComputoDialogEl.showModal();
    });
  }

  function pulisciStorageModuliSpeciali() {
    const keys = [
      "computo_metrico_vani_registrati",
      "computo_metrico_vani_misurazione",
      "computo_metrico_camminamenti_registrati",
    ];
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }

  /** Chiude il computo corrente e riparte da zero (dopo conferma utente). */
  function iniziaNuovoComputoVuoto() {
    dismissVaniIfOpen();
    dismissCamminamentiIfOpen();
    if (voceFocusId !== null) exitVoceFocusMode();

    piani = [];
    stratiMurElevazione = [];
    apertureElevazione = [];
    scaviEsterni = [];
    corselliEsterni = [];
    camminamentiEsterni = [];
    misurazioniVarie = [];
    voci = [];
    apertureMaster = [];
    archivioPianiMisura = [];
    vociUnitaMisuraOptions = [...UNITA_MISURA_DEFAULT_OPTIONS];
    davanzaliSbordiByKey = {};
    soglieSbordiByKey = {};
    falsiTelaiLegnoAggiunteByKey = {};
    falsiTelaiAlluminioAggiunteByKey = {};
    ifcDataCache = null;
    provaBimWallsBackup = null;
    bimSelectedElementCache = null;
    voceMmAperturaDraftByKey.clear();
    vociMmCollapsed.clear();

    pianoIdCounter = 1;
    stratoMurIdCounter = 1;
    aperturaElevIdCounter = 1;
    scavoIdCounter = 1;
    corselloIdCounter = 1;
    camminamentiIdCounter = 1;
    misurazioniIdCounter = 1;
    voceIdCounter = 1;
    apertureMasterIdCounter = 1;

    editingPianoId = null;
    editingStratoMurId = null;
    editingAperturaElevId = null;
    editingScavoId = null;
    editingCorselloId = null;
    editingCamminamentiId = null;
    editingMisurazioneId = null;
    editingVoceId = null;
    editingVoceSoloUnitaMisura = false;
    pendingDeleteVoceId = null;
    pendingDeleteVoceMm = { idVoce: null, index: null };
    apertureMasterEditingId = null;
    apertureMasterPendingDeleteId = null;
    compilazionePianoId = null;
    voceMmDialogContext = { idVoce: null, index: null };
    voceMmUseAperturaContext = { idVoce: null, mmIndex: null };
    pendingEditVoceMmApertura = { idVoce: null, mmIndex: null, idAperturaMaster: "" };

    pulisciStorageModuliSpeciali();

    savePiani();
    saveMurDati();
    saveArchivioPianiMisuraToStorage();
    saveApertureMaster();
    saveVoci();
    saveVociUnitaOptions();
    saveDavanzaliSbordi();
    saveSoglieSbordi();
    saveFalsiTelaiLegnoAggiunte();
    saveFalsiTelaiAlluminioAggiunte();
    saveIfcData();

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
    renderBimSelectedElement(null);
    setBimStatus("Nessun modello IFC caricato.");

    refreshComputoBaselineSnapshot();
    apriVistaVoci();
    document.dispatchEvent(new CustomEvent("computo-nuovo-iniziato"));
    document.dispatchEvent(new CustomEvent("computo-voci-storage-externally-updated"));
  }

  async function richiediIniziaNuovoComputo() {
    const conferma = await mostraConfermaIniziaNuovoComputo();
    if (!conferma) return;
    iniziaNuovoComputoVuoto();
  }

  async function richiediChiusuraApplicazione() {
    if (computoModificatoPerExportJson) {
      const conferma = await mostraConfermaChiusuraApp();
      if (!conferma) return;
    }
    try {
      const tauriInvoke = window.__TAURI__?.core?.invoke;
      if (typeof tauriInvoke === "function") {
        await tauriInvoke("exit_app");
        return;
      }
    } catch (err) {
      console.error(err);
      window.alert("Chiusura non riuscita (comando Tauri). Riavvia l'applicazione.");
      return;
    }
    window.close();
  }

  async function exportJson() {
    const data = buildComputoDataPayload();
    const payload = {
      exportedAt: new Date().toISOString(),
      ...data,
    };
    if (payload.ifcLink && (!payload.ifcLink.linkedAt || payload.ifcLink.linkedAt === "")) {
      payload.ifcLink = { ...payload.ifcLink, linkedAt: new Date().toISOString() };
    }
    const ok = await saveFileWithPickerOrDownload(
      `computo_metrico_export_${timestampExport()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
      [{ name: "JSON", extensions: ["json"] }],
    );
    if (ok) {
      refreshComputoBaselineSnapshot();
      window.alert("Esportazione JSON completata.");
    }
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
    syncEsterniVersoVoci();
    window.alert(`Importate ${nuoveMisure.length} misurazioni da IFC.`);
  }

  function cloneStateArray(value) {
    return JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
  }

  function normalizeIfcTypeName(value) {
    return String(value || "").trim().toUpperCase();
  }

  function toFiniteNumberFromUnknown(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (value && typeof value === "object") {
      if ("value" in value) return toFiniteNumberFromUnknown(value.value);
      if ("Value" in value) return toFiniteNumberFromUnknown(value.Value);
      if ("wrappedValue" in value) return toFiniteNumberFromUnknown(value.wrappedValue);
      if ("_internalValue" in value) return toFiniteNumberFromUnknown(value._internalValue);
    }
    const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function readExpressIdFromAny(node) {
    if (node === null || node === undefined) return null;
    if (typeof node === "number" && Number.isFinite(node)) return Math.trunc(node);
    if (!node || typeof node !== "object") return null;
    const candidates = [node.expressID, node.expressId, node.id, node.value, node.Value, node._internalValue];
    for (const candidate of candidates) {
      const id = readExpressIdFromAny(candidate);
      if (Number.isFinite(id)) return id;
    }
    return null;
  }

  function collectEntityIdsByKeys(root, keys) {
    const wanted = new Set(keys.map((k) => String(k).toLowerCase()));
    const found = new Set();
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      Object.entries(node).forEach(([key, value]) => {
        if (wanted.has(String(key).toLowerCase())) {
          const addValue = (candidate) => {
            if (Array.isArray(candidate)) {
              candidate.forEach(addValue);
              return;
            }
            const id = readExpressIdFromAny(candidate);
            if (Number.isFinite(id)) found.add(id);
          };
          addValue(value);
        }
        walk(value);
      });
    }
    walk(root);
    return Array.from(found);
  }

  function buildOpeningIdsByWallId(openings) {
    const map = new Map();
    const wallRefKeys = [
      "RelatingBuildingElement",
      "RelatedBuildingElement",
      "BuildingElement",
      "RelatingElement",
      "RelatedElement",
      "VoidsElements",
      "VoidsElement",
      "FillsVoids",
      "HasFillings",
      "HasOpenings",
    ];
    openings.forEach((opening) => {
      const openingId = readExpressIdFromAny(opening?.expressID);
      if (!Number.isFinite(openingId)) return;
      const wallIds = collectEntityIdsByKeys(opening, wallRefKeys);
      wallIds.forEach((wallId) => {
        if (!Number.isFinite(wallId)) return;
        if (!map.has(wallId)) map.set(wallId, new Set());
        map.get(wallId).add(openingId);
      });
    });
    return map;
  }

  function buildOpeningIdsByWallFromRelVoids(relVoidsElements) {
    const map = new Map();
    relVoidsElements.forEach((rel) => {
      const wallIds = collectEntityIdsByKeys(rel, ["RelatingBuildingElement", "RelatingElement", "BuildingElement"]);
      const openingIds = collectEntityIdsByKeys(rel, ["RelatedOpeningElement", "RelatingOpeningElement", "OpeningElement"]);
      wallIds.forEach((wallId) => {
        if (!Number.isFinite(wallId)) return;
        if (!map.has(wallId)) map.set(wallId, new Set());
        openingIds.forEach((openingId) => {
          if (Number.isFinite(openingId)) map.get(wallId).add(openingId);
        });
      });
    });
    return map;
  }

  function buildFillElementIdsByOpeningFromRelFills(relFillsElements) {
    const map = new Map();
    relFillsElements.forEach((rel) => {
      const openingIds = collectEntityIdsByKeys(rel, ["RelatingOpeningElement", "RelatedOpeningElement", "OpeningElement"]);
      const fillIds = collectEntityIdsByKeys(rel, ["RelatedBuildingElement", "RelatingBuildingElement", "BuildingElement"]);
      openingIds.forEach((openingId) => {
        if (!Number.isFinite(openingId)) return;
        if (!map.has(openingId)) map.set(openingId, new Set());
        fillIds.forEach((fillId) => {
          if (Number.isFinite(fillId)) map.get(openingId).add(fillId);
        });
      });
    });
    return map;
  }

  function readIfcStoreyLabel(element) {
    const fromLocation = String(element?.locationInfo?.storey || "").trim();
    if (fromLocation) return fromLocation;
    const fromPset = stringifyIfcVal(pickFirstRecursive(element?.propertySets, "Storey")).trim();
    return fromPset || "";
  }

  function readTipostruttura(element) {
    const psets = element?.propertySets;
    if (!psets || typeof psets !== "object") return "";
    const targetKeys = ["TIPOSTRUTTURA", "TipoStruttura", "Tipo Struttura", "Tipo struttura", "TypeStructure"];
    for (const key of targetKeys) {
      const raw = pickFirstRecursive(psets, key);
      const value = stringifyIfcVal(raw).trim();
      if (value) return value;
    }
    return "";
  }

  function readElementLabel(element) {
    const fromName = stringifyIfcVal(pickFirstRecursive(element?.properties, "Name")).trim();
    if (fromName) return fromName;
    const fromTag = stringifyIfcVal(pickFirstRecursive(element?.properties, "Tag")).trim();
    if (fromTag) return fromTag;
    return `${String(element?.ifcType || "Elemento")} #${String(element?.expressID || "")}`.trim();
  }

  function readElementMetric(element, metric) {
    const rows = Array.isArray(element?.quantities) ? element.quantities : [];
    const match = rows.find(
      (q) =>
        String(q?.metric || "").toLowerCase() === String(metric).toLowerCase() &&
        typeof q?.value === "number" &&
        Number.isFinite(q.value),
    );
    if (match) return Number(match.value);
    return NaN;
  }

  function readMuroDimensions(element) {
    function toFiniteNumber(value) {
      if (value === null || value === undefined) return null;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const text = String(value).trim().replace(",", ".");
      if (!text) return null;
      const parsed = Number.parseFloat(text);
      return Number.isFinite(parsed) ? parsed : null;
    }
    function tokenizeDimensionName(name) {
      return String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }
    function findQuantityValueByAliases(rows, aliases) {
      if (!Array.isArray(aliases) || aliases.length === 0) return null;
      for (const row of rows) {
        const n = toFiniteNumber(row?.value);
        if (!Number.isFinite(n)) continue;
        const tokens = tokenizeDimensionName(row?.name);
        const compact = tokens.join("");
        const hasAlias = aliases.some((alias) => tokens.includes(alias) || compact.includes(alias));
        if (hasAlias) return n;
      }
      return null;
    }
    function resolveBoundingBoxDimensionsLikeComputolore(geometry, qRows) {
      const rawX = toFiniteNumber(geometry?.boundingBoxRawX);
      const rawY = toFiniteNumber(geometry?.boundingBoxRawY);
      const rawZ = toFiniteNumber(geometry?.boundingBoxRawZ);
      const candidates = [rawX, rawY, rawZ].filter((v) => Number.isFinite(v));
      if (!candidates.length) {
        return {
          length: toFiniteNumber(geometry?.boundingBoxLength),
          width: toFiniteNumber(geometry?.boundingBoxWidth),
          height: toFiniteNumber(geometry?.boundingBoxHeight),
        };
      }

      const qLength = findQuantityValueByAliases(qRows, ["length", "lunghezza", "overalllength", "nominallength"]);
      const qWidth = findQuantityValueByAliases(qRows, [
        "width",
        "larghezza",
        "overallwidth",
        "nominalwidth",
        "thickness",
        "spessore",
        "depth",
        "profondita",
      ]);
      const qHeight = findQuantityValueByAliases(qRows, ["height", "altezza", "overallheight", "nominalheight"]);

      const remaining = [...candidates];
      const out = { length: null, width: null, height: null };
      function pickClosest(target) {
        if (!Number.isFinite(target) || !remaining.length) return null;
        let bestIdx = -1;
        let bestDelta = Number.POSITIVE_INFINITY;
        remaining.forEach((item, idx) => {
          const delta = Math.abs(item - target);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestIdx = idx;
          }
        });
        if (bestIdx < 0) return null;
        return remaining.splice(bestIdx, 1)[0];
      }
      out.height = pickClosest(qHeight);
      out.length = pickClosest(qLength);
      out.width = pickClosest(qWidth);

      const sortedRemaining = [...remaining].sort((a, b) => a - b);
      if (!Number.isFinite(out.width) && sortedRemaining.length) out.width = sortedRemaining[0];
      if (!Number.isFinite(out.height) && sortedRemaining.length > 1) out.height = sortedRemaining[1];
      if (!Number.isFinite(out.length) && sortedRemaining.length) out.length = sortedRemaining[sortedRemaining.length - 1];

      if (!Number.isFinite(out.height)) out.height = toFiniteNumber(geometry?.boundingBoxHeight);
      if (!Number.isFinite(out.length)) out.length = toFiniteNumber(geometry?.boundingBoxLength);
      if (!Number.isFinite(out.width)) out.width = toFiniteNumber(geometry?.boundingBoxWidth);
      return out;
    }

    const qRows = extractQuantityRows(element);
    const resolvedGeom = resolveBoundingBoxDimensionsLikeComputolore(element?.geometryInfo, qRows);
    const geomLength = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxLength);
    const geomHeight = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxHeight);
    const geomWidth = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxWidth);
    const geomRawX = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxRawX);
    const geomRawY = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxRawY);
    const geomRawZ = toFiniteNumberFromUnknown(element?.geometryInfo?.boundingBoxRawZ);
    const geomRawSorted = [geomRawX, geomRawY, geomRawZ].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const geomByHeuristic = geomRawSorted.length === 3
      ? {
          spessore: geomRawSorted[0],
          altezza: geomRawSorted[1],
          lunghezza: geomRawSorted[2],
        }
      : null;
    const psetLunghezza = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.propertySets, "LUNGHEZZA") ??
        pickFirstRecursive(element?.propertySets, "Lunghezza") ??
        pickFirstRecursive(element?.propertySets, "LENGTH"),
    );
    const psetAltezza = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.propertySets, "ALTEZZA") ??
        pickFirstRecursive(element?.propertySets, "Altezza") ??
        pickFirstRecursive(element?.propertySets, "HEIGHT"),
    );
    const psetSpessore = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.propertySets, "SPESSORE") ??
        pickFirstRecursive(element?.propertySets, "Spessore") ??
        pickFirstRecursive(element?.propertySets, "THICKNESS") ??
        pickFirstRecursive(element?.propertySets, "WIDTH"),
    );
    const qLength = readElementMetric(element, "length");
    const qHeight = readElementMetric(element, "height");
    const qWidth = readElementMetric(element, "width");
    const pLength = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.properties, "Length") ?? pickFirstRecursive(element?.properties, "OverallLength"),
    );
    const pHeight = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.properties, "Height") ?? pickFirstRecursive(element?.properties, "OverallHeight"),
    );
    const pWidth = toFiniteNumberFromUnknown(
      pickFirstRecursive(element?.properties, "Width") ?? pickFirstRecursive(element?.properties, "OverallWidth"),
    );
    const lunghezza = Number.isFinite(resolvedGeom?.length)
      ? resolvedGeom.length
      : Number.isFinite(psetLunghezza)
      ? psetLunghezza
      : Number.isFinite(qLength)
        ? qLength
        : Number.isFinite(pLength)
          ? pLength
          : Number.isFinite(geomLength)
            ? geomLength
            : Number.isFinite(geomByHeuristic?.lunghezza)
              ? geomByHeuristic.lunghezza
              : 0;
    const altezza = Number.isFinite(resolvedGeom?.height)
      ? resolvedGeom.height
      : Number.isFinite(psetAltezza)
        ? psetAltezza
        : Number.isFinite(qHeight)
          ? qHeight
          : Number.isFinite(pHeight)
            ? pHeight
            : Number.isFinite(geomHeight)
              ? geomHeight
              : Number.isFinite(geomByHeuristic?.altezza)
                ? geomByHeuristic.altezza
                : 0;
    const spessore = Number.isFinite(resolvedGeom?.width)
      ? resolvedGeom.width
      : Number.isFinite(psetSpessore)
      ? psetSpessore
      : Number.isFinite(geomByHeuristic?.spessore)
        ? geomByHeuristic.spessore
      : Number.isFinite(geomWidth)
        ? geomWidth
      : Number.isFinite(qWidth)
        ? qWidth
        : Number.isFinite(pWidth)
          ? pWidth
          : 0;
    return {
      lunghezza: Number(lunghezza.toFixed(2)),
      altezza: Number(altezza.toFixed(2)),
      spessore: Number(spessore.toFixed(2)),
    };
  }

  function readAperturaDimensions(openingElement) {
    function toFiniteNumber(value) {
      if (value === null || value === undefined) return null;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const text = String(value).trim().replace(",", ".");
      if (!text) return null;
      const parsed = Number.parseFloat(text);
      return Number.isFinite(parsed) ? parsed : null;
    }
    function tokenizeDimensionName(name) {
      return String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }
    function findQuantityValueByAliases(rows, aliases) {
      if (!Array.isArray(aliases) || aliases.length === 0) return null;
      for (const row of rows) {
        const n = toFiniteNumber(row?.value);
        if (!Number.isFinite(n)) continue;
        const tokens = tokenizeDimensionName(row?.name);
        const compact = tokens.join("");
        const hasAlias = aliases.some((alias) => tokens.includes(alias) || compact.includes(alias));
        if (hasAlias) return n;
      }
      return null;
    }
    function resolveBoundingBoxDimensionsLikeComputolore(geometry, qRows) {
      const rawX = toFiniteNumber(geometry?.boundingBoxRawX);
      const rawY = toFiniteNumber(geometry?.boundingBoxRawY);
      const rawZ = toFiniteNumber(geometry?.boundingBoxRawZ);
      const candidates = [rawX, rawY, rawZ].filter((v) => Number.isFinite(v));
      if (!candidates.length) {
        return {
          length: toFiniteNumber(geometry?.boundingBoxLength),
          width: toFiniteNumber(geometry?.boundingBoxWidth),
          height: toFiniteNumber(geometry?.boundingBoxHeight),
        };
      }
      const qLength = findQuantityValueByAliases(qRows, ["length", "lunghezza", "overalllength", "nominallength"]);
      const qWidth = findQuantityValueByAliases(qRows, [
        "width",
        "larghezza",
        "overallwidth",
        "nominalwidth",
        "thickness",
        "spessore",
        "depth",
        "profondita",
      ]);
      const qHeight = findQuantityValueByAliases(qRows, ["height", "altezza", "overallheight", "nominalheight"]);

      const remaining = [...candidates];
      const out = { length: null, width: null, height: null };
      function pickClosest(target) {
        if (!Number.isFinite(target) || !remaining.length) return null;
        let bestIdx = -1;
        let bestDelta = Number.POSITIVE_INFINITY;
        remaining.forEach((item, idx) => {
          const delta = Math.abs(item - target);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestIdx = idx;
          }
        });
        if (bestIdx < 0) return null;
        return remaining.splice(bestIdx, 1)[0];
      }
      out.height = pickClosest(qHeight);
      out.length = pickClosest(qLength);
      out.width = pickClosest(qWidth);
      const sortedRemaining = [...remaining].sort((a, b) => a - b);
      if (!Number.isFinite(out.width) && sortedRemaining.length) out.width = sortedRemaining[0];
      if (!Number.isFinite(out.height) && sortedRemaining.length > 1) out.height = sortedRemaining[1];
      if (!Number.isFinite(out.length) && sortedRemaining.length) out.length = sortedRemaining[sortedRemaining.length - 1];
      if (!Number.isFinite(out.height)) out.height = toFiniteNumber(geometry?.boundingBoxHeight);
      if (!Number.isFinite(out.length)) out.length = toFiniteNumber(geometry?.boundingBoxLength);
      if (!Number.isFinite(out.width)) out.width = toFiniteNumber(geometry?.boundingBoxWidth);
      return out;
    }

    const qRows = extractQuantityRows(openingElement);
    const resolvedGeom = resolveBoundingBoxDimensionsLikeComputolore(openingElement?.geometryInfo, qRows);
    const qLength = readElementMetric(openingElement, "length");
    const qHeight = readElementMetric(openingElement, "height");
    const qWidth = readElementMetric(openingElement, "width");
    const fromPropsLength = toFiniteNumberFromUnknown(
      pickFirstRecursive(openingElement?.properties, "OverallWidth") ??
        pickFirstRecursive(openingElement?.properties, "Width") ??
        pickFirstRecursive(openingElement?.properties, "NominalWidth"),
    );
    const fromPropsHeight = toFiniteNumberFromUnknown(
      pickFirstRecursive(openingElement?.properties, "OverallHeight") ??
        pickFirstRecursive(openingElement?.properties, "Height") ??
        pickFirstRecursive(openingElement?.properties, "NominalHeight"),
    );
    const fromPropsSpessore = toFiniteNumberFromUnknown(
      pickFirstRecursive(openingElement?.properties, "Thickness") ??
        pickFirstRecursive(openingElement?.properties, "Depth"),
    );
    const lunghezza = Number.isFinite(resolvedGeom?.length)
      ? Number(resolvedGeom.length.toFixed(2))
      : Number.isFinite(qLength)
        ? Number(qLength.toFixed(2))
      : Number.isFinite(fromPropsLength)
        ? Number(fromPropsLength.toFixed(2))
        : 0;
    const altezza = Number.isFinite(resolvedGeom?.height)
      ? Number(resolvedGeom.height.toFixed(2))
      : Number.isFinite(qHeight)
        ? Number(qHeight.toFixed(2))
      : Number.isFinite(fromPropsHeight)
        ? Number(fromPropsHeight.toFixed(2))
        : 0;
    const spessore = Number.isFinite(resolvedGeom?.width)
      ? Number(resolvedGeom.width.toFixed(2))
      : Number.isFinite(qWidth)
        ? Number(qWidth.toFixed(2))
        : Number.isFinite(fromPropsSpessore)
          ? Number(fromPropsSpessore.toFixed(2))
          : 0;
    const doorWinFix = correctLunghezzaAltezzaForDoorWindow(
      String(lunghezza),
      String(altezza),
      openingElement?.ifcType,
    );
    const parseDim2 = (s) => {
      const n = Number(String(s).replace(",", "."));
      return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
    };
    return {
      lunghezza: parseDim2(doorWinFix.lunghezza),
      altezza: parseDim2(doorWinFix.altezza),
      spessore,
    };
  }

  function resolvePianoIdPerImportBim() {
    if (Number.isFinite(compilazionePianoId)) return compilazionePianoId;
    const primoInterrato = piani.find((p) => String(p.tipologia || "").toLowerCase() === "interrato");
    if (primoInterrato) return primoInterrato.id;
    if (piani.length > 0) return piani[0].id;
    return null;
  }

  function aggiornaUndoButtonProvaBim() {
    if (!ifcToMuriApertureUndoButtonEl) return;
    ifcToMuriApertureUndoButtonEl.disabled = !provaBimWallsBackup;
  }

  function annullaUltimaProvaMuriApertureDaIfc() {
    if (!provaBimWallsBackup) {
      window.alert("Nessuna prova BIM da annullare.");
      return;
    }
    piani = cloneStateArray(provaBimWallsBackup.piani);
    stratiMurElevazione = cloneStateArray(provaBimWallsBackup.stratiMurElevazione);
    apertureElevazione = cloneStateArray(provaBimWallsBackup.apertureElevazione);
    stratoMurIdCounter = Number(provaBimWallsBackup.stratoMurIdCounter || 1);
    aperturaElevIdCounter = Number(provaBimWallsBackup.aperturaElevIdCounter || 1);
    compilazionePianoId = provaBimWallsBackup.compilazionePianoId;
    provaBimWallsBackup = null;
    savePiani();
    saveMurDati();
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    aggiornaUndoButtonProvaBim();
    window.alert("Annullamento prova completato: dati precedenti ripristinati.");
  }

  function importaMuriEApertureDaIfcProva() {
    if (!ifcDataCache || !Array.isArray(ifcDataCache.elements) || ifcDataCache.elements.length === 0) {
      window.alert("Nessun dato IFC disponibile. Carica prima un file IFC.");
      return;
    }
    const pianoIdTarget = resolvePianoIdPerImportBim();
    if (!Number.isFinite(pianoIdTarget)) {
      window.alert("Nessun piano disponibile. Crea prima almeno un piano.");
      return;
    }

    const allElements = ifcDataCache.elements.filter((e) => e && typeof e === "object");
    const walls = allElements.filter((e) => {
      const t = normalizeIfcTypeName(e.ifcType);
      return t === "IFCWALL" || t === "IFCWALLSTANDARDCASE";
    });
    const openings = allElements.filter((e) => normalizeIfcTypeName(e.ifcType) === "IFCOPENINGELEMENT");
    const relVoidsElements = allElements.filter((e) => normalizeIfcTypeName(e.ifcType) === "IFCRELVOIDSELEMENT");
    const relFillsElements = allElements.filter((e) => normalizeIfcTypeName(e.ifcType) === "IFCRELFILLSELEMENT");
    const doorsAndWindows = allElements.filter((e) => {
      const t = normalizeIfcTypeName(e.ifcType);
      return t === "IFCDOOR" || t === "IFCWINDOW";
    });
    if (walls.length === 0) {
      window.alert("Nel modello IFC non sono stati trovati muri (IFCWALL / IFCWALLSTANDARDCASE).");
      return;
    }

    const openingsByExpressId = new Map();
    openings.forEach((o) => {
      const id = readExpressIdFromAny(o?.expressID);
      if (Number.isFinite(id)) openingsByExpressId.set(id, o);
    });
    const elementsByExpressId = new Map();
    allElements.forEach((el) => {
      const id = readExpressIdFromAny(el?.expressID);
      if (Number.isFinite(id)) elementsByExpressId.set(id, el);
    });
    doorsAndWindows.forEach((el) => {
      const id = readExpressIdFromAny(el?.expressID);
      if (Number.isFinite(id)) elementsByExpressId.set(id, el);
    });
    const openingIdsByWallId = buildOpeningIdsByWallId(openings);
    const openingIdsByWallFromRelVoids = buildOpeningIdsByWallFromRelVoids(relVoidsElements);
    const fillElementIdsByOpening = buildFillElementIdsByOpeningFromRelFills(relFillsElements);

    const piano = piani.find((item) => item.id === pianoIdTarget);
    const pianoLabel = piano ? `${piano.tipologia} ${piano.piano}`.trim() : `ID ${pianoIdTarget}`;
    const conferma = window.confirm(
      `Prova BIM: importare ${walls.length} muri nel piano "${pianoLabel}"?\n` +
        `L'operazione è annullabile con il pulsante "Annulla ultima prova BIM".`,
    );
    if (!conferma) return;

    provaBimWallsBackup = {
      piani: cloneStateArray(piani),
      stratiMurElevazione: cloneStateArray(stratiMurElevazione),
      apertureElevazione: cloneStateArray(apertureElevazione),
      stratoMurIdCounter,
      aperturaElevIdCounter,
      compilazionePianoId,
    };

    let muriImportati = 0;
    let apertureImportate = 0;
    const riferimentiIfcMuro = [];
    let spessorePrimoMuro = 0;

    walls.forEach((wall) => {
      const tipoStruttura = readTipostruttura(wall);
      const storey = readIfcStoreyLabel(wall);
      const label = readElementLabel(wall);
      const dimsMuro = readMuroDimensions(wall);
      const riferimentoParts = [label];
      if (tipoStruttura) riferimentoParts.push(`TIPOSTRUTTURA: ${tipoStruttura}`);
      if (storey) riferimentoParts.push(`Piano IFC: ${storey}`);
      riferimentiIfcMuro.push(riferimentoParts.join(" | "));
      if (muriImportati === 0) spessorePrimoMuro = Number(dimsMuro.spessore) || 0;
      muriImportati += 1;

      const wallExpressId = readExpressIdFromAny(wall?.expressID);
      const openingIdsFromWall = collectEntityIdsByKeys(wall, [
        "RelatedOpeningElement",
        "RelatingOpeningElement",
        "HasOpenings",
        "VoidsElements",
      ]);
      const openingIdsFromOpeningSide = Number.isFinite(wallExpressId)
        ? Array.from(openingIdsByWallId.get(wallExpressId) || [])
        : [];
      const openingIdsFromRelVoids = Number.isFinite(wallExpressId)
        ? Array.from(openingIdsByWallFromRelVoids.get(wallExpressId) || [])
        : [];
      const openingIds = Array.from(
        new Set([...openingIdsFromWall, ...openingIdsFromOpeningSide, ...openingIdsFromRelVoids]),
      );
      openingIds.forEach((openingId) => {
        const opening = openingsByExpressId.get(openingId) || null;
        const fillCandidateIds = Array.from(fillElementIdsByOpening.get(openingId) || []);
        const fillElement = fillCandidateIds
          .map((id) => elementsByExpressId.get(id))
          .find((el) => el && (normalizeIfcTypeName(el.ifcType) === "IFCDOOR" || normalizeIfcTypeName(el.ifcType) === "IFCWINDOW"));
        if (!opening && !fillElement) return;
        // Il vano IFC (IFCOPENINGELEMENT) spesso non ha BBox/geometry per-id nel mesh: le misure risultano
        // uguali o assurde per tutte. Porta/finestra ha mesh solida: preferiscila per L/A/S.
        const elementForDimensions = fillElement || opening;
        const dims = readAperturaDimensions(elementForDimensions);
        const openingLabel = readElementLabel(fillElement || opening);
        apertureElevazione.push({
          idAperturaElev: aperturaElevIdCounter++,
          idPiano: pianoIdTarget,
          locale: openingLabel || `Apertura IFC #${openingId}`,
          lunghezza: dims.lunghezza,
          altezza: dims.altezza,
          spessoreIfc: dims.spessore,
          lunghezzaIfc: dims.lunghezza,
          altezzaIfc: dims.altezza,
          ante: 1,
          tipologia: "IFC",
          falsotelai: false,
          hDavanzale: 0,
          idVoceCapitolato: "",
          origineImport: "IFC_PROVA",
        });
        apertureImportate += 1;
      });
    });

    piani = piani.map((p) =>
      p.id === pianoIdTarget
        ? {
            ...p,
            murRiferimento: riferimentiIfcMuro.join(" || "),
            murSpessore: spessorePrimoMuro,
          }
        : p,
    );
    savePiani();

    compilazionePianoId = pianoIdTarget;

    saveMurDati();
    renderMurielevazioni();
    renderStrati();
    renderAperture();
    aggiornaUndoButtonProvaBim();

    window.alert(
      `Prova BIM completata.\nMuri importati: ${muriImportati}\nAperture collegate importate: ${apertureImportate}\n` +
        `Relazioni voids trovate: ${relVoidsElements.length} | Relazioni fills trovate: ${relFillsElements.length}\n\n` +
        `Se il risultato non ti convince, usa "Annulla ultima prova BIM".`,
    );
  }

  function buildRiepilogoCollegamentiRows() {
    const apertureIfc = apertureElevazione.filter((ap) => String(ap?.origineImport || "") === "IFC_PROVA");
    const rows = [];
    apertureIfc.forEach((ap) => {
      const p = piani.find((x) => x.id === ap.idPiano);
      rows.push({
        idPiano: ap.idPiano,
        riferimento: typeof p?.murRiferimento === "string" ? p.murRiferimento : "",
        lunghezza: "-",
        altezza: "-",
        spessore:
          typeof p?.murSpessore === "number" ? fmt2(p.murSpessore) : "-",
        aperturaId: ap.idAperturaElev,
        aperturaLocale: ap.locale || "",
        aperturaLunghezza: fmt2(Number((ap?.lunghezzaIfc ?? ap?.lunghezza) || 0)),
        aperturaAltezza: fmt2(Number((ap?.altezzaIfc ?? ap?.altezza) || 0)),
        aperturaSpessore: fmt2(Number(ap?.spessoreIfc || 0)),
        aperturaTipologia: ap.tipologia || "",
      });
    });
    return rows;
  }

  function renderRiepilogoCollegamentiDialog() {
    const rows = buildRiepilogoCollegamentiRows();
    const apertureIfc = apertureElevazione.filter((a) => String(a?.origineImport || "") === "IFC_PROVA");
    const totaleAperture = apertureIfc.length;

    const tableRowsHtml =
      rows.length === 0
        ? `<tr><td colspan="11" class="empty-cell">Nessuna apertura IFC importata per questo piano.</td></tr>`
        : rows
            .map(
              (r) => `<tr>
          <td>${escapeHtml(r.idPiano)}</td>
          <td>${escapeHtml(r.riferimento)}</td>
          <td>${escapeHtml(r.lunghezza)}</td>
          <td>${escapeHtml(r.altezza)}</td>
          <td>${escapeHtml(r.spessore)}</td>
          <td>${escapeHtml(r.aperturaId)}</td>
          <td>${escapeHtml(r.aperturaLocale)}</td>
          <td>${escapeHtml(r.aperturaLunghezza)}</td>
          <td>${escapeHtml(r.aperturaAltezza)}</td>
          <td>${escapeHtml(r.aperturaSpessore)}</td>
          <td>${escapeHtml(r.aperturaTipologia)}</td>
        </tr>`,
            )
            .join("");

    ifcRiepilogoTableWrapEl.innerHTML = `
      <p class="bim-riepilogo-note">
        Aperture IFC (prova): <strong>${totaleAperture}</strong>
      </p>
      <div class="table-wrap bim-riepilogo-table-wrap">
        <table class="data-table bim-riepilogo-table">
          <thead>
            <tr>
              <th>ID Piano</th>
              <th>Riferimento muro (piano)</th>
              <th>Lung. muro</th>
              <th>Alt. muro</th>
              <th>Spess. muro</th>
              <th>ID Apertura</th>
              <th>Apertura / locale</th>
              <th>Apertura Lunghezza</th>
              <th>Apertura Altezza</th>
              <th>Apertura Spessore</th>
              <th>Tipologia</th>
            </tr>
          </thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>
      </div>`;
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
      ? pianiSource
          .filter(
            (item) =>
              typeof item?.id === "number" &&
              typeof item?.tipologia === "string" &&
              (typeof item?.edificio === "string" || typeof item?.edificio === "undefined") &&
              typeof item?.piano === "string",
          )
          .map((item) => ({
            ...item,
            edificio: typeof item?.edificio === "string" ? item.edificio : "",
            murRiferimento:
              typeof item?.murRiferimento === "string"
                ? item.murRiferimento
                : typeof item?.mur_riferimento === "string"
                  ? item.mur_riferimento
                  : "",
            murSpessore:
              typeof item?.murSpessore === "number"
                ? item.murSpessore
                : typeof item?.mur_spessore === "number"
                  ? item.mur_spessore
                  : undefined,
          }))
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

    const elevToPianoImport = new Map(
      importedMurielevazioni.map((m) => [m.idElevazione, m.idPiano]),
    );

    const stratiRaw = Array.isArray(payload.stratiMurElevazione) ? payload.stratiMurElevazione : [];
    const importedStrati = stratiRaw
      .map((item) => {
        if (
          !item ||
          typeof item.idStratoMur !== "number" ||
          typeof item.idStrato !== "string" ||
          typeof item.lunghezza !== "number" ||
          typeof item.altezza !== "number" ||
          typeof item.spessore !== "number" ||
          typeof item.idVoceCapitolato !== "string"
        ) {
          return null;
        }
        let idPiano = typeof item.idPiano === "number" ? item.idPiano : null;
        if (idPiano === null && typeof item.idElevazione === "number") {
          idPiano = elevToPianoImport.get(item.idElevazione) ?? null;
        }
        if (typeof idPiano !== "number") return null;
        const { idElevazione: _ig, ...rest } = item;
        return { ...rest, idPiano };
      })
      .filter(Boolean);

    const apertureRaw = Array.isArray(payload.apertureElevazione) ? payload.apertureElevazione : [];
    const importedAperture = apertureRaw
      .map((item) => {
        if (
          !item ||
          typeof item.idAperturaElev !== "number" ||
          typeof item.locale !== "string" ||
          typeof item.lunghezza !== "number" ||
          typeof item.altezza !== "number" ||
          typeof item.ante !== "number" ||
          typeof item.tipologia !== "string" ||
          typeof item.falsotelai !== "boolean" ||
          typeof item.hDavanzale !== "number" ||
          typeof item.idVoceCapitolato !== "string"
        ) {
          return null;
        }
        let idPiano = typeof item.idPiano === "number" ? item.idPiano : null;
        if (idPiano === null && typeof item.idElevazione === "number") {
          idPiano = elevToPianoImport.get(item.idElevazione) ?? null;
        }
        if (typeof idPiano !== "number") return null;
        const { idElevazione: _ig, ...rest } = item;
        return { ...rest, idPiano };
      })
      .filter(Boolean);

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
              apertureCollegate: normalizzaApertureCollegateMisurazione(item.apertureCollegate),
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
      misurazioniManuali: normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura),
      voce: item.voce,
      note: typeof item?.note === "string" ? item.note : "",
    }));

    const importedUnita = Array.isArray(payload.vociUnitaMisuraOptions)
      ? payload.vociUnitaMisuraOptions
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      : [];
    const importedApertureMaster = normalizzaApertureMaster(payload.apertureMaster);

    piani = importedPiani.map((p) => {
      const fromMur = importedMurielevazioni.find((m) => m.idPiano === p.id);
      const murRiferimento =
        typeof p.murRiferimento === "string" && p.murRiferimento.trim() !== ""
          ? p.murRiferimento
          : fromMur
            ? fromMur.riferimento
            : "";
      const murSpessore =
        typeof p.murSpessore === "number"
          ? p.murSpessore
          : fromMur
            ? fromMur.spessore
            : 0;
      return { ...p, murRiferimento, murSpessore };
    });
    stratiMurElevazione = importedStrati;
    apertureElevazione = importedAperture;
    scaviEsterni = importedScavi;
    corselliEsterni = importedCorselli;
    camminamentiEsterni = [];
    misurazioniVarie = importedMisurazioni;
    voci = importedVoci;
    apertureMaster = importedApertureMaster;

    if (Array.isArray(payload.archivioPianiMisura)) {
      const mapImp = new Map();
      for (const item of payload.archivioPianiMisura) {
        if (typeof item === "string") mergeNomePianoInMap(mapImp, item);
      }
      archivioPianiMisura = sortedUniquePianiNomiFromMap(mapImp);
    } else {
      archivioPianiMisura = [];
    }
    syncArchivioPianiMisuraCompleto();

    const uniqueUnita = [];
    [...UNITA_MISURA_DEFAULT_OPTIONS, ...importedUnita, ...voci.map((v) => v.unitaMisura)].forEach(
      (item) => {
        if (!uniqueUnita.some((u) => u.toLowerCase() === item.toLowerCase())) uniqueUnita.push(item);
      },
    );
    vociUnitaMisuraOptions = uniqueUnita;

    pianoIdCounter = piani.reduce((max, item) => Math.max(max, item.id), 0) + 1;
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
    apertureMasterIdCounter =
      apertureMaster.reduce((max, ap) => {
        const n = Number(String(ap.idAperturaMaster || "").replace("APM-", ""));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0) + 1;

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

    savePiani();
    saveMurDati();
    saveArchivioPianiMisuraToStorage();
    saveApertureMaster();
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
    syncEsterniVersoVoci();

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
    refreshComputoBaselineSnapshot();
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

  function syncMurParamsInputsDaPianoCorrente() {
    if (!murParamsRiferimentoEl || !murParamsSpessoreEl) return;
    if (compilazionePianoId === null) {
      murParamsRiferimentoEl.value = "";
      murParamsSpessoreEl.value = "";
      murParamsRiferimentoEl.disabled = true;
      murParamsSpessoreEl.disabled = true;
      return;
    }
    const p = piani.find((e) => e.id === compilazionePianoId);
    murParamsRiferimentoEl.disabled = false;
    murParamsSpessoreEl.disabled = false;
    murParamsRiferimentoEl.value = typeof p?.murRiferimento === "string" ? p.murRiferimento : "";
    murParamsSpessoreEl.value = fmt2(typeof p?.murSpessore === "number" ? p.murSpessore : 0);
  }

  function renderMurielevazioni() {
    syncMurParamsInputsDaPianoCorrente();
  }

  function renderStrati() {
    stratiMurBodyEl.innerHTML = "";
    updateMurPianoCompilazioneLabel(
      idPianoCompilazioneEl,
      riferimentoMurPianoEl,
      compilazionePianoId,
      piani,
    );
    const totaleStrati =
      compilazionePianoId === null
        ? 0
        : stratiMurElevazione.filter((s) => s.idPiano === compilazionePianoId).length;
    countStratiEl.textContent = `(${totaleStrati})`;

    try {
      if (compilazionePianoId === null) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-cell";
        cell.textContent =
          "Apri Compila su un piano Interrato: serve un piano attivo e i campi Riferimento / Spessore muro sopra.";
        row.appendChild(cell);
        stratiMurBodyEl.appendChild(row);
        return;
      }

      const visibili = stratiMurElevazione.filter((s) => s.idPiano === compilazionePianoId);
      if (visibili.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-cell";
        cell.textContent = "Nessuno strato per questo piano.";
        row.appendChild(cell);
        stratiMurBodyEl.appendChild(row);
        return;
      }

      visibili.forEach((item) => {
        const row = document.createElement("tr");
        row.appendChild(createCell(String(item.idStratoMur)));
        row.appendChild(createCell(String(item.idPiano)));
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
      const pianoAttivo = piani.find((e) => e.id === compilazionePianoId);
      const spessoreElevazione = Number(pianoAttivo?.murSpessore ?? 0);
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
      confrontoCell.textContent = `Spessore muro (piano): ${fmt2(spessoreElevazione)}`;

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
      stratiMurElevazione,
      apertureElevazione,
      createCell,
      fmt2,
      altezzaAperturaInclusaNelloStrato,
    });
  }

  function renderAperture() {
    apertureElevBodyEl.innerHTML = "";
    updateMurPianoCompilazioneLabel(
      idPianoCompilazioneEl,
      riferimentoMurPianoEl,
      compilazionePianoId,
      piani,
    );
    const totaleAperture =
      compilazionePianoId === null
        ? 0
        : apertureElevazione.filter((a) => a.idPiano === compilazionePianoId).length;
    countApertureEl.textContent = `(${totaleAperture})`;

    try {
      if (compilazionePianoId === null) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 11;
        cell.className = "empty-cell";
        cell.textContent =
          "Apri Compila su un piano Interrato e verifica Riferimento / Spessore muro sopra per gestire le aperture.";
        row.appendChild(cell);
        apertureElevBodyEl.appendChild(row);
        return;
      }

      const visibili = apertureElevazione.filter((a) => a.idPiano === compilazionePianoId);
      if (visibili.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 11;
        cell.className = "empty-cell";
        cell.textContent = "Nessuna apertura per questo piano.";
        row.appendChild(cell);
        apertureElevBodyEl.appendChild(row);
        return;
      }

      visibili.forEach((item) => {
        const row = document.createElement("tr");
        row.appendChild(createCell(String(item.idAperturaElev)));
        row.appendChild(createCell(String(item.idPiano)));
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

      const addAperturaButton = document.createElement("button");
      addAperturaButton.type = "button";
      addAperturaButton.className = "btn-action";
      addAperturaButton.dataset.action = "add-apertura-misurazione";
      addAperturaButton.dataset.id = String(item.idMisurazione);
      addAperturaButton.textContent = "Aggiungi apertura";

      actionsCell.append(editButton, deleteButton, addAperturaButton);
      row.appendChild(actionsCell);
      misurazioniBodyEl.appendChild(row);

      const detailRow = document.createElement("tr");
      detailRow.className = "misurazione-aperture-row";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 9;
      detailCell.className = "empty-cell";
      const apertureCollegate = normalizzaApertureCollegateMisurazione(item.apertureCollegate);
      if (apertureCollegate.length === 0) {
        detailCell.textContent = "Aperture collegate: nessuna.";
      } else {
        const wrapper = document.createElement("div");
        wrapper.textContent = `Aperture collegate (${apertureCollegate.length}): `;
        apertureCollegate.forEach((apertura, index) => {
          if (index > 0) wrapper.append(" | ");
          const itemWrap = document.createElement("span");
          itemWrap.textContent =
            `${apertura.locale} - L:${fmt2(apertura.lunghezza)} H:${fmt2(apertura.altezza)} ` +
            `Ante:${apertura.ante} Tipo:${apertura.tipologia} Falsotelai:${apertura.falsotelai ? "Si" : "No"} ` +
            `Dav:${fmt2(apertura.hDavanzale)} Voce:${apertura.idVoceCapitolato || "-"}`;
          const delAperturaButton = document.createElement("button");
          delAperturaButton.type = "button";
          delAperturaButton.className = "btn-action btn-delete";
          delAperturaButton.dataset.action = "delete-apertura-misurazione";
          delAperturaButton.dataset.id = String(item.idMisurazione);
          delAperturaButton.dataset.aperturaId = apertura.idApertura;
          delAperturaButton.textContent = "Elimina apertura";
          itemWrap.append(" ", delAperturaButton);
          wrapper.appendChild(itemWrap);
        });
        detailCell.appendChild(wrapper);
      }
      detailRow.appendChild(detailCell);
      misurazioniBodyEl.appendChild(detailRow);
    });
  }

  pianoFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const tipologia = tipologiaEl.value.trim();
    const edificio = edificioEl.value.trim();
    const piano = pianoEl.value.trim();
    if (!tipologia || !edificio || !piano) return;

    if (editingPianoId === null) {
      piani.push({
        id: pianoIdCounter,
        tipologia,
        edificio,
        piano,
        murRiferimento: "",
        murSpessore: 0,
      });
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
    if (compilazionePianoId === null) {
      window.alert("Apri Compila su un piano Interrato: serve un piano attivo.");
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

    const spessoreMur = getSpessoreMurPianoCorrente();
    if (spessoreMur <= 0) {
      window.alert(
        "Prima di aggiungere uno strato devi inserire lo SPESSORE nel campo sopra (muro del piano).",
      );
      return;
    }

    const residuo = calcolaSpessoreResiduoPerPiano(compilazionePianoId, editingStratoMurId);
    if (residuo <= 0) {
      window.alert("Hai gia' raggiunto lo spessore massimo del muro per questo piano.");
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
      const idStrato = String(prossimoIdStratoPerPiano(compilazionePianoId));
      stratiMurElevazione.push({
        idStratoMur: stratoMurIdCounter++,
        idPiano: compilazionePianoId,
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
    if (compilazionePianoId === null) {
      window.alert("Apri Compila su un piano Interrato: serve un piano attivo.");
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
        idPiano: compilazionePianoId,
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
    const piano = ensurePianoMisuraInArchivio(scavoPianoEl.value);
    scavoPianoEl.value = piano;
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
    syncEsterniVersoVoci();
    resetScavoForm();
    updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
  });

  corselloFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const piano = ensurePianoMisuraInArchivio(corselloPianoEl.value);
    corselloPianoEl.value = piano;
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
    syncEsterniVersoVoci();
    resetCorselloForm();
    updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
  });

  if (misurazioniFormEl) {
    misurazioniFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const idVoce = misurazioniIdVoceEl.value.trim();
      const piano = ensurePianoMisuraInArchivio(misurazioniPianoEl.value);
      misurazioniPianoEl.value = piano;
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
        misurazioniVarie.push({
          ...payload,
          idMisurazione: misurazioniIdCounter++,
          apertureCollegate: [],
        });
      } else {
        misurazioniVarie = misurazioniVarie.map((item) =>
          item.idMisurazione === editingMisurazioneId
            ? {
                ...item,
                ...payload,
                apertureCollegate: normalizzaApertureCollegateMisurazione(item.apertureCollegate),
              }
            : item,
        );
      }

      saveMurDati();
      renderMisurazioniVarie();
      syncEsterniVersoVoci();
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
    } else if (targetId === misurazioniFormulaEl?.id) {
      misurazioniFormulaEl.value = formulaDialogTextEl.value.trim();
      updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
    }
    formulaDialogEl.close();
  });

  document.addEventListener("input", (event) => {
    if (!isElementoInFormTracciatoPerDirty(event.target)) return;
    segnaComputoModificatoPerExportJson();
  });
  document.addEventListener("change", (event) => {
    if (!isElementoInFormTracciatoPerDirty(event.target)) return;
    segnaComputoModificatoPerExportJson();
  });

  voceMmRigaDialogFormEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    salvaVoceMmRigaDialog();
  });

  voceMmRigaFormulaEl?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaTipoOggettoEl?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaSpecificaEl?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaMisura1El?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaMisura2El?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaMisura3El?.addEventListener("input", () => {
    syncVoceMmExclusiveFields();
  });
  voceMmRigaNumeroEl?.addEventListener("input", () => {
    updateVoceMmRisultatoPreview();
  });
  voceMmRigaSegnoEl?.addEventListener("change", () => {
    updateVoceMmRisultatoPreview();
  });
  voceMmCopiaMisureInFormulaEl?.addEventListener("click", () => {
    const m1 = formatFixedOrOne(voceMmRigaMisura1El?.value);
    const m2 = formatFixedOrOne(voceMmRigaMisura2El?.value);
    const m3 = formatFixedOrOne(voceMmRigaMisura3El?.value);
    if (m1 === null || m2 === null || m3 === null) {
      window.alert("Le misure devono essere numeri validi (max 3 decimali) prima della copia in formula.");
      return;
    }
    const hadAnyMisura =
      (voceMmRigaMisura1El?.value || "").trim() !== "" ||
      (voceMmRigaMisura2El?.value || "").trim() !== "" ||
      (voceMmRigaMisura3El?.value || "").trim() !== "";
    if (!hadAnyMisura) {
      window.alert("Compila almeno una misura prima di usare la copia in formula.");
      return;
    }
    const confirmed = window.confirm(
      "Confermi la conversione in FORMULA?\nVerrà inserito (MISURA1 * MISURA2 * MISURA3) nel campo FORMULA e saranno azzerati i campi semiautomatici.",
    );
    if (!confirmed) return;
    if (voceMmRigaFormulaEl) voceMmRigaFormulaEl.value = `(${m1} * ${m2} * ${m3})`;
    if (voceMmRigaMisura1El) voceMmRigaMisura1El.value = "";
    if (voceMmRigaMisura2El) voceMmRigaMisura2El.value = "";
    if (voceMmRigaMisura3El) voceMmRigaMisura3El.value = "";
    if (voceMmRigaTipoOggettoEl) voceMmRigaTipoOggettoEl.value = "";
    if (voceMmRigaSpecificaEl) voceMmRigaSpecificaEl.value = "";
    syncVoceMmExclusiveFields();
  });

  voceMmTemplateFaldaButtonEl?.addEventListener("click", () => {
    if (!voceMmTemplateFaldaDialogEl) return;
    if (voceMmTemplateFaldaGrondaEl) {
      voceMmTemplateFaldaGrondaEl.value =
        typeof voceMmTemplateFaldaMeta.gronda === "number" ? String(voceMmTemplateFaldaMeta.gronda) : "";
    }
    if (voceMmTemplateFaldaSalitaEl) voceMmTemplateFaldaSalitaEl.value = "";
    if (voceMmTemplateFaldaPendenzaEl) voceMmTemplateFaldaPendenzaEl.value = "";
    if (voceMmTemplateFaldaCanaleEl) voceMmTemplateFaldaCanaleEl.checked = voceMmTemplateFaldaMeta.canale === true;
    voceMmTemplateFaldaDialogEl.showModal();
    setTimeout(() => voceMmTemplateFaldaGrondaEl?.focus(), 0);
  });

  voceMmTemplateFaldaCancelEl?.addEventListener("click", () => {
    voceMmTemplateFaldaDialogEl?.close();
  });

  voceMmTemplateFaldaFormEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const grondaTxt = formatFixed3ForFormula(voceMmTemplateFaldaGrondaEl?.value);
    const salitaTxt = formatFixed3ForFormula(voceMmTemplateFaldaSalitaEl?.value);
    const pendenzaVal = parseNonNegativeDecimal3OrNull(voceMmTemplateFaldaPendenzaEl?.value);
    if (!grondaTxt || !salitaTxt || pendenzaVal === null) {
      window.alert("Compila Gronda, Salita e Pendenza con numeri validi (max 3 decimali).");
      return;
    }
    const pendenzaFactor = pendenzaVal / 100;
    const radqVal = Math.sqrt(1 + pendenzaFactor * pendenzaFactor);
    const radqTxt = Number(radqVal.toFixed(6)).toString();
    const grondaVal = parseNonNegativeDecimal3OrNull(voceMmTemplateFaldaGrondaEl?.value);
    const canaleChecked = voceMmTemplateFaldaCanaleEl?.checked === true;
    voceMmTemplateFaldaMeta = {
      canale: canaleChecked,
      gronda: canaleChecked && grondaVal !== null ? Number(grondaVal.toFixed(3)) : null,
    };
    if (voceMmRigaFormulaEl) {
      voceMmRigaFormulaEl.value = `(${grondaTxt} * (${salitaTxt} * ${radqTxt}))`;
    }
    voceMmTemplateFaldaDialogEl?.close();
    syncVoceMmExclusiveFields();
  });

  voceMmRigaCancelEl?.addEventListener("click", () => {
    voceMmRigaDialogEl?.close();
    voceMmDialogContext = { idVoce: null, index: null };
    voceMmTemplateFaldaMeta = { canale: false, gronda: null };
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
    if (voceIdBloccataInVoci(idVoce)) {
      const voce = voci.find((item) => item.idVoce === idVoce);
      const msg = voce && isVoceSpecialeNoTotaleRiferimento(voce)
        ? "Questa voce automatica è in sola lettura in VOCI. Modifica dai relativi strumenti."
        : "Questa voce deriva da VANI o CAMMINAMENTI: in VOCI puoi modificare solo l'unità di misura (✎).";
      window.alert(msg);
      return;
    }
    openVoceMmRigaDialog(idVoce, idx);
  });

  aggiungiVoceButtonEl.addEventListener("click", () => {
    resetVoceForm();
    voceDialogEl.showModal();
    setTimeout(() => vocePosizioneEl.focus(), 0);
  });

  document.addEventListener("computo-apri-dialog-nuova-voce", () => {
    if (!voceDialogEl) return;
    resetVoceForm();
    if (voceTipoMisuraEl) voceTipoMisuraEl.value = TIPOMISURA_VOCE_MANUALE;
    voceDialogEl.showModal();
    setTimeout(() => vocePosizioneEl?.focus(), 0);
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
    resetVoceForm();
    voceDialogEl.close();
  });

  voceDialogEl?.addEventListener("close", () => {
    if (editingVoceSoloUnitaMisura) setVoceDialogModalitaSoloUnitaMisura(false);
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
    if (editingVoceId !== null && editingVoceSoloUnitaMisura) {
      const voceEsistente = voci.find((v) => v.idVoce === editingVoceId);
      if (!voceEsistente) {
        resetVoceForm();
        voceDialogEl.close();
        return;
      }
      const unitaMisura = voceUnitaMisuraEl.value.trim();
      if (!unitaMisura) return;
      if (
        unitaMisura &&
        !vociUnitaMisuraOptions.some((u) => u.toLowerCase() === unitaMisura.toLowerCase())
      ) {
        vociUnitaMisuraOptions.push(unitaMisura);
        saveVociUnitaOptions();
        renderVociUnitaOptions(unitaMisura);
      }
      voci = voci.map((item) =>
        item.idVoce === editingVoceId
          ? {
              ...item,
              unitaMisura,
              misurazioniManuali: normalizzaMisurazioniManualiVoce(
                item.misurazioniManuali,
                unitaMisura,
              ),
            }
          : item,
      );
      normalizzaPosizioniVoci();
      saveVoci();
      renderVoci();
      resetVoceForm();
      voceDialogEl.close();
      return;
    }
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
        ? normalizzaMisurazioniManualiVoce(voceEsistente?.misurazioniManuali, unitaMisura)
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
    const azione = String(button.dataset.action || "").trim();
    const idVoceLock = Number(button.dataset.idVoce ?? button.dataset.id ?? NaN);
    const azioniBloccateDaVani = new Set([
      "duplicate-voce-mm-row",
      "open-voce-mm-apertura-editor",
      "use-voce-mm-apertura",
      "edit-voce-mm-apertura",
      "cancel-voce-mm-apertura-draft",
      "save-voce-mm-apertura-draft",
      "delete-voce-mm-apertura",
      "duplicate-voce-mm-apertura",
      "delete-voce-mm-row",
      "copy-voce",
    ]);
    if (azione === "edit-voce" && !Number.isNaN(idVoceLock)) {
      const voceEdit = voci.find((item) => item.idVoce === idVoceLock);
      if (voceEdit && isVoceSpecialeNoTotaleRiferimento(voceEdit)) {
        window.alert(
          "Questa voce automatica è in sola lettura in VOCI. Modifica dai relativi strumenti.",
        );
        return;
      }
    }
    if (azioniBloccateDaVani.has(azione) && !Number.isNaN(idVoceLock) && voceIdBloccataInVoci(idVoceLock)) {
      const voce = voci.find((item) => item.idVoce === idVoceLock);
      const msg = voce && isVoceSpecialeNoTotaleRiferimento(voce)
        ? "Questa voce automatica è in sola lettura in VOCI. Modifica dai relativi strumenti."
        : "Questa voce deriva da VANI o CAMMINAMENTI: in VOCI puoi modificare solo l'unità di misura (✎).";
      window.alert(msg);
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

    if (button.dataset.action === "open-voce-mm-apertura-editor") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (Number.isNaN(idVoce) || Number.isNaN(idx)) return;
      const key = getVoceMmAperturaDraftKey(idVoce, idx);
      if (!voceMmAperturaDraftByKey.has(key)) {
        voceMmAperturaDraftByKey.set(key, createEmptyVoceMmAperturaDraft());
      }
      renderVoci();
      return;
    }

    if (button.dataset.action === "use-voce-mm-apertura") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (Number.isNaN(idVoce) || Number.isNaN(idx)) return;
      if (apertureMaster.length === 0) {
        window.alert("Archivio APERTURE vuoto. Crea prima una apertura.");
        return;
      }
      openUseAperturaDialog(idVoce, idx);
      return;
    }

    if (button.dataset.action === "edit-voce-mm-apertura") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      const aperturaId = String(button.dataset.aperturaId || "").trim();
      if (Number.isNaN(idVoce) || Number.isNaN(idx) || !aperturaId) return;
      pendingEditVoceMmApertura = { idVoce, mmIndex: idx, idAperturaMaster: aperturaId };
      confirmEditVoceMmAperturaDialogEl.showModal();
      return;
    }

    if (button.dataset.action === "cancel-voce-mm-apertura-draft") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (Number.isNaN(idVoce) || Number.isNaN(idx)) return;
      voceMmAperturaDraftByKey.delete(getVoceMmAperturaDraftKey(idVoce, idx));
      renderVoci();
      return;
    }

    if (button.dataset.action === "save-voce-mm-apertura-draft") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      if (Number.isNaN(idVoce) || Number.isNaN(idx)) return;
      const key = getVoceMmAperturaDraftKey(idVoce, idx);
      const draftRaw = voceMmAperturaDraftByKey.get(key);
      const parsedApertura = parseVoceMmAperturaDraft(draftRaw);
      if (!parsedApertura) {
        window.alert("Compila correttamente tutti i campi obbligatori dell'apertura.");
        return;
      }
      const editingAperturaMasterId = String(draftRaw?.editingAperturaMasterId || "").trim();
      voci = voci.map((item) => {
        if (item.idVoce !== idVoce) return item;
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        if (idx < 0 || idx >= mm.length) return item;
        const row = mm[idx];
        const pianoDaMisurazione = String(row.piano || "").trim();
        const refs = normalizzaApertureCollegateRefs(row.apertureCollegate);
        if (editingAperturaMasterId) {
          apertureMaster = apertureMaster.map((apertura) =>
            apertura.idAperturaMaster === editingAperturaMasterId
              ? { ...apertura, ...parsedApertura, piano: pianoDaMisurazione }
              : apertura,
          );
          mm[idx] = { ...row, apertureCollegate: refs };
        } else {
          const nuovoId = creaAperturaMasterDaDati({ ...parsedApertura, piano: pianoDaMisurazione });
          if (nuovoId) mm[idx] = { ...row, apertureCollegate: [...refs, { idAperturaMaster: nuovoId }] };
        }
        return { ...item, misurazioniManuali: mm };
      });
      voceMmAperturaDraftByKey.delete(key);
      saveApertureMaster();
      saveVoci();
      syncVoceDavanzali();
      syncVoceSoglie();
      syncVoceCanali();
      syncVoceFalsiTelaiLegno();
      syncVoceFalsiTelaiAlluminio();
      renderVoci();
      return;
    }

    if (button.dataset.action === "delete-voce-mm-apertura") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      const aperturaId = String(button.dataset.aperturaId || "").trim();
      if (Number.isNaN(idVoce) || Number.isNaN(idx) || !aperturaId) return;
      if (
        !window.confirm(
          "Sei sicuro di eliminare questa apertura, verrà eliminata in tutte le voci che la usano",
        )
      ) {
        return;
      }
      voci = voci.map((item) => {
        if (item.idVoce !== idVoce) return item;
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        if (idx < 0 || idx >= mm.length) return item;
        const row = mm[idx];
        const aperture = normalizzaApertureCollegateRefs(row.apertureCollegate);
        mm[idx] = {
          ...row,
          apertureCollegate: aperture.filter((apertura) => apertura.idAperturaMaster !== aperturaId),
        };
        return { ...item, misurazioniManuali: mm };
      });
      saveVoci();
      renderVoci();
      return;
    }

    if (button.dataset.action === "duplicate-voce-mm-apertura") {
      const idVoce = Number(button.dataset.idVoce);
      const idx = Number(button.dataset.mmIndex);
      const aperturaId = String(button.dataset.aperturaId || "").trim();
      if (Number.isNaN(idVoce) || Number.isNaN(idx) || !aperturaId) return;
      voci = voci.map((item) => {
        if (item.idVoce !== idVoce) return item;
        const mm = normalizzaMisurazioniManualiVoce(item.misurazioniManuali, item.unitaMisura);
        if (idx < 0 || idx >= mm.length) return item;
        const row = mm[idx];
        const aperture = normalizzaApertureCollegateRefs(row.apertureCollegate);
        const source = aperture.find((apertura) => apertura.idAperturaMaster === aperturaId);
        if (!source) return item;
        const sourceMaster = apertureMaster.find((ap) => ap.idAperturaMaster === source.idAperturaMaster);
        if (!sourceMaster) return item;
        const cloneMaster = {
          ...sourceMaster,
          idAperturaMaster: nextAperturaMasterId(),
          piano: String(row.piano || "").trim(),
        };
        apertureMaster.push(cloneMaster);
        const newMasterId = cloneMaster.idAperturaMaster;
        mm[idx] = { ...row, apertureCollegate: [...aperture, { idAperturaMaster: newMasterId }] };
        return { ...item, misurazioniManuali: mm };
      });
      saveApertureMaster();
      saveVoci();
      renderVoci();
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
      if (isVoceSpecialeNoTotaleRiferimento(row)) {
        window.alert(
          "Questa voce automatica è in sola lettura in VOCI. Modifica dai relativi strumenti.",
        );
        return;
      }
      editingVoceId = id;
      const soloUnita = voceDerivataDaVani(row);
      setVoceDialogModalitaSoloUnitaMisura(soloUnita);
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
      setTimeout(() => (soloUnita ? voceUnitaMisuraEl : vocePosizioneEl)?.focus(), 0);
      return;
    }

    if (button.dataset.action === "delete-voce") {
      pendingDeleteVoceId = id;
      voceDeleteDialogEl.showModal();
      return;
    }

    if (button.dataset.action === "copy-voce") {
      duplicaVoceCompleta(id);
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

  vociBodyEl.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    if (target.dataset.action !== "change-voce-mm-apertura-draft") return;
    const idVoce = Number(target.dataset.idVoce);
    const idx = Number(target.dataset.mmIndex);
    const field = String(target.dataset.field || "").trim();
    if (Number.isNaN(idVoce) || Number.isNaN(idx) || !field) return;
    const key = getVoceMmAperturaDraftKey(idVoce, idx);
    const current = voceMmAperturaDraftByKey.get(key) || createEmptyVoceMmAperturaDraft();
    voceMmAperturaDraftByKey.set(key, { ...current, [field]: target.value });
  });

  btnChiudiTutteVociEl?.addEventListener("click", () => {
    chiudiTutteLeVociManuali();
  });
  btnApriTutteVociEl?.addEventListener("click", () => {
    apriTutteLeVociManuali();
  });

  vociCercaAbbrevInputEl?.addEventListener("input", () => {
    renderVoci();
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

  chiudiAppButtonEl?.addEventListener("click", () => {
    richiediChiusuraApplicazione().catch((err) => {
      console.error(err);
      window.alert("Errore durante la chiusura. Controlla la console per i dettagli.");
    });
  });

  iniziaComputoButtonEl?.addEventListener("click", () => {
    richiediIniziaNuovoComputo().catch((err) => {
      console.error(err);
      window.alert("Errore durante l’avvio del nuovo computo.");
    });
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

  murParamsRiferimentoEl?.addEventListener("change", () => {
    if (compilazionePianoId === null) return;
    aggiornaMurRiferimentoPiano(compilazionePianoId, murParamsRiferimentoEl.value.trim());
    updateMurPianoCompilazioneLabel(
      idPianoCompilazioneEl,
      riferimentoMurPianoEl,
      compilazionePianoId,
      piani,
    );
  });

  murParamsSpessoreEl?.addEventListener("change", () => {
    if (compilazionePianoId === null) return;
    const parsed = parseNonNegativeDecimal2(murParamsSpessoreEl.value);
    const spessore = parsed === null ? 0 : parsed;
    aggiornaMurSpessorePiano(compilazionePianoId, spessore);
    murParamsSpessoreEl.value = fmt2(spessore);
    aggiornaSuggerimentoSpessoreStrato();
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
      syncEsterniVersoVoci();
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
      syncEsterniVersoVoci();
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
      syncEsterniVersoVoci();
      return;
    }

    if (button.dataset.action === "add-apertura-misurazione") {
      const nuovaApertura = chiediDatiAperturaMisurazione();
      if (!nuovaApertura) {
        window.alert("Apertura non aggiunta: verifica i dati inseriti.");
        return;
      }
      misurazioniVarie = misurazioniVarie.map((item) => {
        if (item.idMisurazione !== id) return item;
        const aperture = normalizzaApertureCollegateMisurazione(item.apertureCollegate);
        return { ...item, apertureCollegate: [...aperture, nuovaApertura] };
      });
      saveMurDati();
      renderMisurazioniVarie();
      return;
    }

    if (button.dataset.action === "delete-apertura-misurazione") {
      const aperturaId = String(button.dataset.aperturaId || "").trim();
      if (!aperturaId) return;
      if (
        !window.confirm(
          "Sei sicuro di eliminare questa apertura, verrà eliminata in tutte le voci che la usano",
        )
      ) {
        return;
      }
      misurazioniVarie = misurazioniVarie.map((item) => {
        if (item.idMisurazione !== id) return item;
        const aperture = normalizzaApertureCollegateMisurazione(item.apertureCollegate);
        return {
          ...item,
          apertureCollegate: aperture.filter((apertura) => apertura.idApertura !== aperturaId),
        };
      });
      saveMurDati();
      renderMisurazioniVarie();
    }
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
      stratiMurElevazione = stratiMurElevazione.filter((s) => s.idPiano !== id);
      apertureElevazione = apertureElevazione.filter((a) => a.idPiano !== id);
      if (editingPianoId === id) resetPianoForm();
      if (compilazionePianoId === id) {
        compilazionePianoId = null;
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

  misureVarieSidebarButtonEl.id = "btn-sidebar-misure-varie";
  misureVarieSidebarButtonEl.type = "button";
  misureVarieSidebarButtonEl.className = "btn-action btn-secondary";
  misureVarieSidebarButtonEl.textContent = "MISURE VARIE";
  misureVarieSidebarButtonEl.title = "Misurazioni varie collegate alle voci";
  misureVarieSidebarButtonEl.addEventListener("click", () => {
    openCompilazioneMisureVarie();
  });
  wireMisureVarieUi({
    onBack: () => {
      closeVistaMisureVarie();
      renderPiani();
    },
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
  if (ifcToMisureButtonEl?.parentElement) {
    ifcToMuriApertureButtonEl.type = "button";
    ifcToMuriApertureButtonEl.id = "btn-ifc-to-muri-aperture-prova";
    ifcToMuriApertureButtonEl.className = ifcToMisureButtonEl.className || "btn-action";
    ifcToMuriApertureButtonEl.textContent = "PROVA BIM MURI+APERTURE";
    ifcToMuriApertureButtonEl.title = "Importa muri e aperture dal BIM (prova annullabile)";
    ifcToMuriApertureButtonEl.addEventListener("click", () => {
      importaMuriEApertureDaIfcProva();
    });

    ifcToMuriApertureUndoButtonEl.type = "button";
    ifcToMuriApertureUndoButtonEl.id = "btn-annulla-prova-bim-muri-aperture";
    ifcToMuriApertureUndoButtonEl.className = ifcToMisureButtonEl.className || "btn-action";
    ifcToMuriApertureUndoButtonEl.textContent = "ANNULLA ULTIMA PROVA BIM";
    ifcToMuriApertureUndoButtonEl.title = "Ripristina i dati prima della prova BIM";
    ifcToMuriApertureUndoButtonEl.disabled = true;
    ifcToMuriApertureUndoButtonEl.addEventListener("click", () => {
      annullaUltimaProvaMuriApertureDaIfc();
    });

    ifcRiepilogoCollegamentiButtonEl.type = "button";
    ifcRiepilogoCollegamentiButtonEl.id = "btn-ifc-riepilogo-collegamenti";
    ifcRiepilogoCollegamentiButtonEl.className = ifcToMisureButtonEl.className || "btn-action";
    ifcRiepilogoCollegamentiButtonEl.textContent = "RIEPILOGO MURI/APERTURE";
    ifcRiepilogoCollegamentiButtonEl.title = "Mostra tabella riepilogativa collegamenti muro-apertura";
    ifcRiepilogoCollegamentiButtonEl.addEventListener("click", () => {
      renderRiepilogoCollegamentiDialog();
      ifcRiepilogoDialogEl.showModal();
    });

    ifcToMisureButtonEl.insertAdjacentElement("afterend", ifcToMuriApertureButtonEl);
    ifcToMuriApertureButtonEl.insertAdjacentElement("afterend", ifcToMuriApertureUndoButtonEl);
    ifcToMuriApertureUndoButtonEl.insertAdjacentElement("afterend", ifcRiepilogoCollegamentiButtonEl);
  }

  ifcRiepilogoDialogEl.id = "ifc-riepilogo-collegamenti-dialog";
  ifcRiepilogoDialogEl.className = "ifc-riepilogo-dialog";
  ifcRiepilogoDialogEl.innerHTML = `
    <form method="dialog" class="ifc-riepilogo-dialog-form">
      <div class="ifc-riepilogo-dialog-header">
        <h3>Riepilogo collegamenti muri/aperture</h3>
      </div>
    </form>
  `;
  ifcRiepilogoTableWrapEl.className = "ifc-riepilogo-table-host";
  ifcRiepilogoCloseButtonEl.type = "button";
  ifcRiepilogoCloseButtonEl.className = "btn-action btn-secondary";
  ifcRiepilogoCloseButtonEl.textContent = "Chiudi";
  ifcRiepilogoCloseButtonEl.addEventListener("click", () => ifcRiepilogoDialogEl.close());
  ifcRiepilogoDialogEl.appendChild(ifcRiepilogoTableWrapEl);
  ifcRiepilogoDialogEl.appendChild(ifcRiepilogoCloseButtonEl);
  document.body.appendChild(ifcRiepilogoDialogEl);

  apertureMasterDialogEl.id = "aperture-master-dialog";
  apertureMasterDialogEl.className = "ifc-riepilogo-dialog";
  apertureMasterDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = String(button.dataset.id || "").trim();
    if (action === "close-master-aperture") {
      apertureMasterDialogEl.close();
      apertureMasterEditingId = null;
      apertureMasterPendingDeleteId = null;
      return;
    }
    if (action === "new-master-apertura") {
      apertureMasterEditingId = "__new__";
      apertureMasterPendingDeleteId = null;
      openApertureMasterDialog();
      return;
    }
    if (action === "edit-master-apertura" && id) {
      apertureMasterEditingId = id;
      apertureMasterPendingDeleteId = null;
      openApertureMasterDialog();
      return;
    }
    if (action === "cancel-edit-master-apertura") {
      apertureMasterEditingId = null;
      openApertureMasterDialog();
      return;
    }
    if (action === "save-master-apertura-inline" && id) {
      const parsed = readAperturaMasterInlineDraft(id);
      if (!parsed) {
        window.alert("Dati apertura non validi.");
        return;
      }
      apertureMaster = apertureMaster.map((ap) => (ap.idAperturaMaster === id ? { ...ap, ...parsed } : ap));
      apertureMasterEditingId = null;
      apertureMasterPendingDeleteId = null;
      saveApertureMaster();
      syncVoceDavanzali();
      syncVoceSoglie();
      syncVoceCanali();
      syncVoceFalsiTelaiLegno();
      syncVoceFalsiTelaiAlluminio();
      renderVoci();
      openApertureMasterDialog();
      return;
    }
    if (action === "save-new-master-apertura-inline") {
      const parsed = readAperturaMasterInlineDraft("__new__");
      if (!parsed) {
        window.alert("Dati apertura non validi.");
        return;
      }
      apertureMaster.push({ idAperturaMaster: nextAperturaMasterId(), ...parsed });
      apertureMasterEditingId = null;
      apertureMasterPendingDeleteId = null;
      saveApertureMaster();
      syncVoceDavanzali();
      syncVoceSoglie();
      syncVoceCanali();
      syncVoceFalsiTelaiLegno();
      syncVoceFalsiTelaiAlluminio();
      renderVoci();
      openApertureMasterDialog();
      return;
    }
    if (action === "delete-master-apertura" && id) {
      apertureMasterPendingDeleteId = id;
      confirmDeleteAperturaMasterDialogEl.showModal();
      return;
    }
  });
  document.body.appendChild(apertureMasterDialogEl);

  pianiMisuraArchivioDialogEl.id = "piani-misura-archivio-dialog";
  pianiMisuraArchivioDialogEl.className = "ifc-riepilogo-dialog";
  pianiMisuraArchivioDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close-archivio-piani-misura") {
      pianiMisuraArchivioDialogEl.close();
      return;
    }
    if (action === "add-archivio-piano-misura") {
      const input = pianiMisuraArchivioDialogEl.querySelector("#archivio-piani-misura-new");
      const raw = input instanceof HTMLInputElement ? input.value : "";
      const c = ensurePianoMisuraInArchivio(raw);
      if (!c) {
        window.alert("Inserisci un nome piano.");
        return;
      }
      if (input instanceof HTMLInputElement) input.value = "";
      openArchivioPianiMisuraDialog();
      return;
    }
    if (action === "delete-archivio-piano-misura") {
      const idx = Number.parseInt(button.dataset.index || "", 10);
      if (!Number.isFinite(idx) || idx < 0 || idx >= archivioPianiMisura.length) return;
      const nome = archivioPianiMisura[idx];
      if (countRiferimentiPianoMisura(nome) > 0) {
        const msg = messaggioPianoArchivioNonEliminabile(nome);
        window.alert(
          msg ||
            "Il piano non è eliminabile perché è ancora usato in una o più misurazioni.",
        );
        return;
      }
      archivioPianiMisura = archivioPianiMisura.filter((_, i) => i !== idx);
      saveArchivioPianiMisuraToStorage();
      refreshArchivioPianiMisuraDatalist();
      openArchivioPianiMisuraDialog();
    }
  });
  document.body.appendChild(pianiMisuraArchivioDialogEl);

  pianiMisuraArchivioSidebarButtonEl.id = "btn-apri-archivio-piani-misura";
  pianiMisuraArchivioSidebarButtonEl.type = "button";
  pianiMisuraArchivioSidebarButtonEl.className = "btn-action btn-secondary";
  pianiMisuraArchivioSidebarButtonEl.title = "Archivio nomi piano (misurazioni)";
  pianiMisuraArchivioSidebarButtonEl.textContent = "PIANI";
  pianiMisuraArchivioSidebarButtonEl.addEventListener("click", () => {
    openArchivioPianiMisuraDialog();
  });
  sidebarLeftActionsPrimariEl?.appendChild(pianiMisuraArchivioSidebarButtonEl);

  vaniSidebarButtonEl.id = "btn-vani-open";
  vaniSidebarButtonEl.type = "button";
  vaniSidebarButtonEl.className = "btn-action btn-secondary";
  vaniSidebarButtonEl.textContent = "VANI";
  vaniSidebarButtonEl.addEventListener("click", () => {
    openVistaVani();
  });
  sidebarLeftActionsPrimariEl?.appendChild(vaniSidebarButtonEl);
  wireVaniUi();

  const camminamentiSidebarButtonEl = document.createElement("button");
  camminamentiSidebarButtonEl.id = "btn-camm-open";
  camminamentiSidebarButtonEl.type = "button";
  camminamentiSidebarButtonEl.className = "btn-action btn-secondary";
  camminamentiSidebarButtonEl.textContent = "CAMMINAMENTI";
  camminamentiSidebarButtonEl.addEventListener("click", () => {
    openVistaCamminamenti();
  });
  sidebarLeftActionsPrimariEl?.appendChild(camminamentiSidebarButtonEl);
  wireCamminamentiUi();

  // ESTERNI VARI e MISURE VARIE nel gruppo primario (in fondo alla zona alta).
  if (sidebarEsterniVariButtonEl && sidebarLeftActionsPrimariEl) {
    sidebarLeftActionsPrimariEl.appendChild(sidebarEsterniVariButtonEl);
  }
  if (misureVarieSidebarButtonEl && sidebarLeftActionsPrimariEl) {
    sidebarLeftActionsPrimariEl.appendChild(misureVarieSidebarButtonEl);
  }

  apertureMasterSidebarButtonEl.id = "btn-apri-archivio-aperture";
  apertureMasterSidebarButtonEl.type = "button";
  apertureMasterSidebarButtonEl.className = "btn-action btn-secondary";
  apertureMasterSidebarButtonEl.textContent = "APERTURE";
  apertureMasterSidebarButtonEl.addEventListener("click", () => {
    openApertureMasterDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(apertureMasterSidebarButtonEl);

  davanzaliSidebarButtonEl.id = "btn-apri-archivio-davanzali";
  davanzaliSidebarButtonEl.type = "button";
  davanzaliSidebarButtonEl.className = "btn-action btn-secondary";
  davanzaliSidebarButtonEl.textContent = "DAVANZALI";
  davanzaliSidebarButtonEl.addEventListener("click", () => {
    openArchivioDavanzaliDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(davanzaliSidebarButtonEl);

  soglieSidebarButtonEl.id = "btn-apri-archivio-soglie";
  soglieSidebarButtonEl.type = "button";
  soglieSidebarButtonEl.className = "btn-action btn-secondary";
  soglieSidebarButtonEl.textContent = "SOGLIE";
  soglieSidebarButtonEl.addEventListener("click", () => {
    openArchivioSoglieDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(soglieSidebarButtonEl);

  grondeSidebarButtonEl.id = "btn-apri-archivio-gronde";
  grondeSidebarButtonEl.type = "button";
  grondeSidebarButtonEl.className = "btn-action btn-secondary";
  grondeSidebarButtonEl.textContent = "CANALI";
  grondeSidebarButtonEl.addEventListener("click", () => {
    openArchivioGrondeDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(grondeSidebarButtonEl);

  falsiTelaiSidebarButtonEl.id = "btn-apri-archivio-falsi-telai";
  falsiTelaiSidebarButtonEl.type = "button";
  falsiTelaiSidebarButtonEl.className = "btn-action btn-secondary";
  falsiTelaiSidebarButtonEl.textContent = "FALSI TELAI LEGNO";
  falsiTelaiSidebarButtonEl.addEventListener("click", () => {
    openArchivioFalsiTelaiDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(falsiTelaiSidebarButtonEl);

  falsiTelaiAllSidebarButtonEl.id = "btn-apri-archivio-falsi-telai-alluminio";
  falsiTelaiAllSidebarButtonEl.type = "button";
  falsiTelaiAllSidebarButtonEl.className = "btn-action btn-secondary";
  falsiTelaiAllSidebarButtonEl.textContent = "FALSI TELAI ALLUMINIO";
  falsiTelaiAllSidebarButtonEl.addEventListener("click", () => {
    openArchivioFalsiTelaiAlluminioDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(falsiTelaiAllSidebarButtonEl);

  rivestimentiSidebarButtonEl.id = "btn-apri-riepilogo-rivestimenti";
  rivestimentiSidebarButtonEl.type = "button";
  rivestimentiSidebarButtonEl.className = "btn-action btn-secondary";
  rivestimentiSidebarButtonEl.textContent = "RIVESTIMENTI";
  rivestimentiSidebarButtonEl.title = "Pareti con rivestimento attivo nei vani registrati";
  rivestimentiSidebarButtonEl.addEventListener("click", () => {
    openRiepilogoRivestimentiDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(rivestimentiSidebarButtonEl);

  intonacoRusticoSidebarButtonEl.id = "btn-apri-riepilogo-intonaco-rustico";
  intonacoRusticoSidebarButtonEl.type = "button";
  intonacoRusticoSidebarButtonEl.className = "btn-action btn-secondary";
  intonacoRusticoSidebarButtonEl.textContent = "INTONACO RUSTICO";
  intonacoRusticoSidebarButtonEl.title = "Pareti con rustico attivo nei vani registrati";
  intonacoRusticoSidebarButtonEl.addEventListener("click", () => {
    openRiepilogoIntonacoRusticoDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(intonacoRusticoSidebarButtonEl);

  intonacoCivileSidebarButtonEl.id = "btn-apri-riepilogo-intonaco-civile";
  intonacoCivileSidebarButtonEl.type = "button";
  intonacoCivileSidebarButtonEl.className = "btn-action btn-secondary";
  intonacoCivileSidebarButtonEl.textContent = "INTONACO CIVILE";
  intonacoCivileSidebarButtonEl.title = "Pareti con civile attivo nei vani registrati";
  intonacoCivileSidebarButtonEl.addEventListener("click", () => {
    openRiepilogoIntonacoCivileDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(intonacoCivileSidebarButtonEl);

  zoccoloSidebarButtonEl.id = "btn-apri-riepilogo-zoccolo";
  zoccoloSidebarButtonEl.type = "button";
  zoccoloSidebarButtonEl.className = "btn-action btn-secondary";
  zoccoloSidebarButtonEl.textContent = "ZOCCOLO";
  zoccoloSidebarButtonEl.title = "Pareti con zoccolo attivo nei vani registrati";
  zoccoloSidebarButtonEl.addEventListener("click", () => {
    openRiepilogoZoccoloDialog();
  });
  sidebarLeftActionsSecondariEl?.appendChild(zoccoloSidebarButtonEl);

  useAperturaDialogEl.id = "use-apertura-dialog";
  useAperturaDialogEl.className = "ifc-riepilogo-dialog";
  useAperturaDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close-use-apertura-dialog") {
      useAperturaDialogEl.close();
      voceMmUseAperturaContext = { idVoce: null, mmIndex: null };
      return;
    }
    if (action === "use-apertura-master") {
      const id = String(button.dataset.id || "").trim();
      const idVoce = voceMmUseAperturaContext.idVoce;
      const mmIndex = voceMmUseAperturaContext.mmIndex;
      if (!id || idVoce === null || mmIndex === null) return;
      collegaAperturaMasterARigaVoce(idVoce, mmIndex, id);
      useAperturaDialogEl.close();
      voceMmUseAperturaContext = { idVoce: null, mmIndex: null };
    }
  });
  document.body.appendChild(useAperturaDialogEl);

  grondeDialogEl.id = "gronde-dialog";
  grondeDialogEl.className = "ifc-riepilogo-dialog";
  grondeDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-gronde-dialog") {
      grondeDialogEl.close();
    }
  });
  document.body.appendChild(grondeDialogEl);

  davanzaliDialogEl.id = "davanzali-dialog";
  davanzaliDialogEl.className = "ifc-riepilogo-dialog";
  davanzaliDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-davanzali-dialog") {
      davanzaliDialogEl.close();
    }
  });
  davanzaliDialogEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "change-davanzale-sbordo") return;
    const key = String(target.dataset.key || "").trim();
    if (!key) return;
    const parsed = parseNonNegativeDecimal2(target.value);
    if (parsed === null) {
      target.value = fmt2(typeof davanzaliSbordiByKey[key] === "number" ? davanzaliSbordiByKey[key] : 0.05);
      return;
    }
    davanzaliSbordiByKey[key] = Number(parsed.toFixed(2));
    saveDavanzaliSbordi();
    syncVoceDavanzali();
    syncVoceSoglie();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
  });
  document.body.appendChild(davanzaliDialogEl);

  soglieDialogEl.id = "soglie-dialog";
  soglieDialogEl.className = "ifc-riepilogo-dialog";
  soglieDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-soglie-dialog") {
      soglieDialogEl.close();
    }
  });
  soglieDialogEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "change-soglia-sbordo") return;
    const key = String(target.dataset.key || "").trim();
    if (!key) return;
    const parsed = parseNonNegativeDecimal2(target.value);
    if (parsed === null) {
      target.value = fmt2(typeof soglieSbordiByKey[key] === "number" ? soglieSbordiByKey[key] : 0.05);
      return;
    }
    soglieSbordiByKey[key] = Number(parsed.toFixed(2));
    saveSoglieSbordi();
    syncVoceSoglie();
    syncVoceCanali();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
  });
  document.body.appendChild(soglieDialogEl);

  falsiTelaiDialogEl.id = "falsi-telai-dialog";
  falsiTelaiDialogEl.className = "ifc-riepilogo-dialog";
  falsiTelaiDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-falsi-telai-dialog") {
      falsiTelaiDialogEl.close();
    }
  });
  falsiTelaiDialogEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "change-falsi-telai-aggiunta") return;
    const key = String(target.dataset.key || "").trim();
    if (!key) return;
    const parsed = parseNonNegativeDecimal2(target.value);
    if (parsed === null) {
      target.value = fmt2(
        typeof falsiTelaiLegnoAggiunteByKey[key] === "number" ? falsiTelaiLegnoAggiunteByKey[key] : 0.1,
      );
      return;
    }
    falsiTelaiLegnoAggiunteByKey[key] = Number(parsed.toFixed(2));
    saveFalsiTelaiLegnoAggiunte();
    syncVoceFalsiTelaiLegno();
    syncVoceFalsiTelaiAlluminio();
  });
  document.body.appendChild(falsiTelaiDialogEl);

  falsiTelaiAllDialogEl.id = "falsi-telai-alluminio-dialog";
  falsiTelaiAllDialogEl.className = "ifc-riepilogo-dialog";
  falsiTelaiAllDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-falsi-telai-alluminio-dialog") {
      falsiTelaiAllDialogEl.close();
    }
  });
  falsiTelaiAllDialogEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "change-falsi-telai-alluminio-aggiunta") return;
    const key = String(target.dataset.key || "").trim();
    if (!key) return;
    const parsed = parseNonNegativeDecimal2(target.value);
    if (parsed === null) {
      target.value = fmt2(
        typeof falsiTelaiAlluminioAggiunteByKey[key] === "number" ? falsiTelaiAlluminioAggiunteByKey[key] : 0.1,
      );
      return;
    }
    falsiTelaiAlluminioAggiunteByKey[key] = Number(parsed.toFixed(2));
    saveFalsiTelaiAlluminioAggiunte();
    syncVoceFalsiTelaiAlluminio();
  });
  document.body.appendChild(falsiTelaiAllDialogEl);

  rivestimentiDialogEl.id = "rivestimenti-dialog";
  rivestimentiDialogEl.className = "ifc-riepilogo-dialog";
  rivestimentiDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-rivestimenti-dialog") {
      rivestimentiDialogEl.close();
    }
  });
  document.body.appendChild(rivestimentiDialogEl);

  intonacoRusticoDialogEl.id = "intonaco-rustico-dialog";
  intonacoRusticoDialogEl.className = "ifc-riepilogo-dialog";
  intonacoRusticoDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-intonaco-rustico-dialog") {
      intonacoRusticoDialogEl.close();
    }
  });
  document.body.appendChild(intonacoRusticoDialogEl);

  intonacoCivileDialogEl.id = "intonaco-civile-dialog";
  intonacoCivileDialogEl.className = "ifc-riepilogo-dialog";
  intonacoCivileDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-intonaco-civile-dialog") {
      intonacoCivileDialogEl.close();
    }
  });
  document.body.appendChild(intonacoCivileDialogEl);

  zoccoloDialogEl.id = "zoccolo-dialog";
  zoccoloDialogEl.className = "ifc-riepilogo-dialog";
  zoccoloDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "close-zoccolo-dialog") {
      zoccoloDialogEl.close();
    }
  });
  document.body.appendChild(zoccoloDialogEl);

  confirmDeleteAperturaMasterDialogEl.id = "confirm-delete-apertura-master-dialog";
  confirmDeleteAperturaMasterDialogEl.className = "ifc-riepilogo-dialog";
  confirmDeleteAperturaMasterDialogEl.innerHTML = `
    <form method="dialog" class="ifc-riepilogo-dialog-form">
      <div class="ifc-riepilogo-dialog-header"><h3>Conferma eliminazione</h3></div>
      <p style="padding: 0 8px 8px;">
        Sei sicuro di eliminare questa apertura, verrà eliminata in tutte le voci che la usano
      </p>
      <div style="padding:8px;display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="btn-action btn-secondary" data-action="cancel-confirm-delete-apertura-master">Annulla</button>
        <button type="button" class="btn-action btn-delete" data-action="confirm-delete-apertura-master">Conferma</button>
      </div>
    </form>
  `;
  confirmDeleteAperturaMasterDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "cancel-confirm-delete-apertura-master") {
      apertureMasterPendingDeleteId = null;
      confirmDeleteAperturaMasterDialogEl.close();
      return;
    }
    if (action === "confirm-delete-apertura-master") {
      const id = apertureMasterPendingDeleteId;
      if (!id) {
        confirmDeleteAperturaMasterDialogEl.close();
        return;
      }
      confirmDeleteAperturaMasterDialogEl.close();
      eliminaAperturaMaster(id);
    }
  });
  document.body.appendChild(confirmDeleteAperturaMasterDialogEl);

  confirmEditVoceMmAperturaDialogEl.id = "confirm-edit-voce-mm-apertura-dialog";
  confirmEditVoceMmAperturaDialogEl.className = "ifc-riepilogo-dialog";
  confirmEditVoceMmAperturaDialogEl.innerHTML = `
    <form method="dialog" class="ifc-riepilogo-dialog-form">
      <div class="ifc-riepilogo-dialog-header"><h3>Conferma modifica apertura</h3></div>
      <p style="padding: 0 8px 8px;">
        SE MODIFICHI L'APERTURA, LE MODIFICHE VERRANNO APPLICATE IN TUTTE LE VOCI DOVE E' USATA QUESTA APERTURA
      </p>
      <div style="padding:8px;display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="btn-action btn-secondary" data-action="cancel-confirm-edit-voce-mm-apertura">Annulla</button>
        <button type="button" class="btn-action btn-edit" data-action="confirm-edit-voce-mm-apertura">OK</button>
      </div>
    </form>
  `;
  confirmEditVoceMmAperturaDialogEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "cancel-confirm-edit-voce-mm-apertura") {
      pendingEditVoceMmApertura = { idVoce: null, mmIndex: null, idAperturaMaster: "" };
      confirmEditVoceMmAperturaDialogEl.close();
      return;
    }
    if (action === "confirm-edit-voce-mm-apertura") {
      const { idVoce, mmIndex, idAperturaMaster } = pendingEditVoceMmApertura;
      pendingEditVoceMmApertura = { idVoce: null, mmIndex: null, idAperturaMaster: "" };
      confirmEditVoceMmAperturaDialogEl.close();
      if (idVoce === null || mmIndex === null || !idAperturaMaster) return;
      avviaModificaVoceMmApertura(idVoce, mmIndex, idAperturaMaster);
    }
  });
  document.body.appendChild(confirmEditVoceMmAperturaDialogEl);

  setupBimTabs();

  loadPiani();
  loadMurDati();
  loadArchivioPianiMisuraFromStorage();
  loadVociUnitaOptions();
  loadDavanzaliSbordi();
  loadSoglieSbordi();
  loadFalsiTelaiLegnoAggiunte();
  loadFalsiTelaiAlluminioAggiunte();
  loadApertureMaster();
  syncVaniApertureLocalesForPicker(apertureElevazione, apertureMaster);
  loadVoci();
  syncArchivioPianiMisuraCompleto();
  migraApertureCollegateVociSuMaster();
  syncVoceDavanzali();
  syncVoceSoglie();
  syncVoceCanali();
  syncVoceFalsiTelaiLegno();
  syncVoceFalsiTelaiAlluminio();
  loadIfcData();
  updateComputoDirtyIndicator();
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
  toggleVoceMmFieldsByTipo(VOCE_MM_TIPO_MANUALE);
  updateFormulaButtonState(scavoFormulaEl, apriFormulaScavoButtonEl);
  updateFormulaButtonState(corselloFormulaEl, apriFormulaCorselloButtonEl);
  updateFormulaButtonState(misurazioniFormulaEl, apriFormulaMisurazioniButtonEl);
  apFalsotelaiEl.value = "no";
  mostraPannelloCompilazione("interrato");
  vistaPianiEl.hidden = true;
  vistaCompilazioneEl.hidden = true;
  vistaVociEl.hidden = false;
  if (vistaBimEl) vistaBimEl.hidden = true;
  altreTipologiePanelEl.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
  updateMurPianoCompilazioneLabel(
    idPianoCompilazioneEl,
    riferimentoMurPianoEl,
    compilazionePianoId,
    piani,
  );
  renderPiani();
  renderMurielevazioni();
  renderStrati();
  renderAperture();
  renderScavi();
  renderCorselli();
  renderCamminamenti();
  renderMisurazioniVarie();
  syncEsterniVersoVoci();
  chiudiTutteLeVociManuali();
  aggiornaUndoButtonProvaBim();

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
    const focusTesto = draft && draft.focusVoceTesto === true;
    setTimeout(() => (focusTesto ? voceTestoEl : vocePosizioneEl)?.focus(), 0);
  })();

  wireArchivioPianiMisuraComboInputs();

  refreshComputoBaselineSnapshot();
});
