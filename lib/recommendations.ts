import { v4 as uuidv4 } from "uuid";
import type { AdapterCandidate } from "@/lib/adapters/types";
import type { ProjectBrief } from "@/lib/brief";

/** Response slice per docs/adapter-venue-spec.md §6 */
export type Recommendation = {
  recommendation_id: string;
  venue: Record<string, unknown>;
  evidence: string[];
  draft_posts: { locale: string; tone: string; body: string }[];
  checklist: { id: string; label: string; done: boolean }[];
  sources: string[];
};

export function candidateToRecommendation(
  c: AdapterCandidate,
  brief: ProjectBrief,
): Recommendation {
  const v = (c.suggested_venue ?? {}) as Record<string, unknown>;
  const name = String(v.name ?? c.title);
  const rulesUrl = v.rules_url != null ? String(v.rules_url) : null;

  const summaryClip =
    brief.summary.length > 400 ? `${brief.summary.slice(0, 400)}…` : brief.summary;

  const body =
    `Hi — I'm working on "${brief.title}".\n\n` +
    `${summaryClip}\n\n` +
    `Is sharing in **${name}** appropriate per your community rules? I can adjust tone or wait for admin approval if needed.`;

  const sourceRaw = String(v.source ?? "");
  const sources: string[] =
    sourceRaw === "adapter_telegram" ? ["adapter:telegram"] : ["curated"];

  return {
    recommendation_id: uuidv4(),
    venue: v,
    evidence: [
      ...c.evidence,
      ...(rulesUrl ? [`Rules / how to post: ${rulesUrl}`] : []),
    ],
    draft_posts: [
      {
        locale: brief.language,
        tone: "short",
        body,
      },
    ],
    checklist: [
      {
        id: "read_rules",
        label: "Read posting rules before sending anything",
        done: false,
      },
      {
        id: "join_if_needed",
        label: "Join or request access if the venue requires it",
        done: false,
      },
      {
        id: "no_spam",
        label: "Do not mass-DM or drop links without context",
        done: false,
      },
    ],
    sources,
  };
}
