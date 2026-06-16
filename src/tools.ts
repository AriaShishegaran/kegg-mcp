/**
 * All tool definitions (JSON schemas) and handlers for the KEGG MCP server.
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import {
  ToolResult,
  SearchArgs,
  PathwayInfoArgs,
  OrganismArgs,
  PathwayArgs,
  GeneArgs,
  BatchArgs,
  BriteSearchArgs,
  ConvertArgs,
  FindRelatedArgs,
  DrugInteractionArgs,
  GeneOrthologArgs,
  CompoundReactionArgs,
  BriteInfoArgs,
  DatabaseInfoArgs,
  HealthCheckArgs,
  KEGGGetOption,
} from './types.js';
import { KEGGClient } from './client.js';
import {
  parseKEGGEntry,
  parseKEGGList,
  parseGenomeList,
  parseLinkResults,
  splitMultiEntryResponse,
} from './parsers.js';
import {
  extractOrganismPrefix,
  isNonEmptyString,
  validateEntryIds,
} from './utils.js';

export function buildToolDefinitions() {
  return [
    // Database Information & Statistics (2 tools)
    {
      name: 'get_database_info',
      description: 'Get release information and statistics for any KEGG database',
      inputSchema: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description:
              'Database name (kegg, pathway, brite, module, ko, genes, genome, compound, glycan, reaction, rclass, enzyme, network, variant, disease, drug, dgroup, or organism code)',
          },
        },
        required: ['database'],
      },
    },
    {
      name: 'list_organisms',
      description: 'Get all KEGG organisms with T numbers, organism codes, and names',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of organisms to return (default: 100)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: [],
      },
    },

    // Pathway Analysis (3 tools)
    {
      name: 'search_pathways',
      description:
        'Search pathways by keywords or pathway names. Note: KEGG find does not support organism filtering natively; results are reference pathways.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (pathway name, keywords, or description)',
          },
          organism_code: {
            type: 'string',
            description:
              'Organism code to filter results client-side (optional, e.g., hsa, mmu, eco). Note: the KEGG API does not accept organism_code in the find path; filtering is done locally.',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_pathway_info',
      description: 'Get detailed information for a specific pathway',
      inputSchema: {
        type: 'object',
        properties: {
          pathway_id: {
            type: 'string',
            description: 'Pathway ID (e.g., map00010, hsa00010, ko00010)',
          },
          format: {
            type: 'string',
            enum: ['aaseq', 'ntseq', 'mol', 'kcf', 'image', 'image2x', 'conf', 'kgml', 'json'],
            description: 'Output format (default: flat file parsed as JSON)',
          },
        },
        required: ['pathway_id'],
      },
    },
    {
      name: 'get_pathway_genes',
      description: 'Get all genes involved in a specific organism pathway',
      inputSchema: {
        type: 'object',
        properties: {
          pathway_id: {
            type: 'string',
            description: 'Pathway ID (e.g., hsa00010, mmu00010)',
          },
        },
        required: ['pathway_id'],
      },
    },

    // Gene Analysis (2 tools)
    {
      name: 'search_genes',
      description: 'Search genes by name, symbol, or keywords',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (gene name, symbol, or keywords)',
          },
          organism_code: {
            type: 'string',
            description: 'Organism code to filter results (optional, e.g., hsa, mmu)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_gene_info',
      description: 'Get detailed information for a specific gene',
      inputSchema: {
        type: 'object',
        properties: {
          gene_id: {
            type: 'string',
            description: 'Gene ID (e.g., hsa:1956, mmu:11651, eco:b0008)',
          },
          include_sequences: {
            type: 'boolean',
            description: 'Include amino acid and nucleotide sequences (default: false)',
          },
        },
        required: ['gene_id'],
      },
    },

    // Compound Analysis (2 tools)
    {
      name: 'search_compounds',
      description: 'Search compounds by name, formula, or chemical structure',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (compound name, formula, or identifier)',
          },
          search_type: {
            type: 'string',
            enum: ['name', 'formula', 'exact_mass', 'mol_weight'],
            description: 'Type of search (default: name)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_compound_info',
      description: 'Get detailed information for a specific compound',
      inputSchema: {
        type: 'object',
        properties: {
          compound_id: {
            type: 'string',
            description: 'Compound ID (e.g., C00002, C00031, cpd:C00002)',
          },
        },
        required: ['compound_id'],
      },
    },

    // Reaction & Enzyme Analysis (4 tools)
    {
      name: 'search_reactions',
      description: 'Search biochemical reactions by keywords or reaction components',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (reaction name, enzyme, or compound)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_reaction_info',
      description: 'Get detailed information for a specific reaction',
      inputSchema: {
        type: 'object',
        properties: {
          reaction_id: {
            type: 'string',
            description: 'Reaction ID (e.g., R00001, R00002)',
          },
        },
        required: ['reaction_id'],
      },
    },
    {
      name: 'search_enzymes',
      description: 'Search enzymes by EC number or enzyme name',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (EC number or enzyme name)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_enzyme_info',
      description: 'Get detailed enzyme information by EC number',
      inputSchema: {
        type: 'object',
        properties: {
          ec_number: {
            type: 'string',
            description: 'EC number (e.g., ec:1.1.1.1)',
          },
        },
        required: ['ec_number'],
      },
    },

    // Disease & Drug Analysis (5 tools)
    {
      name: 'search_diseases',
      description: 'Search human diseases by name or keywords',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (disease name or keywords)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_disease_info',
      description: 'Get detailed information for a specific disease',
      inputSchema: {
        type: 'object',
        properties: {
          disease_id: {
            type: 'string',
            description: 'Disease ID (e.g., H00001, H00002)',
          },
        },
        required: ['disease_id'],
      },
    },
    {
      name: 'search_drugs',
      description: 'Search drugs by name, target, or indication',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (drug name, target, or indication)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_drug_info',
      description: 'Get detailed information for a specific drug',
      inputSchema: {
        type: 'object',
        properties: {
          drug_id: {
            type: 'string',
            description: 'Drug ID (e.g., D00001, D00002)',
          },
        },
        required: ['drug_id'],
      },
    },
    {
      name: 'get_drug_interactions',
      description: 'Find adverse drug-drug interactions',
      inputSchema: {
        type: 'object',
        properties: {
          drug_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Drug IDs to check for interactions (1-10)',
            minItems: 1,
            maxItems: 10,
          },
        },
        required: ['drug_ids'],
      },
    },

    // Module & Orthology Analysis (4 tools)
    {
      name: 'search_modules',
      description: 'Search KEGG modules by name or function',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (module name or function)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_module_info',
      description: 'Get detailed information for a specific module',
      inputSchema: {
        type: 'object',
        properties: {
          module_id: {
            type: 'string',
            description: 'Module ID (e.g., M00001, M00002)',
          },
        },
        required: ['module_id'],
      },
    },
    {
      name: 'search_ko_entries',
      description: 'Search KEGG Orthology entries by function or gene name',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (function or gene name)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_ko_info',
      description: 'Get detailed information for a specific KO entry',
      inputSchema: {
        type: 'object',
        properties: {
          ko_id: {
            type: 'string',
            description: 'KO ID (e.g., K00001, K00002)',
          },
        },
        required: ['ko_id'],
      },
    },

    // Glycan Analysis (2 tools)
    {
      name: 'search_glycans',
      description: 'Search glycan structures by name or composition',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (glycan name or composition)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_glycan_info',
      description: 'Get detailed information for a specific glycan',
      inputSchema: {
        type: 'object',
        properties: {
          glycan_id: {
            type: 'string',
            description: 'Glycan ID (e.g., G00001, G00002)',
          },
        },
        required: ['glycan_id'],
      },
    },

    // BRITE Hierarchy Analysis (2 tools)
    {
      name: 'search_brite',
      description: 'Search BRITE functional hierarchies',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (function or category)',
          },
          hierarchy_type: {
            type: 'string',
            enum: ['br', 'ko', 'jp'],
            description: 'Type of BRITE hierarchy (default: br)',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results (1-1000, default: 50)',
            minimum: 1,
            maximum: 1000,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_brite_info',
      description: 'Get detailed information for a specific BRITE entry',
      inputSchema: {
        type: 'object',
        properties: {
          brite_id: {
            type: 'string',
            description: 'BRITE ID (e.g., br:br08301, ko:K00001)',
          },
          format: {
            type: 'string',
            enum: ['aaseq', 'ntseq', 'mol', 'kcf', 'image', 'image2x', 'conf', 'kgml', 'json'],
            description: 'Output format (default: flat file parsed as JSON)',
          },
        },
        required: ['brite_id'],
      },
    },

    // Advanced Analysis Tools (5 tools)
    {
      name: 'get_pathway_compounds',
      description: 'Get all compounds involved in a specific pathway',
      inputSchema: {
        type: 'object',
        properties: {
          pathway_id: {
            type: 'string',
            description: 'Pathway ID (e.g., map00010, hsa00010)',
          },
        },
        required: ['pathway_id'],
      },
    },
    {
      name: 'get_pathway_reactions',
      description: 'Get all reactions involved in a specific pathway',
      inputSchema: {
        type: 'object',
        properties: {
          pathway_id: {
            type: 'string',
            description: 'Pathway ID (e.g., map00010, rn00010)',
          },
        },
        required: ['pathway_id'],
      },
    },
    {
      name: 'get_compound_reactions',
      description: 'Get all reactions involving a specific compound',
      inputSchema: {
        type: 'object',
        properties: {
          compound_id: {
            type: 'string',
            description: 'Compound ID (e.g., C00002, C00031)',
          },
        },
        required: ['compound_id'],
      },
    },
    {
      name: 'get_gene_orthologs',
      description: 'Find orthologous genes across organisms',
      inputSchema: {
        type: 'object',
        properties: {
          gene_id: {
            type: 'string',
            description: 'Gene ID (e.g., hsa:1956)',
          },
          target_organisms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Target organism codes (optional, e.g., [mmu, rno, dme])',
          },
        },
        required: ['gene_id'],
      },
    },
    {
      name: 'batch_entry_lookup',
      description: 'Process multiple KEGG entries efficiently (max 10)',
      inputSchema: {
        type: 'object',
        properties: {
          entry_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'KEGG entry IDs (1-10)',
            minItems: 1,
            maxItems: 10,
          },
          operation: {
            type: 'string',
            enum: ['info', 'sequence', 'pathway', 'link'],
            description: 'Operation to perform (default: info)',
          },
        },
        required: ['entry_ids'],
      },
    },

    // Cross-References & Integration (2 tools)
    {
      name: 'convert_identifiers',
      description: 'Convert between KEGG and external database identifiers',
      inputSchema: {
        type: 'object',
        properties: {
          source_db: {
            type: 'string',
            description: 'Source database (e.g., hsa, ncbi-geneid, uniprot)',
          },
          target_db: {
            type: 'string',
            description: 'Target database (e.g., hsa, ncbi-geneid, uniprot)',
          },
          identifiers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Identifiers to convert (optional, for batch conversion)',
          },
        },
        required: ['source_db', 'target_db'],
      },
    },
    {
      name: 'find_related_entries',
      description: 'Find related entries across KEGG databases using cross-references',
      inputSchema: {
        type: 'object',
        properties: {
          source_db: {
            type: 'string',
            description: 'Source database (e.g., pathway, compound, gene)',
          },
          target_db: {
            type: 'string',
            description: 'Target database (e.g., pathway, compound, gene)',
          },
          source_entries: {
            type: 'array',
            items: { type: 'string' },
            description: 'Source entries to find links for (optional)',
          },
        },
        required: ['source_db', 'target_db'],
      },
    },

    // Health Check (1 tool)
    {
      name: 'kegg_health_check',
      description: 'Check connectivity and latency to the KEGG REST API',
      inputSchema: {
        type: 'object',
        properties: {
          check_type: {
            type: 'string',
            enum: ['connectivity', 'latency', 'full'],
            description: 'Type of health check (default: full)',
          },
        },
        required: [],
      },
    },
  ];
}

export function buildToolHandlers(client: KEGGClient) {
  return async function handleTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (name) {
      case 'get_database_info':
        return handleGetDatabaseInfo(client, args as unknown as DatabaseInfoArgs);
      case 'list_organisms':
        return handleListOrganisms(client, args as unknown as OrganismArgs);
      case 'search_pathways':
        return handleSearchPathways(client, args as unknown as SearchArgs);
      case 'get_pathway_info':
        return handleGetPathwayInfo(client, args as unknown as PathwayInfoArgs);
      case 'get_pathway_genes':
        return handleGetPathwayGenes(client, args as unknown as PathwayArgs);
      case 'search_genes':
        return handleSearchGenes(client, args as unknown as SearchArgs);
      case 'get_gene_info':
        return handleGetGeneInfo(client, args as unknown as GeneArgs);
      case 'search_compounds':
        return handleSearchCompounds(client, args as unknown as SearchArgs);
      case 'get_compound_info':
        return handleGetCompoundInfo(client, args as unknown as { compound_id: string });
      case 'search_reactions':
        return handleSearchReactions(client, args as unknown as SearchArgs);
      case 'get_reaction_info':
        return handleGetReactionInfo(client, args as unknown as { reaction_id: string });
      case 'search_enzymes':
        return handleSearchEnzymes(client, args as unknown as SearchArgs);
      case 'get_enzyme_info':
        return handleGetEnzymeInfo(client, args as unknown as { ec_number: string });
      case 'search_diseases':
        return handleSearchDiseases(client, args as unknown as SearchArgs);
      case 'get_disease_info':
        return handleGetDiseaseInfo(client, args as unknown as { disease_id: string });
      case 'search_drugs':
        return handleSearchDrugs(client, args as unknown as SearchArgs);
      case 'get_drug_info':
        return handleGetDrugInfo(client, args as unknown as { drug_id: string });
      case 'get_drug_interactions':
        return handleGetDrugInteractions(client, args as unknown as DrugInteractionArgs);
      case 'search_modules':
        return handleSearchModules(client, args as unknown as SearchArgs);
      case 'get_module_info':
        return handleGetModuleInfo(client, args as unknown as { module_id: string });
      case 'search_ko_entries':
        return handleSearchKoEntries(client, args as unknown as SearchArgs);
      case 'get_ko_info':
        return handleGetKoInfo(client, args as unknown as { ko_id: string });
      case 'search_glycans':
        return handleSearchGlycans(client, args as unknown as SearchArgs);
      case 'get_glycan_info':
        return handleGetGlycanInfo(client, args as unknown as { glycan_id: string });
      case 'search_brite':
        return handleSearchBrite(client, args as unknown as BriteSearchArgs);
      case 'get_brite_info':
        return handleGetBriteInfo(client, args as unknown as BriteInfoArgs);
      case 'get_pathway_compounds':
        return handleGetPathwayCompounds(client, args as unknown as PathwayArgs);
      case 'get_pathway_reactions':
        return handleGetPathwayReactions(client, args as unknown as PathwayArgs);
      case 'get_compound_reactions':
        return handleGetCompoundReactions(client, args as unknown as CompoundReactionArgs);
      case 'get_gene_orthologs':
        return handleGetGeneOrthologs(client, args as unknown as GeneOrthologArgs);
      case 'batch_entry_lookup':
        return handleBatchEntryLookup(client, args as unknown as BatchArgs);
      case 'convert_identifiers':
        return handleConvertIdentifiers(client, args as unknown as ConvertArgs);
      case 'find_related_entries':
        return handleFindRelatedEntries(client, args as unknown as FindRelatedArgs);
      case 'kegg_health_check':
        return handleHealthCheck(client, args as unknown as HealthCheckArgs);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  };
}

async function handleGetDatabaseInfo(client: KEGGClient, args: DatabaseInfoArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.database)) {
    throw new McpError(ErrorCode.InvalidParams, 'Database parameter is required');
  }
  const data = await client.info(args.database);
  return {
    content: [{ type: 'text', text: JSON.stringify({ database: args.database, info: data }, null, 2) }],
  };
}

async function handleListOrganisms(client: KEGGClient, args: OrganismArgs): Promise<ToolResult> {
  const data = await client.list('genome');
  const organisms = parseGenomeList(data);
  const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 100;
  const limited = organisms.slice(0, limit);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            total_organisms: organisms.length,
            returned_count: limited.length,
            organisms: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleSearchPathways(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('pathway', args.query);
  let results = parseKEGGList(data);

  // Client-side organism filtering if requested
  if (isNonEmptyString(args.organism_code)) {
    const orgPrefix = args.organism_code.toLowerCase();
    results = results.filter((r) => {
      const id = r.id.toLowerCase();
      // Reference pathways start with 'map'; organism-specific start with org code
      return id.startsWith(orgPrefix) || id.startsWith('map');
    });
  }

  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            organism_code: args.organism_code || null,
            total_found: results.length,
            returned_count: limited.length,
            pathways: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetPathwayInfo(client: KEGGClient, args: PathwayInfoArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.pathway_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'pathway_id is required');
  }
  const format = args.format;
  const validOptions: KEGGGetOption[] = ['aaseq', 'ntseq', 'mol', 'kcf', 'image', 'image2x', 'conf', 'kgml', 'json'];
  const option = validOptions.includes(format as KEGGGetOption) ? format : undefined;

  const data = await client.getEntry(args.pathway_id, option);

  if (option && option !== 'json') {
    return { content: [{ type: 'text', text: data }] };
  }

  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleGetPathwayGenes(client: KEGGClient, args: PathwayArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.pathway_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'pathway_id is required');
  }
  const org = extractOrganismPrefix(args.pathway_id);
  if (!org) {
    throw new McpError(ErrorCode.InvalidParams, 'Could not extract organism code from pathway_id');
  }
  const data = await client.link(org, args.pathway_id);
  const links = parseLinkResults(data);
  const genes: Record<string, string> = {};
  for (const link of links) {
    const target = link.target;
    const parts = target.split(':');
    if (parts.length === 2) {
      genes[target] = parts[1];
    } else {
      genes[target] = target;
    }
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { pathway_id: args.pathway_id, gene_count: Object.keys(genes).length, genes },
          null,
          2
        ),
      },
    ],
  };
}

async function handleSearchGenes(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const database = isNonEmptyString(args.organism_code) ? args.organism_code : 'genes';
  const data = await client.find(database, args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            database,
            total_found: results.length,
            returned_count: limited.length,
            genes: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetGeneInfo(client: KEGGClient, args: GeneArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.gene_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'gene_id is required');
  }
  const data = await client.getEntry(args.gene_id);
  const info = parseKEGGEntry(data);

  if (args.include_sequences) {
    try {
      const aaseq = await client.getEntry(args.gene_id, 'aaseq').catch((err) => {
        console.error(`Failed to fetch aaseq for ${args.gene_id}:`, err);
        return null;
      });
      const ntseq = await client.getEntry(args.gene_id, 'ntseq').catch((err) => {
        console.error(`Failed to fetch ntseq for ${args.gene_id}:`, err);
        return null;
      });
      if (aaseq) info.aaseq = aaseq;
      if (ntseq) info.ntseq = ntseq;
    } catch (err) {
      console.error(`Failed to fetch sequences for ${args.gene_id}:`, err);
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchCompounds(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const searchType = args.search_type || 'name';
  let data: string;
  if (searchType === 'formula') {
    data = await client.find('compound', args.query, 'formula');
  } else if (searchType === 'exact_mass') {
    data = await client.find('compound', args.query, 'exact_mass');
  } else if (searchType === 'mol_weight') {
    data = await client.find('compound', args.query, 'mol_weight');
  } else {
    data = await client.find('compound', args.query);
  }
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            search_type: searchType,
            total_found: results.length,
            returned_count: limited.length,
            compounds: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetCompoundInfo(client: KEGGClient, args: { compound_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.compound_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'compound_id is required');
  }
  const data = await client.getEntry(args.compound_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchReactions(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('reaction', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            reactions: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetReactionInfo(client: KEGGClient, args: { reaction_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.reaction_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'reaction_id is required');
  }
  const data = await client.getEntry(args.reaction_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchEnzymes(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('enzyme', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            enzymes: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetEnzymeInfo(client: KEGGClient, args: { ec_number: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.ec_number)) {
    throw new McpError(ErrorCode.InvalidParams, 'ec_number is required');
  }
  const data = await client.getEntry(args.ec_number);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchDiseases(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('disease', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            diseases: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetDiseaseInfo(client: KEGGClient, args: { disease_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.disease_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'disease_id is required');
  }
  const data = await client.getEntry(args.disease_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchDrugs(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('drug', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            drugs: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetDrugInfo(client: KEGGClient, args: { drug_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.drug_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'drug_id is required');
  }
  const data = await client.getEntry(args.drug_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleGetDrugInteractions(client: KEGGClient, args: DrugInteractionArgs): Promise<ToolResult> {
  if (!Array.isArray(args.drug_ids) || args.drug_ids.length === 0) {
    throw new McpError(ErrorCode.InvalidParams, 'drug_ids array is required');
  }
  if (args.drug_ids.length > 10) {
    throw new McpError(ErrorCode.InvalidParams, 'Maximum 10 drug IDs allowed');
  }
  const data = await client.ddi(args.drug_ids);
  const results = parseKEGGList(data);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            drug_ids: args.drug_ids,
            interaction_count: results.length,
            interactions: results,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleSearchModules(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('module', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            modules: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetModuleInfo(client: KEGGClient, args: { module_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.module_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'module_id is required');
  }
  const data = await client.getEntry(args.module_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchKoEntries(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('ko', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            ko_entries: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetKoInfo(client: KEGGClient, args: { ko_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.ko_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'ko_id is required');
  }
  const data = await client.getEntry(args.ko_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchGlycans(client: KEGGClient, args: SearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('glycan', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            total_found: results.length,
            returned_count: limited.length,
            glycans: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetGlycanInfo(client: KEGGClient, args: { glycan_id: string }): Promise<ToolResult> {
  if (!isNonEmptyString(args.glycan_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'glycan_id is required');
  }
  const data = await client.getEntry(args.glycan_id);
  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleSearchBrite(client: KEGGClient, args: BriteSearchArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.query)) {
    throw new McpError(ErrorCode.InvalidParams, 'query is required');
  }
  const data = await client.find('brite', args.query);
  const results = parseKEGGList(data);
  const maxResults = typeof args.max_results === 'number' && args.max_results > 0 ? args.max_results : 50;
  const limited = results.slice(0, maxResults);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            hierarchy_type: args.hierarchy_type || 'br',
            total_found: results.length,
            returned_count: limited.length,
            brite_entries: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetBriteInfo(client: KEGGClient, args: BriteInfoArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.brite_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'brite_id is required');
  }
  const validOptions: KEGGGetOption[] = ['aaseq', 'ntseq', 'mol', 'kcf', 'image', 'image2x', 'conf', 'kgml', 'json'];
  const option = validOptions.includes(args.format as KEGGGetOption) ? args.format : undefined;

  const data = await client.getEntry(args.brite_id, option);

  if (option && option !== 'json') {
    return { content: [{ type: 'text', text: data }] };
  }

  const info = parseKEGGEntry(data);
  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}

async function handleGetPathwayCompounds(client: KEGGClient, args: PathwayArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.pathway_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'pathway_id is required');
  }
  const data = await client.link('cpd', args.pathway_id);
  const links = parseLinkResults(data);
  const compounds: Record<string, string> = {};
  for (const link of links) {
    compounds[link.source] = link.target;
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            pathway_id: args.pathway_id,
            compound_count: Object.keys(compounds).length,
            compounds,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetPathwayReactions(client: KEGGClient, args: PathwayArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.pathway_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'pathway_id is required');
  }
  const data = await client.link('rn', args.pathway_id);
  const links = parseLinkResults(data);
  const reactions: Record<string, string> = {};
  for (const link of links) {
    reactions[link.source] = link.target;
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            pathway_id: args.pathway_id,
            reaction_count: Object.keys(reactions).length,
            reactions,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetCompoundReactions(client: KEGGClient, args: CompoundReactionArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.compound_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'compound_id is required');
  }
  const data = await client.link('rn', args.compound_id);
  const links = parseLinkResults(data);
  const reactions: Record<string, string> = {};
  for (const link of links) {
    reactions[link.source] = link.target;
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            compound_id: args.compound_id,
            reaction_count: Object.keys(reactions).length,
            reactions,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetGeneOrthologs(client: KEGGClient, args: GeneOrthologArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.gene_id)) {
    throw new McpError(ErrorCode.InvalidParams, 'gene_id is required');
  }
  const data = await client.link('ko', args.gene_id);
  const koLinks = parseLinkResults(data);
  const koIds = koLinks.map((l) => l.target);

  let orthologs: Record<string, string> = {};

  if (Array.isArray(args.target_organisms) && args.target_organisms.length > 0) {
    for (const koId of koIds) {
      for (const org of args.target_organisms) {
        try {
          const orgData = await client.link(org, koId);
          const orgLinks = parseLinkResults(orgData);
          for (const link of orgLinks) {
            orthologs[link.target] = link.source;
          }
        } catch (err) {
          console.error(`Organism ${org} may not have KO ${koId}:`, err);
        }
      }
    }
  } else {
    for (const link of koLinks) {
      orthologs[link.target] = link.source;
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            gene_id: args.gene_id,
            target_organisms: args.target_organisms || null,
            ortholog_count: Object.keys(orthologs).length,
            orthologs,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleBatchEntryLookup(client: KEGGClient, args: BatchArgs): Promise<ToolResult> {
  const entryIds = validateEntryIds(args.entry_ids, 10);
  const operation = args.operation || 'info';

  if (operation === 'info') {
    const data = await client.getEntries(entryIds);
    const entries = splitMultiEntryResponse(data);
    const results = entries.map((entry, idx) => {
      try {
        const info = parseKEGGEntry(entry);
        return { entry_id: entryIds[idx], data: info, success: true };
      } catch (error) {
        return {
          entry_id: entryIds[idx],
          error: error instanceof Error ? error.message : 'Parse error',
          success: false,
        };
      }
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              operation,
              total_entries: entryIds.length,
              successful: results.filter((r) => r.success).length,
              failed: results.filter((r) => !r.success).length,
              results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // For other operations, process sequentially
  const results: Array<{ entry_id: string; data: unknown; success: boolean } | { entry_id: string; error: string; success: false }> = [];
  for (const entryId of entryIds) {
    try {
      let data: string;
      if (operation === 'sequence') {
        data = await client.getEntry(entryId, 'aaseq');
      } else if (operation === 'pathway') {
        data = await client.link('pathway', entryId);
      } else if (operation === 'link') {
        data = await client.link('ko', entryId);
      } else {
        data = await client.getEntry(entryId);
      }

      if (operation === 'sequence') {
        results.push({ entry_id: entryId, data, success: true });
      } else if (operation === 'pathway' || operation === 'link') {
        const links = parseLinkResults(data);
        results.push({ entry_id: entryId, data: links, success: true });
      } else {
        const info = parseKEGGEntry(data);
        results.push({ entry_id: entryId, data: info, success: true });
      }
    } catch (error) {
      results.push({
        entry_id: entryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            operation,
            total_entries: entryIds.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleConvertIdentifiers(client: KEGGClient, args: ConvertArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.source_db) || !isNonEmptyString(args.target_db)) {
    throw new McpError(ErrorCode.InvalidParams, 'source_db and target_db are required');
  }
  let data: string;
  if (Array.isArray(args.identifiers) && args.identifiers.length > 0) {
    const joined = args.identifiers.join('+');
    data = await client.conv(args.target_db, joined);
  } else {
    data = await client.conv(args.target_db, args.source_db);
  }
  const results = parseKEGGList(data);
  const conversions: Record<string, string> = {};
  for (const item of results) {
    conversions[item.id] = item.name;
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            source_db: args.source_db,
            target_db: args.target_db,
            conversion_count: results.length,
            conversions,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleFindRelatedEntries(client: KEGGClient, args: FindRelatedArgs): Promise<ToolResult> {
  if (!isNonEmptyString(args.source_db) || !isNonEmptyString(args.target_db)) {
    throw new McpError(ErrorCode.InvalidParams, 'source_db and target_db are required');
  }
  let data: string;
  if (Array.isArray(args.source_entries) && args.source_entries.length > 0) {
    const joined = args.source_entries.join('+');
    data = await client.link(args.target_db, joined);
  } else {
    data = await client.link(args.target_db, args.source_db);
  }
  const results = parseLinkResults(data);
  const links: Record<string, string> = {};
  for (const item of results) {
    links[item.source] = item.target;
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            source_db: args.source_db,
            target_db: args.target_db,
            link_count: results.length,
            links,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleHealthCheck(client: KEGGClient, args: HealthCheckArgs): Promise<ToolResult> {
  const checkType = args.check_type || 'full';
  const start = Date.now();
  try {
    const data = await client.info('kegg');
    const latency = Date.now() - start;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'healthy',
              check_type: checkType,
              latency_ms: latency,
              kegg_info: checkType === 'full' ? data : undefined,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'unhealthy',
              check_type: checkType,
              latency_ms: latency,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
