// Every custom drag source in the app (task rows, event blocks, preset
// cards) encodes its payload the same way — a JSON blob under the
// "application/json" MIME type — so every drop target can share this one
// parser instead of re-implementing try/catch JSON.parse everywhere.
export function readDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData("application/json"));
  } catch {
    return null;
  }
}
