/**
 * Small utilities shared across the KEGG MCP server.
 */

export function extractOrganismPrefix(pathwayId: string): string | null {
  const match = pathwayId.match(/^([a-z]{3,4})\d+$/i);
  return match ? match[1].toLowerCase() : null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function urlEncodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/%20/g, '+');
}

export function validateEntryIds(entryIds: string[], max = 10): string[] {
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    throw new Error('entry_ids must be a non-empty array');
  }
  if (entryIds.length > max) {
    throw new Error(`entry_ids exceeds maximum of ${max}`);
  }
  for (const id of entryIds) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('Each entry_id must be a non-empty string');
    }
  }
  return entryIds;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
