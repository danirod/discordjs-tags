import { Snowflake } from "discord.js";

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

class SqliteBasedTagProvider implements TagProvider {
  private memory: { [key: string]: unknown };

  constructor() {
    this.memory = {};
  }

  tagbag(namespace: Snowflake, owner: Snowflake): TagBag {
    return {
      tag: (key) => ({
        get: (defValue) => this.get(namespace, owner, key, defValue),
        set: (value) => this.set(namespace, owner, key, value),
        delete: () => this.delete(namespace, owner, key),
      }),
    };
  }

  private get<T>(
    namespace: Snowflake,
    owner: Snowflake,
    key: string,
    defValue?: T
  ): Promise<T | undefined> {
    const vector = `${namespace}:${owner}:${key}`;
    const value: T | undefined = (this.memory[vector] as T) || defValue;
    return Promise.resolve(value) as Promise<T>;
  }

  private set<T>(
    namespace: Snowflake,
    owner: Snowflake,
    key: string,
    value: T
  ): Promise<void> {
    const vector = `${namespace}:${owner}:${key}`;
    this.memory[vector] = value;
    return Promise.resolve();
  }

  private delete(
    namespace: Snowflake,
    owner: Snowflake,
    key: string
  ): Promise<void> {
    const vector = `${namespace}:${owner}:${key}`;
    delete this.memory[vector];
    return Promise.resolve();
  }
}

export function createRepository(): TagProvider {
  return new SqliteBasedTagProvider();
}
