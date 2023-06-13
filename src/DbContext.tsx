import React, { createContext, useContext, useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";

interface DbContextType {
  db: Database;
  select: <T>(query: string, bind?: unknown[]) => Promise<T>;
  execute: (query: string, bind?: unknown[]) => Promise<QueryResult>;
  createTableIfNotExists: (
    name: string,
    fields: Record<string, string>
  ) => Promise<void>;
}
const DbContext = createContext<DbContextType>(null);

export function DbContextProvider({
  tables,
  children,
}: {
  tables: Record<string, Record<string, string>>;
  children: React.ReactNode;
}) {
  const [database, setDatabase] = useState<DbContextType>(null);

  useEffect(() => {
    (async () => {
      const d = await Database.load("sqlite:loothound.db");
      async function select<T>(query: string, bind?: unknown[]): T {
        return await d.select(query, bind);
      }

      async function execute<T>(query: string, bind?: unknown[]): T {
        return await d.execute(query, bind);
      }

      async function createTableIfNotExists(
        name: string,
        fields: Record<string, string>
      ): boolean {
        let str_fields = "(";
        for (const [k, v] of Object.entries(fields)) {
          str_fields += k + " " + v + ",";
        }
        str_fields = str_fields.slice(0, -1) + ")";
        console.log(name, str_fields);
        await d.execute(
          "CREATE TABLE IF NOT EXISTS " + name + " " + str_fields + ";"
        );
      }
      const db = {
        db: d,
        select: select,
        execute: execute,
        createTableIfNotExists: createTableIfNotExists,
      };
      for (const [k, v] of Object.entries(tables)) {
        db.createTableIfNotExists(k, v);
      }
      setDatabase(db);
    })();
  }, []);

  return <DbContext.Provider value={database}>{children}</DbContext.Provider>;
}

export default function useDb() {
  return useContext(DbContext);
}
