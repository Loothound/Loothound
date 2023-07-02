use sqlx::FromRow;
use ts_rs::TS;

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Stash {
    pub id: String,
    pub name: String,
    pub r#type: String,
}

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub league_id: String,
    pub pricing_league: String,
}

#[derive(FromRow, Debug, PartialEq, Eq, serde::Serialize, TS)]
#[ts(export, export_to = "../src/bindings/")]
pub struct ProfileStashAssoc {
    pub profile_id: usize,
    pub stash_id: String,
}
