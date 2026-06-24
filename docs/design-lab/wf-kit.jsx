// wf-kit.jsx — shared low-fi wireframe primitives for the bluesix devlog explorations.
// Exports to window: Lines, Ph, Chip, Anno, Logo.

// A stack of grey placeholder text bars. `widths` is an array of % strings.
function Lines({ widths = ['100%', '92%', '70%'], gap = 7, h = 9 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {widths.map((w, i) => (
        <span key={i} style={{ display: 'block', height: h, width: w, background: 'var(--wf-bar)', borderRadius: 3 }} />
      ))}
    </div>
  );
}

// Placeholder image / media box with a hatched fill and a mono caption.
function Ph({ label = 'image', h = 160, style = {} }) {
  return (
    <div className="wf-ph" style={{ height: h, ...style }}>
      <span>[ {label} ]</span>
    </div>
  );
}

// Small pill chip (tags, categories, version badges).
function Chip({ children, tone = 'plain' }) {
  return <span className={`wf-chip wf-chip--${tone}`}>{children}</span>;
}

// Handwritten margin annotation in marker-blue.
function Anno({ children, style = {} }) {
  return <div className="wf-anno" style={style}>{children}</div>;
}

// The bluesix block mark — six little squares, one of them filled blue.
function Logo({ size = 18, gap = 3, lit = 4 }) {
  const cells = [0, 1, 2, 3, 4, 5];
  return (
    <span style={{ display: 'inline-grid', gridTemplateColumns: `repeat(3, ${size}px)`, gridAutoRows: `${size}px`, gap }}>
      {cells.map((c) => (
        <span key={c} style={{
          background: c === lit ? 'var(--wf-accent)' : 'var(--wf-ink)',
          borderRadius: 2,
        }} />
      ))}
    </span>
  );
}

Object.assign(window, { Lines, Ph, Chip, Anno, Logo });
