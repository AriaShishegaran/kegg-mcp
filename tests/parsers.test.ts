import { describe, it, expect } from 'vitest';
import {
  parseKEGGEntry,
  parseKEGGList,
  parseGenomeList,
  parseLinkResults,
  splitMultiEntryResponse,
} from '../src/parsers.js';

describe('parseKEGGEntry', () => {
  it('parses a simple compound entry', () => {
    const data = `ENTRY       C00002                      Compound
NAME        ATP;
            Adenosine 5'-triphosphate
FORMULA     C10H16N5O13P3
EXACT_MASS  506.9957
MOL_WEIGHT  507.1810
PATHWAY     map00010  Glycolysis / Gluconeogenesis
            map00030  Pentose phosphate pathway
REACTION    R00002  hexokinase
            R00003  phosphofructokinase
///`;
    const result = parseKEGGEntry(data);
    expect(result.entry).toBe('C00002');
    expect(result.type).toBe('Compound');
    expect(result.name).toEqual(["ATP;", "Adenosine 5'-triphosphate"]);
    expect(result.formula).toBe('C10H16N5O13P3');
    expect(result.exact_mass).toBe('506.9957');
    expect(result.mol_weight).toBe('507.1810');
    expect(result.pathway).toEqual({
      map00010: 'Glycolysis / Gluconeogenesis',
      map00030: 'Pentose phosphate pathway',
    });
    expect(result.reaction).toEqual({
      R00002: 'hexokinase',
      R00003: 'phosphofructokinase',
    });
  });

  it('parses a gene entry with sequences and dblinks', () => {
    const data = `ENTRY       hsa:1956                    Gene
NAME        EGFR
DEFINITION  epidermal growth factor receptor [EC:2.7.10.1]
ORGANISM    hsa  Homo sapiens (human)
PATHWAY     hsa04010  MAPK signaling pathway
            hsa04014  Ras signaling pathway
DBLINKS     NCBI-GeneID: 1956
            NCBI-ProteinID: NP_005219
            OMIM: 131550
///`;
    const result = parseKEGGEntry(data);
    expect(result.entry).toBe('hsa:1956');
    expect(result.type).toBe('Gene');
    expect(result.name).toEqual(['EGFR']);
    expect(result.definition).toBe('epidermal growth factor receptor [EC:2.7.10.1]');
    expect(result.organism).toBe('hsa  Homo sapiens (human)');
    expect(result.dblinks).toEqual({
      'NCBI-GeneID': ['1956'],
      'NCBI-ProteinID': ['NP_005219'],
      OMIM: ['131550'],
    });
  });

  it('parses multi-line DEFINITION and COMMENT fields', () => {
    const data = `ENTRY       C00031                      Compound
NAME        D-Glucose
DEFINITION  A primary source of energy for living organisms.
            It is naturally occurring and is found in fruits
            and other parts of plants.
COMMENT     Glucose is a simple sugar.
            It is an important carbohydrate.
///`;
    const result = parseKEGGEntry(data);
    expect(result.definition).toBe(
      'A primary source of energy for living organisms. It is naturally occurring and is found in fruits and other parts of plants.'
    );
    expect(result.comment).toBe('Glucose is a simple sugar. It is an important carbohydrate.');
  });

  it('parses REFERENCE blocks', () => {
    const data = `ENTRY       C00031                      Compound
NAME        D-Glucose
REFERENCE   1
  AUTHORS   Smith J, Doe A
  TITLE     The structure of glucose
  JOURNAL   Nature 100 (2000) 1-10
  PUBMED    12345678
REFERENCE   2
  AUTHORS   Brown B
  TITLE     Glucose metabolism
  JOURNAL   Science 200 (2005) 20-30
///`;
    const result = parseKEGGEntry(data);
    expect(result.reference).toHaveLength(2);
    expect(result.reference![0]).toEqual({
      authors: 'Smith J, Doe A',
      title: 'The structure of glucose',
      journal: 'Nature 100 (2000) 1-10',
      pmid: '12345678',
    });
    expect(result.reference![1]).toEqual({
      authors: 'Brown B',
      title: 'Glucose metabolism',
      journal: 'Science 200 (2005) 20-30',
    });
  });

  it('parses REFERENCE blocks with multi-line sub-fields', () => {
    const data = `ENTRY       C00031                      Compound
NAME        D-Glucose
REFERENCE   1
  AUTHORS   Smith J, Doe A,
            Brown B, Green C
  TITLE     The structure of glucose and
            its metabolic derivatives
  JOURNAL   Nature 100 (2000) 1-10
  PUBMED    12345678
///`;
    const result = parseKEGGEntry(data);
    expect(result.reference).toHaveLength(1);
    expect(result.reference![0]).toEqual({
      authors: 'Smith J, Doe A, Brown B, Green C',
      title: 'The structure of glucose and its metabolic derivatives',
      journal: 'Nature 100 (2000) 1-10',
      pmid: '12345678',
    });
  });

  it('throws on non-string input', () => {
    expect(() => parseKEGGEntry(123 as any)).toThrow('parseKEGGEntry: input must be a string');
  });
});

