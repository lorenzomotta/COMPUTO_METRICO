// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
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
        .invoke_handler(tauri::generate_handler![
            greet,
            write_export_file,
            write_export_file_bytes,
            write_temp_export_file_bytes,
            open_file_with_system,
            read_file_bytes,
            exit_app,
            check_app_update,
            install_app_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
