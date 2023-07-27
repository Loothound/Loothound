// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod oauth;
mod sql;

fn main() {
    tauri::Builder::default()
        .plugin(oauth::init())
        .plugin(sql::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
