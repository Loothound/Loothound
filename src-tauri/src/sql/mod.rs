mod model;

use chrono::Duration;
use model::*;
use serde::Serialize;
use sqlx::migrate::MigrateDatabase;
use sqlx::sqlite::{Sqlite, SqlitePool};
use std::{fs::create_dir_all, path::PathBuf};
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
static LEAGUES: [&str; 2] = ["Standard", "Ancestor"];

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
    league: String,
) -> Result<Stash> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as(
        "INSERT INTO stashes (id, name, type, league) VALUES (?, ?, ?, ?)  ON CONFLICT(id) DO UPDATE SET id=excluded.id, name=excluded.name, type=excluded.type, league=excluded.league RETURNING *",
    )
    .bind(stash_id)
    .bind(stash_name)
    .bind(stash_type)
    .bind(league)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)
}

#[tauri::command]
async fn create_profile(
    con: State<'_, DbCon>,
    profile_name: String,
    stash_tabs: Vec<String>,
    league_id: String,
    pricing_league: String,
) -> Result<Profile> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let trx = pool.begin().await?;

    let profile = sqlx::query_as::<_, Profile>(
        "INSERT INTO profiles (name, league_id, pricing_league) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(profile_name)
    .bind(league_id)
    .bind(pricing_league)
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

    sqlx::query(
        "INSERT INTO snapshots (profile_id, timestamp, pricing_revision, value) VALUES (?, ?, ?, ?)",
    )
    .bind(profile_id)
    .bind(chrono::Local::now().naive_local())
    .bind(pricing_revision.0)
    .bind(0.0)
    .execute(pool)
    .await
    .map_err(Error::Sql)?;

    sqlx::query_as::<_, Snapshot>(
        "SELECT * FROM snapshots WHERE profile_id = ? ORDER BY id DESC LIMIT 1",
    )
    .bind(profile_id)
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
) -> Result<f64> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;
    let snapshot_id = snapshot.id;

    let mut counter = 0.0;

    let profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles WHERE id = ?")
        .bind(snapshot.profile_id)
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)?;

    let league = profile.pricing_league;

    for item in items {
        let json_item = serde_json::to_string(&item).unwrap();
        let name = if item.name.len() > 0 {
            item.name
        } else {
            item.type_line
        };
        let mut price = sqlx::query_as::<_, Price>(
            "SELECT * FROM price WHERE name LIKE ? AND revision = ? AND league = ? LIMIT 1",
        )
        .bind(&name)
        .bind(snapshot.pricing_revision)
        .bind(&league)
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)
        .map_or(0.0, |x| x.price);

        if &name == "Chaos Orb" {
            price = 1.0;
        }

        counter += price * item.stack_size.unwrap_or(1) as f64;

        sqlx::query("INSERT INTO item (snapshot_id, stash_id, data, value) VALUES (?, ?, ?, ?)")
            .bind(snapshot_id)
            .bind(&stash_id)
            .bind(json_item)
            .bind(price * item.stack_size.unwrap_or(1) as f64)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;
    }

    sqlx::query("UPDATE snapshots SET value = ? WHERE id = ?")
        .bind(counter)
        .bind(snapshot.id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    Ok(
        sqlx::query_as::<_, (f64,)>("SELECT value FROM snapshots WHERE id = ?")
            .bind(snapshot.id)
            .fetch_one(pool)
            .await
            .map_err(Error::Sql)?
            .0,
    )
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
async fn fetch_prices(con: State<'_, DbCon>) -> Result<()> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    async fn fetch_prices_for_league(pool: &SqlitePool, league: String) -> Result<()> {
        let current_revision: (i64,) =
            sqlx::query_as("SELECT MAX(revision) as rev FROM price WHERE league = ?")
                .bind(&league)
                .fetch_one(pool)
                .await
                .map_err(Error::Sql)
                .unwrap_or((0,));
        let next_rev = current_revision.0 + 1;

        let timestamp = chrono::Local::now().naive_utc();

        for currency_type in CURRENCY_CATEGORIES {
            let url = format!(
                "https://poe.ninja/api/data/currencyoverview?league={}&type={}",
                league, currency_type
            );
            let resp: NinjaCurrencyResponse = reqwest::get(url).await?.json().await?;

            for line in resp.lines.iter() {
                if let Some(receive) = &line.receive {
                    sqlx::query(
                        "INSERT INTO price (name, price, revision, timestamp, league) VALUES (?, ?, ?, ?, ?)",
                    )
                    .bind(&line.currency_type_name)
                    .bind(receive.value)
                    .bind(next_rev)
                    .bind(timestamp)
                    .bind(&league)
                    .execute(pool)
                    .await
                    .map_err(Error::Sql)?;
                }
            }
        }

        for item_type in ITEM_CATEGORIES {
            let url = format!(
                "https://poe.ninja/api/data/itemoverview?league={}&type={}",
                league, item_type
            );
            let resp: NinjaItemResponse = reqwest::get(url).await?.json().await?;

            for line in resp.lines.iter() {
                let links = line.links.map(|n| if n == 6 { 1 } else { 0 }).unwrap_or(0);
                sqlx::query(
                    "INSERT INTO price (name, price, revision, fully_linked, timestamp, league) VALUES (?, ?, ?, ?, ?, ?)",
                )
                .bind(&line.name)
                .bind(line.chaos_value)
                .bind(next_rev)
                .bind(links)
                .bind(timestamp)
                .bind(&league)
                .execute(pool)
                .await
                .map_err(Error::Sql)?;
            }
        }
        Ok(())
    }

    for league in LEAGUES.iter() {
        fetch_prices_for_league(&pool, league.to_string()).await?;
    }

    Ok(())
}

