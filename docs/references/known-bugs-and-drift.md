# Known Bugs and API Drift

> This document catalogs every broken or incorrect tool in the current KEGG MCP Server codebase, the root cause, and the correct live API call.

---

## Summary Table

| # | Tool | Current (Broken) Call | Correct Live API Call | Root Cause | Impact |
|---|------|------------------------|----------------------|------------|--------|
| 1 | `list_organisms` | `GET /list/organism` | `GET /list/genome` | Wrong endpoint; also parser expects 2 columns but API returns 3 | **High** — returns 400, no organisms listed |
| 2 | `search_pathways` (with `organism_code`) | `GET /find/pathway/{org}/{query}` | `GET /find/pathway/{query}` (no org in path) | `find` does not accept `pathway/<org>` as a database | **High** — returns 400 for all organism-specific searches |
| 3 | `get_pathway_genes` | `GET /link/genes/{pathway_id}` | `GET /link/{org}/{pathway_id}` (e.g., `/link/hsa/hsa00010`) | Target database must be organism code, not `genes` | **High** — returns 400 |
| 4 | `get_pathway_compounds` | `GET /link/compound/{pathway_id}` | `GET /link/cpd/{pathway_id}` | Must use abbreviation `cpd`, not full name `compound` | **High** — returns 400 |
| 5 | `get_pathway_reactions` | `GET /link/reaction/{pathway_id}` | `GET /link/rn/{pathway_id}` | Must use abbreviation `rn`, not full name `reaction` | **High** — returns 400 |
| 6 | `get_pathway_compounds` / `get_pathway_reactions` | See #4, #5 | Same as above | Even with correct endpoints, many pathways return empty link results (single newline) | **Medium** — 200 OK but no data; may need alternative data source |

---

## Detailed Bug Reports

### 1. `list_organisms`

**Current implementation (line ~1008):**
```typescript
const response = await this.apiClient.get('/list/organism');
```

**Live API behavior:**
- `GET https://rest.kegg.jp/list/organism` → **400 Bad Request** (empty body)
- `GET https://rest.kegg.jp/list/genome` → **200 OK** with tab-delimited data:
  ```
  T01001	hsa	Homo sapiens
  T01002	mmu	Mus musculus
  ...
  ```

**Parser issue:** The current `parseKEGGList` method (line ~263–277) splits on the first tab only, producing:
- `id` = `T01001`
- `name` = `hsa	Homo sapiens` (incorrect — should be `hsa` and `Homo sapiens` separately)

**Fix required:**
1. Change endpoint from `/list/organism` to `/list/genome`
2. Update parser to handle three columns: `T number`, `organism_code`, `organism_name`

---

### 2. `search_pathways` with `organism_code`

**Current implementation (line ~1042):**
```typescript
const database = args.organism_code ? `pathway/${args.organism_code}` : 'pathway';
const response = await this.apiClient.get(`/find/${database}/${encodeURIComponent(args.query)}`);
```

**Live API behavior:**
- `GET https://rest.kegg.jp/find/pathway/hsa/glycolysis` → **400 Bad Request**
- `GET https://rest.kegg.jp/find/pathway/glycolysis` → **200 OK**:
  ```
  map00010	Glycolysis / Gluconeogenesis
  map00020	Citrate cycle (TCA cycle)
  ...
  ```

**Root cause:** The KEGG `find` operation only accepts a database name as the first path segment. `pathway/hsa` is not a valid database name. The `find` API has no native organism filter.

**Fix required:**
1. Always call `/find/pathway/{query}` (without organism code in the path)
2. If organism-specific results are needed, either:
   - Filter the returned `mapXXXXX` IDs client-side by looking up the organism-specific equivalent (e.g., `hsa00010`), OR
   - Use `/list/pathway/{org}` to list all organism pathways and match by name client-side

---

### 3. `get_pathway_genes`

**Current implementation (line ~1122):**
```typescript
const response = await this.apiClient.get(`/link/genes/${args.pathway_id}`);
```

**Live API behavior:**
- `GET https://rest.kegg.jp/link/genes/hsa00010` → **400 Bad Request**
- `GET https://rest.kegg.jp/link/hsa/hsa00010` → **200 OK**:
  ```
  path:hsa00010	hsa:10327
  path:hsa00010	hsa:2645
  ...
  ```

