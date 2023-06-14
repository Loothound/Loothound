/* eslint-disable @typescript-eslint/no-inferrable-types */
import "reflect-metadata";
import { table, primaryKey, notNull, columnName } from "./decorators";
import { Data } from "dataclass";

@table("stashes")
export class Stash extends Data {
  @primaryKey
  id: string = -1;

  @notNull
  @columnName("my_special_column")
  name: string = "";
}

const t = Stash.create({ id: "abcd1234", name: "Currency" });
console.log(t.getCreateQuery());
