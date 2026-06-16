/**
 * Robust parsers for KEGG flat files, tab-delimited lists, and multi-entry batch responses.
 *
 * KEGG flat-file conventions used here:
 *  - Field names are written in columns 0-11 (left aligned, uppercase).
 *  - Field values start at column 12.
 *  - Continuation lines begin with whitespace in columns 0-11.
 *  - Entries are terminated by a line starting with "///".
 */

import { KEGGEntry, KEGGListItem, KEGGOrganism, KEGGLinkResult, KEGGReference } from './types.js';

const KNOWN_FIELDS = new Set([
  'ENTRY',
  'NAME',
  'DEFINITION',
  'FORMULA',
  'EXACT_MASS',
  'MOL_WEIGHT',
  'PATHWAY',
  'GENE',
  'COMPOUND',
  'REACTION',
  'ORTHOLOGY',
  'DBLINKS',
  'ORGANISM',
  'MODULE',
  'DISEASE',
  'DRUG',
  'BRITE',
  'REFERENCE',
  'CLASS',
  'COMMENT',
  'REMARK',
  'SYNONYM',
  'ACTIVITY',
  'TARGET',
  'PATHWAY_MAP',
  'DESCRIPTION',
  'POSITION',
  'MOTIF',
  'STRUCTURE',
  'NETWORK',
  'VARIANT',
  'ENZYME',
  'RCLASS',
  'EQUATION',
  'RPAIR',
  'INTERACTION',
  'COMPONENT',
  'MEMBER',
  'CATEGORY',
  'MARKER',
  'KEYWORDS',
  'SYSNAME',
  'PRODUCTS',
  'SUBSTRATES',
  'ALL_REAC',
  'SUBSTRATE',
  'PRODUCT',
  'COFACTOR',
  'INHIBITOR',
  'ACTIVATOR',
  'EFFECTOR',
  'LINK',
]);

const REFERENCE_SUBFIELDS = ['AUTHORS', 'TITLE', 'JOURNAL', 'PUBMED', 'ABSTRACT'] as const;

/**
 * Parse a KEGG flat-file entry into a structured object.
 * Captures ALL lines of multi-line fields until the next field header or terminator.
 */
