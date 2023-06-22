import { Generated } from "kysely";

export interface Stash {
  id: Generated<string>;
  name: string;
  type: string;
}

export interface Profile {
  id: Generated<number>;
  name: string;
  league_id: string;
  pricing_league: string;
}

export interface ProfileStashAssoc {
  profile_id: Generated<number>;
  stash_id: string;
}

export interface Item {
  id: Generated<number>;
  base_type: string;
  type_line: string;
  raw_data: string;
}

export interface Snapshot {
  id: Generated<number>;
  stash_id: string;
  item_id: number;
  amount: number;
}

export interface Database {
  stashes: Stash;
  items: Item;
  profiles: Profile;
  profile_stash_assoc: ProfileStashAssoc;
  snapshots: Snapshot;
}
