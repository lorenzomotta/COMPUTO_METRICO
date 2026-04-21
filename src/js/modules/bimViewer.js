import * as THREE from "../../vendor/bim/three.module.js";
import * as WebIFC from "../../vendor/bim/web-ifc-api.js";
import { OrbitControls } from "../../vendor/bim/OrbitControls.js";
import { IFCLoader } from "../../vendor/bim/IFCLoader.js";

const IFC_WASM_LOCAL_PATH = "/vendor/bim/";

/**
 * Crea un visualizzatore 3D IFC minimo per file BIM.
 * @param {HTMLElement} containerEl
 * @param {(message: string) => void} setStatus
 * @param {(selection: any | null) => void} [onSelectedElement]
 */
export function createBimViewer(containerEl, setStatus, onSelectedElement) {
  if (!containerEl) throw new Error("Contenitore viewer IFC non trovato.");
  const emitSelection = typeof onSelectedElement === "function" ? onSelectedElement : () => {};
  const ifcTypeNameByCode = new Map(
    Object.entries(WebIFC)
      .filter(([key, value]) => key.startsWith("IFC") && typeof value === "number")
      .map(([key, value]) => [Number(value), key]),
  );

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7fb);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.set(16, 12, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  containerEl.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 2, 0);
  controls.update();

  const grid = new THREE.GridHelper(100, 100, 0x94a3b8, 0xcbd5e1);
  scene.add(grid);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
  directionalLight.position.set(20, 30, 10);
  scene.add(directionalLight);

  const ifcLoader = new IFCLoader();
  ifcLoader.ifcManager.setWasmPath(IFC_WASM_LOCAL_PATH);
  ifcLoader.ifcManager.setupThreeMeshBVH();

  /** @type {THREE.Object3D | null} */
  let currentModel = null;
  /** @type {any | null} */
  let currentIfcData = null;
  /** @type {number | null} */
  let selectedExpressID = null;
  /** contatore richieste selezione per evitare overwrite asincroni */
  let selectionRequestSeq = 0;
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const selectionMaterial = new THREE.MeshLambertMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.75,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  function resize() {
    const width = containerEl.clientWidth || 1;
    const height = containerEl.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function frameModel(object3d) {
    const box = new THREE.Box3().setFromObject(object3d);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const fitOffset = 1.25;
    const distance = size * fitOffset;

    controls.target.copy(center);
    camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance);
    camera.near = Math.max(size / 1000, 0.01);
    camera.far = Math.max(size * 20, 2000);
    camera.updateProjectionMatrix();
    controls.update();
  }

  async function loadIfcFile(file) {
    if (!file) return;

    setStatus(`Caricamento IFC: ${file.name}...`);

    try {
      if (currentModel) {
        ifcLoader.ifcManager.removeSubset(currentModel.modelID, selectionMaterial, "selection-subset");
        scene.remove(currentModel);
        currentModel = null;
        selectedExpressID = null;
        selectionRequestSeq++;
        emitSelection(null);
      }

      const fileUrl = URL.createObjectURL(file);
      const model = await ifcLoader.loadAsync(fileUrl);
      URL.revokeObjectURL(fileUrl);

      currentModel = model;
      scene.add(model);
      frameModel(model);
      setStatus(`Caricato: ${file.name}. Lettura dati IFC in corso...`);
      currentIfcData = await extractIfcData(file.name);
      selectedExpressID = null;
      selectionRequestSeq++;
      emitSelection(null);
      setStatus(
        `Caricato: ${file.name} | Elementi: ${currentIfcData.summary.totalElements} | Misurazioni: ${currentIfcData.measurements.length}`,
      );
      return currentIfcData;
    } catch (error) {
      console.error("Errore caricamento IFC:", error);
      setStatus("Errore nel caricamento IFC. Controlla il file e riprova.");
      throw error;
    }
  }

  async function extractIfcData(fileName) {
    if (!currentModel) throw new Error("Modello IFC non disponibile.");
    const modelID = currentModel.modelID;
    const manager = ifcLoader.ifcManager;

    const ifcTypeEntries = await loadIfcTypeEntries(WebIFC);

    const elements = [];
    const byType = {};

    for (const typeEntry of ifcTypeEntries) {
      let expressIds = [];
      try {
        expressIds = await manager.getAllItemsOfType(modelID, typeEntry.code, false);
      } catch (_) {
        expressIds = [];
      }
      if (!Array.isArray(expressIds) || expressIds.length === 0) continue;

      byType[typeEntry.name] = expressIds.length;

      for (const expressID of expressIds) {
        try {
          const itemProperties = await manager.getItemProperties(modelID, expressID, false);
          const propertySets = await manager.getPropertySets(modelID, expressID, true);
          const typeProperties = await manager.getTypeProperties(modelID, expressID, true);
          const materialProperties = await manager.getMaterialsProperties(modelID, expressID, true);
          const plainItem = toPlainIfcValue(itemProperties);
          const plainPsets = toPlainIfcValue(propertySets);
          const plainTypeProps = toPlainIfcValue(typeProperties);
          const plainMaterials = toPlainIfcValue(materialProperties);

          const quantities = collectNumericQuantities(plainPsets);
          const basicMeasurements = quantities.map((q) => ({
            expressID,
            ifcType: typeEntry.name,
            elementName: readFirstString(plainItem, ["Name", "LongName", "Description"]) || "",
            quantitySet: q.quantitySet,
            quantityName: q.quantityName,
            metric: q.metric,
            value: q.value,
            unitHint: metricToUnitHint(q.metric),
            riferimento: buildMeasurementReference(
              typeEntry.name,
              readFirstString(plainItem, ["Name", "LongName", "Description"]),
              q.quantitySet,
              q.quantityName,
            ),
          }));

          elements.push({
            expressID,
            ifcType: typeEntry.name,
            properties: plainItem,
            propertySets: plainPsets,
            typeProperties: plainTypeProps,
            materialProperties: plainMaterials,
            quantities,
            measurements: basicMeasurements,
          });
        } catch (error) {
          console.warn(`Errore lettura IFC expressID ${expressID}:`, error);
        }
      }
    }

    let spatialStructure = null;
    try {
      spatialStructure = toPlainIfcValue(await manager.getSpatialStructure(modelID, true));
    } catch (_) {
      spatialStructure = null;
    }

    const measurements = elements.flatMap((element) =>
      Array.isArray(element.measurements) ? element.measurements : [],
    );

    return {
      source: {
        fileName,
        loadedAt: new Date().toISOString(),
        modelID,
      },
      summary: {
        totalElements: elements.length,
        totalIfcTypes: Object.keys(byType).length,
        totalMeasurements: measurements.length,
        byType,
      },
      spatialStructure,
      elements,
      measurements,
    };
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  async function pickElementAtClientPoint(clientX, clientY) {
    const reqId = ++selectionRequestSeq;
    if (!currentModel) {
      if (reqId === selectionRequestSeq) emitSelection(null);
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);
    const intersections = raycaster.intersectObject(currentModel, true);
    if (!intersections.length) {
      if (reqId === selectionRequestSeq) emitSelection(null);
      return;
    }

    const firstHit = intersections[0];
    const faceIndex = firstHit.faceIndex;
    const geometry = firstHit.object?.geometry;
    if (typeof faceIndex !== "number" || !geometry) {
      if (reqId === selectionRequestSeq) emitSelection(null);
      return;
    }

    try {
      const expressID = ifcLoader.ifcManager.getExpressId(geometry, faceIndex);
      const modelID = currentModel.modelID;
      const typeCode = ifcLoader.ifcManager.getIfcType(modelID, expressID);
      const ifcType = ifcTypeNameByCode.get(Number(typeCode)) || String(typeCode || "N/D");
      const geometryInfo = computeElementGeometryInfo(modelID, expressID);
      const locationInfo = extractSpatialLocationInfo(expressID);
      highlightExpressID(expressID);
      if (reqId !== selectionRequestSeq) return;

      // Aggiorno subito il pannello con i dati minimi (evita sensazione di blocco).
      emitSelection({
        expressID,
        ifcType,
        name: "",
        properties: {},
        propertySets: [],
        typeProperties: [],
        materialProperties: [],
        quantities: [],
        geometryInfo,
        locationInfo,
      });
      setStatus(`Elemento selezionato: ${ifcType} #${expressID}. Lettura proprietà...`);

      const itemProperties = toPlainIfcValue(await ifcLoader.ifcManager.getItemProperties(modelID, expressID, true));
      const propertySets = toPlainIfcValue(await ifcLoader.ifcManager.getPropertySets(modelID, expressID, true));
      const typeProperties = toPlainIfcValue(await ifcLoader.ifcManager.getTypeProperties(modelID, expressID, true));
      const materialProperties = toPlainIfcValue(
        await ifcLoader.ifcManager.getMaterialsProperties(modelID, expressID, true),
      );
      const quantities = collectNumericQuantities(propertySets);
      if (reqId !== selectionRequestSeq) return;

      emitSelection({
        expressID,
        ifcType,
        name: readFirstString(itemProperties, ["Name", "LongName", "Description"]),
        properties: itemProperties,
        propertySets,
        typeProperties,
        materialProperties,
        quantities,
        geometryInfo,
        locationInfo,
      });
      setStatus(`Elemento selezionato: ${ifcType} #${expressID}`);
    } catch (error) {
      if (reqId !== selectionRequestSeq) return;
      console.error("Errore selezione elemento IFC:", error);
      setStatus("Elemento selezionato ma lettura proprietà non riuscita.");
    }
  }

  function highlightExpressID(expressID) {
    if (!currentModel) return;
    const modelID = currentModel.modelID;
    try {
      ifcLoader.ifcManager.removeSubset(modelID, selectionMaterial, "selection-subset");
    } catch (_) {
      // subset precedente assente: ignorabile
    }

    selectedExpressID = expressID;
    ifcLoader.ifcManager.createSubset({
      modelID,
      ids: [expressID],
      material: selectionMaterial,
      scene,
      removePrevious: true,
      customID: "selection-subset",
    });
  }

  function zoomToExpressID(expressID) {
    if (!currentModel || typeof expressID !== "number") return;
    const modelID = currentModel.modelID;
    try {
      const previewSubset = ifcLoader.ifcManager.createSubset({
        modelID,
        ids: [expressID],
        material: selectionMaterial,
        scene: null,
        removePrevious: true,
        customID: "zoom-preview-subset",
      });

      if (!previewSubset) return;

      const box = new THREE.Box3().setFromObject(previewSubset);
      ifcLoader.ifcManager.removeSubset(modelID, selectionMaterial, "zoom-preview-subset");
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(sphere.radius, 0.2);
      const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      const distance = radius * 3.2;

      controls.target.copy(center);
      camera.position.copy(center).add(direction.multiplyScalar(distance));
      controls.update();
      camera.updateProjectionMatrix();
    } catch (error) {
      console.warn("Zoom su elemento IFC non riuscito:", error);
    }
  }

  function computeElementGeometryInfo(modelID, expressID) {
    try {
      const subsetId = `geom-info-subset-${expressID}`;
      const tmpSubset = ifcLoader.ifcManager.createSubset({
        modelID,
        ids: [expressID],
        material: selectionMaterial,
        scene: null,
        removePrevious: true,
        customID: subsetId,
      });
      if (!tmpSubset) return null;
      const box = new THREE.Box3().setFromObject(tmpSubset);
      ifcLoader.ifcManager.removeSubset(modelID, selectionMaterial, subsetId);
      if (box.isEmpty()) return null;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const round3 = (n) => Number(Number(n).toFixed(3));

      return {
        hasOwnGeometry: true,
        globalX: round3(center.x),
        globalY: round3(center.y),
        globalZ: round3(center.z),
        boundingBoxLength: round3(size.x),
        boundingBoxWidth: round3(size.y),
        boundingBoxHeight: round3(size.z),
      };
    } catch (error) {
      console.warn("Calcolo geometry info non riuscito:", error);
      return null;
    }
  }

  function extractSpatialLocationInfo(expressID) {
    const spatial = currentIfcData?.spatialStructure;
    if (!spatial || typeof spatial !== "object") return null;

    const chain = findSpatialChainForExpressID(spatial, expressID);
    if (!chain.length) return null;

    const pickName = (n) => {
      if (!n || typeof n !== "object") return "";
      const name = typeof n.name === "string" ? n.name : typeof n.Name === "string" ? n.Name : "";
      return name || "";
    };

    const project = chain.find((n) => String(n.type || "").toUpperCase().includes("PROJECT"));
    const building = chain.find((n) => String(n.type || "").toUpperCase().includes("BUILDING"));
    const storey = chain.find((n) => String(n.type || "").toUpperCase().includes("STOREY"));

    return {
      project: pickName(project),
      building: pickName(building),
      storey: pickName(storey),
    };
  }

  function findSpatialChainForExpressID(root, targetExpressID) {
    const out = [];
    const target = Number(targetExpressID);

    function walk(node, chain) {
      if (!node || typeof node !== "object") return false;
      const expressID = Number(node.expressID ?? node.expressId ?? node.id ?? NaN);
      const nextChain = Number.isNaN(expressID) ? chain : [...chain, node];
      if (!Number.isNaN(expressID) && expressID === target) {
        out.push(...nextChain);
        return true;
      }

      const children = Array.isArray(node.children) ? node.children : [];
      for (const child of children) {
        if (walk(child, nextChain)) return true;
      }
      return false;
    }

    walk(root, []);
    return out;
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(containerEl);
  renderer.domElement.addEventListener("click", (event) => {
    pickElementAtClientPoint(event.clientX, event.clientY);
  });
  renderer.domElement.addEventListener("dblclick", (event) => {
    event.preventDefault();
    pickElementAtClientPoint(event.clientX, event.clientY)
      .then(() => {
        if (selectedExpressID !== null) {
          zoomToExpressID(selectedExpressID);
        }
      })
      .catch((error) => {
        console.warn("Doppio click IFC non riuscito:", error);
      });
  });
  resize();
  animate();

  return {
    loadIfcFile,
    getIfcData: () => currentIfcData,
  };
}

async function loadIfcTypeEntries(webIfcModule) {
  try {
    const entries = Object.entries(webIfcModule || {})
      .filter(([key, value]) => key.startsWith("IFC") && typeof value === "number")
      .map(([name, code]) => ({ name, code: Number(code) }));
    if (entries.length > 0) return entries;
  } catch (_) {
    // uso fallback sotto
  }

  // Fallback minimale: tipi principali più usati nel computo.
  return [
    { name: "IFCPROJECT", code: 103090709 },
    { name: "IFCSITE", code: 4097777520 },
    { name: "IFCBUILDING", code: 4031249490 },
    { name: "IFCBUILDINGSTOREY", code: 3124254112 },
    { name: "IFCSPACE", code: 3856911033 },
    { name: "IFCWALL", code: 2391406946 },
    { name: "IFCWALLSTANDARDCASE", code: 220370906 },
    { name: "IFCSLAB", code: 1529196076 },
    { name: "IFCBEAM", code: 753842376 },
    { name: "IFCCOLUMN", code: 32344328 },
    { name: "IFCFOOTING", code: 900683007 },
    { name: "IFCROOF", code: 2016517767 },
    { name: "IFCDOOR", code: 395920057 },
    { name: "IFCWINDOW", code: 3304561284 },
    { name: "IFCOPENINGELEMENT", code: 3588315303 },
    { name: "IFCSTAIR", code: 3311658599 },
    { name: "IFCRAILING", code: 2262370178 },
    { name: "IFCCOVERING", code: 300787885 },
    { name: "IFCCURTAINWALL", code: 3495092785 },
    { name: "IFCPLATE", code: 1960468691 },
    { name: "IFCMEMBER", code: 1073191201 },
    { name: "IFCFURNISHINGELEMENT", code: 263784265 },
    { name: "IFCFLOWSEGMENT", code: 987401354 },
    { name: "IFCFLOWTERMINAL", code: 2223149337 },
    { name: "IFCFLOWFITTING", code: 4278956645 },
    { name: "IFCPROXY", code: 910340369 },
  ];
}

function toPlainIfcValue(value, depth = 0, seen = new WeakSet()) {
  if (depth > 25) return null;
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => toPlainIfcValue(item, depth + 1, seen));
  if (typeof value !== "object") return value;
  if (seen.has(value)) return null;
  seen.add(value);

  if ("value" in value && Object.keys(value).length <= 3) {
    return toPlainIfcValue(value.value, depth + 1, seen);
  }

  const out = {};
  Object.entries(value).forEach(([key, nested]) => {
    out[key] = toPlainIfcValue(nested, depth + 1, seen);
  });
  return out;
}