#[tauri::command]
async fn list_snapshots(con: State<'_, DbCon>, profile_id: i64) -> Result<Vec<Snapshot>> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as::<_, Snapshot>("SELECT * FROM snapshots WHERE profile_id = ?")
        .bind(profile_id)
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)
}

#[tauri::command]
async fn delete_snapshot(con: State<'_, DbCon>, snapshot_id: i64) -> Result<()> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query("DELETE FROM item WHERE snapshot_id = ?")
        .bind(snapshot_id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    sqlx::query("DELETE FROM snapshots WHERE id = ?")
        .bind(snapshot_id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    Ok(())
}

#[tauri::command]
async fn delete_profile(con: State<'_, DbCon>, profile_id: i64) -> Result<()> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let snapshots = sqlx::query_as::<_, Snapshot>("SELECT * FROM snapshots WHERE profile_id = ?")
        .bind(profile_id)
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)?;

    for snapshot in snapshots {
        sqlx::query("DELETE FROM item WHERE snapshot_id = ?")
            .bind(snapshot.id)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;

        sqlx::query("DELETE FROM snapshots WHERE id = ?")
            .bind(snapshot.id)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;
    }

    sqlx::query("DELETE FROM profiles WHERE id = ?")
        .bind(profile_id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    Ok(())
}

#[tauri::command]
async fn update_profile(
    con: State<'_, DbCon>,
    profile: Profile,
    stash_tabs: Vec<String>,
) -> Result<ProfileWithStashes> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let new_profile = sqlx::query_as::<_, Profile>(
        "UPDATE profiles SET name = ?, league_id = ?, pricing_league = ? WHERE id = ? RETURNING *",
    )
    .bind(profile.name)
    .bind(profile.league_id)
    .bind(profile.pricing_league)
    .bind(profile.id)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)?;

    sqlx::query("DELETE FROM profile_stash_assoc WHERE profile_id = ?")
        .bind(profile.id)
        .execute(pool)
        .await
        .map_err(Error::Sql)?;

    for stash_id in &stash_tabs {
        sqlx::query("INSERT INTO profile_stash_assoc (profile_id, stash_id) VALUES (?, ?)")
            .bind(profile.id)
            .bind(stash_id)
            .execute(pool)
            .await
            .map_err(Error::Sql)?;
    }

    Ok(ProfileWithStashes {
        profile: new_profile,
        stashes: stash_tabs,
    })
}

