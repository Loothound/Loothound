/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Driver, DatabaseConnection, CompiledQuery, QueryResult } from "kysely";
import Database, { QueryResult as DbQueryResult } from "tauri-plugin-sql-api";

export class TauriDriver implements Driver {
  readonly #mutex = new ConnectionMutex();

  #db?: Database;
  #connection?: DatabaseConnection;

  async init(): Promise<void> {
    this.#db = await Database.load("sqlite:loothound.db");
    this.#connection = new TauriConnection(this.#db);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#mutex.lock();
    return this.#connection!;
  }

  async beginTransaction(): Promise<void> {
    await this.#connection?.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(): Promise<void> {
    await this.#connection?.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(): Promise<void> {
    await this.#connection?.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(): Promise<void> {
    this.#mutex.unlock();
  }

  async destroy(): Promise<void> {
    this.#db?.close();
  }
}

class TauriConnection implements DatabaseConnection {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    if (sql.startsWith("SELECT")) {
      // assume select query
      const response: R[] = await this.#db.select<R[]>(sql, [...parameters]);
      return {
        rows: response,
      };
    } else {
      // assume anything else
      const response: DbQueryResult = await this.#db.execute(sql, [
        ...parameters,
      ]);
      return {
        numAffectedRows: BigInt(response.rowsAffected),
        insertId: BigInt(response.lastInsertId),
        rows: [],
      };
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Sqlite driver doesn't support streaming");
    yield null as unknown as QueryResult<R>;
  }
}

class ConnectionMutex {
  #promise?: Promise<void>;
  #resolve?: () => void;

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise;
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.#resolve;

    this.#promise = undefined;
    this.#resolve = undefined;

    resolve?.();
  }
}
