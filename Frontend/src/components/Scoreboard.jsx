import "./Scoreboard.css";
import { calcSR, calcER, calcCRR, ovD, ballClass } from "../utils";

/* ─── Score Hero ─────────────────────────────────────── */
export function ScoreHero({ inn, inning, batName, target, runsNeeded, ballsLeft, rrr, isDesktop }) {
  const crr = calcCRR(inn.runs, inn.balls);
  const stats = [
    ["CRR", crr],
    target ? ["Target", target] : null,
    rrr    ? ["RRR", rrr]       : null,
  ].filter(Boolean);

  return (
    <div className={`score-hero${isDesktop ? " score-hero--desktop" : ""}`}>
      <div className="score-hero__inn-label">
        {batName} · {inning === 2 ? "2nd" : "1st"} Innings
      </div>
      <div className="score-hero__main">
        <span className={`score-hero__big${isDesktop ? " score-hero__big--desktop" : ""}`}>
          {inn.runs}–{inn.wickets}
        </span>
        <span className={`score-hero__overs${isDesktop ? " score-hero__overs--desktop" : ""}`}>
          ({ovD(inn.balls)})
        </span>
      </div>
      <div className={`score-hero__stats${isDesktop ? " score-hero__stats--desktop" : ""}`}>
        {stats.map(([label, val]) => (
          <div key={label}>
            <div className="score-hero__stat-label">{label}</div>
            <div className={`score-hero__stat-val${isDesktop ? " score-hero__stat-val--desktop" : ""}`}>{val}</div>
          </div>
        ))}
      </div>
      {inning === 2 && runsNeeded > 0 && (
        <div className="score-hero__chase">
          {batName} need {runsNeeded} runs in {ballsLeft} balls
        </div>
      )}
    </div>
  );
}

