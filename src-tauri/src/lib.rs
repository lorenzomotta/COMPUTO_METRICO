// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateAvailablePayload {
    version: String,
    current_version: String,
    body: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn write_export_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| format!("Errore salvataggio file: {}", e))
}

#[tauri::command]
fn write_export_file_bytes(path: String, bytes: Vec<u8>) -> Result<(), String> {
    fs::write(path, bytes).map_err(|e| format!("Errore salvataggio file: {}", e))
}

#[tauri::command]
fn write_temp_export_file_bytes(file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_name = sanitize_file_name(&file_name);
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Errore timestamp: {}", e))?
        .as_millis();

    let mut dir = std::env::temp_dir();
    dir.push("computo-metrico-preview");
    fs::create_dir_all(&dir).map_err(|e| format!("Errore creazione cartella temporanea: {}", e))?;

    let mut full_path = PathBuf::from(&dir);
    full_path.push(format!("{}_{}", ts, safe_name));
    fs::write(&full_path, bytes)
        .map_err(|e| format!("Errore salvataggio file temporaneo: {}", e))?;

    Ok(full_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_file_with_system(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Errore apertura file su Windows: {}", e))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Errore apertura file su macOS: {}", e))?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Errore apertura file su Linux: {}", e))?;
        return Ok(());
    }
}

#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(|e| format!("Errore lettura file: {}", e))
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

fn titolo_app_con_versione(app: &tauri::AppHandle) -> String {
    format!("LP_COMPUTO {}", app.package_info().version)
}

#[cfg(desktop)]
#[tauri::command]
async fn check_app_update(app: tauri::AppHandle) -> Result<Option<UpdateAvailablePayload>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(Some(UpdateAvailablePayload {
            version: update.version,
            current_version: update.current_version,
            body: update.body,
        })),
        None => Ok(None),
    }
}

#[cfg(desktop)]
#[tauri::command]
async fn install_app_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    let Some(update) = updater.check().await.map_err(|e| e.to_string())? else {
        return Err("Nessun aggiornamento disponibile.".into());
    };

    update
        .download_and_install(|_chunk_len, _content_len| {}, || {})
        .await
        .map_err(|e| e.to_string())?;

    app.restart();
}

fn sanitize_file_name(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for c in input.chars() {
        let ok = c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-';
        out.push(if ok { c } else { '_' });
    }
    if out.trim().is_empty() {
        "preview.pdf".to_string()
    } else {
        out
    }
}

/// Nome file template: lettere/numeri/spazi → underscore, senza path traversal.
fn sanitize_template_stem(input: &str) -> String {
    let trimmed = input.trim();
    let mut out = String::with_capacity(trimmed.len());
    for c in trimmed.chars() {
        if c.is_alphanumeric() || c == '-' || c == '_' {
            out.push(c);
        } else if c.is_whitespace() {
            if !out.ends_with('_') {
                out.push('_');
            }
        }
    }
    let out = out.trim_matches('_').to_string();
    if out.is_empty() {
        "template_capitoli".to_string()
    } else {
        out.chars().take(80).collect()
    }
}

fn capitoli_templates_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cartella dati app non disponibile: {}", e))?;
    dir.push("templates");
    dir.push("capitoli");
    fs::create_dir_all(&dir).map_err(|e| format!("Errore creazione cartella template: {}", e))?;
    Ok(dir)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CapitoliTemplateInfo {
    file_name: String,
    nome: String,
}

#[tauri::command]
fn get_capitoli_templates_dir(app: tauri::AppHandle) -> Result<String, String> {
    Ok(capitoli_templates_dir(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
fn list_capitoli_templates(app: tauri::AppHandle) -> Result<Vec<CapitoliTemplateInfo>, String> {
    let dir = capitoli_templates_dir(&app)?;
    let mut out: Vec<CapitoliTemplateInfo> = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("Errore lettura cartella template: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        if file_name.is_empty() {
            continue;
        }
        let mut nome = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&file_name)
            .replace('_', " ");
        if let Ok(raw) = fs::read_to_string(&path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                if let Some(n) = val.get("nome").and_then(|v| v.as_str()) {
                    let t = n.trim();
                    if !t.is_empty() {
                        nome = t.to_string();
                    }
                }
            }
        }
        out.push(CapitoliTemplateInfo { file_name, nome });
    }
    out.sort_by(|a, b| {
        a.nome
            .to_lowercase()
            .cmp(&b.nome.to_lowercase())
            .then_with(|| a.file_name.cmp(&b.file_name))
    });
    Ok(out)
}

#[tauri::command]
fn save_capitoli_template(
    app: tauri::AppHandle,
    nome: String,
    content: String,
    overwrite: bool,
) -> Result<String, String> {
    let nome_trim = nome.trim();
    if nome_trim.is_empty() {
        return Err("Inserisci un nome per il template.".into());
    }
    let stem = sanitize_template_stem(nome_trim);
    let file_name = format!("{}.json", stem);
    let mut path = capitoli_templates_dir(&app)?;
    path.push(&file_name);
    if path.exists() && !overwrite {
        return Err(format!("EXISTS:{}", file_name));
    }
    fs::write(&path, content).map_err(|e| format!("Errore salvataggio template: {}", e))?;
    Ok(file_name)
}

fn safe_template_file_name(input: &str) -> Result<String, String> {
    let name = input.trim();
    if name.is_empty()
        || name.contains('/')
        || name.contains('\\')
        || name.contains("..")
        || !name.ends_with(".json")
    {
        return Err("Nome file template non valido.".into());
    }
    // Solo il nome file, niente path.
    if std::path::Path::new(name)
        .file_name()
        .and_then(|s| s.to_str())
        != Some(name)
    {
        return Err("Nome file template non valido.".into());
    }
    Ok(name.to_string())
}

#[tauri::command]
fn load_capitoli_template(app: tauri::AppHandle, file_name: String) -> Result<String, String> {
    let safe = safe_template_file_name(&file_name)?;
    let mut path = capitoli_templates_dir(&app)?;
    path.push(&safe);
    if !path.is_file() {
        return Err("Template non trovato.".into());
    }
    fs::read_to_string(&path).map_err(|e| format!("Errore lettura template: {}", e))
}

#[tauri::command]
fn delete_capitoli_template(app: tauri::AppHandle, file_name: String) -> Result<(), String> {
    let safe = safe_template_file_name(&file_name)?;
    let mut path = capitoli_templates_dir(&app)?;
    path.push(&safe);
    if !path.is_file() {
        return Err("Template non trovato.".into());
    }
    fs::remove_file(&path).map_err(|e| format!("Errore eliminazione template: {}", e))
}

#[tauri::command]
fn open_capitoli_templates_dir(app: tauri::AppHandle) -> Result<(), String> {
    let dir = capitoli_templates_dir(&app)?;
    open_file_with_system(dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|app| {
            let titolo = titolo_app_con_versione(app.handle());
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title(&titolo);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            write_export_file,
            write_export_file_bytes,
            write_temp_export_file_bytes,
            open_file_with_system,
            read_file_bytes,
            exit_app,
            get_app_version,
            check_app_update,
            install_app_update,
            get_capitoli_templates_dir,
            list_capitoli_templates,
            save_capitoli_template,
            load_capitoli_template,
            delete_capitoli_template,
            open_capitoli_templates_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
