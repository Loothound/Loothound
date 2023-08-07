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

    #[error(transparent)]
    Network(#[from] reqwest::Error),
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

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Sparkline {
    data: Vec<f64>,
    total_change: f64,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ItemLine {
    name: String,
    chaos_value: f64,
    links: Option<isize>,
}

#[derive(Debug, serde::Deserialize)]
struct NinjaItemResponse {
    lines: Vec<ItemLine>,
}

#[derive(Debug, serde::Deserialize)]
struct CurrencyReceive {
    value: f64,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CurrencyLine {
    currency_type_name: String,
    receive: Option<CurrencyReceive>,
}

#[derive(Debug, serde::Deserialize)]
struct NinjaCurrencyResponse {
    lines: Vec<CurrencyLine>,
}

static CURRENCY_CATEGORIES: [&str; 2] = ["Currency", "Fragment"];
static ITEM_CATEGORIES: [&str; 18] = [
    "DivinationCard",
    "Artifact",
    "Oil",
    "Incubator",
    "UniqueWeapon",
    "UniqueArmour",
    "UniqueAccessory",
    "UniqueFlask",
    "UniqueJewel",
    "UniqueMap",
    "DeliriumOrb",
    "Invitation",
    "Scarab",
    "Fossil",
    "Resonator",
    "Beast",
    "Essence",
    "Vial",
];
static LEAGUE: &str = "Crucible";

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
async fn get_profiles(con: State<'_, DbCon>) -> Result<Vec<ProfileWithStashes>> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let profiles = sqlx::query_as::<_, Profile>("SELECT * FROM profiles")
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)?;

    let mut profiles_with_stashes = Vec::new();

    for profile in profiles.iter() {
        let stashes = sqlx::query_as::<_, ProfileStashAssoc>(
            "SELECT * FROM profile_stash_assoc WHERE profile_id = ?",
        )
        .bind(profile.id)
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)?;
        profiles_with_stashes.push(ProfileWithStashes {
            profile: profile.clone(),
            stashes: stashes.into_iter().map(|s| s.stash_id).collect(),
        })
    }

    Ok(profiles_with_stashes)
}

#[tauri::command]
async fn new_snapshot(con: State<'_, DbCon>, profile_id: i64) -> Result<Snapshot> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let pricing_revision = sqlx::query_as::<_, (i64,)>("SELECT MAX(revision) as rev FROM price")
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)?;

    sqlx::query_as::<_, Snapshot>(
        "INSERT INTO snapshots (profile_id, timestamp, pricing_revision) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(profile_id)
    .bind(chrono::Local::now().naive_utc())
    .bind(pricing_revision.0)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)
}

#[tauri::command]
async fn add_items_to_snapshot(
    con: State<'_, DbCon>,
    snapshot: Snapshot,
    items: Vec<Item>,
    stash_id: String,
) -> Result<()> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;
    let snapshot_id = snapshot.id;

    for item in items {
        let json_item = serde_json::to_string(&item).unwrap();
        sqlx::query("INSERT INTO item (snapshot_id, stash_id, data) VALUES (?, ?, ?)")
            .bind(snapshot_id)
            .bind(&stash_id)
            .bind(json_item)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;
    }

    Ok(())
}

#[tauri::command]
async fn snapshot_set_value(con: State<'_, DbCon>, snapshot: Snapshot, value: i64) -> Result<()> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query("UPDATE snapshots SET value = ? WHERE id = ?")
        .bind(value)
        .bind(snapshot.id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    Ok(())
}

#[tauri::command]
async fn fetch_prices(con: State<'_, DbCon>) -> Result<i64> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let current_revision: (i64,) = sqlx::query_as("SELECT MAX(revision) as rev FROM price")
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)
        .unwrap_or((0,));
    let next_rev = current_revision.0 + 1;

    for currency_type in CURRENCY_CATEGORIES {
        let url = format!(
            "https://poe.ninja/api/data/currencyoverview?league={}&type={}",
            LEAGUE, currency_type
        );
        let resp: NinjaCurrencyResponse = reqwest::get(url).await?.json().await?;

        for line in resp.lines.iter() {
            if let Some(receive) = &line.receive {
                sqlx::query("INSERT INTO price (name, price, revision) VALUES (?, ?, ?)")
                    .bind(&line.currency_type_name)
                    .bind(receive.value)
                    .bind(next_rev)
                    .execute(pool)
                    .await
                    .map_err(Error::Sql)?;
            }
        }
    }

    for item_type in ITEM_CATEGORIES {
        let url = format!(
            "https://poe.ninja/api/data/itemoverview?league={}&type={}",
            LEAGUE, item_type
        );
        let resp: NinjaItemResponse = reqwest::get(url).await?.json().await?;

        for line in resp.lines.iter() {
            let links = line.links.map(|n| if n == 6 { 1 } else { 0 }).unwrap_or(0);
            sqlx::query(
                "INSERT INTO price (name, price, revision, fully_linked) VALUES (?, ?, ?, ?)",
            )
            .bind(&line.name)
            .bind(line.chaos_value)
            .bind(next_rev)
            .bind(links)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;
        }
    }

    Ok(current_revision.0)
}

#[tauri::command]
async fn check_price(con: State<'_, DbCon>, name: String) -> Result<f64> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let current_revision: (i64,) = sqlx::query_as("SELECT MAX(revision) as rev FROM price")
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)
        .unwrap_or((0,));

    let price = sqlx::query_as::<_, Price>(
        "SELECT * FROM price WHERE name LIKE ? AND revision = ? LIMIT 1",
    )
    .bind(name)
    .bind(current_revision.0)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)
    .unwrap_or(Price {
        id: 0,
        name: "".into(),
        price: 0.0,
        revision: 0,
        fully_linked: false,
    });

    Ok(price.price)
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
                sqlx::migrate!().run(&pool).await?;
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
            get_profiles,
            new_snapshot,
            fetch_prices,
            check_price,
            add_items_to_snapshot,
            snapshot_set_value
        ])
        .build()
}
