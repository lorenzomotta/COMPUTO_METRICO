/**
 * Template CAPITOLI (solo sequenza + nome), salvati nella cartella dati app.
 * File: AppData/.../templates/capitoli/*.json
 */

import { createCapitoloId, normalizzaCapitolo, sortCapitoli } from "./archivioCapitoli.js";

const TEMPLATE_TIPO = "capitoli-template";
const TEMPLATE_VERSION = 1;

function getInvoke() {
  return window.__TAURI__?.core?.invoke;
}

/**
 * @param {Array<{ sequenza?: number, nome?: string, id?: string }>} capitoli
 * @param {string} nomeTemplate
 */
export function buildCapitoliTemplatePayload(capitoli, nomeTemplate) {
  const nome = String(nomeTemplate || "").trim() || "Template capitoli";
  const list = sortCapitoli(
    (Array.isArray(capitoli) ? capitoli : [])
      .map((c) =>
        normalizzaCapitolo({
          id: typeof c?.id === "string" && c.id.trim() ? c.id : createCapitoloId(),
          sequenza: c?.sequenza,
          nome: c?.nome,
        }),
      )
      .filter(Boolean),
  ).map((c) => ({ sequenza: c.sequenza, nome: c.nome }));

  return {
    tipo: TEMPLATE_TIPO,
    version: TEMPLATE_VERSION,
    nome,
    savedAt: new Date().toISOString(),
    capitoli: list,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ nome: string, capitoli: { id: string, sequenza: number, nome: string }[] }}
 */
export function parseCapitoliTemplatePayload(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("File template non valido (JSON).");
    }
  }
  if (!data || typeof data !== "object") {
    throw new Error("File template non valido.");
  }
  const nome =
    typeof data.nome === "string" && data.nome.trim()
      ? data.nome.trim()
      : "Template capitoli";
  const src = Array.isArray(data.capitoli) ? data.capitoli : [];
  const capitoli = [];
  const seenSeq = new Set();
  for (const item of src) {
    const seq = Math.floor(Number(item?.sequenza));
    const n = typeof item?.nome === "string" ? item.nome.trim() : "";
    if (!Number.isFinite(seq) || seq < 1 || !n) continue;
    if (seenSeq.has(seq)) continue;
    seenSeq.add(seq);
    capitoli.push({
      id: createCapitoloId(),
      sequenza: seq,
      nome: n,
    });
  }
  return { nome, capitoli: sortCapitoli(capitoli) };
}

export async function listCapitoliTemplates() {
  const invoke = getInvoke();
  if (typeof invoke !== "function") {
    throw new Error("Funzione disponibile solo nell'app desktop (Tauri).");
  }
  const list = await invoke("list_capitoli_templates");
  return Array.isArray(list) ? list : [];
}

/**
 * @param {string} nome
 * @param {object} payload
 * @param {boolean} overwrite
 * @returns {Promise<string>} fileName
 */
export async function saveCapitoliTemplate(nome, payload, overwrite = false) {
  const invoke = getInvoke();
  if (typeof invoke !== "function") {
    throw new Error("Funzione disponibile solo nell'app desktop (Tauri).");
  }
  const content = JSON.stringify(payload, null, 2);
  return await invoke("save_capitoli_template", {
    nome: String(nome || "").trim(),
    content,
    overwrite: Boolean(overwrite),
  });
}

/**
 * @param {string} fileName
 */
export async function loadCapitoliTemplateFile(fileName) {
  const invoke = getInvoke();
  if (typeof invoke !== "function") {
    throw new Error("Funzione disponibile solo nell'app desktop (Tauri).");
  }
  const raw = await invoke("load_capitoli_template", { fileName });
  return parseCapitoliTemplatePayload(raw);
}

/**
 * @param {string} fileName
 */
export async function deleteCapitoliTemplateFile(fileName) {
  const invoke = getInvoke();
  if (typeof invoke !== "function") {
    throw new Error("Funzione disponibile solo nell'app desktop (Tauri).");
  }
  await invoke("delete_capitoli_template", { fileName });
}

export async function openCapitoliTemplatesFolder() {
  const invoke = getInvoke();
  if (typeof invoke !== "function") {
    throw new Error("Funzione disponibile solo nell'app desktop (Tauri).");
  }
  await invoke("open_capitoli_templates_dir");
}

export async function getCapitoliTemplatesDirPath() {
  const invoke = getInvoke();
  if (typeof invoke !== "function") return "";
  try {
    return String((await invoke("get_capitoli_templates_dir")) || "");
  } catch {
    return "";
  }
}
