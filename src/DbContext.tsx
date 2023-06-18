import React, { createContext, useContext, useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { Database as DatabaseType } from "./database/model";
import {
  Kysely,
  Migrator,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import { TauriDriver } from "./database/driver";
import LoothoundMigrationProvider from "./database/migrations";

export type DbContextType = Kysely<DatabaseType>;
const DbContext = createContext<DbContextType>({} as unknown as DbContextType);

export function DbContextProvider({ children }: { children: React.ReactNode }) {
  const [database, setDatabase] = useState<DbContextType>(
    {} as unknown as DbContextType
  );

  useEffect(() => {
    (async () => {
      const db: DbContextType = new Kysely<DatabaseType>({
        dialect: {
          createAdapter() {
            return new SqliteAdapter();
          },
          createDriver() {
            return new TauriDriver();
          },
          createIntrospector(db: Kysely<Database>) {
            return new SqliteIntrospector(db);
          },
          createQueryCompiler() {
            return new SqliteQueryCompiler();
          },
        },
      });

      const migrator = new Migrator({
        db,
        provider: LoothoundMigrationProvider,
      });
      await migrator.migrateToLatest();

      setDatabase(db);
    })();
  }, []);

  return <DbContext.Provider value={database}>{children}</DbContext.Provider>;
}

export default function useDb() {
  return useContext(DbContext);
}
