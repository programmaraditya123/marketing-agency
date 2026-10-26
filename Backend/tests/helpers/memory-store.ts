import type { Collection } from "mongodb";
import type { User, Session, Activity, Visitor } from "../../types/auth";
import type { CrawlJob } from "../../types/crawler";
// In-memory Mongo subset for isolated API contract tests; never opens a real database.
export function memoryCollection<T extends { _id: string }>() {
  const rows: T[] = [];
  const matches = (row: T, filter: Record<string, unknown>) => Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return (value as Record<string, unknown>[]).some(part => matches(row, part));
    const actual = (row as Record<string, unknown>)[key];
    if (value && typeof value === "object" && !(value instanceof Date)) {
      const ops = value as Record<string, unknown>;
      if ("$exists" in ops) return Object.prototype.hasOwnProperty.call(row, key) === ops.$exists;
      if ("$gt" in ops) return (actual as Date) > (ops.$gt as Date);
      if ("$lt" in ops) return (actual as string) < (ops.$lt as string);
    }
    return actual instanceof Date && value instanceof Date ? actual.getTime() === value.getTime() : actual === value;
  });
  function applyUpdate(row: T, update: { $set?: Partial<T>; $addToSet?: Record<string, unknown> }) {
    Object.assign(row, structuredClone(update.$set || {}));
    for (const [key, value] of Object.entries(update.$addToSet || {})) {
      const fields = row as Record<string, unknown>;
      const values = (fields[key] || []) as unknown[];
      if (!values.includes(value)) fields[key] = [...values, structuredClone(value)];
    }
  }
  const collection = {
    async insertOne(row: T) {
      if (rows.some(saved => saved._id === row._id || ("email" in row && "email" in saved && row.email === saved.email))) throw Object.assign(new Error("duplicate"), { code: 11000 });
      rows.push(structuredClone(row)); return { insertedId: row._id };
    },
    async findOne(filter: Record<string, unknown>) { return structuredClone(rows.find(row => matches(row, filter)) || null); },
    async updateOne(filter: Record<string, unknown>, update: { $set?: Partial<T>; $addToSet?: Record<string, unknown> }) {
      const row = rows.find(row => matches(row, filter)); if (row) applyUpdate(row, update); return { matchedCount: row ? 1 : 0 };
    },
    async updateMany(filter: Record<string, unknown>, update: { $set: Partial<T> }) {
      for (const row of rows.filter(row => matches(row, filter))) Object.assign(row, structuredClone(update.$set));
    },
    async deleteOne(filter: Record<string, unknown>) { const index = rows.findIndex(row => matches(row, filter)); if (index >= 0) rows.splice(index, 1); },
    async deleteMany(filter: Record<string, unknown>) { for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], filter)) rows.splice(i, 1); },
    find(filter: Record<string, unknown>) {
      let result = rows.filter(row => matches(row, filter));
      const cursor = {
        sort() { result = [...result].sort((a, b) => String((b as Record<string, unknown>).createdAt).localeCompare(String((a as Record<string, unknown>).createdAt)) || b._id.localeCompare(a._id)); return cursor; },
        limit(n: number) { result = result.slice(0, n); return cursor; },
        async toArray() { return structuredClone(result); },
      }; return cursor;
    },
  };
  return { rows, collection: collection as unknown as Collection<T> };
}
export function memoryStore() {
  return { users: memoryCollection<User>(), sessions: memoryCollection<Session>(), activities: memoryCollection<Activity>(), jobs: memoryCollection<CrawlJob>(), visitors: memoryCollection<Visitor>() };
}
