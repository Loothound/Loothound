import { MigrationProvider, Migration, Kysely } from 'kysely';

async function getMigrations(): Promise<Record<string, Migration>> {
	return {
		'2023-06-18_initial': {
			async up(db: Kysely<unknown>) {
				db.schema
					.createTable('stashes')
					.addColumn('id', 'text', (col) => col.autoIncrement().primaryKey())
					.addColumn('name', 'text')
					.addColumn('type', 'text')
					.execute();
				db.schema
					.createTable('profiles')
					.addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
					.addColumn('name', 'text')
					.addColumn('league_id', 'text')
					.addColumn('pricing_league', 'text')
					.execute();
				db.schema
					.createTable('profile_stash_assoc')
					.addColumn('profile_id', 'integer')
					.addColumn('stash_id', 'text')
					.addForeignKeyConstraint('profile_stash_profile_id_fk', ['profile_id'], 'profiles', [
						'id',
					])
					// .addForeignKeyConstraint('profile_stash_stash_id_fk', ['stash_id'], 'stashes', ['id'])
					.execute();
				db.schema
					.createTable('item')
					.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
					.addColumn('base_type', 'text')
					.addColumn('type_line', 'text')
					.addColumn('raw_data', 'text')
					.execute();
				db.schema
					.createTable('snapshots')
					.addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
					.addColumn('stash_id', 'text')
					.addColumn('item_id', 'integer')
					.addColumn('amount', 'integer')
					.addForeignKeyConstraint('snapshot_stash_id_fk', ['stash_id'], 'stashes', ['id'])
					.addForeignKeyConstraint('snapshot_item_id_fk', ['item_id'], 'items', ['id'])
					.execute();
			},
		},
	};
}

const LoothoundMigrationProvider: MigrationProvider = {
	getMigrations: getMigrations,
};

export default LoothoundMigrationProvider;
