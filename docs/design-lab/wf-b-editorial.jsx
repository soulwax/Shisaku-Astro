// wf-b-editorial.jsx — Direction B: "Editorial". Serif masthead, featured hero,
// narrative copy, magazine grid. Exports: EditorialDesktop, EditorialMobile.

const B_FEATURE = {
  kicker: 'Field notes',
  title: 'What I learned shipping a query planner I didn\u2019t fully understand',
  dek: 'Three weeks, one cost model, and a quiet lesson about trusting the benchmark over the instinct.',
  byline: 'Sam \u00b7 June 20, 2026 \u00b7 9 min read',
};

const B_POSTS = [
  {
    title: 'The plugin system that almost ate the project',
    dek: 'It served two users and demanded all of my weekends. Here\u2019s how I talked myself into deleting it.',
    meta: 'Postmortem \u00b7 6 min',
  },
  {
    title: 'A love letter to builds under 200kb',
    dek: 'Cutting the WebAssembly bundle in half turned into a meditation on what a feature is really worth.',
    meta: 'Craft \u00b7 4 min',
  },
  {
    title: 'A weekend lost (and found) inside io_uring',
    dek: 'I set out to make ingest faster. I came back understanding how Linux actually schedules my work.',
    meta: 'Deep dive \u00b7 7 min',
  },
  {
    title: 'On building in the open, two years in',
    dek: 'What changes when the people reading your devlog are also the people using the thing.',
    meta: 'Essay \u00b7 5 min',
  },
];

function EditorialMasthead({ compact }) {
  return (
    <div className="eb-masthead">
      <div className="eb-mast-l">
        <div className="eb-kicker"><Logo size={compact ? 8 : 9} /> <span>BLUESIX</span></div>
        <div className="eb-wordmark">Devlog</div>
        <div className="eb-dateline">Notes from building bluesix in public &middot; est. 2026</div>
      </div>
      {!compact && <nav className="eb-nav"><span>Latest</span><span>Archive</span><span>About</span><span>RSS</span></nav>}
    </div>
  );
}

function EditorialCard({ p }) {
  return (
    <article className="eb-card">
      <Ph label="thumb" h={110} />
      <h3 className="eb-card-title">{p.title}</h3>
      <p className="eb-card-dek">{p.dek}</p>
      <div className="eb-meta">{p.meta}</div>
    </article>
  );
}

function EditorialDesktop() {
  return (
    <div className="wf eb wf--d">
      <EditorialMasthead />
      <div className="eb-rule" />
      <section className="eb-hero">
        <Ph label="hero image" h={230} />
        <div className="eb-hero-text">
          <div className="eb-kick2">{B_FEATURE.kicker}</div>
          <h1 className="eb-hero-title">{B_FEATURE.title}</h1>
          <p className="eb-hero-dek">{B_FEATURE.dek}</p>
          <div className="eb-meta">{B_FEATURE.byline}</div>
        </div>
      </section>
      <div className="eb-section-label"><span>Recent</span><span className="eb-hr" /></div>
      <div className="eb-grid">
        {B_POSTS.map((p, i) => <EditorialCard key={i} p={p} />)}
      </div>
      <Anno style={{ position: 'absolute', top: 150, right: 14, width: 122 }}>one big featured story up top</Anno>
      <Anno style={{ position: 'absolute', top: 560, right: 14, width: 122 }}>narrative headlines + deks</Anno>
    </div>
  );
}

function EditorialMobile() {
  return (
    <div className="wf eb eb--m">
      <EditorialMasthead compact />
      <div className="eb-rule" />
      <section className="eb-hero eb-hero--m">
        <Ph label="hero" h={120} />
        <h1 className="eb-hero-title">{B_FEATURE.title}</h1>
        <p className="eb-hero-dek">{B_FEATURE.dek}</p>
        <div className="eb-meta">{B_FEATURE.byline}</div>
      </section>
      <div className="eb-section-label"><span>Recent</span><span className="eb-hr" /></div>
      <div className="eb-grid eb-grid--m">
        {B_POSTS.slice(0, 2).map((p, i) => <EditorialCard key={i} p={p} />)}
      </div>
    </div>
  );
}

Object.assign(window, { EditorialDesktop, EditorialMobile });