**Root cause:** The KEGG `link` operation requires `target_db/source_db` or `target_db/dbentries`. The target database for genes in a pathway is the organism code (`hsa`), not the literal string `genes`.

**Fix required:**
1. Extract the organism prefix from the pathway ID (e.g., `hsa` from `hsa00010`)
2. Call `/link/{org}/{pathway_id}` instead of `/link/genes/{pathway_id}`

---

### 4. `get_pathway_compounds`

**Current implementation (line ~1918):**
```typescript
const response = await this.apiClient.get(`/link/compound/${args.pathway_id}`);
```

**Live API behavior:**
- `GET https://rest.kegg.jp/link/compound/hsa00010` → **400 Bad Request**
- `GET https://rest.kegg.jp/link/cpd/hsa00010` → **200 OK** (but body may be empty for some pathways)

**Root cause:** The `link` operation uses abbreviated database names. `cpd` is the correct abbreviation for `compound`.

**Fix required:**
1. Change endpoint from `/link/compound/{pathway_id}` to `/link/cpd/{pathway_id}`
2. Note: Even with the correct endpoint, many pathways return only a single newline (empty result). The tool should handle empty responses gracefully.

---

### 5. `get_pathway_reactions`

**Current implementation (line ~1947):**
```typescript
const response = await this.apiClient.get(`/link/reaction/${args.pathway_id}`);
```

**Live API behavior:**
- `GET https://rest.kegg.jp/link/reaction/hsa00010` → **400 Bad Request**
- `GET https://rest.kegg.jp/link/rn/hsa00010` → **200 OK** (but body may be empty for some pathways)

**Root cause:** Same as #4. The `link` operation uses `rn` (reaction) as the abbreviation, not `reaction`.

**Fix required:**
1. Change endpoint from `/link/reaction/{pathway_id}` to `/link/rn/{pathway_id}`
2. Handle empty responses gracefully.

---

### 6. Empty Link Results for Compounds and Reactions

**Observation:** Even with the correct endpoints (`/link/cpd/hsa00010` and `/link/rn/hsa00010`), the live API returns a 200 OK response with a body containing only a single newline byte (`0x0a`). This means no compound or reaction links are returned for this pathway.

**Implication:** The endpoint pattern is structurally valid, but it may not be the right way to get pathway compounds/reactions. The actual compounds and reactions in a pathway may need to be extracted from the pathway flat file (via `GET /get/{pathway_id}`) or KGML (via `GET /get/{pathway_id}/kgml`) instead of relying on the `link` operation.

**Fix required:**
- Consider adding a fallback: if `link` returns empty, parse the pathway entry directly.

---

## Verification Evidence

All findings above were verified with live `curl` calls against `https://rest.kegg.jp/` on 2026-06-16. Example commands:

```bash
# Verify /list/genome works
curl -s "https://rest.kegg.jp/list/genome" | head -n 3

# Verify /find/pathway/glycolysis works
curl -s "https://rest.kegg.jp/find/pathway/glycolysis" | head -n 3

# Verify /link/hsa/hsa00010 works
curl -s "https://rest.kegg.jp/link/hsa/hsa00010" | head -n 3

# Verify /link/cpd/hsa00010 works (may be empty)
curl -s "https://rest.kegg.jp/link/cpd/hsa00010" | wc -c

# Verify /link/rn/hsa00010 works (may be empty)
curl -s "https://rest.kegg.jp/link/rn/hsa00010" | wc -c
```

---

## Affected Files

- `/src/index.ts` (or main server file) — contains all tool handlers and API client calls
- Any parser utility files that implement `parseKEGGList`

---

## Priority Ranking

| Priority | Bug | Reason |
|----------|-----|--------|
| P0 | `list_organisms` | Completely broken (400); core functionality |
| P0 | `search_pathways` with `organism_code` | Completely broken (400); commonly used |
| P0 | `get_pathway_genes` | Completely broken (400); core functionality |
| P0 | `get_pathway_compounds` | Completely broken (400); fix is trivial |
| P0 | `get_pathway_reactions` | Completely broken (400); fix is trivial |
| P1 | Empty link results | Returns 200 but no data; needs fallback strategy |
