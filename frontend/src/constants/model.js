// Mirrors backend/services/groqClient.js's MODEL constant. Stored on each
// conversation document so the record is self-describing and a future
// provider/model switch doesn't require a data migration.
export const MODEL = "llama-3.1-8b-instant";
