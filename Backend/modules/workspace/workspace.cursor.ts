import { AppError } from "../../utils/app-error";
export function encodeCursor(createdAt: string | Date, id: string) {
  return Buffer.from(JSON.stringify({ date: new Date(createdAt).toISOString(), id })).toString("base64url");
}
type CursorFilter<T> = { $or?: ({ createdAt: { $lt: T } } | { createdAt: T; _id: { $lt: string } })[] };
export function cursorFilter(cursor: string | undefined, dates: true): CursorFilter<Date>;
export function cursorFilter(cursor: string | undefined, dates?: false): CursorFilter<string>;
export function cursorFilter(cursor: string | undefined, dates = false): CursorFilter<string | Date> {
  if (!cursor) return {};
  try {
    const { date, id } = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof date !== "string" || new Date(date).toISOString() !== date || typeof id !== "string" || !/^[a-f0-9]{32,64}$/.test(id)) throw new Error();
    const createdAt = dates ? new Date(date) : date;
    return { $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: id } }] };
  } catch { throw new AppError(400, "Invalid history cursor."); }
}
