/**
 * Resource templates and handlers for the KEGG MCP server.
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { KEGGClient } from './client.js';
import { parseKEGGEntry, parseKEGGList } from './parsers.js';

export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  mimeType: string;
  description: string;
}

export function buildResourceTemplates(): ResourceTemplate[] {
  return [
    {
      uriTemplate: 'kegg://pathway/{pathway_id}',
      name: 'KEGG pathway information',
      mimeType: 'application/json',
      description: 'Complete pathway information including genes, compounds, and reactions',
    },
    {
      uriTemplate: 'kegg://gene/{org}:{gene_id}',
      name: 'KEGG gene entry',
      mimeType: 'application/json',
      description: 'Gene information including sequences, pathways, and orthology',
    },
    {
      uriTemplate: 'kegg://compound/{compound_id}',
      name: 'KEGG compound entry',
      mimeType: 'application/json',
      description: 'Chemical compound information including structure and reactions',
    },
    {
      uriTemplate: 'kegg://reaction/{reaction_id}',
      name: 'KEGG reaction entry',
      mimeType: 'application/json',
      description: 'Biochemical reaction information including equation and enzymes',
    },
    {
      uriTemplate: 'kegg://disease/{disease_id}',
      name: 'KEGG disease entry',
      mimeType: 'application/json',
      description: 'Disease information including associated genes and pathways',
    },
    {
      uriTemplate: 'kegg://drug/{drug_id}',
      name: 'KEGG drug entry',
      mimeType: 'application/json',
      description: 'Drug information including targets and interactions',
    },
    {
      uriTemplate: 'kegg://organism/{org_code}',
      name: 'KEGG organism information',
      mimeType: 'application/json',
      description: 'Organism information and statistics',
    },
    {
      uriTemplate: 'kegg://search/{database}/{query}',
      name: 'KEGG search results',
      mimeType: 'application/json',
      description: 'Search results for the specified database and query',
    },
  ];
}

export async function handleResourceRequest(
  client: KEGGClient,
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  // Pathway
  const pathwayMatch = uri.match(/^kegg:\/\/pathway\/(.+)$/);
  if (pathwayMatch) {
    const pathwayId = pathwayMatch[1];
    const data = await client.getEntry(pathwayId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Gene (kegg://gene/{org}:{gene_id})
  const geneMatch = uri.match(/^kegg:\/\/gene\/(.+)$/);
  if (geneMatch) {
    const geneId = geneMatch[1];
    const data = await client.getEntry(geneId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Compound
  const compoundMatch = uri.match(/^kegg:\/\/compound\/(.+)$/);
  if (compoundMatch) {
    const compoundId = compoundMatch[1];
    const data = await client.getEntry(compoundId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Reaction
  const reactionMatch = uri.match(/^kegg:\/\/reaction\/(.+)$/);
  if (reactionMatch) {
    const reactionId = reactionMatch[1];
    const data = await client.getEntry(reactionId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Disease
  const diseaseMatch = uri.match(/^kegg:\/\/disease\/(.+)$/);
  if (diseaseMatch) {
    const diseaseId = diseaseMatch[1];
    const data = await client.getEntry(diseaseId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Drug
  const drugMatch = uri.match(/^kegg:\/\/drug\/(.+)$/);
  if (drugMatch) {
    const drugId = drugMatch[1];
    const data = await client.getEntry(drugId);
    const info = parseKEGGEntry(data);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(info, null, 2) }],
    };
  }

  // Organism
  const organismMatch = uri.match(/^kegg:\/\/organism\/(.+)$/);
  if (organismMatch) {
    const orgCode = organismMatch[1];
    const data = await client.info(orgCode);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ organism: orgCode, info: data }, null, 2) }],
    };
  }

  // Search
  const searchMatch = uri.match(/^kegg:\/\/search\/([^\/]+)\/(.+)$/);
  if (searchMatch) {
    const database = searchMatch[1];
    const query = decodeURIComponent(searchMatch[2]);
    const data = await client.find(database, query);
    const results = parseKEGGList(data);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ search_results: results, query, database }, null, 2),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
}
