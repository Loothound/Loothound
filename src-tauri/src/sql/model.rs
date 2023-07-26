use sqlx::FromRow;
use ts_rs::TS;

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Stash {
    pub id: String,
    pub name: String,
    pub r#type: String,
}

#[derive(FromRow, Debug, PartialEq, Eq, Clone, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub league_id: String,
    pub pricing_league: String,
}

#[derive(Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct ProfileWithStashes {
    pub profile: Profile,
    pub stashes: Vec<String>,
}

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct ProfileStashAssoc {
    pub profile_id: i64,
    pub stash_id: String,
}

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Snapshot {
    pub id: i64,
    pub stash_id: String,
    pub item_id: i64,
    pub amount: i64,
}

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Item {
    pub id: i64,
    pub base_type: String,
    pub base_line: String,
    pub raw_data: String,
}

#[derive(FromRow, Debug, PartialEq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Price {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub revision: i64,
    pub fully_linked: bool,
}
