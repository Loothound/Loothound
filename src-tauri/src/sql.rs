mod model;

use model::*;
use serde::Serialize;
use sqlx::migrate::MigrateDatabase;
use sqlx::{
    migrate::Migrator,
    sqlite::{Sqlite, SqlitePool},
};
use std::{
    fs::create_dir_all,
    path::{Path, PathBuf},
};
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, Manager, Runtime, State,
};
use tokio::sync::Mutex;

struct DbCon {
    db: Mutex<Option<SqlitePool>>,
}

#[derive(thiserror::Error, Debug)]
enum Error {
    #[error(transparent)]
    Sql(#[from] sqlx::Error),

    #[error(transparent)]
    Migration(#[from] sqlx::migrate::MigrateError),

    #[error("Database not loaded")]
    DatabaseNotLoaded,

    #[error("unsupported datatype: {0}")]
    UnsupportedDatatype(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

type Result<T> = std::result::Result<T, Error>;

fn app_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    app.path_resolver()
        .app_data_dir()
        .expect("No data dir found")
}

#[tauri::command]
async fn get_stashes(con: State<'_, DbCon>) -> Result<Vec<Stash>> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as::<_, Stash>("SELECT * FROM stashes")
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)
}

#[tauri::command]
async fn insert_stash(
    con: State<'_, DbCon>,
    stash_id: String,
    stash_name: String,
    stash_type: String,
) -> Result<Stash> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as(
        "INSERT INTO stashes (id, name, type) VALUES (?, ?, ?)  ON CONFLICT(id) DO UPDATE SET id=excluded.id, name=excluded.name, type=excluded.type RETURNING *",
    )
    .bind(stash_id)
    .bind(stash_name)
    .bind(stash_type)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)
}

#[tauri::command]
async fn create_profile(
    con: State<'_, DbCon>,
    profile_name: String,
    stash_tabs: Vec<String>,
) -> Result<Profile> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let trx = pool.begin().await?;

    let profile = sqlx::query_as::<_, Profile>(
        "INSERT INTO profiles (name, league_id, pricing_league) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(profile_name)
    .bind("1")
    .bind("1")
    .fetch_one(pool)
    .await?;

    for tab in stash_tabs.iter() {
        sqlx::query("INSERT INTO profile_stash_assoc (profile_id, stash_id) VALUES (?,?)")
            .bind(profile.id)
            .bind(tab)
            .execute(pool)
            .await?;
    }

    trx.commit().await?;

    Ok(profile)
}

#[tauri::command]
async fn get_profiles(con: State<'_, DbCon>) -> Result<Vec<Profile>> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as!(Profile, "SELECT * FROM profiles")
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("sql")
        .setup(|app| {
            let mut app_path = app_path(&app);
            create_dir_all(&app_path).expect("Problem creating App directory!");
            app_path.push("loothound.db");
            let db_path = format!("sqlite:{}", app_path.to_str().expect("oopsie"));

            tauri::async_runtime::block_on(async {
                if !Sqlite::database_exists(&db_path).await.unwrap_or(false) {
                    Sqlite::create_database(&db_path).await?;
                }
                let pool = SqlitePool::connect(&db_path).await?;
                let m = Migrator::new(Path::new("./migrations")).await?;
                m.run(&pool).await?;
                app.manage(DbCon {
                    db: Mutex::new(Some(pool)),
                });
                Result::<()>::Ok(())
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_stashes,
            create_profile,
            insert_stash,
            get_profiles
        ])
        .build()
}