export function parseKEGGEntry(data: string): KEGGEntry {
  if (typeof data !== 'string') {
    throw new Error('parseKEGGEntry: input must be a string');
  }

  const lines = data.split('\n');
  const result: KEGGEntry = {};
  let currentField: string | null = null;

  function parseHeader(line: string): { field: string; rest: string } | null {
    // In KEGG flat files field names occupy columns 0-11 and values start at column 12.
    // Continuation lines therefore begin with whitespace.
    if (line.length === 0 || line[0] === ' ' || line[0] === '\t') {
      return null;
    }
    const match = line.match(/^([A-Z][A-Z_0-9]*)\b/);
    if (!match) return null;
    const field = match[1];
    const rest = line.slice(field.length).trim();
    return { field, rest };
  }

  function ensureMap(field: string): Record<string, string> {
    const key = field.toLowerCase();
    const existing = result[key];
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return existing as Record<string, string>;
    }
    const map: Record<string, string> = {};
    result[key] = map;
    return map;
  }

  function ensureStringArray(field: string): string[] {
    const key = field.toLowerCase();
    const existing = result[key];
    if (Array.isArray(existing)) {
      return existing as string[];
    }
    const arr: string[] = [];
    result[key] = arr;
    return arr;
  }

  function appendString(field: string, value: string): void {
    const key = field.toLowerCase();
    const existing = result[key];
    if (typeof existing === 'string') {
      result[key] = existing + ' ' + value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else if (existing !== undefined) {
      result[key] = [String(existing), value];
    } else {
      result[key] = value;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('///')) {
      break;
    }

    const header = parseHeader(line);

    if (header && (KNOWN_FIELDS.has(header.field) || header.field.length <= 12)) {
      currentField = header.field;
      const { field, rest } = header;

      if (field === 'ENTRY') {
        const parts = rest.split(/\s+/).filter(Boolean);
        result.entry = parts[0] ?? '';
        result.type = parts[1] ?? '';
      } else if (field === 'NAME') {
        result.name = rest ? [rest] : [];
      } else if (
        field === 'DEFINITION' ||
        field === 'COMMENT' ||
        field === 'REMARK' ||
        field === 'DESCRIPTION' ||
        field === 'CLASS' ||
        field === 'SYSNAME'
      ) {
        appendString(field, rest);
      } else if (field === 'FORMULA') {
        result.formula = rest;
      } else if (field === 'EXACT_MASS') {
        result.exact_mass = rest;
      } else if (field === 'MOL_WEIGHT') {
        result.mol_weight = rest;
      } else if (field === 'ORGANISM') {
        result.organism = rest;
      } else if (field === 'POSITION') {
        result.position = rest;
      } else if (field === 'STRUCTURE') {
        result.structure = rest;
      } else if (field === 'EQUATION') {
        result.equation = rest;
      } else if (
        field === 'PATHWAY' ||
        field === 'GENE' ||
        field === 'COMPOUND' ||
        field === 'REACTION' ||
        field === 'ORTHOLOGY'
      ) {
        const target = ensureMap(field);
        const match = rest.match(/^(\S+)\s+(.+)$/);
        if (match) {
          target[match[1]] = match[2];
        }
      } else if (field === 'DBLINKS') {
        const target: Record<string, string[]> = {};
        result.dblinks = target;
        const match = rest.match(/^(\S+):\s*(.+)$/);
        if (match) {
          target[match[1]] = match[2].split(/\s+/).filter(Boolean);
        }
      } else if (
        field === 'MODULE' ||
        field === 'DISEASE' ||
        field === 'DRUG' ||
        field === 'BRITE'
      ) {
        const target = ensureStringArray(field);
        if (rest) target.push(rest);
      } else if (field === 'REFERENCE') {
        const refs = ensureStringArray('REFERENCE') as unknown as KEGGReference[];
        result.reference = refs;
        refs.push({});
      } else {
        appendString(field, rest);
      }
    } else if (currentField) {
      // Continuation line
      const trimmed = line.trimStart();

      if (currentField === 'NAME') {
        const arr = result.name as string[];
        arr.push(trimmed);
      } else if (
        currentField === 'DEFINITION' ||
        currentField === 'COMMENT' ||
        currentField === 'REMARK' ||
        currentField === 'DESCRIPTION' ||
        currentField === 'CLASS' ||
        currentField === 'SYSNAME'
      ) {
        appendString(currentField, trimmed);
      } else if (
        currentField === 'PATHWAY' ||
        currentField === 'GENE' ||
        currentField === 'COMPOUND' ||
        currentField === 'REACTION' ||
        currentField === 'ORTHOLOGY'
      ) {
        const target = result[currentField.toLowerCase()] as Record<string, string>;
        const match = trimmed.match(/^(\S+)\s+(.+)$/);
        if (match) {
          target[match[1]] = match[2];
        } else if (trimmed) {
          const keys = Object.keys(target);
          if (keys.length > 0) {
            target[keys[keys.length - 1]] += ' ' + trimmed;
          }
        }
      } else if (currentField === 'DBLINKS') {
        const target = result.dblinks as Record<string, string[]>;
        const match = trimmed.match(/^(\S+):\s*(.+)$/);
        if (match) {
          target[match[1]] = match[2].split(/\s+/).filter(Boolean);
        } else if (trimmed) {
          const keys = Object.keys(target);
          if (keys.length > 0) {
            target[keys[keys.length - 1]].push(...trimmed.split(/\s+/).filter(Boolean));
          }
        }
      } else if (
        currentField === 'MODULE' ||
        currentField === 'DISEASE' ||
        currentField === 'DRUG' ||
        currentField === 'BRITE'
      ) {
        const target = result[currentField.toLowerCase()] as string[];
        target.push(trimmed);
      } else if (currentField === 'REFERENCE') {
        const refs = result.reference as KEGGReference[];
        const currentRef = refs[refs.length - 1];

        const subMatch = trimmed.match(/^([A-Z]+)\s+(.*)$/);
        if (subMatch && REFERENCE_SUBFIELDS.includes(subMatch[1] as typeof REFERENCE_SUBFIELDS[number])) {
          const rawField = subMatch[1];
          const subField = (rawField === 'PUBMED' ? 'pmid' : rawField.toLowerCase()) as keyof KEGGReference;
          currentRef[subField] = subMatch[2];
        } else if (trimmed) {
          // Continuation of the most recently seen reference sub-field.
          for (let j = REFERENCE_SUBFIELDS.length - 1; j >= 0; j--) {
            const rawField = REFERENCE_SUBFIELDS[j];
            const key = (rawField === 'PUBMED' ? 'pmid' : rawField.toLowerCase()) as keyof KEGGReference;
            if (currentRef[key] !== undefined) {
              currentRef[key] += ' ' + trimmed;
              break;
            }
          }
        }
      } else {
        appendString(currentField, trimmed);
      }
    }
  }

  return result;
}

