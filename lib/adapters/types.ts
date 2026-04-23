import type { ProjectBrief } from "@/lib/brief";

/** docs/adapter-venue-spec.md §4.2 */
export type AdapterCapabilities = {
  adapter_id: "telegram";
  version: string;
  modes: ("search")[];
  rate_limit_per_minute: number;
  notes?: string;
};

/** §4.3 */
export type AdapterSearchRequest = {
  request_id: string;
  project_brief: ProjectBrief;
  query_text?: string;
  max_results: number;
  context: {
    locale: string;
    include_global: boolean;
  };
};

/** §4.4 */
export type AdapterSearchResult = {
  request_id: string;
  status: "ok" | "partial" | "error";
  items: AdapterCandidate[];
  error?: { code: string; message: string };
};

/** §4.5 — v0.1 returns ranked rows from DB as candidates. */
export type AdapterCandidate = {
  external_id: string;
  title: string;
  relevance_score: number;
  evidence: string[];
  suggested_venue?: Record<string, unknown>;
};

export type AdapterHealth = {
  adapter_id: "telegram";
  ok: boolean;
  last_error?: string;
};
