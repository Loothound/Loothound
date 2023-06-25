import React, { createContext, useContext, useEffect, useState } from 'react';
import { Database as DatabaseType } from './database/model';
import { Kysely, Migrator, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from 'kysely';
import { TauriDriver } from './database/driver';
import LoothoundMigrationProvider from './database/migrations';
import { Loader } from '@mantine/core';

export type DbContextType = Kysely<DatabaseType> | undefined;
const DbContext = createContext<DbContextType>(undefined);

export function DbContextProvider({ children }: { children: React.ReactNode }) {
	const [database, setDatabase] = useState<DbContextType>(undefined);

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
					createIntrospector(db: Kysely<unknown>) {
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

	if (!database) {
		return <Loader size="xl" />;
	}

	return <DbContext.Provider value={database}>{children}</DbContext.Provider>;
}

export default function useDb() {
	const ctx = useContext(DbContext);
	if (!ctx) {
		throw new Error('Used useDb outside of provider');
	}
	return ctx;
}
