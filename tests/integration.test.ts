import { describe, it, expect } from 'vitest';
import { KEGGClient } from '../src/client.js';
import { parseKEGGList, parseGenomeList, parseLinkResults, parseKEGGEntry } from '../src/parsers.js';

/**
 * Live integration tests against rest.kegg.jp.
 * These are polite, sequential, and read-only.
 * Run with: npm run test:integration
 */

const client = new KEGGClient({ retries: 2, timeout: 30000 });

describe('Integration: Database Info', () => {
  it('get_database_info for kegg', async () => {
    const data = await client.info('kegg');
    expect(data).toContain('KEGG');
  });
});

describe('Integration: list_organisms', () => {
  it('list /genome returns organisms', async () => {
    const data = await client.list('genome');
    const organisms = parseGenomeList(data);
    expect(organisms.length).toBeGreaterThan(0);
    expect(organisms[0]).toHaveProperty('t_number');
    expect(organisms[0]).toHaveProperty('organism_code');
    expect(organisms[0]).toHaveProperty('organism_name');
  }, 15000);
});

describe('Integration: search_pathways', () => {
  it('find/pathway/glycolysis returns results', async () => {
    const data = await client.find('pathway', 'glycolysis');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id.includes('00010'))).toBe(true);
  });
});

describe('Integration: get_pathway_info', () => {
  it('get hsa00010 returns pathway info', async () => {
    const data = await client.getEntry('hsa00010');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('hsa00010');
  });
});

describe('Integration: get_pathway_genes', () => {
  it('link/hsa/hsa00010 returns gene links', async () => {
    const data = await client.link('hsa', 'hsa00010');
    const links = parseLinkResults(data);
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].target).toMatch(/^hsa:/);
  });
});

describe('Integration: get_pathway_compounds', () => {
  it('link/cpd/hsa00010 returns results or empty gracefully', async () => {
    const data = await client.link('cpd', 'hsa00010');
    // May be empty for some pathways; should not throw
    const links = parseLinkResults(data);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe('Integration: get_pathway_reactions', () => {
  it('link/rn/hsa00010 returns results or empty gracefully', async () => {
    const data = await client.link('rn', 'hsa00010');
    const links = parseLinkResults(data);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe('Integration: search_genes', () => {
  it('find/genes/insulin returns results', async () => {
    const data = await client.find('genes', 'insulin');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  }, 15000);
});

describe('Integration: get_gene_info', () => {
  it('get hsa:3630 returns gene info', async () => {
    const data = await client.getEntry('hsa:3630');
    const info = parseKEGGEntry(data);
    // KEGG gene entries have numeric ENTRY IDs; the organism code is in the request
    expect(info.entry).toBeDefined();
    expect(info.type).toBe('CDS');
  });
});

describe('Integration: search_compounds', () => {
  it('find/compound/glucose returns results', async () => {
    const data = await client.find('compound', 'glucose');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_compound_info', () => {
  it('get C00031 returns compound info', async () => {
    const data = await client.getEntry('C00031');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('C00031');
  });
});

describe('Integration: search_reactions', () => {
  it('find/reaction/hexokinase returns results or empty gracefully', async () => {
    const data = await client.find('reaction', 'hexokinase');
    const results = parseKEGGList(data);
    // KEGG reaction search may legitimately return empty results
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('Integration: get_reaction_info', () => {
  it('get R00001 returns reaction info', async () => {
    const data = await client.getEntry('R00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('R00001');
  });
});

describe('Integration: search_enzymes', () => {
  it('find/enzyme/1.1.1.1 returns results', async () => {
    const data = await client.find('enzyme', '1.1.1.1');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_enzyme_info', () => {
  it('get ec:1.1.1.1 returns enzyme info', async () => {
    const data = await client.getEntry('ec:1.1.1.1');
    const info = parseKEGGEntry(data);
    // KEGG enzyme entries have ENTRY format: "EC 1.1.1.1"
    expect(info.entry).toMatch(/^EC/);
  }, 15000);
});

describe('Integration: search_diseases', () => {
  it('find/disease/diabetes returns results', async () => {
    const data = await client.find('disease', 'diabetes');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_disease_info', () => {
  it('get H00001 returns disease info', async () => {
    const data = await client.getEntry('H00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('H00001');
  });
});

describe('Integration: search_drugs', () => {
  it('find/drug/aspirin returns results', async () => {
    const data = await client.find('drug', 'aspirin');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_drug_info', () => {
  it('get D00001 returns drug info', async () => {
    const data = await client.getEntry('D00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('D00001');
  });
});

describe('Integration: search_modules', () => {
  it('find/module/glycolysis returns results', async () => {
    const data = await client.find('module', 'glycolysis');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_module_info', () => {
  it('get M00001 returns module info', async () => {
    const data = await client.getEntry('M00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('M00001');
  }, 15000);
});

describe('Integration: search_ko_entries', () => {
  it('find/ko/hexokinase returns results', async () => {
    const data = await client.find('ko', 'hexokinase');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_ko_info', () => {
  it('get K00001 returns KO info', async () => {
    const data = await client.getEntry('K00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toMatch(/^K00001/);
  });
});

describe('Integration: search_glycans', () => {
  it('find/glycan/glucose returns results', async () => {
    const data = await client.find('glycan', 'glucose');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_glycan_info', () => {
  it('get G00001 returns glycan info', async () => {
    const data = await client.getEntry('G00001');
    const info = parseKEGGEntry(data);
    expect(info.entry).toBe('G00001');
  });
});

describe('Integration: search_brite', () => {
  it('find/brite/enzyme returns results', async () => {
    const data = await client.find('brite', 'enzyme');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: get_brite_info', () => {
  it('get br:br08301 returns brite info', async () => {
    const data = await client.getEntry('br:br08301');
    const info = parseKEGGEntry(data);
    // BRITE entries may not have a standard ENTRY line
    expect(info).toBeDefined();
  });
});

describe('Integration: get_compound_reactions', () => {
  it('link/rn/C00002 returns reactions', async () => {
    const data = await client.link('rn', 'C00002');
    const links = parseLinkResults(data);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe('Integration: get_gene_orthologs', () => {
  it('link/ko/hsa:3630 returns KO links', async () => {
    const data = await client.link('ko', 'hsa:3630');
    const links = parseLinkResults(data);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe('Integration: convert_identifiers', () => {
  it('conv/ncbi-geneid/hsa:10458 returns conversion', async () => {
    const data = await client.conv('ncbi-geneid', 'hsa:10458');
    const results = parseKEGGList(data);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration: find_related_entries', () => {
  it('link/pathway/hsa:10458 returns links', async () => {
    const data = await client.link('pathway', 'hsa:10458');
    const links = parseLinkResults(data);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe('Integration: batch_entry_lookup', () => {
  it('get multiple entries returns batch data', async () => {
    const data = await client.getEntries(['C00001', 'C00002']);
    expect(data).toContain('C00001');
    expect(data).toContain('C00002');
  });
});

describe('Integration: kegg_health_check', () => {
  it('info/kegg returns healthy response', async () => {
    const data = await client.info('kegg');
    expect(data).toContain('KEGG');
  });
});
