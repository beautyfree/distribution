export type ApiNode = {
  id: string;
  type: string;
  name: string;
  url: string;
  audience_size: number;
  topics: string[];
  post_rules: string;
  post_format: string;
  language: string;
  description: string | null;
  score: number;
};

export type MatchMode = "semantic" | "topical" | "empty";

export type MatchResponse = {
  count: number;
  mode: MatchMode;
  nodes: ApiNode[];
};

export type Sort = "best" | "newest" | "audience";

export type ViewMode = "tier" | "platform" | "flat" | "saved";
