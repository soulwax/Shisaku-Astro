// wf-a-terminal.jsx — Direction A: "Terminal Feed". Monospace, build-number list,
// terse commit-style copy. Exports: TerminalDesktop, TerminalMobile.

const A_ENTRIES = [
  {
    date: '2026.06.20', build: '#0042', read: '4 min',
    title: 'shipping the new query planner',
    body: 'rewrote the planner around a cost model. ~3x on multi-join reads, far fewer pathological plans. notes on what broke.',
    tags: ['+rust', '+postgres', '+perf'],
  },
  {
    date: '2026.06.11', build: '#0041', read: '2 min',
    title: 'wasm build is finally under 200kb',
    body: 'dropped the regex crate, hand-rolled the tokenizer. boot time halved. teardown of the diff.',
    tags: ['+wasm', '+size'],
  },
  {
    date: '2026.05.29', build: '#0040', read: '6 min',
    title: 'why i killed the plugin system',
    body: 'two users, infinite support surface. ripped it out, kept the good parts as config. postmortem.',
    tags: ['+architecture', '+regret'],
  },
  {
    date: '2026.05.14', build: '#0039', read: '3 min',
    title: 'a weekend with io_uring',
    body: 'tried to make ingest faster. mostly learned how io_uring actually schedules. numbers inside.',
    tags: ['+linux', '+io'],
  },
];

function TerminalTopbar({ compact }) {
  return (
    <div className="ta-top">
      <div className="ta-brand">
        <Logo size={compact ? 9 : 11} />
        <span className="ta-path">bluesix<span className="ta-dim"> ~/devlog</span></span>
      </div>
      {compact
        ? <span className="ta-burger">≡</span>
        : <nav className="ta-nav"><span>latest</span><span>tags</span><span>rss</span><span>about</span></nav>}
    </div>
  );
}

function TerminalRow({ e }) {
  return (
    <div className="ta-row">
      <div className="ta-meta">{e.date}<span className="ta-dim">  ·  build {e.build}  ·  {e.read}</span></div>
      <div className="ta-title"><span className="ta-caret">&gt;</span> {e.title}</div>
      <div className="ta-body">{e.body}</div>
      <div className="ta-tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</div>
    </div>
  );
}

function TerminalDesktop() {
  return (
    <div className="wf ta wf--d">
      <TerminalTopbar />
      <div className="ta-prompt">$ ls -t devlog/ <span className="ta-cursor" /></div>
      <div className="ta-list">
        {A_ENTRIES.map((e, i) => <TerminalRow key={i} e={e} />)}
      </div>
      <div className="ta-foot">feed.xml &nbsp;·&nbsp; github/bluesix &nbsp;·&nbsp; built in the open</div>
      <Anno style={{ position: 'absolute', top: 96, right: 14, width: 120 }}>terse, lowercase, commit-message voice</Anno>
      <Anno style={{ position: 'absolute', top: 360, right: 14, width: 120 }}>build # as the through-line</Anno>
    </div>
  );
}

function TerminalMobile() {
  return (
    <div className="wf ta ta--m">
      <TerminalTopbar compact />
      <div className="ta-prompt">$ ls -t <span className="ta-cursor" /></div>
      <div className="ta-list">
        {A_ENTRIES.slice(0, 3).map((e, i) => <TerminalRow key={i} e={e} />)}
      </div>
      <div className="ta-foot">feed.xml · gh/bluesix</div>
    </div>
  );
}

Object.assign(window, { TerminalDesktop, TerminalMobile });