function collectNumericQuantities(propertySets) {
  const out = [];
  const metricKeyMap = {
    LengthValue: "length",
    AreaValue: "area",
    VolumeValue: "volume",
    CountValue: "count",
    WeightValue: "weight",
    TimeValue: "time",
  };

  walkAny(propertySets, (node, path) => {
    if (!node || typeof node !== "object") return;
    const quantitySet = resolveQuantitySetName(path);
    const quantityName = typeof node.Name === "string" ? node.Name : "";

    Object.entries(metricKeyMap).forEach(([rawKey, metric]) => {
      if (typeof node[rawKey] !== "number" || !Number.isFinite(node[rawKey])) return;
      out.push({
        quantitySet,
        quantityName: quantityName || rawKey,
        metric,
        value: Number(node[rawKey].toFixed(6)),
      });
    });
  });

  return out;
}

function walkAny(node, visit, path = []) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    node.forEach((item, index) => walkAny(item, visit, path.concat(index)));
    return;
  }
  if (typeof node !== "object") return;
  visit(node, path);
  Object.entries(node).forEach(([key, value]) => {
    walkAny(value, visit, path.concat(key));
  });
}

function resolveQuantitySetName(path) {
  if (!Array.isArray(path)) return "";
  for (let i = path.length - 1; i >= 0; i--) {
    const key = path[i];
    if (typeof key === "string" && key.toLowerCase().includes("basequantities")) return key;
    if (typeof key === "string" && key.toLowerCase().includes("quant")) return key;
  }
  return "";
}

function readFirstString(source, keys) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    if (typeof source[key] === "string" && source[key].trim() !== "") return source[key].trim();
  }
  return "";
}

function metricToUnitHint(metric) {
  if (metric === "length") return "ml.";
  if (metric === "area") return "mq.";
  if (metric === "volume") return "mc";
  if (metric === "count") return "n";
  if (metric === "weight") return "kg";
  if (metric === "time") return "h";
  return "";
}

function buildMeasurementReference(ifcType, elementName, quantitySet, quantityName) {
  const bits = [ifcType, elementName || "", quantitySet || "", quantityName || ""]
    .map((v) => String(v || "").trim())
    .filter((v) => v !== "");
  return bits.join(" | ");
}
