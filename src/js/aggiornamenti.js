/**
 * Controlla aggiornamenti automatici all'avvio (plugin Tauri updater).
 * File dedicato: HTML banner + CSS in styles/aggiornamenti.css
 */

function getInvoke() {
  return window.__TAURI__?.core?.invoke ?? null;
}

function ensureBanner() {
  let banner = document.querySelector("#app-update-banner");
  if (banner) return banner;

  banner = document.createElement("div");
  banner.id = "app-update-banner";
  banner.className = "app-update-banner";
  banner.hidden = true;
  banner.innerHTML = `
    <div class="app-update-banner__text">
      <strong class="app-update-banner__title">Aggiornamento disponibile</strong>
      <p class="app-update-banner__desc"></p>
    </div>
    <div class="app-update-banner__actions">
      <button type="button" class="btn-action btn-secondary" data-update-action="later">Più tardi</button>
      <button type="button" class="btn-action btn-primary" data-update-action="install">Aggiorna ora</button>
    </div>
  `;
  document.body.appendChild(banner);
  return banner;
}

function setBannerBusy(banner, busy, message) {
  const installBtn = banner.querySelector('[data-update-action="install"]');
  const laterBtn = banner.querySelector('[data-update-action="later"]');
  const desc = banner.querySelector(".app-update-banner__desc");
  if (installBtn) installBtn.disabled = busy;
  if (laterBtn) laterBtn.disabled = busy;
  if (desc && message) desc.textContent = message;
}

/**
 * Avvia il controllo aggiornamenti e mostra il banner se serve.
 */
export function wireAggiornamentiAutomatici() {
  const invoke = getInvoke();
  if (!invoke) return;

  const banner = ensureBanner();
  const descEl = banner.querySelector(".app-update-banner__desc");

  banner.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-update-action]");
    if (!button) return;
    const action = button.getAttribute("data-update-action");

    if (action === "later") {
      banner.hidden = true;
      return;
    }

    if (action !== "install") return;

    setBannerBusy(
      banner,
      true,
      "Download e installazione in corso… L'app si riavvierà a fine aggiornamento.",
    );
    try {
      await invoke("install_app_update");
    } catch (error) {
      const msg = error?.message || String(error || "Errore sconosciuto");
      setBannerBusy(banner, false, `Aggiornamento non riuscito: ${msg}`);
    }
  });

  // Piccolo ritardo: lascia caricare l'interfaccia prima del check di rete
  window.setTimeout(async () => {
    try {
      const update = await invoke("check_app_update");
      if (!update || !update.version) return;
      const notes = (update.body || "").trim();
      descEl.textContent = notes
        ? `Versione ${update.version} (ora hai ${update.currentVersion}). ${notes}`
        : `Versione ${update.version} disponibile (ora hai ${update.currentVersion}).`;
      banner.hidden = false;
    } catch (error) {
      // Silenzioso in sviluppo / senza rete / senza latest.json
      console.debug("Controllo aggiornamenti non disponibile:", error);
    }
  }, 2500);
}
