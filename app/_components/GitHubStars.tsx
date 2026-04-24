// Server component — fetched at build time / ISR every hour.
// Graceful fallback: if GitHub rate-limits or the repo is unreachable,
// render a plain "GitHub ↗" link with no star count.

const REPO = "beautyfree/distribution";

async function fetchStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export async function GitHubStars() {
  const stars = await fetchStars();
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noreferrer"
      className="text-muted hover:text-fg"
    >
      {stars !== null ? (
        <>
          GitHub{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>
            ★ {formatStars(stars)}
          </span>
        </>
      ) : (
        <>GitHub ↗</>
      )}
    </a>
  );
}
