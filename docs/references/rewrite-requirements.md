# Rewrite Requirements

> Non-negotiable requirements for rewriting the KEGG MCP Server.

---

## 1. SDK & Runtime

| Requirement | Detail |
|-------------|--------|
| **Latest SDK** | Must use the latest stable `@modelcontextprotocol/sdk` (or equivalent official MCP SDK) |
| **TypeScript** | Written in TypeScript with strict mode enabled (`strict: true` in `tsconfig.json`) |
| **Node.js** | Target Node.js LTS (currently v20+); specify `engines` in `package.json` |
| **Build** | Produce a clean `dist/` output; no source files in production package |

---

## 2. API Client & Endpoint Correctness

| Requirement | Detail |
|-------------|--------|
| **Base URL** | `https://rest.kegg.jp/` (HTTPS only) |
| **Correct endpoints** | Every tool must call the exact endpoint documented in `kegg-rest-api-reference.md` |
| **Endpoint fixes** | `/list/organism` → `/list/genome`; `/find/pathway/{org}/{query}` → `/find/pathway/{query}`; `/link/genes/{id}` → `/link/{org}/{id}`; `/link/compound/{id}` → `/link/cpd/{id}`; `/link/reaction/{id}` → `/link/rn/{id}` |
| **HTTP client** | Use a robust HTTP client (e.g., `axios` or native `fetch`) with configurable timeout and retry logic |
| **Error handling** | Map KEGG HTTP status codes (400, 404) to clear MCP error messages; never return raw HTML errors |
| **Rate limiting** | Respect KEGG academic-use policy; implement polite delays between batch requests |

---

## 3. Parser Fixes

| Requirement | Detail |
|-------------|--------|
| **Three-column list parser** | `parseKEGGList` must handle the three-column output of `/list/genome` (`T number`, `organism_code`, `organism_name`) |
| **Flat file parser** | `parseKEGGEntry` must correctly parse KEGG flat-file format (ENTRY, NAME, DESCRIPTION, CLASS, PATHWAY_MAP, etc.) |
| **Tab-delimited parser** | All tab-delimited responses must be split on `\t` and handle missing/empty columns gracefully |
| **Empty response handling** | Tools calling `link` operations must handle empty responses (single newline) without crashing |
| **No silent failures** | Every parser must throw or return an explicit error on malformed input, never return partial/wrong data silently |

---

## 4. Tool Definitions & Schemas

| Requirement | Detail |
|-------------|--------|
| **Accurate schemas** | Every tool's `inputSchema` (Zod or JSON Schema) must reflect the actual parameters the live API accepts |
| **No invalid parameters** | Remove `organism_code` from `search_pathways` input schema if the API cannot filter by organism natively |
| **Descriptive metadata** | `name` and `description` of each tool must match the KEGG operation it wraps |
| **Batch limits** | Enforce max 10 entries client-side for `list` and `get` operations before sending the request |

---

## 5. Testing

| Requirement | Detail |
|-------------|--------|
| **Unit tests** | Every parser function must have unit tests with real KEGG response fixtures |
| **Live integration tests** | A test suite must exercise every tool against the live KEGG API (read-only, polite rate limiting) |
| **Mock tests** | HTTP client must be mockable so tests can run offline with recorded responses |
| **CI** | GitHub Actions (or equivalent) must run tests on every PR |
| **Coverage** | Aim for >80% coverage on parsers and API client logic |

---

## 6. Documentation

| Requirement | Detail |
|-------------|--------|
| **README** | Must include: installation, configuration, available tools list, example usage, and KEGG API policy notice |
| **API reference** | Keep `kegg-rest-api-reference.md` up to date with any KEGG changes |
| **Changelog** | Maintain a `CHANGELOG.md` following semver for every release |
| **License** | Include the project's license file (already present) |

---

## 7. Observability & Robustness

| Requirement | Detail |
|-------------|--------|
| **Logging** | Structured logging (e.g., `pino` or `winston`) with configurable log levels |
| **Request IDs** | Generate a request ID per MCP call and include it in logs for traceability |
| **Timeouts** | All HTTP requests must have a timeout (default 30s) |
| **Retries** | Implement exponential backoff for transient failures (5xx, network errors) |
| **Health check** | Expose a `health` or `ping` tool that verifies connectivity to KEGG |

---

## 8. Compatibility & Migration

| Requirement | Detail |
|-------------|--------|
| **No breaking changes** | Where possible, keep existing tool names and parameter names to avoid breaking existing MCP clients |
| **Deprecation path** | If a tool must be removed or renamed, mark it deprecated for one minor version before removal |
| **Version pinning** | Pin the MCP SDK version in `package.json` to avoid surprise breaking changes |

---

## 9. Security

| Requirement | Detail |
|-------------|--------|
| **No secrets in code** | No hardcoded API keys or credentials (KEGG REST API is unauthenticated, but future features may require keys) |
| **Input validation** | Strictly validate all user inputs against schemas before sending to KEGG |
| **URL encoding** | Properly encode all path and query parameters to prevent injection |
| **No SSRF** | Ensure the API client can only call `rest.kegg.jp` (or configured allowlist) |

---

## 10. Performance

| Requirement | Detail |
|-------------|--------|
| **Connection reuse** | Use HTTP keep-alive for sequential requests |
| **Batching** | Support batching up to the KEGG limit (10 entries) to reduce round trips |
| **Caching** | Optionally cache `info` and `list` responses (short TTL, e.g., 5 minutes) since they change infrequently |

---

## Checklist

- [x] Latest MCP SDK installed and configured
- [x] All 5 endpoint bugs from `known-bugs-and-drift.md` fixed
- [x] Parser updated for three-column `/list/genome` output
- [x] Unit tests for every parser with real fixtures
- [x] Live integration tests for every tool
- [x] CI pipeline running tests on PR
- [x] README with installation, usage, and policy notice
- [x] Structured logging and request IDs
- [x] Timeouts and retry logic on HTTP client
- [x] Input validation and URL encoding on all parameters
- [x] Health check tool implemented
- [x] `CHANGELOG.md` started
