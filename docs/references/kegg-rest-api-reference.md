# KEGG REST API Reference

> Base URL: `https://rest.kegg.jp/`
> Last updated: May 1, 2026

---

## 1. INFO — Database Information

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoint** | `/info/<database>` |
| **Supported databases** | `kegg`, `pathway`, `brite`, `module`, `ko`, `genes`, `<org>`, `vg`, `vp`, `ag`, `genome`, `ligand`, `compound`, `glycan`, `reaction`, `rclass`, `enzyme`, `network`, `variant`, `disease`, `drug`, `dgroup` |
| **Output** | Plain text message with release info and statistics |
| **Restrictions** | None |

**Example:**
```
GET https://rest.kegg.jp/info/kegg
```

---

## 2. LIST — List Entries

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoints** | `/list/<database>` |
| | `/list/pathway/<org>` |
| | `/list/brite/<option>` (option = `br`, `jp`, `ko`, `<org>`) |
| | `/list/<dbentries>` (max 10 identifiers) |
| **Supported databases** | `pathway`, `brite`, `module`, `ko`, `<org>`, `vg`, `vp`, `ag`, `genome`, `compound`, `glycan`, `reaction`, `rclass`, `enzyme`, `network`, `variant`, `disease`, `drug`, `dgroup` |
| **Output** | Tab-delimited text |
| **Restrictions** | Max 10 identifiers for `<dbentries>`; excludes composite names `genes`, `ligand`, `kegg` |

**Examples:**
```
GET https://rest.kegg.jp/list/hsa
GET https://rest.kegg.jp/list/pathway/hsa
GET https://rest.kegg.jp/list/brite/br
GET https://rest.kegg.jp/list/hsa:10458+ece:Z5100
```

**Note on `/list/genome`:** Returns a three-column tab-delimited list: `T number`, `organism code`, `organism name`. This is the correct endpoint for listing organisms, not `/list/organism`.

---

## 3. FIND — Search by Keywords

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoints** | `/find/<database>/<query>` |
| | `/find/<database>/<query>/<option>` (compound/drug only) |
| **Supported databases** | `pathway`, `brite`, `module`, `ko`, `genes`, `<org>`, `vg`, `vp`, `ag`, `genome`, `ligand`, `compound`, `glycan`, `reaction`, `rclass`, `enzyme`, `network`, `variant`, `disease`, `drug`, `dgroup` |
| **Chemical options** | `formula`, `exact_mass`, `mol_weight`, `nop` (for `compound`/`drug` only) |
| **Output** | Tab-delimited text |
| **Restrictions** | None |

**Examples:**
```
GET https://rest.kegg.jp/find/pathway/glycolysis
GET https://rest.kegg.jp/find/compound/300-310/mol_weight
GET https://rest.kegg.jp/find/compound/C6H12O6/formula
```

**Important:** The `find` operation does NOT accept `pathway/<org>` as a database parameter. To search organism-specific pathways, use `/find/pathway/<query>` and filter client-side, or use `/list/pathway/<org>`.

---

## 4. GET — Retrieve Entries

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoint** | `/get/<dbentries>[/<option>]` |
| **Supported databases** | `pathway`, `brite`, `module`, `ko`, `<org>`, `vg`, `vp`, `ag`, `genome`, `compound`, `glycan`, `reaction`, `rclass`, `enzyme`, `network`, `variant`, `disease`, `drug`, `dgroup`, `disease_ja`, `drug_ja`, `dgroup_ja`, `compound_ja` |
| **Options** | `aaseq`, `ntseq`, `mol`, `kcf`, `image`, `image2x`, `conf`, `kgml`, `json` |
| **Output** | Flat file format (default); tab-delimited for some options; image files for `image` option; KGML for `kgml`; JSON for `json` |
| **Restrictions** | Max 10 entries for flat file; one compound/glycan/drug entry with `image` option; one pathway entry with `image` or `kgml` option |

**Examples:**
```
GET https://rest.kegg.jp/get/hsa:10458+ece:Z5100
GET https://rest.kegg.jp/get/hsa00010/kgml
GET https://rest.kegg.jp/get/C00001/mol
GET https://rest.kegg.jp/get/hsa00010/image
```

---

## 5. CONV — ID Conversion

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoints** | `/conv/<target_db>/<source_db>` |
| | `/conv/<target_db>/<dbentries>` |
| **Required** | `<target_db>`, `<source_db>` or `<dbentries>` |
| **Gene DBs** | `<org>` ↔ `ncbi-geneid`, `ncbi-proteinid`, `uniprot` |
| **Chemical DBs** | `compound`, `glycan`, `drug` ↔ `pubchem`, `chebi` |
| **Output** | Tab-delimited text |

**Examples:**
```
GET https://rest.kegg.jp/conv/ncbi-geneid/hsa:10458
GET https://rest.kegg.jp/conv/pubchem/compound
GET https://rest.kegg.jp/conv/uniprot/hsa
```

---

## 6. LINK — Cross-Database Links

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoints** | `/link/<target_db>/<source_db>[/<option>]` |
| | `/link/<target_db>/<dbentries>[/<option>]` |
| **Required** | `<target_db>`, `<source_db>` or `<dbentries>` |
| **Optional** | Taxonomy: `species`, `genus`, `family`, `order`, `class`, `phylum`; RDF: `turtle`, `n-triple` (for `drug`/`atc`/`jtc` only) |
| **Output** | Tab-delimited text |

**Examples:**
```
GET https://rest.kegg.jp/link/hsa/hsa00010
GET https://rest.kegg.jp/link/pathway/hsa:10458
GET https://rest.kegg.jp/link/cpd/hsa00010
GET https://rest.kegg.jp/link/rn/hsa00010
```

**Important:** In `link` operations, the target database should be the organism code (e.g., `hsa`) or the abbreviated database name (e.g., `cpd`, `rn`), not the full name (`genes`, `compound`, `reaction`).

---

## 7. DDI — Drug-Drug Interactions

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Endpoints** | `/ddi/<dbentry>` (single entry) |
| | `/ddi/<dbentries>` (multiple entries) |
| **Required** | `<dbentry>` or `<dbentries>` from `drug`, `ndc`, `yj` |
| **Output** | Tab-delimited text |
| **Notes** | Checks contraindication (CI) and precaution (P) in Japanese drug labels |

**Example:**
```
GET https://rest.kegg.jp/ddi/D00564
```

---

## Parameter Types

| Parameter | Description |
|-----------|-------------|
| `<database>` | KEGG database name (e.g., `pathway`, `compound`, `hsa`) |
| `<dbentries>` | One or more database entries separated by `+` (max 10) |
| `<org>` | Three- or four-letter organism code (e.g., `hsa`, `eco`) |
| `<option>` | Format or filter option specific to the operation |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request |
| 404 | Not found |

---

## Recent Changes (2024–2026)

| Date | Change | Impact |
|------|--------|--------|
| May 1, 2026 | NCBI taxonomy available for link to/from genome | New capability |
| Dec 1, 2024 | YK code included as an outside identifier | New ID conversion support |
| Jun 1, 2022 | Moved from HTTP to HTTPS | Infrastructure change |

---

## Access Policy

KEGG API at `rest.kegg.jp` is made available only for academic use by academic users. Commercial users require separate licensing terms.

---

## Sources

- [KEGG API Official Documentation](https://www.kegg.jp/kegg/rest/keggapi.html)
- [KEGG REST API Changelog](https://www.kegg.jp/kegg/rest/)
