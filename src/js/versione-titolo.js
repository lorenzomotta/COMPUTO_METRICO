/**
 * Mostra LP_COMPUTO + versione nel titolo home e nella barra finestra.
 */

const APP_NAME = "LP_COMPUTO";

async function leggiVersioneApp() {
  try {
    const getVersion = window.__TAURI__?.app?.getVersion;
    if (typeof getVersion === "function") {
      return await getVersion();
    }
  } catch {
    // fallback sotto
  }

  try {
    const invoke = window.__TAURI__?.core?.invoke;
    if (typeof invoke === "function") {
      return await invoke("plugin:app|version");
    }
  } catch {
    // fallback sotto
  }

  return null;
}

async function aggiornaTitoloFinestra(titolo) {
  try {
    const getCurrent = window.__TAURI__?.webviewWindow?.getCurrentWebviewWindow
      || window.__TAURI__?.window?.getCurrentWindow;
    if (typeof getCurrent === "function") {
      const win = getCurrent();
      if (win && typeof win.setTitle === "function") {
        await win.setTitle(titolo);
      }
    }
  } catch {
    // Ignora se non siamo in Tauri
  }
}

/**
 * Imposta "LP_COMPUTO 0.x.y" nell'h1 e nel titolo della finestra.
 */
export async function wireTitoloConVersione() {
  const versione = await leggiVersioneApp();
  const titolo = versione ? `${APP_NAME} ${versione}` : APP_NAME;

  const h1 = document.querySelector("#app-title");
  if (h1) h1.textContent = titolo;

  document.title = titolo;
  await aggiornaTitoloFinestra(titolo);
}