#[tauri::command]
async fn has_recent_prices(con: State<'_, DbCon>) -> Result<bool> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let count = sqlx::query_as::<_, (i64,)>("SELECT COUNT(*) as count_price FROM price")
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)?;

    if count.0 == 0 {
        return Ok(false);
    }

    let res = sqlx::query_as::<_, Price>("SELECT * FROM price ORDER BY timestamp DESC LIMIT 1")
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)?;

    return Ok(chrono::Utc::now()
        .naive_utc()
        .signed_duration_since(res.timestamp)
        <= Duration::hours(1));
}

#[tauri::command]
async fn snapshot_fetch_items(con: State<'_, DbCon>, snapshot: Snapshot) -> Result<Vec<Item>> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let row_items = sqlx::query_as::<_, ItemRow>("SELECT * FROM item WHERE snapshot_id = ?")
        .bind(snapshot.id)
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)?;

    Ok(row_items.iter().map(|x| x.data.clone().0).collect())
}

#[tauri::command]
async fn oopsie<R: Runtime>(con: State<'_, DbCon>, app: AppHandle<R>) -> Result<()> {
    let mut mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;
    pool.close().await;

    let mut app_path = app_path(&app);
    create_dir_all(&app_path).expect("Problem creating App directory!");
    app_path.push("loothound.db");
    let db_path = format!("sqlite:{}", app_path.to_str().expect("oopsie"));

    std::fs::remove_file(&db_path).unwrap();
    Sqlite::create_database(&db_path).await?;

    let new_pool = SqlitePool::connect(&db_path).await?;
    sqlx::migrate!().run(&new_pool).await?;

    *mutex = Some(new_pool);

    Ok(())
}

#[tauri::command]
async fn basically_this_use_effect(
    con: State<'_, DbCon>,
    snapshot: Snapshot,
) -> Result<UseEffectResponse> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    let profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles WHERE id = ?")
        .bind(snapshot.profile_id)
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)?;
    let league = profile.pricing_league;

    let item_rows = sqlx::query_as::<_, ItemRow>("SELECT * FROM item WHERE snapshot_id = ?")
        .bind(snapshot.id)
        .fetch_all(pool)
        .await
        .map_err(Error::Sql)?;

    let snapshot_div_price = sqlx::query_as::<_, Price>(
        "SELECT  * FROM price WHERE name = ? AND revision = ? AND LEAGUE = ? LIMIT 1",
    )
    .bind("Divine Orb")
    .bind(snapshot.pricing_revision)
    .bind(league)
    .fetch_one(pool)
    .await
    .map_err(Error::Sql)?;

    Ok(UseEffectResponse {
        items: item_rows
            .iter()
            .map(|x| ItemWithPrice {
                item: x.data.clone().0,
                price: x.value,
            })
            .collect(),
        total_chaos: snapshot.value,
        total_div: snapshot.value / snapshot_div_price.price,
    })
}

#[tauri::command]
async fn stash_from_id(con: State<'_, DbCon>, stash_id: String) -> Result<Stash> {
    let mutex = con.db.lock().await;
    let pool = mutex.as_ref().ok_or(Error::DatabaseNotLoaded)?;

    sqlx::query_as::<_, Stash>("SELECT * FROM stashes WHERE id = ?")
        .bind(stash_id)
        .fetch_one(pool)
        .await
        .map_err(Error::Sql)
}

#[tauri::command]
async fn get_pricing_leagues() -> Result<Vec<String>> {
    Ok(LEAGUES.iter().map(|x| x.to_string()).collect())
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
            add_items_to_snapshot,
            snapshot_set_value,
            list_snapshots,
            delete_snapshot,
            delete_profile,
            update_profile,
            has_recent_prices,
            snapshot_fetch_items,
            oopsie,
            basically_this_use_effect,
            stash_from_id,
            get_pricing_leagues
        ])
        .build()
}