describe('parseKEGGList', () => {
  it('parses 2-column tab-delimited list', () => {
    const data = `map00010\tGlycolysis / Gluconeogenesis
map00020\tCitrate cycle (TCA cycle)
map00030\tPentose phosphate pathway`;
    const result = parseKEGGList(data);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'map00010', name: 'Glycolysis / Gluconeogenesis' });
    expect(result[1]).toEqual({ id: 'map00020', name: 'Citrate cycle (TCA cycle)' });
    expect(result[2]).toEqual({ id: 'map00030', name: 'Pentose phosphate pathway' });
  });

  it('parses 3-column tab-delimited list (genome)', () => {
    const data = `T01001\thsa\tHomo sapiens
T01002\tmmu\tMus musculus
T01005\trno\tRattus norvegicus`;
    const result = parseKEGGList(data);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'T01001', extra: 'hsa', name: 'Homo sapiens' });
    expect(result[1]).toEqual({ id: 'T01002', extra: 'mmu', name: 'Mus musculus' });
    expect(result[2]).toEqual({ id: 'T01005', extra: 'rno', name: 'Rattus norvegicus' });
  });

  it('handles empty input', () => {
    const result = parseKEGGList('');
    expect(result).toHaveLength(0);
  });

  it('throws on malformed line', () => {
    expect(() => parseKEGGList('single_column')).toThrow('parseKEGGList: malformed line');
  });

  it('throws on non-string input', () => {
    expect(() => parseKEGGList(123 as any)).toThrow('parseKEGGList: input must be a string');
  });
});

describe('parseGenomeList', () => {
  it('parses 3-column genome list', () => {
    const data = `T01001\thsa\tHomo sapiens
T01002\tmmu\tMus musculus
T01005\trno\tRattus norvegicus`;
    const result = parseGenomeList(data);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ t_number: 'T01001', organism_code: 'hsa', organism_name: 'Homo sapiens' });
    expect(result[1]).toEqual({ t_number: 'T01002', organism_code: 'mmu', organism_name: 'Mus musculus' });
    expect(result[2]).toEqual({ t_number: 'T01005', organism_code: 'rno', organism_name: 'Rattus norvegicus' });
  });

  it('throws on malformed line', () => {
    expect(() => parseGenomeList('T01001')).toThrow('parseGenomeList: expected 2-3 columns');
  });

  it('throws on non-string input', () => {
    expect(() => parseGenomeList(123 as any)).toThrow('parseGenomeList: input must be a string');
  });
});

describe('parseLinkResults', () => {
  it('parses tab-delimited link pairs', () => {
    const data = `path:hsa00010\thsa:10327
path:hsa00010\thsa:2645
path:hsa00010\thsa:3098`;
    const result = parseLinkResults(data);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ source: 'path:hsa00010', target: 'hsa:10327' });
    expect(result[1]).toEqual({ source: 'path:hsa00010', target: 'hsa:2645' });
    expect(result[2]).toEqual({ source: 'path:hsa00010', target: 'hsa:3098' });
  });

  it('handles empty input', () => {
    const result = parseLinkResults('');
    expect(result).toHaveLength(0);
  });

  it('throws on malformed line', () => {
    expect(() => parseLinkResults('single')).toThrow('parseLinkResults: expected 2 columns');
  });

  it('throws on non-string input', () => {
    expect(() => parseLinkResults(123 as any)).toThrow('parseLinkResults: input must be a string');
  });
});

describe('splitMultiEntryResponse', () => {
  it('splits multi-entry response on ///', () => {
    const data = `ENTRY       C00001                      Compound
NAME        Water
///
ENTRY       C00002                      Compound
NAME        ATP
///`;
    const result = splitMultiEntryResponse(data);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('C00001');
    expect(result[1]).toContain('C00002');
  });

  it('handles single entry without terminator', () => {
    const data = `ENTRY       C00001                      Compound
NAME        Water`;
    const result = splitMultiEntryResponse(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('C00001');
  });

  it('throws if more than 10 entries', () => {
    const entries = Array.from({ length: 11 }, (_, i) => `ENTRY       C${String(i).padStart(5, '0')}                      Compound\nNAME        Test${i}`).join('\n///\n');
    expect(() => splitMultiEntryResponse(entries)).toThrow('max allowed is 10');
  });

  it('throws on non-string input', () => {
    expect(() => splitMultiEntryResponse(123 as any)).toThrow('splitMultiEntryResponse: input must be a string');
  });
});
