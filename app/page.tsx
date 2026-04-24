import { SearchExperience } from "./_components/SearchExperience";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-6 leading-[1.5]">
      <header className="flex items-center justify-between pt-3 pb-8">
        <div className="flex items-center gap-[10px]">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[14px] font-bold text-[var(--accent-fg)]"
            style={{
              background: "var(--accent)",
              fontFamily: "var(--font-mono)",
            }}
            aria-hidden
          >
            d
          </div>
          <div className="text-[16px] font-semibold tracking-[-0.01em]">
            distribution
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="https://github.com/devall/distribution-registry"
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-muted hover:text-fg"
          >
            browse
          </a>
          <a
            href="https://github.com/devall/distribution-registry/issues/new?template=add-channel.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-1.5 text-[13px] text-fg hover:border-[color:var(--fg)] md:min-h-0"
          >
            Add channel →
          </a>
        </nav>
      </header>

      <SearchExperience />

      <footer className="mt-16 flex items-center gap-4 border-t border-border pt-4 text-[12px] text-muted">
        <a
          href="https://github.com/devall/distribution-registry"
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-fg"
        >
          GitHub ↗
        </a>
        <a href="https://github.com/beautyfree/distribution/blob/master/LICENSE" target="_blank" rel="noreferrer" className="text-muted hover:text-fg">License</a>
        <span className="ml-auto">Made by builders</span>
      </footer>
    </main>
  );
}
