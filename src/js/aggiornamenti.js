/**
 * Controlla aggiornamenti automatici all'avvio (plugin Tauri updater).
 * File dedicato: HTML banner + CSS in styles/aggiornamenti.css
 */

const MSG_UPDATE_AVAILABLE =
  "E' disponibile una nuova versione del programma.";

function getInvoke() {
  return window.__TAURI__?.core?.invoke ?? null;
}

function ensureBanner() {
  let banner = document.querySelector("#app-update-banner");
  let backdrop = document.querySelector("#app-update-backdrop");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "app-update-backdrop";
    backdrop.className = "app-update-backdrop";
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  if (banner) return banner;

  banner = document.createElement("div");
  banner.id = "app-update-banner";
  banner.className = "app-update-banner";
  banner.hidden = true;
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-modal", "true");
  banner.setAttribute("aria-labelledby", "app-update-banner-title");
  banner.innerHTML = `
    <div class="app-update-banner__text">
      <strong id="app-update-banner-title" class="app-update-banner__title">Aggiornamento disponibile</strong>
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

function setUpdateDialogVisible(visible) {
  const banner = document.querySelector("#app-update-banner");
  const backdrop = document.querySelector("#app-update-backdrop");
  if (banner) banner.hidden = !visible;
  if (backdrop) backdrop.hidden = !visible;
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
 * Avvia il controllo aggiornamenti e mostra il dialog se serve.
 */
export function wireAggiornamentiAutomatici() {
  const invoke = getInvoke();
  if (!invoke) return;

  const banner = ensureBanner();
  const descEl = banner.querySelector(".app-update-banner__desc");
  const titleEl = banner.querySelector(".app-update-banner__title");

  banner.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-update-action]");
    if (!button) return;
    const action = button.getAttribute("data-update-action");

    if (action === "later") {
      setUpdateDialogVisible(false);
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

  document.querySelector("#app-update-backdrop")?.addEventListener("click", () => {
    setUpdateDialogVisible(false);
  });

  // Piccolo ritardo: lascia caricare l'interfaccia prima del check di rete
  window.setTimeout(async () => {
    try {
      const update = await invoke("check_app_update");
      if (!update || !update.version) return;
      if (titleEl) titleEl.textContent = "Aggiornamento disponibile";
      descEl.textContent = MSG_UPDATE_AVAILABLE;
      const installBtn = banner.querySelector('[data-update-action="install"]');
      if (installBtn) installBtn.hidden = false;
      setUpdateDialogVisible(true);
    } catch (error) {
      const msg = error?.message || String(error || "errore sconosciuto");
      console.warn("Controllo aggiornamenti non riuscito:", msg);
      if (/404|not found|failed to fetch|error sending request|tls|certificate|forbidden|401|403/i.test(msg)) {
        if (titleEl) titleEl.textContent = "Aggiornamenti non disponibili";
        descEl.textContent =
          "Non riesco a controllare gli aggiornamenti (file latest.json non raggiungibile).";
        const installBtn = banner.querySelector('[data-update-action="install"]');
        if (installBtn) installBtn.hidden = true;
        setUpdateDialogVisible(true);
      }
    }
  }, 2500);
}
