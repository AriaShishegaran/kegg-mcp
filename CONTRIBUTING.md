# Contributing

Thanks for your interest in contributing to kegg-mcp!

## Development

```bash
npm install
npm run build              # compile to dist/
npm test                   # unit tests
npm run test:integration   # live tests against rest.kegg.jp
npm run typecheck
npm run lint
```

## Commits — Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) so releases are automated via [release-please](https://github.com/googleapis/release-please):

| Type | Bump | Example |
| --- | --- | --- |
| `feat:` | minor (`1.0.0` → `1.1.0`) | `feat: add organism auto-detect to search_genes` |
| `fix:` | patch (`1.0.0` → `1.0.1`) | `fix: handle empty compounds in get_pathway_compounds` |
| `feat!:` / `BREAKING CHANGE:` in body | major (`1.0.0` → `2.0.0`) | `feat!: drop Node 18 support` |
| `docs:`, `chore:`, `test:`, `refactor:`, `perf:`, `ci:`, `build:` | none (no release) | `docs: clarify install steps` |

Pushing to `main` opens a **release PR** that bumps the version, updates `package.json`, `package-lock.json`, and `CHANGELOG.md`. Merging that PR tags the release and publishes to npm with provenance (once the `NPM_TOKEN` secret is configured).

## Pull requests

1. Fork and branch from `main`.
2. Add or update tests; keep `npm run typecheck`, `npm run lint`, and `npm test` green.
3. Write a Conventional Commit message.
4. Open a PR against `main`.

## Releases

Fully automated — see the `Release` (release-please) and `Publish` GitHub Actions workflows. Maintainers only need to merge the release PR.
