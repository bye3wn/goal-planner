// Centralized id generation. If you later swap to database-generated ids
// (e.g. UUIDs from Supabase), this is the only place that needs to change.
let counter = 0;

export function makeId(prefix = "id") {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
