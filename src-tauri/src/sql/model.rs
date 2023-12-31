use sqlx::FromRow;
use ts_rs::TS;

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Stash {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub league: String,
}

#[derive(FromRow, Debug, PartialEq, Eq, Clone, serde::Serialize, serde::Deserialize, TS)]
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

#[derive(FromRow, Debug, PartialEq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Snapshot {
    pub id: i64,
    pub profile_id: i64,
    #[ts(type = "string")]
    pub timestamp: sqlx::types::chrono::NaiveDateTime,
    pub pricing_revision: i64,
    pub value: f64,
}

#[derive(FromRow, Debug, PartialEq)]
pub struct ItemRow {
    pub id: i64,
    pub snapshot_id: i64,
    pub stash_id: String,
    pub data: sqlx::types::Json<Item>,
    pub value: f64,
}

#[derive(Debug, PartialEq, serde::Deserialize, serde::Serialize, Clone, TS)]
#[ts(export, export_to = "../src/bindings/")]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub verified: bool,
    pub w: i64,
    pub h: i64,
    pub icon: String,
    pub support: Option<bool>,
    pub stack_size: Option<i64>,
    pub max_stack_size: Option<i64>,
    pub stack_size_text: Option<String>,
    pub league: Option<String>,
    pub id: Option<String>,
    pub fractured: Option<bool>,
    pub synthesized: Option<bool>,
    pub name: String,
    pub type_line: String,
    pub base_type: String,
    pub identified: bool,
    pub item_level: Option<i64>,
    pub frame_type: i64,
}

#[derive(FromRow, Debug, PartialEq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Price {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub revision: i64,
    pub fully_linked: bool,
    #[ts(type = "string")]
    pub timestamp: chrono::NaiveDateTime,
    pub league: String,
}

#[derive(Debug, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct UseEffectResponse {
    pub items: Vec<ItemWithPrice>,
    pub total_chaos: f64,
    pub total_div: f64,
}

#[derive(Debug, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct ItemWithPrice {
    pub item: Item,
    pub price: f64,
}
