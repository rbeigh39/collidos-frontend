/**
 * Client-generated temporary id for an optimistic row, used before the server
 * assigns the real id (the settle refetch swaps it in). The `temp:` prefix
 * makes optimistic rows identifiable.
 */
export const tempId = (prefix = "temp") => `${prefix}:${crypto.randomUUID()}`;
