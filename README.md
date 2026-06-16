# kegg-mcp

[![npm version](https://img.shields.io/npm/v/kegg-mcp?color=blue&logo=npm)](https://www.npmjs.com/package/kegg-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/AriaShishegaran/kegg-mcp/ci.yml?branch=main&label=CI&logo=github)](https://github.com/AriaShishegaran/kegg-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/AriaShishegaran/kegg-mcp?color=green)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2020-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![MCP](https://img.shields.io/badge/MCP-server-8A2BE2)](https://modelcontextprotocol.io)

An [MCP](https://modelcontextprotocol.io) server that exposes the [KEGG](https://www.kegg.jp) REST API — pathways, genes, compounds, reactions, enzymes, diseases, drugs, modules, orthology, glycans, and BRITE hierarchies, with cross-database linking. **34 tools, 8 resource templates, runs over stdio.**

## Install

```bash
npm install -g kegg-mcp
```

…or run it once with no install:

```bash
npx -y kegg-mcp
```

> Requires Node.js ≥ 20.

## Connect your MCP client

Add a `kegg` server to your client config (Claude Desktop, Cursor, VS Code, Cline, …):

```json
{
  "mcpServers": {
    "kegg": {
      "command": "npx",
      "args": ["-y", "kegg-mcp"]
    }
  }
}
```

Prefer a global install? Use `"command": "kegg-mcp"` with no args.

## Highlights

- **34 tools** across every major KEGG database
- **8 resource templates** (`kegg://pathway/{id}`, `kegg://gene/{org}:{id}`, …)
- Polite rate limiting (≤ 3 req/s), retries with exponential backoff, 30 s timeouts, keep-alive
- Native `fetch` — zero runtime deps beyond the MCP SDK
- TypeScript, unit tests with real KEGG fixtures, live integration tests, CI on Node 20/22/24

## Quick examples

```
search_pathways(query="glycolysis")
get_pathway_info(pathway_id="hsa00010")
get_pathway_genes(pathway_id="hsa00010")
search_genes(query="insulin", organism_code="hsa")
get_gene_info(gene_id="hsa:3630", include_sequences=true)
search_compounds(query="glucose")
get_compound_info(compound_id="C00031")
convert_identifiers(source_db="hsa", target_db="ncbi-geneid")
batch_entry_lookup(entries=["hsa:3630", "hsa:3631"])
kegg_health_check()
```

## Tools (34)

**Info** — `get_database_info`, `list_organisms`
**Pathways** — `search_pathways`, `get_pathway_info`, `get_pathway_genes`, `get_pathway_compounds`, `get_pathway_reactions`
**Genes** — `search_genes`, `get_gene_info`, `get_gene_orthologs`
**Compounds** — `search_compounds`, `get_compound_info`, `get_compound_reactions`
**Reactions & enzymes** — `search_reactions`, `get_reaction_info`, `search_enzymes`, `get_enzyme_info`
**Disease & drugs** — `search_diseases`, `get_disease_info`, `search_drugs`, `get_drug_info`, `get_drug_interactions`
**Modules & orthology** — `search_modules`, `get_module_info`, `search_ko_entries`, `get_ko_info`
**Glycans & BRITE** — `search_glycans`, `get_glycan_info`, `search_brite`, `get_brite_info`
**Cross-db & batch** — `convert_identifiers`, `find_related_entries`, `batch_entry_lookup`
**Health** — `kegg_health_check`

## Resource templates (8)

`kegg://pathway/{pathway_id}` · `kegg://gene/{org}:{gene_id}` · `kegg://compound/{compound_id}` · `kegg://reaction/{reaction_id}` · `kegg://disease/{disease_id}` · `kegg://drug/{drug_id}` · `kegg://organism/{org_code}` · `kegg://search/{database}/{query}`

## Develop

```bash
git clone https://github.com/AriaShishegaran/kegg-mcp.git
cd kegg-mcp
npm install
npm run build              # outputs to dist/
npm test                   # unit tests
npm run test:integration   # live tests against rest.kegg.jp
```

| Script | What it does |
| --- | --- |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run test:integration` | Live tests against `rest.kegg.jp` |
| `npm start` | Run the server |

Releases are automated via [release-please](https://github.com/googleapis/release-please) from [Conventional Commits](https://www.conventionalcommits.org/). See [CONTRIBUTING.md](./CONTRIBUTING.md).

## KEGG API terms

`rest.kegg.jp` is **academic use only**. Commercial use requires a license from [Kanehisa Laboratories](https://www.kegg.jp/kegg/rest/keggapi.html).

## License

[MIT](./LICENSE) © Aria
