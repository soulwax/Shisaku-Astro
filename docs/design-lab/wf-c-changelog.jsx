// wf-c-changelog.jsx — Direction C: "Changelog". Sidebar nav, version-tagged
// release-note entries, structured copy. Exports: ChangelogDesktop, ChangelogMobile.

const C_ENTRIES = [
  {
    date: 'Jun 20, 2026', ver: 'v1.4.0',
    title: 'Query planner rewrite',
    chips: [['Feature', 'feat'], ['Perf', 'perf']],
    items: [
      'Added a cost-based planner for multi-join reads (~3x faster on typical workloads).',
      'Improved plan stability — no more pathological plans on skewed data.',
      'Changed EXPLAIN output; see migration note below.',
    ],
  },
  {
    date: 'Jun 11, 2026', ver: 'v1.3.2',
    title: 'Smaller WebAssembly build',
    chips: [['Perf', 'perf'], ['Fix', 'fix']],
    items: [
      'Reduced wasm bundle from 410kb to 188kb by dropping the regex dependency.',
      'Fixed a cold-start hang on Safari 17.',
    ],
  },
  {
    date: 'May 29, 2026', ver: 'v1.3.0',
    title: 'Removed the plugin system',
    chips: [['Breaking', 'break'], ['Note', 'note']],
    items: [
      'Removed the runtime plugin API. The two common plugins now ship as config flags.',
      'See the postmortem for migration steps and rationale.',
    ],
  },
];

function ChangelogSidebar() {
  return (
    <aside className="cc-side">
      <div className="cc-brand"><Logo size={11} /><span>bluesix<br /><em>devlog</em></span></div>
      <div className="cc-search">Search the log…</div>
      <nav className="cc-nav">
        <span className="cc-nav-on">Latest</span>
        <span>By tag</span>
        <span>Archive</span>
        <span>About</span>
        <span>RSS feed</span>
      </nav>
      <div className="cc-filter-label">Versions</div>
      <div className="cc-filters">
        <Chip tone="ver">v1.x</Chip><Chip tone="plain">v0.x</Chip>
      </div>
    </aside>
  );
}

function ChangelogEntry({ e }) {
  return (
    <article className="cc-entry">
      <div className="cc-entry-head">
        <span className="cc-date">{e.date}</span>
        <Chip tone="ver">{e.ver}</Chip>
      </div>
      <h3 className="cc-entry-title">{e.title}</h3>
      <div className="cc-chips">{e.chips.map(([l, t]) => <Chip key={l} tone={t}>{l}</Chip>)}</div>
      <ul className="cc-items">
        {e.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </article>
  );
}

function ChangelogDesktop() {
  return (
    <div className="wf cc wf--d">
      <ChangelogSidebar />
      <main className="cc-main">
        <h1 className="cc-h1">Changelog</h1>
        <p className="cc-sub">Every shipped change to bluesix, newest first.</p>
        <div className="cc-entries">
          {C_ENTRIES.map((e, i) => <ChangelogEntry key={i} e={e} />)}
        </div>
      </main>
      <Anno style={{ position: 'absolute', top: 96, right: 14, width: 122 }}>persistent sidebar nav on the left</Anno>
      <Anno style={{ position: 'absolute', top: 330, right: 14, width: 122 }}>version + category tags; release-note voice</Anno>
    </div>
  );
}

function ChangelogMobile() {
  return (
    <div className="wf cc cc--m">
      <div className="cc-mbar"><div className="cc-brand cc-brand--m"><Logo size={9} /><span>bluesix devlog</span></div><span className="ta-burger">≡</span></div>
      <main className="cc-main cc-main--m">
        <h1 className="cc-h1">Changelog</h1>
        <div className="cc-entries">
          {C_ENTRIES.slice(0, 2).map((e, i) => <ChangelogEntry key={i} e={e} />)}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { ChangelogDesktop, ChangelogMobile });
