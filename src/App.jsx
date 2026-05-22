import { useState } from "react";

const SETUPS = ["FVG", "Liquidity Sweep", "Order Block", "FVG + OB", "Sweep + FVG", "Sweep + OB"];
const SESSIONS = ["London", "New York", "Asian", "London/NY Overlap"];
const DIRECTIONS = ["Long", "Short"];
const OUTCOMES = ["Win", "Loss", "Breakeven"];
const PAIRS = ["ES", "NQ", "GC", "CL", "EURUSD", "GBPUSD", "BTCUSD", "Other"];

const initialForm = {
  date: new Date().toISOString().split("T")[0],
  pair: "NQ",
  direction: "Long",
  session: "New York",
  setup: "FVG",
  entry: "",
  sl: "",
  tp: "",
  outcome: "Win",
  rr: "",
  pnl: "",
  notes: "",
  fvgFilled: false,
  sweepConfirmed: false,
  obRespected: false,
  htfAligned: false,
  emotionRating: 3,
};

const emotionLabels = ["Fearful", "Anxious", "Neutral", "Confident", "Disciplined"];
const emotionColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [view, setView] = useState("log"); // log | history | stats
  const [filterSetup, setFilterSetup] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const calcRR = () => {
    const e = parseFloat(form.entry);
    const s = parseFloat(form.sl);
    const t = parseFloat(form.tp);
    if (!isNaN(e) && !isNaN(s) && !isNaN(t) && s !== e) {
      const rr = Math.abs((t - e) / (e - s)).toFixed(2);
      setForm((f) => ({ ...f, rr }));
    }
  };

  const submitTrade = () => {
    if (!form.pair || !form.entry) return;
    const newTrade = { ...form, id: Date.now() };
    setTrades((prev) => [newTrade, ...prev]);
    setForm({ ...initialForm, date: form.date });
    setView("history");
  };

  const deleteTrade = (id) => setTrades((t) => t.filter((tr) => tr.id !== id));

  const filtered = filterSetup === "All" ? trades : trades.filter((t) => t.setup === filterSetup);

  const wins = trades.filter((t) => t.outcome === "Win").length;
  const losses = trades.filter((t) => t.outcome === "Loss").length;
  const wr = trades.length ? ((wins / trades.length) * 100).toFixed(0) : 0;
  const avgRR = trades.length
    ? (trades.reduce((a, b) => a + (parseFloat(b.rr) || 0), 0) / trades.length).toFixed(2)
    : 0;
  const totalPnL = trades.reduce((a, b) => a + (parseFloat(b.pnl) || 0), 0).toFixed(2);
  const setupStats = SETUPS.map((s) => {
    const st = trades.filter((t) => t.setup === s);
    const sw = st.filter((t) => t.outcome === "Win").length;
    return { setup: s, count: st.length, wr: st.length ? ((sw / st.length) * 100).toFixed(0) : "-" };
  }).filter((s) => s.count > 0);

  const outcomeColor = (o) => (o === "Win" ? "#10b981" : o === "Loss" ? "#ef4444" : "#eab308");

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>EDGE JOURNAL</span>
        </div>
        <div style={styles.nav}>
          {["log", "history", "stats"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ ...styles.navBtn, ...(view === v ? styles.navBtnActive : {}) }}
            >
              {v === "log" ? "📝 Log Trade" : v === "history" ? "📋 History" : "📊 Stats"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.body}>
        {/* QUICK STATS BAR */}
        <div style={styles.statsBar}>
          {[
            { label: "Total Trades", val: trades.length, color: "#94a3b8" },
            { label: "Win Rate", val: `${wr}%`, color: wins >= losses ? "#10b981" : "#ef4444" },
            { label: "Avg R:R", val: `${avgRR}R`, color: "#60a5fa" },
            { label: "Total P&L", val: `$${totalPnL}`, color: parseFloat(totalPnL) >= 0 ? "#10b981" : "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={styles.statPill}>
              <span style={{ ...styles.statVal, color: s.color }}>{s.val}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* LOG TRADE VIEW */}
        {view === "log" && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>New Trade Entry</h2>

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Instrument</label>
                <select style={styles.input} value={form.pair} onChange={(e) => handleChange("pair", e.target.value)}>
                  {PAIRS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Direction</label>
                <div style={styles.btnGroup}>
                  {DIRECTIONS.map((d) => (
                    <button key={d} onClick={() => handleChange("direction", d)}
                      style={{ ...styles.toggleBtn, ...(form.direction === d ? (d === "Long" ? styles.toggleLong : styles.toggleShort) : {}) }}>
                      {d === "Long" ? "▲ Long" : "▼ Short"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Session</label>
                <select style={styles.input} value={form.session} onChange={(e) => handleChange("session", e.target.value)}>
                  {SESSIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* SETUP */}
            <div style={styles.field}>
              <label style={styles.label}>Setup Type</label>
              <div style={styles.setupGrid}>
                {SETUPS.map((s) => (
                  <button key={s} onClick={() => handleChange("setup", s)}
                    style={{ ...styles.setupBtn, ...(form.setup === s ? styles.setupBtnActive : {}) }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* CHECKLIST */}
            <div style={styles.field}>
              <label style={styles.label}>Confluence Checklist</label>
              <div style={styles.checkGrid}>
                {[
                  { key: "htfAligned", label: "HTF Aligned" },
                  { key: "fvgFilled", label: "FVG Identified" },
                  { key: "sweepConfirmed", label: "Sweep Confirmed" },
                  { key: "obRespected", label: "OB Respected" },
                ].map(({ key, label }) => (
                  <div key={key} style={styles.checkItem} onClick={() => handleChange(key, !form[key])}>
                    <div style={{ ...styles.checkbox, ...(form[key] ? styles.checkboxOn : {}) }}>
                      {form[key] && "✓"}
                    </div>
                    <span style={styles.checkLabel}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRICE LEVELS */}
            <div style={styles.grid3}>
              {[
                { key: "entry", label: "Entry" },
                { key: "sl", label: "Stop Loss" },
                { key: "tp", label: "Take Profit" },
              ].map(({ key, label }) => (
                <div key={key} style={styles.field}>
                  <label style={styles.label}>{label}</label>
                  <input style={styles.input} type="number" step="0.01" placeholder="0.00"
                    value={form[key]} onChange={(e) => handleChange(key, e.target.value)} onBlur={calcRR} />
                </div>
              ))}
            </div>

            <div style={styles.grid3}>
              <div style={styles.field}>
                <label style={styles.label}>R:R Ratio</label>
                <input style={{ ...styles.input, color: "#60a5fa" }} placeholder="Auto" value={form.rr}
                  onChange={(e) => handleChange("rr", e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>P&L ($)</label>
                <input style={styles.input} type="number" placeholder="0.00" value={form.pnl}
                  onChange={(e) => handleChange("pnl", e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Outcome</label>
                <select style={styles.input} value={form.outcome} onChange={(e) => handleChange("outcome", e.target.value)}>
                  {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* EMOTION */}
            <div style={styles.field}>
              <label style={styles.label}>Emotional State — <span style={{ color: emotionColors[form.emotionRating - 1] }}>{emotionLabels[form.emotionRating - 1]}</span></label>
              <input type="range" min="1" max="5" value={form.emotionRating}
                onChange={(e) => handleChange("emotionRating", parseInt(e.target.value))}
                style={styles.slider} />
              <div style={styles.sliderLabels}>
                {emotionLabels.map((l, i) => (
                  <span key={l} style={{ ...styles.sliderLabel, color: form.emotionRating === i + 1 ? emotionColors[i] : "#475569" }}>{l}</span>
                ))}
              </div>
            </div>

            {/* NOTES */}
            <div style={styles.field}>
              <label style={styles.label}>Notes / Trade Reasoning</label>
              <textarea style={styles.textarea} placeholder="Describe the setup: where was the sweep? Where was the FVG? What was the OB reaction?..."
                value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
            </div>

            <button style={styles.submitBtn} onClick={submitTrade}>
              ◈ Log Trade
            </button>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && (
          <div style={styles.card}>
            <div style={styles.historyHeader}>
              <h2 style={styles.cardTitle}>Trade History</h2>
              <select style={{ ...styles.input, width: "auto" }} value={filterSetup} onChange={(e) => setFilterSetup(e.target.value)}>
                <option>All</option>
                {SETUPS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            {filtered.length === 0 ? (
              <div style={styles.empty}>No trades logged yet. Start tracking your edge.</div>
            ) : (
              filtered.map((t) => (
                <div key={t.id} style={styles.tradeRow}>
                  <div style={styles.tradeRowTop} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <div style={styles.tradeLeft}>
                      <span style={{ ...styles.outcomeTag, background: outcomeColor(t.outcome) + "22", color: outcomeColor(t.outcome), borderColor: outcomeColor(t.outcome) + "44" }}>{t.outcome}</span>
                      <span style={styles.tradePair}>{t.pair}</span>
                      <span style={{ ...styles.tradeDir, color: t.direction === "Long" ? "#10b981" : "#ef4444" }}>{t.direction === "Long" ? "▲" : "▼"} {t.direction}</span>
                      <span style={styles.tradeSetup}>{t.setup}</span>
                    </div>
                    <div style={styles.tradeRight}>
                      <span style={styles.tradeDate}>{t.date}</span>
                      {t.rr && <span style={styles.tradeRR}>{t.rr}R</span>}
                      {t.pnl && <span style={{ color: parseFloat(t.pnl) >= 0 ? "#10b981" : "#ef4444", fontSize: "13px" }}>${t.pnl}</span>}
                      <button style={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deleteTrade(t.id); }}>✕</button>
                    </div>
                  </div>
                  {expandedId === t.id && (
                    <div style={styles.tradeExpanded}>
                      <div style={styles.expandGrid}>
                        <div><span style={styles.expandLabel}>Session</span><br />{t.session}</div>
                        <div><span style={styles.expandLabel}>Entry</span><br />{t.entry || "—"}</div>
                        <div><span style={styles.expandLabel}>SL</span><br />{t.sl || "—"}</div>
                        <div><span style={styles.expandLabel}>TP</span><br />{t.tp || "—"}</div>
                        <div><span style={styles.expandLabel}>Emotion</span><br /><span style={{ color: emotionColors[t.emotionRating - 1] }}>{emotionLabels[t.emotionRating - 1]}</span></div>
                      </div>
                      <div style={styles.confluenceRow}>
                        {[
                          { key: "htfAligned", label: "HTF" },
                          { key: "fvgFilled", label: "FVG" },
                          { key: "sweepConfirmed", label: "Sweep" },
                          { key: "obRespected", label: "OB" },
                        ].map(({ key, label }) => (
                          <span key={key} style={{ ...styles.confluenceTag, ...(t[key] ? styles.confluenceOn : styles.confluenceOff) }}>
                            {t[key] ? "✓" : "✗"} {label}
                          </span>
                        ))}
                      </div>
                      {t.notes && <div style={styles.tradeNotes}>"{t.notes}"</div>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* STATS VIEW */}
        {view === "stats" && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Performance Analytics</h2>
            {trades.length === 0 ? (
              <div style={styles.empty}>Log some trades to see your stats.</div>
            ) : (
              <>
                <div style={styles.statsGrid}>
                  {[
                    { label: "Total Trades", val: trades.length },
                    { label: "Wins", val: wins, color: "#10b981" },
                    { label: "Losses", val: losses, color: "#ef4444" },
                    { label: "Win Rate", val: `${wr}%`, color: parseInt(wr) >= 50 ? "#10b981" : "#ef4444" },
                    { label: "Avg R:R", val: `${avgRR}R`, color: "#60a5fa" },
                    { label: "Total P&L", val: `$${totalPnL}`, color: parseFloat(totalPnL) >= 0 ? "#10b981" : "#ef4444" },
                  ].map((s) => (
                    <div key={s.label} style={styles.bigStatCard}>
                      <div style={{ ...styles.bigStatVal, color: s.color || "#f1f5f9" }}>{s.val}</div>
                      <div style={styles.bigStatLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {setupStats.length > 0 && (
                  <>
                    <h3 style={styles.sectionTitle}>Setup Performance</h3>
                    {setupStats.map((s) => (
                      <div key={s.setup} style={styles.setupStat}>
                        <span style={styles.setupStatName}>{s.setup}</span>
                        <div style={styles.setupStatBar}>
                          <div style={{ ...styles.setupStatFill, width: `${s.wr}%`, background: parseInt(s.wr) >= 50 ? "#10b981" : "#ef4444" }} />
                        </div>
                        <span style={styles.setupStatWR}>{s.wr}% ({s.count})</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Session breakdown */}
                <h3 style={styles.sectionTitle}>Session Breakdown</h3>
                {SESSIONS.map((sess) => {
                  const st = trades.filter((t) => t.session === sess);
                  if (!st.length) return null;
                  const sw = st.filter((t) => t.outcome === "Win").length;
                  return (
                    <div key={sess} style={styles.setupStat}>
                      <span style={styles.setupStatName}>{sess}</span>
                      <div style={styles.setupStatBar}>
                        <div style={{ ...styles.setupStatFill, width: `${(sw / st.length) * 100}%`, background: "#60a5fa" }} />
                      </div>
                      <span style={styles.setupStatWR}>{((sw / st.length) * 100).toFixed(0)}% ({st.length})</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#070b14",
    color: "#e2e8f0",
    fontFamily: "'Courier New', 'Lucida Console', monospace",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #1e293b",
    background: "#0a0f1e",
    flexWrap: "wrap",
    gap: "12px",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: { fontSize: "22px", color: "#60a5fa" },
  logoText: { fontSize: "15px", fontWeight: "700", letterSpacing: "4px", color: "#60a5fa" },
  nav: { display: "flex", gap: "8px", flexWrap: "wrap" },
  navBtn: {
    padding: "6px 14px", fontSize: "12px", letterSpacing: "1px",
    background: "transparent", border: "1px solid #1e293b", color: "#64748b",
    cursor: "pointer", borderRadius: "4px", transition: "all 0.2s",
  },
  navBtnActive: { borderColor: "#60a5fa", color: "#60a5fa", background: "#60a5fa11" },
  body: { maxWidth: "780px", margin: "0 auto", padding: "24px 16px" },
  statsBar: {
    display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap",
  },
  statPill: {
    flex: "1 1 120px", background: "#0d1526", border: "1px solid #1e293b",
    borderRadius: "8px", padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center",
  },
  statVal: { fontSize: "20px", fontWeight: "700" },
  statLabel: { fontSize: "10px", color: "#475569", letterSpacing: "1px", marginTop: "2px" },
  card: {
    background: "#0a0f1e", border: "1px solid #1e293b",
    borderRadius: "12px", padding: "28px",
  },
  cardTitle: { fontSize: "14px", letterSpacing: "3px", color: "#94a3b8", marginBottom: "24px", marginTop: 0 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" },
  field: { marginBottom: "16px" },
  label: { display: "block", fontSize: "11px", letterSpacing: "2px", color: "#475569", marginBottom: "8px" },
  input: {
    width: "100%", background: "#0d1a2d", border: "1px solid #1e293b", color: "#e2e8f0",
    padding: "10px 12px", borderRadius: "6px", fontSize: "13px", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  textarea: {
    width: "100%", background: "#0d1a2d", border: "1px solid #1e293b", color: "#94a3b8",
    padding: "12px", borderRadius: "6px", fontSize: "12px", outline: "none",
    minHeight: "80px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
    lineHeight: "1.6",
  },
  btnGroup: { display: "flex", gap: "8px" },
  toggleBtn: {
    flex: 1, padding: "10px", background: "#0d1a2d", border: "1px solid #1e293b",
    color: "#475569", cursor: "pointer", borderRadius: "6px", fontSize: "12px", letterSpacing: "1px",
  },
  toggleLong: { borderColor: "#10b981", color: "#10b981", background: "#10b98111" },
  toggleShort: { borderColor: "#ef4444", color: "#ef4444", background: "#ef444411" },
  setupGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  setupBtn: {
    padding: "7px 14px", background: "#0d1a2d", border: "1px solid #1e293b",
    color: "#475569", cursor: "pointer", borderRadius: "4px", fontSize: "11px", letterSpacing: "1px",
  },
  setupBtnActive: { borderColor: "#60a5fa", color: "#60a5fa", background: "#60a5fa11" },
  checkGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  checkItem: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px", borderRadius: "6px", border: "1px solid #1e293b" },
  checkbox: {
    width: "18px", height: "18px", border: "1px solid #334155", borderRadius: "4px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#0a0f1e", flexShrink: 0,
  },
  checkboxOn: { background: "#10b981", borderColor: "#10b981" },
  checkLabel: { fontSize: "12px", color: "#94a3b8", letterSpacing: "1px" },
  slider: { width: "100%", margin: "8px 0 4px", accentColor: "#60a5fa" },
  sliderLabels: { display: "flex", justifyContent: "space-between" },
  sliderLabel: { fontSize: "9px", letterSpacing: "0.5px" },
  submitBtn: {
    width: "100%", padding: "14px", background: "#60a5fa11", border: "1px solid #60a5fa",
    color: "#60a5fa", cursor: "pointer", borderRadius: "6px", fontSize: "13px",
    letterSpacing: "3px", marginTop: "8px", transition: "all 0.2s",
  },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  empty: { color: "#334155", textAlign: "center", padding: "40px", fontSize: "13px", letterSpacing: "1px" },
  tradeRow: { border: "1px solid #1e293b", borderRadius: "8px", marginBottom: "10px", overflow: "hidden" },
  tradeRowTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", cursor: "pointer", gap: "8px", flexWrap: "wrap",
  },
  tradeLeft: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  tradeRight: { display: "flex", alignItems: "center", gap: "10px" },
  outcomeTag: { padding: "2px 8px", borderRadius: "4px", fontSize: "10px", letterSpacing: "1px", border: "1px solid" },
  tradePair: { fontSize: "14px", fontWeight: "700", color: "#e2e8f0" },
  tradeDir: { fontSize: "12px" },
  tradeSetup: { fontSize: "10px", color: "#475569", letterSpacing: "1px" },
  tradeDate: { fontSize: "11px", color: "#334155" },
  tradeRR: { fontSize: "12px", color: "#60a5fa" },
  deleteBtn: {
    background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "12px", padding: "2px 6px",
  },
  tradeExpanded: { padding: "16px", borderTop: "1px solid #1e293b", background: "#0d1526" },
  expandGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "12px", fontSize: "12px", color: "#94a3b8" },
  expandLabel: { fontSize: "9px", letterSpacing: "1px", color: "#334155" },
  confluenceRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" },
  confluenceTag: { padding: "3px 10px", borderRadius: "4px", fontSize: "10px", letterSpacing: "1px", border: "1px solid" },
  confluenceOn: { color: "#10b981", borderColor: "#10b98144", background: "#10b98111" },
  confluenceOff: { color: "#334155", borderColor: "#1e293b", background: "transparent" },
  tradeNotes: { fontSize: "12px", color: "#475569", borderLeft: "2px solid #1e293b", paddingLeft: "12px", fontStyle: "italic" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" },
  bigStatCard: { background: "#0d1526", border: "1px solid #1e293b", borderRadius: "8px", padding: "16px", textAlign: "center" },
  bigStatVal: { fontSize: "24px", fontWeight: "700" },
  bigStatLabel: { fontSize: "10px", color: "#475569", letterSpacing: "1px", marginTop: "4px" },
  sectionTitle: { fontSize: "11px", letterSpacing: "3px", color: "#475569", marginBottom: "16px", marginTop: "24px" },
  setupStat: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  setupStatName: { fontSize: "11px", color: "#94a3b8", width: "130px", flexShrink: 0 },
  setupStatBar: { flex: 1, height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" },
  setupStatFill: { height: "100%", borderRadius: "3px", transition: "width 0.5s" },
  setupStatWR: { fontSize: "11px", color: "#60a5fa", width: "70px", textAlign: "right" },
};
