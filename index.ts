import { Snowflake } from "discord.js";
import { open, Database } from "sqlite";
import * as sqlite3 from "sqlite3";

export interface TagOptions {
  ttl: number;
}

export interface Tag {
  get<T>(defValue?: T): Promise<T | undefined>;
  set<T>(value: T, options?: TagOptions): Promise<void>;
  delete(): Promise<void>;
}

export interface TagBag {
  tag(key: string): Tag;
}

export interface TagProvider {
  tagbag(namespace: Snowflake, owner: Snowflake): TagBag;
}

const MIGRATION_SCRIPT = `
  CREATE TABLE IF NOT EXISTS tags (
    server_id VARCHAR(48),
    owner_id VARCHAR(48),
    key VARCHAR(32),
    value TEXT,
    expires_at DATETIME,
    PRIMARY KEY("server_id", "owner_id", "key")
  );
`;

class SqliteBasedTagProvider implements TagProvider {
  constructor(private db: Database) {}

  tagbag(namespace: Snowflake, owner: Snowflake): TagBag {
    return {
      tag: (key) => ({
        get: (defValue) => this.get(namespace, owner, key, defValue),
        set: (value) => this.set(namespace, owner, key, value),
        delete: () => this.delete(namespace, owner, key),
      }),
    };
  }

  private async get<T>(
    namespace: Snowflake,
    owner: Snowflake,
    key: string,
    defValue?: T
  ): Promise<T | undefined> {
    const query =
      "SELECT value FROM tags WHERE server_id = ? AND owner_id = ? AND key = ?";
    const params = await this.db.get(query, [namespace, owner, key]);
    if (params && params.value) {
      return JSON.parse(params.value);
    } else {
      return defValue;
    }
  }

  private async set<T>(
    namespace: Snowflake,
    owner: Snowflake,
    key: string,
    value: T
  ): Promise<void> {
    const query =
      "INSERT OR REPLACE INTO tags(server_id, owner_id, key, value) VALUES(?, ?, ?, ?)";
    await this.db.run(query, [namespace, owner, key, JSON.stringify(value)]);
  }

  private async delete(
    namespace: Snowflake,
    owner: Snowflake,
    key: string
  ): Promise<void> {
    const query =
      "DELETE FROM tags WHERE server_id = ? AND owner_id = ? AND key = ?";
    await this.db.run(query, [namespace, owner, key]);
  }
}

export async function createRepository(file: string): Promise<TagProvider> {
  const database = await open({
    filename: file,
    driver: sqlite3.Database,
  });
  await database.run(MIGRATION_SCRIPT);
  return new SqliteBasedTagProvider(database);
}
