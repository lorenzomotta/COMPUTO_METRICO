/**
 * UNDO a un passo: prima della prima scrittura su localStorage del computo
 * salva una fotografia. UNDO ripristina quella fotografia.
 * Non include il modello IFC (troppo pesante). Vale solo per la sessione corrente.
 */

const PREFIX = "computo_metrico_";
const SKIP_KEYS = new Set(["computo_metrico_ifc_data"]);
const COALESCE_MS = 450;

/** @type {Record<string, string>|null} */
let snapshot = null;
let capturing = false;
let coalesceTimer = 0;
let installed = false;
let onChange = () => {};

function shouldTrackKey(key) {
  const k = String(key ?? "");
  return k.startsWith(PREFIX) && !SKIP_KEYS.has(k);
}

function collectTrackedKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && shouldTrackKey(k)) keys.push(k);
    }
  } catch {
    /* ignore */
  }
  return keys;
}

function takeSnapshot() {
  const map = /** @type {Record<string, string>} */ ({});
  try {
    for (const k of collectTrackedKeys()) {
      const v = localStorage.getItem(k);
      if (v != null) map[k] = v;
    }
    snapshot = map;
  } catch {
    snapshot = null;
  }
  onChange();
}

function ensureUndoSnapshot() {
  if (capturing) return;
  capturing = true;
  takeSnapshot();
  window.clearTimeout(coalesceTimer);
  coalesceTimer = window.setTimeout(() => {
    capturing = false;
  }, COALESCE_MS);
}

export function canUndoComputo() {
  return snapshot != null;
}

export function clearUndoComputo() {
  snapshot = null;
  onChange();
}

/**
 * Esegue `fn` senza creare uno snapshot UNDO (ripristino, ricaricamento).
 * @param {() => void} fn
 */
export function runWithoutUndoCapture(fn) {
  capturing = true;
  window.clearTimeout(coalesceTimer);
  try {
    fn();
  } finally {
    capturing = false;
  }
}

export function restoreUndoSnapshot() {
  if (!snapshot) return false;
  const previous = snapshot;
  const wasCapturing = capturing;
  capturing = true;
  try {
    const wanted = new Set(Object.keys(previous));
    for (const k of collectTrackedKeys()) {
      if (!wanted.has(k)) localStorage.removeItem(k);
    }
    for (const [k, v] of Object.entries(previous)) {
      localStorage.setItem(k, v);
    }
    snapshot = null;
    onChange();
    return true;
  } catch {
    return false;
  } finally {
    capturing = wasCapturing;
  }
}

export function setUndoComputoOnChange(fn) {
  onChange = typeof fn === "function" ? fn : () => {};
}

export function installUndoLocalStorageHook() {
  if (installed) return;
  installed = true;
  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function setItemTracked(key, value) {
    if (this === localStorage && shouldTrackKey(key)) ensureUndoSnapshot();
    return origSet.apply(this, arguments);
  };
  Storage.prototype.removeItem = function removeItemTracked(key) {
    if (this === localStorage && shouldTrackKey(key)) ensureUndoSnapshot();
    return origRemove.apply(this, arguments);
  };
}
