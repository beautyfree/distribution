import type { Sort, ViewMode } from "./api-types";

export type SearchState = {
  description: string;
  types: string[];
  language: "en" | null;
  minAudience: number | null;
  sort: Sort;
  view: ViewMode;
};

export const DEFAULT_STATE: SearchState = {
  description: "",
  types: [],
  language: null,
  minAudience: null,
  sort: "best",
  view: "tier",
};

const SORTS: Sort[] = ["best", "newest", "audience"];
const VIEWS: ViewMode[] = ["tier", "platform", "flat", "saved"];

export function encodeSearchState(s: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.description.trim()) p.set("q", s.description.trim());
  if (s.types.length > 0) p.set("types", [...s.types].sort().join(","));
  if (s.language === "en") p.set("lang", "en");
  if (s.minAudience && s.minAudience > 0) p.set("min", String(s.minAudience));
  if (s.sort !== "best") p.set("sort", s.sort);
  if (s.view !== "tier") p.set("view", s.view);
  return p;
}

export function decodeSearchState(p: URLSearchParams): SearchState {
  const q = p.get("q") ?? "";
  const typesRaw = p.get("types") ?? "";
  const types = typesRaw
    ? typesRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const lang = p.get("lang") === "en" ? "en" : null;
  const minRaw = p.get("min");
  const min = minRaw && /^\d+$/.test(minRaw) ? Number(minRaw) : null;
  const sortRaw = p.get("sort");
  const sort: Sort = SORTS.includes(sortRaw as Sort)
    ? (sortRaw as Sort)
    : "best";
  const viewRaw = p.get("view");
  const view: ViewMode = VIEWS.includes(viewRaw as ViewMode)
    ? (viewRaw as ViewMode)
    : "tier";
  return {
    description: q.slice(0, 2000),
    types,
    language: lang,
    minAudience: min,
    sort,
    view,
  };
}
