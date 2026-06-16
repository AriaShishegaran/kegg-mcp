# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-16

### Added
- 34 tools covering every major KEGG database (pathways, genes, compounds, reactions, enzymes, diseases, drugs, modules, orthology, glycans, BRITE).
- 8 resource templates for dynamic data access (`kegg://pathway/{id}`, `kegg://gene/{org}:{id}`, …).
- `kegg_health_check` tool for connectivity and latency checks against the KEGG API.
- `KEGGClient` with configurable base URL, retries, timeouts, keep-alive, and polite rate limiting (≤ 3 req/s).
- Exponential backoff retries for transient failures (5xx, network errors); no retry on 4xx.
- Robust KEGG flat-file, list, and link parsers that preserve multi-line fields.
- Unit tests with real KEGG response fixtures, plus a live integration test suite.
- CI workflow running typecheck, lint, build, and tests on Node 20 & 22.

### Stack
- `@modelcontextprotocol/sdk` 1.29.0, TypeScript 5.8, Node ≥ 20.
- Native `fetch` (no HTTP client dependency).