/**
 * Parse KEGG tab-delimited list responses.
 * Handles 2-column (id\tname) and 3-column (id\textra\tname) outputs.
 */
export function parseKEGGList(data: string): KEGGListItem[] {
  if (typeof data !== 'string') {
    throw new Error('parseKEGGList: input must be a string');
  }

  const lines = data.split('\n').filter((line) => line.trim().length > 0);
  const results: KEGGListItem[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length === 2) {
      results.push({ id: parts[0], name: parts[1] });
    } else if (parts.length >= 3) {
      results.push({ id: parts[0], extra: parts[1], name: parts[2] });
    } else {
      throw new Error(`parseKEGGList: malformed line, expected 2+ tab-delimited columns: "${line}"`);
    }
  }

  return results;
}

/**
 * Parse the 3-column output of /list/genome into organism records.
 */
export function parseGenomeList(data: string): KEGGOrganism[] {
  if (typeof data !== 'string') {
    throw new Error('parseGenomeList: input must be a string');
  }

  const lines = data.split('\n').filter((line) => line.trim().length > 0);
  const results: KEGGOrganism[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length === 3) {
      results.push({
        t_number: parts[0],
        organism_code: parts[1],
        organism_name: parts[2],
      });
    } else if (parts.length === 2) {
      // Some KEGG genome list lines use 2 columns: T-number\torg; name
      const subParts = parts[1].split(';');
      if (subParts.length >= 2) {
        results.push({
          t_number: parts[0],
          organism_code: subParts[0].trim(),
          organism_name: subParts.slice(1).join(';').trim(),
        });
      } else {
        results.push({
          t_number: parts[0],
          organism_code: parts[1].trim(),
          organism_name: parts[1].trim(),
        });
      }
    } else {
      throw new Error(`parseGenomeList: expected 2-3 columns, got ${parts.length}: "${line}"`);
    }
  }

  return results;
}

/**
 * Parse KEGG link results (tab-delimited source\ttarget pairs).
 */
export function parseLinkResults(data: string): KEGGLinkResult[] {
  if (typeof data !== 'string') {
    throw new Error('parseLinkResults: input must be a string');
  }

  const lines = data.split('\n').filter((line) => line.trim().length > 0);
  const results: KEGGLinkResult[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length !== 2) {
      throw new Error(`parseLinkResults: expected 2 columns, got ${parts.length}: "${line}"`);
    }
    results.push({ source: parts[0], target: parts[1] });
  }

  return results;
}

/**
 * Split a multi-entry GET response on "\n///\n" terminators.
 * Returns up to 10 entries.
 */
export function splitMultiEntryResponse(data: string): string[] {
  if (typeof data !== 'string') {
    throw new Error('splitMultiEntryResponse: input must be a string');
  }

  // Normalize line endings and split on terminator lines
  const normalized = data.replace(/\r\n/g, '\n');
  const entries = normalized.split(/\n\/\/\/\n?/).filter((entry) => entry.trim().length > 0);

  if (entries.length > 10) {
    throw new Error(`splitMultiEntryResponse: received ${entries.length} entries, max allowed is 10`);
  }

  return entries;
}
