import { useState } from "react";
import "./Analysis.css";
import { ovD, calcCRR } from "../utils";

/* ─── Run Rate Chart ─────────────────────────────────── */
function RunRateChart({ innings, t1Name, t2Name, isDesktop }) {
  const W = isDesktop ? 520 : 310, H = isDesktop ? 240 : 200, PAD = 38;
  const tx = (v, mx) => PAD + (v / (mx || 1)) * (W - PAD * 2);
  const ty = (v, mx) => H - PAD - (v / (mx || 1)) * (H - PAD * 2);

  const rrData1 = innings[0].overs.map((_, i) => ({
    over: i + 1,
    rr: innings[0].overs.slice(0, i + 1).reduce((s, o) => s + o.runs, 0) / (i + 1),
  }));
  const rrData2 = innings[1].overs.map((_, i) => ({
    over: i + 1,
    rr: innings[1].overs.slice(0, i + 1).reduce((s, o) => s + o.runs, 0) / (i + 1),
  }));

  const maxO  = Math.max(rrData1.length, rrData2.length, 1);
  const maxRR = Math.max(...rrData1.map(d => d.rr), ...rrData2.map(d => d.rr), 10);

  // No data yet
  if (rrData1.length === 0 && rrData2.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"32px 0", color:"var(--c-faint)", fontSize:13 }}>
        No overs completed yet
      </div>
    );
  }

  return (
    <div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`}>
        <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2}
          fill="var(--c-green-bg)" rx="6" />
        {[0,1,2,3,4].map(t => {
          const v  = maxRR * t / 4;
          const yp = ty(v, maxRR);
          return (
            <g key={t}>
              <line x1={PAD} y1={yp} x2={W - PAD} y2={yp}
                stroke="var(--c-green-faint)" strokeWidth="1" />
              <text x={PAD - 5} y={yp + 4} textAnchor="end"
                fontSize="9" fill="var(--c-faint)">{v.toFixed(1)}</text>
            </g>
          );
        })}
        {Array.from({ length: maxO + 1 }, (_, i) => (
          <text key={i} x={tx(i, maxO)} y={H - 8}
            textAnchor="middle" fontSize="9" fill="var(--c-faint)">{i}</text>
        ))}
        {rrData1.length > 0 && (
          <polyline
            points={[{over:0,rr:0}, ...rrData1].map(d =>
              `${tx(d.over, maxO)},${ty(d.rr, maxRR)}`).join(" ")}
            fill="none" stroke="var(--c-teal)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {rrData1.map((d, i) => (
          <circle key={i} cx={tx(d.over, maxO)} cy={ty(d.rr, maxRR)}
            r="3.5" fill="var(--c-teal)" stroke="#fff" strokeWidth="1.5" />
        ))}
        {rrData2.length > 0 && (
          <polyline
            points={[{over:0,rr:0}, ...rrData2].map(d =>
              `${tx(d.over, maxO)},${ty(d.rr, maxRR)}`).join(" ")}
            fill="none" stroke="var(--c-primary)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {rrData2.map((d, i) => (
          <circle key={i} cx={tx(d.over, maxO)} cy={ty(d.rr, maxRR)}
            r="3.5" fill="var(--c-primary)" stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend__item chart-legend__item--t1">■ {t1Name}</span>
        <span className="chart-legend__item chart-legend__item--t2">■ {t2Name}</span>
      </div>
      <p className="chart-x-label">Overs →</p>
    </div>
  );
}

/* ─── Safe innings helper ────────────────────────────── */
function safeInn(raw) {
  if (!raw) return { runs:0, wickets:0, balls:0, extras:{wide:0,nb:0,byes:0,lb:0}, overs:[], batsmen:[], bowlers:[], activeBat:[0,1], activeBowler:0 };
  return {
    runs:     raw.runs     ?? 0,
    wickets:  raw.wickets  ?? 0,
    balls:    raw.balls    ?? 0,
    extras:   raw.extras   ?? { wide:0, nb:0, byes:0, lb:0 },
    overs:    Array.isArray(raw.overs)   ? raw.overs   : [],
    batsmen:  Array.isArray(raw.batsmen) ? raw.batsmen : [],
    bowlers:  Array.isArray(raw.bowlers) ? raw.bowlers : [],
    activeBat:    Array.isArray(raw.activeBat) ? raw.activeBat : [0,1],
    activeBowler: raw.activeBowler ?? 0,
  };
}

/* ─── Match content (chart + summary + performers) ──── */
function MatchAnalysis({ inn1, inn2, t1Name, t2Name, isDesktop }) {
  const innings = [safeInn(inn1), safeInn(inn2)];

  return (
    <>
      {/* Run Rate Chart */}
      <div className="card chart-card">
        <div className="sec-title" style={{ marginBottom: 12 }}>Run Rate Comparison</div>
        <RunRateChart innings={innings} t1Name={t1Name} t2Name={t2Name} isDesktop={isDesktop} />
      </div>

      {/* Summary */}
      <div className="card">
        <div className="sec-title">Match Summary</div>
        {innings.map((inn, i) => (
          <div key={i} className="summary-row">
            <div className="summary-row__team">{i === 0 ? t1Name : t2Name}</div>
            <div className="summary-row__stats">
              {inn.runs}/{inn.wickets} in {ovD(inn.balls)} overs
              &nbsp;·&nbsp; CRR {calcCRR(inn.runs, inn.balls)}
              &nbsp;·&nbsp; 4s {inn.batsmen.reduce((a, b) => a + (b.fours||0), 0)}
              &nbsp;·&nbsp; 6s {inn.batsmen.reduce((a, b) => a + (b.sixes||0), 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Top performers */}
      {innings.map((inn, ii) => inn.batsmen.length > 0 && (
        <div key={ii} className="card">
          <div className="sec-title">{ii === 0 ? t1Name : t2Name} – Top Performers</div>
          <div className="performer-grid">
            <div>
              <div className="performer-col__label">Bat</div>
              {[...inn.batsmen].sort((a,b) => b.runs - a.runs).slice(0,3).map((b,i) => (
                <div key={i} className="performer-row">
                  <span>{b.name}</span>
                  <span className="performer-row__val">{b.runs}({b.balls})</span>
                </div>
              ))}
            </div>
            <div>
              <div className="performer-col__label">Bowl</div>
              {[...inn.bowlers].filter(b => b.balls > 0).sort((a,b) => b.wickets - a.wickets).slice(0,3).map((b,i) => (
                <div key={i} className="performer-row">
                  <span>{b.name}</span>
                  <span className="performer-row__val">{b.wickets}/{b.runs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Main export ────────────────────────────────────── */
export default function Analysis({ innings, t1Name, t2Name, isDesktop, history = [] }) {
  // "live" = current match, or index into history array
  const [selected, setSelected] = useState("live");

  // Build list of completed matches from history (exclude in-progress)
  const completed = history.filter(h =>
    h.status && h.status !== "In Progress" &&
    (h.inn1?.batsmen?.length > 0 || h.inn2?.batsmen?.length > 0)
  );

  // Determine what to show
  const isLive = selected === "live";
  const histMatch = !isLive ? completed[parseInt(selected)] : null;

  const displayInn1  = isLive ? innings[0]       : histMatch?.inn1;
  const displayInn2  = isLive ? innings[1]       : histMatch?.inn2;
  const displayT1    = isLive ? t1Name           : (histMatch?.team1 || "Team 1");
  const displayT2    = isLive ? t2Name           : (histMatch?.team2 || "Team 2");
  const displayStatus = isLive ? null            : histMatch?.status;

  /* ── Match picker ── */
  const MatchPicker = () => (
    <div className="analysis-picker">
      {/* Live match option */}
      <button
        className={`analysis-picker__btn${isLive ? " active" : ""}`}
        onClick={() => setSelected("live")}
      >
        <span className="analysis-picker__icon">🏏</span>
        <div>
          <div className="analysis-picker__label">Live Match</div>
          <div className="analysis-picker__sub">{t1Name} vs {t2Name}</div>
        </div>
      </button>

      {/* Completed matches */}
      {completed.map((h, i) => (
        <button
          key={i}
          className={`analysis-picker__btn${selected === String(i) ? " active" : ""}`}
          onClick={() => setSelected(String(i))}
        >
          <span className="analysis-picker__icon">🏆</span>
          <div>
            <div className="analysis-picker__label">{h.team1} vs {h.team2}</div>
            <div className="analysis-picker__sub">{h.date} · {h.status?.slice(0,28)}{h.status?.length > 28 ? "…" : ""}</div>
          </div>
        </button>
      ))}

      {completed.length === 0 && (
        <div className="analysis-picker__empty">No completed matches yet</div>
      )}
    </div>
  );

  const Content = () => (
    <div>
      {/* Result banner for history matches */}
      {displayStatus && (
        <div className="analysis-result-banner">🏆 {displayStatus}</div>
      )}
      <MatchAnalysis
        inn1={displayInn1}
        inn2={displayInn2}
        t1Name={displayT1}
        t2Name={displayT2}
        isDesktop={isDesktop}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <div className="analysis-layout">
        <div className="analysis-desktop-layout">
          {/* Left: match picker */}
          <div className="analysis-desktop-sidebar">
            <div className="sec-title" style={{ marginBottom: 12 }}>Select Match</div>
            <MatchPicker />
          </div>
          {/* Right: analysis content */}
          <div className="analysis-desktop-main">
            <Content />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-layout--mobile">
      {/* Horizontal scroll picker on mobile */}
      <div className="sec-title" style={{ marginBottom: 8 }}>Select Match</div>
      <MatchPicker />
      <div style={{ marginTop: 12 }}>
        <Content />
      </div>
    </div>
  );
}