/* ─── Teams Bar ──────────────────────────────────────── */
export function TeamsBar({ innings, currentInning, battingTeam, matchConfig, isDesktop, onStatsClick }) {
  return (
    <div
      className={`teams-bar${onStatsClick ? " teams-bar--clickable" : ""}`}
      onClick={onStatsClick}
      title={onStatsClick ? "Tap to see full player stats" : undefined}
    >
      {[0, 1].map(i => {
        const ti   = innings[i];
        const name = i === 0
          ? (battingTeam === "team1" ? matchConfig.team2 : matchConfig.team1)
          : (battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2);
        const active = i === currentInning - 1;
        return (
          <div key={i} className={`teams-bar__card${active ? " active" : ""}`}>
            <div className="teams-bar__inner">
              <div className="teams-bar__left">
                <div className={`team-badge team-badge--sm${i === 1 ? " team-badge--dark" : ""}`}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="teams-bar__name">{name}</div>
                  <div className="teams-bar__inn-tag">{i === 0 ? "1st" : "2nd"} Inn</div>
                </div>
              </div>
              <div className="teams-bar__right">
                <div className={`teams-bar__score${isDesktop ? " teams-bar__score--desktop" : ""}`}>
                  {ti.runs}/{ti.wickets}
                </div>
                <div className="teams-bar__overs">
                  ({ovD(ti.balls)})
                  {active && <span className="live-badge">LIVE</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {onStatsClick && (
        <div className="teams-bar__tap-hint">📊</div>
      )}
    </div>
  );
}

/* ─── Live Stats Modal ───────────────────────────────── */
export function LiveStatsModal({ innings, inn1BatName, inn1BowlName, inn2BatName, inn2BowlName, inn2Started, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📊 Full Match Stats</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-scroll">

          {/* 1st Innings Batting */}
          <div className="sec-title" style={{ marginTop: 4 }}>{inn1BatName} – 1st Innings Batting</div>
          <table className="cric-table">
            <thead>
              <tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Status</th></tr>
            </thead>
            <tbody>
              {innings[0].batsmen.filter(b => b.balls > 0 || innings[0].activeBat.includes(innings[0].batsmen.indexOf(b))).map((b, i) => {
                const isActive  = innings[0].activeBat.includes(innings[0].batsmen.indexOf(b));
                const isStriker = innings[0].activeBat[0] === innings[0].batsmen.indexOf(b);
                return (
                  <tr key={i} className={isActive ? "row-active" : ""}>
                    <td>
                      <div className={b.out ? "player-name player-name--out" : "player-name"}>
                        {b.name}{!b.out && isStriker ? " *" : ""}
                      </div>
                    </td>
                    <td>{b.runs}</td><td>{b.balls}</td>
                    <td>{b.fours}</td><td>{b.sixes}</td>
                    <td>{calcSR(b.runs, b.balls)}</td>
                    <td style={{ fontSize: 11, color: "var(--c-faint)" }}>{b.out ? b.howOut : "not out"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="inn-summary__extras">
            Extras: {innings[0].extras.wide + innings[0].extras.nb + innings[0].extras.byes + innings[0].extras.lb}
            &nbsp;(WD {innings[0].extras.wide}, NB {innings[0].extras.nb}, B {innings[0].extras.byes}, LB {innings[0].extras.lb})
          </div>
          <div className="inn-summary__total">
            Total: {innings[0].runs}/{innings[0].wickets} ({ovD(innings[0].balls)}) &nbsp; CRR {calcCRR(innings[0].runs, innings[0].balls)}
          </div>

          {/* 1st Innings Bowling */}
          <div className="sec-title" style={{ marginTop: 16 }}>{inn1BowlName} – 1st Innings Bowling</div>
          <table className="cric-table">
            <thead>
              <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>
            </thead>
            <tbody>
              {innings[0].bowlers.filter(b => b.balls > 0).map((b, i) => (
                <tr key={i}>
                  <td><span className="player-name">{b.name}</span></td>
                  <td>{b.overs}.{b.balls % 6}</td>
                  <td>{b.maidens}</td><td>{b.runs}</td><td>{b.wickets}</td>
                  <td>{calcER(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 2nd Innings — only if started */}
          {inn2Started && (<>
            <div className="sec-title" style={{ marginTop: 20 }}>{inn2BatName} – 2nd Innings Batting</div>
            <table className="cric-table">
              <thead>
                <tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Status</th></tr>
              </thead>
              <tbody>
                {innings[1].batsmen.filter(b => b.balls > 0 || innings[1].activeBat.includes(innings[1].batsmen.indexOf(b))).map((b, i) => {
                  const isActive  = innings[1].activeBat.includes(innings[1].batsmen.indexOf(b));
                  const isStriker = innings[1].activeBat[0] === innings[1].batsmen.indexOf(b);
                  return (
                    <tr key={i} className={isActive ? "row-active" : ""}>
                      <td>
                        <div className={b.out ? "player-name player-name--out" : "player-name"}>
                          {b.name}{!b.out && isStriker ? " *" : ""}
                        </div>
                      </td>
                      <td>{b.runs}</td><td>{b.balls}</td>
                      <td>{b.fours}</td><td>{b.sixes}</td>
                      <td>{calcSR(b.runs, b.balls)}</td>
                      <td style={{ fontSize: 11, color: "var(--c-faint)" }}>{b.out ? b.howOut : "not out"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="inn-summary__extras">
              Extras: {innings[1].extras.wide + innings[1].extras.nb + innings[1].extras.byes + innings[1].extras.lb}
              &nbsp;(WD {innings[1].extras.wide}, NB {innings[1].extras.nb}, B {innings[1].extras.byes}, LB {innings[1].extras.lb})
            </div>
            <div className="inn-summary__total">
              Total: {innings[1].runs}/{innings[1].wickets} ({ovD(innings[1].balls)}) &nbsp; CRR {calcCRR(innings[1].runs, innings[1].balls)}
            </div>

            <div className="sec-title" style={{ marginTop: 16 }}>{inn2BowlName} – 2nd Innings Bowling</div>
            <table className="cric-table">
              <thead>
                <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>
              </thead>
              <tbody>
                {innings[1].bowlers.filter(b => b.balls > 0).map((b, i) => (
                  <tr key={i}>
                    <td><span className="player-name">{b.name}</span></td>
                    <td>{b.overs}.{b.balls % 6}</td>
                    <td>{b.maidens}</td><td>{b.runs}</td><td>{b.wickets}</td>
                    <td>{calcER(b.runs, b.balls)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>)}

        </div>
      </div>
    </div>
  );
}

/* ─── Active Players ─────────────────────────────────── */
export function ActivePlayers({ inn }) {
  const bat1    = inn.batsmen[inn.activeBat[0]];
  const bat2    = inn.batsmen[inn.activeBat[1]];
  const bowler  = inn.bowlers[inn.activeBowler];

  return (
    <div className="card">
      <table className="cric-table">
        <thead>
          <tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
        </thead>
        <tbody>
          {[bat1, bat2].filter(Boolean).map((b, i) => (
            <tr key={i}>
              <td><span className="player-name">{b.name}{i === 0 ? " *" : ""}</span></td>
              <td>{b.runs}</td><td>{b.balls}</td>
              <td>{b.fours}</td><td>{b.sixes}</td>
              <td>{calcSR(b.runs, b.balls)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="active-players__divider" />

      <table className="cric-table">
        <thead>
          <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="player-name">{bowler?.name}</span></td>
            <td>{bowler?.overs}.{(bowler?.balls ?? 0) % 6}</td>
            <td>{bowler?.maidens}</td>
            <td>{bowler?.runs}</td>
            <td>{bowler?.wickets}</td>
            <td>{calcER(bowler?.runs, bowler?.balls)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── This Over ──────────────────────────────────────── */
export function ThisOver({ currentOver }) {
  return (
    <div className="card">
      <div className="this-over">
        <span className="this-over__label">This over:</span>
        {currentOver.map((b, i) => (
          <div key={i} className={ballClass(b)}>{b}</div>
        ))}
        {currentOver.length === 0 && <span style={{ fontSize: 12, color: "var(--c-faint)" }}>–</span>}
      </div>
    </div>
  );
}

/* ─── Extras Panel ───────────────────────────────────── */
export function ExtrasPanel({ extras, setExtras, onSwap, onChangeBowler }) {
  const checks = [
    ["wide",    "Wide"],
    ["noBall",  "No Ball"],
    ["byes",    "Byes"],
    ["legByes", "Leg Byes"],
    ["wicket",  "Wicket"],
  ];
  return (
    <div className="card">
      <div className="extras-row">
        {checks.map(([k, label]) => (
          <label key={k} className={`extras-check${extras[k] ? " checked" : ""}`}>
            <input
              type="checkbox"
              checked={extras[k]}
              onChange={e => setExtras(ex => ({ ...ex, [k]: e.target.checked }))}
              style={{ accentColor: "var(--c-green)" }}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="action-row">
        <button className="btn-outline" onClick={onSwap}>↔ Swap Batsman</button>
        <button className="btn-outline" onClick={onChangeBowler}>🔄 Change Bowler</button>
      </div>
    </div>
  );
}

/* ─── Run Pad ────────────────────────────────────────── */
export function RunPad({ onAddBall, onUndo, onAnalysis, runAnim }) {
  return (
    <div className="card">
      <div className="run-pad">
        <div className="run-pad__actions">
          <button className="btn-green btn-green--sm" onClick={onUndo}>↩ Undo</button>
          <button className="btn-green btn-green--sm" onClick={onAnalysis}>📈 Analysis</button>
        </div>
        <div className="run-pad__grid">
          {[0, 1, 2, 3, 4, 5, 6, "·"].map((r, i) => (
            <button
              key={i}
              className={`btn-run${runAnim === r ? " active" : ""}`}
              onClick={() => typeof r === "number" && onAddBall(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Full Batting Card ──────────────────────────────── */
export function FullBatCard({ inn, batName }) {
  const crr = calcCRR(inn.runs, inn.balls);
  return (
    <div className="card">
      <div className="sec-title">{batName} – Batting</div>
      <table className="cric-table">
        <thead>
          <tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
        </thead>
        <tbody>
          {inn.batsmen
            .filter(b => b.balls > 0 || inn.activeBat.includes(inn.batsmen.indexOf(b)))
            .map((b, i) => {
              const isActive = inn.activeBat.includes(inn.batsmen.indexOf(b));
              const isStriker = inn.activeBat[0] === inn.batsmen.indexOf(b);
              return (
                <tr key={i} className={isActive ? "row-active" : ""}>
                  <td>
                    <div className={b.out ? "player-name player-name--out" : "player-name"}>
                      {b.name}{!b.out && isStriker ? " *" : ""}
                    </div>
                    <div className="player-how-out">{b.out ? b.howOut : "not out"}</div>
                  </td>
                  <td>{b.runs}</td><td>{b.balls}</td>
                  <td>{b.fours}</td><td>{b.sixes}</td>
                  <td>{calcSR(b.runs, b.balls)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <div className="inn-summary__extras">
        Extras: {inn.extras.wide + inn.extras.nb + inn.extras.byes + inn.extras.lb}
        &nbsp;(WD {inn.extras.wide}, NB {inn.extras.nb}, B {inn.extras.byes}, LB {inn.extras.lb})
      </div>
      <div className="inn-summary__total">
        Total: {inn.runs}/{inn.wickets} ({ovD(inn.balls)}) &nbsp; CRR {crr}
      </div>
    </div>
  );
}

/* ─── Full Bowling Card ──────────────────────────────── */
export function FullBowlCard({ inn, bowlName }) {
  return (
    <div className="card">
      <div className="sec-title">{bowlName} – Bowling</div>
      <table className="cric-table">
        <thead>
          <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>
        </thead>
        <tbody>
          {inn.bowlers.filter(b => b.balls > 0).map((b, i) => (
            <tr key={i}>
              <td><span className="player-name">{b.name}</span></td>
              <td>{b.overs}.{b.balls % 6}</td>
              <td>{b.maidens}</td><td>{b.runs}</td><td>{b.wickets}</td>
              <td>{calcER(b.runs, b.balls)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}