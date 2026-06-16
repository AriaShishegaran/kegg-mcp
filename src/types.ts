export interface KEGGListItem {
  id: string;
  name: string;
  extra?: string;
}

export interface KEGGListResult {
  [key: string]: string;
}

export interface KEGGEntry {
  entry?: string;
  type?: string;
  name?: string | string[];
  definition?: string;
  formula?: string;
  exact_mass?: string;
  mol_weight?: string;
  pathway?: Record<string, string>;
  gene?: Record<string, string>;
  compound?: Record<string, string>;
  reaction?: Record<string, string>;
  orthology?: Record<string, string>;
  dblinks?: Record<string, string[]>;
  organism?: string;
  module?: string[];
  disease?: string[];
  drug?: string[];
  brite?: string[];
  reference?: KEGGReference[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface KEGGReference {
  pmid?: string;
  authors?: string;
  title?: string;
  journal?: string;
  abstract?: string;
}

export interface KEGGOrganism {
  t_number: string;
  organism_code: string;
  organism_name: string;
}

export interface KEGGLinkResult {
  source: string;
  target: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface KEGGClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  userAgent: string;
}

export type KEGGGetOption = 'aaseq' | 'ntseq' | 'mol' | 'kcf' | 'image' | 'image2x' | 'conf' | 'kgml' | 'json';

export type SearchType = 'name' | 'formula' | 'exact_mass' | 'mol_weight';

export type BriteHierarchy = 'br' | 'ko' | 'jp';

export type BatchOperation = 'info' | 'sequence' | 'pathway' | 'link';

export interface SearchArgs {
  query: string;
  organism_code?: string;
  max_results?: number;
  search_type?: SearchType;
}

export interface PathwayInfoArgs {
  pathway_id: string;
  format?: KEGGGetOption;
}

export interface OrganismArgs {
  organism_code?: string;
  limit?: number;
}

export interface PathwayArgs {
  pathway_id?: string;
  organism_code?: string;
  include_genes?: boolean;
  include_compounds?: boolean;
}

export interface GeneArgs {
  gene_id?: string;
  organism_code?: string;
  include_sequences?: boolean;
}

export interface BatchArgs {
  entry_ids: string[];
  operation?: BatchOperation;
}

export interface BriteSearchArgs {
  query: string;
  hierarchy_type?: BriteHierarchy;
  max_results?: number;
}

export interface ConvertArgs {
  source_db: string;
  target_db: string;
  identifiers?: string[];
}

export interface FindRelatedArgs {
  source_db: string;
  target_db: string;
  source_entries?: string[];
}

export interface DrugInteractionArgs {
  drug_ids: string[];
}

export interface GeneOrthologArgs {
  gene_id: string;
  target_organisms?: string[];
}

export interface CompoundReactionArgs {
  compound_id: string;
}

export interface BriteInfoArgs {
  brite_id: string;
  format?: KEGGGetOption;
}

export interface DatabaseInfoArgs {
  database: string;
}

export interface HealthCheckArgs {
  check_type?: 'connectivity' | 'latency' | 'full';
}
