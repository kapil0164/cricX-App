import { useState, useEffect } from "react";
import "./App.css";
import "./styles/components.css";

import { useWindowSize }  from "./hooks/useWindowSize";
import { INIT_MATCH, INIT_EX, INIT_INN, mkBat, mkBowl, SAMPLE_HISTORY, ovD, findManOfTheMatch, extractBestPerformances } from "./utils";

import {
  ScoreHero, TeamsBar, ActivePlayers,
  ThisOver, ExtrasPanel, RunPad,
  FullBatCard, FullBowlCard,
  LiveStatsModal,
} from "./components/Scoreboard";
import Overs      from "./components/Overs";
import PlayerList from "./components/PlayerList";
import Squads     from "./components/Squads";
import Analysis   from "./components/Analysis";
import MatchSetup from "./components/MatchSetup";
import History    from "./components/History";
import Auth       from "./components/Auth";
import { fetchHistory, saveMatch, deleteMatch, signUp, signIn, signOut, getMe } from "./api";

/* ── Sidebar nav items ── */
const NAV_ITEMS = [
  { id: "home",     icon: "🏠", label: "Home"      },
  { id: "match",    icon: "🏏", label: "Live Match" },
  { id: "analysis", icon: "📈", label: "Analysis"   },
  { id: "history",  icon: "🕐", label: "History"    },
];

function IconBtn({ children, onClick }) {
  return <button className="icon-btn" onClick={onClick}>{children}</button>;
}

function NotificationsDropdown({ visible, history = [], onClose, onResume, onOpenHistory }) {
  if (!visible) return null;
  return (
    <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
      <div className="notif-dropdown__header">Notifications</div>
      <div className="notif-dropdown__list">
        {history.length === 0 && <div className="notif-empty">No notifications</div>}
        {history.map((h, i) => (
          <div key={i} className="notif-item">
            <div className="notif-item__left">
              <div className="team-badge team-badge--sm">{(h.team1||'T1').slice(0,2).toUpperCase()}</div>
            </div>
            <div className="notif-item__body">
              <div className="notif-item__title">{h.team1} vs {h.team2}</div>
              <div className="notif-item__meta">{h.date} · {h.time} · {h.status || 'Saved'}</div>
            </div>
            <div className="notif-item__actions">
              <button className="btn-link" onClick={() => { onResume && onResume(h); onClose(); }}>Resume</button>
              <button className="btn-link" onClick={() => { onOpenHistory && onOpenHistory(); onClose(); }}>Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SAFE DEEP COPY — guarantees every innings object has
   all required fields even if it came from partial
   history data (SAMPLE_HISTORY only has runs/wickets/balls)
══════════════════════════════════════════════════════ */
function safeInn(raw) {
  const base = INIT_INN();
  if (!raw) return base;
  return {
    runs:         typeof raw.runs     === "number" ? raw.runs     : 0,
    wickets:      typeof raw.wickets  === "number" ? raw.wickets  : 0,
    balls:        typeof raw.balls    === "number" ? raw.balls    : 0,
    extras: {
      wide: raw.extras?.wide ?? 0,
      nb:   raw.extras?.nb   ?? 0,
      byes: raw.extras?.byes ?? 0,
      lb:   raw.extras?.lb   ?? 0,
    },
    overs:        Array.isArray(raw.overs)     ? raw.overs.map(o => ({ runs: o.runs ?? 0, balls: Array.isArray(o.balls) ? [...o.balls] : [] })) : [],
    batsmen:      Array.isArray(raw.batsmen)   ? raw.batsmen.map(b => ({ ...b }))  : [],
    bowlers:      Array.isArray(raw.bowlers)   ? raw.bowlers.map(b => ({ ...b }))  : [],
    activeBat:    Array.isArray(raw.activeBat) ? [...raw.activeBat] : [0, 1],
    activeBowler: typeof raw.activeBowler === "number" ? raw.activeBowler : 0,
  };
}

/* Safe deep copy of the full innings array — used in undo snapshot */
function deepCopyInnings(src) {
  return src.map(i => safeInn(i));
}

/* ══════════════════════════════════════════════════════
   HISTORY SCOREBOARD MODAL
══════════════════════════════════════════════════════ */
function HistoryScoreboardModal({ match, onClose }) {
  const innings = [
    { label: "1st Innings", team: match.team1, inn: safeInn(match.inn1) },
    { label: "2nd Innings", team: match.team2, inn: safeInn(match.inn2) },
  ];

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(30,20,60,0.6)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:20, width:"100%", maxWidth:540,
        maxHeight:"88vh", overflow:"auto",
        boxShadow:"0 8px 40px rgba(92,53,196,0.3)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background:"linear-gradient(135deg,#3b1f8c,#5c35c4)",
          borderRadius:"20px 20px 0 0", padding:"18px 20px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div>
            <div style={{ color:"#c4b0ff", fontSize:12, fontWeight:600 }}>{match.date} · {match.time}</div>
            <div style={{ color:"#fff", fontSize:17, fontWeight:800, marginTop:2 }}>
              {match.team1} vs {match.team2}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.18)", border:"none", color:"#fff",
            fontSize:18, borderRadius:10, padding:"5px 12px", cursor:"pointer",
          }}>✕</button>
        </div>

        <div style={{ padding:16 }}>
          {/* Result badge */}
          <div style={{
            background:"#ede8fb", borderRadius:10, padding:"10px 14px",
            color:"#5c35c4", fontWeight:700, fontSize:14, marginBottom:16,
          }}>🏆 {match.status}</div>

          {match.manOfTheMatch && (
            <div style={{
              background:"rgba(92,53,196,0.08)", borderRadius:12, padding:"12px 14px",
              marginBottom:14, border:"1px solid rgba(92,53,196,0.12)",
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#341f69", marginBottom:6 }}>🏅 Man of the Match</div>
              <div style={{ fontSize:15, fontWeight:800, color:"#1a1530" }}>{match.manOfTheMatch.name}</div>
              <div style={{ fontSize:12, color:"#6f64a1" }}>{match.manOfTheMatch.team} · {match.manOfTheMatch.role}</div>
              <div style={{ marginTop:8, fontSize:12, color:"#534ea3" }}>{match.manOfTheMatch.summary}</div>
            </div>
          )}

          {innings.map(({ label, team, inn }, idx) => (
            <div key={idx} style={{ marginBottom:20 }}>
              {/* Innings header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:10, color:"#7065a0", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#1a1530" }}>{team}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:"#3b1f8c", lineHeight:1 }}>
                    {inn.runs}/{inn.wickets}
                  </div>
                  <div style={{ fontSize:12, color:"#7065a0" }}>({ovD(inn.balls)} ov)</div>
                </div>
              </div>

              {/* Batting table — only if player data available */}
              {inn.batsmen.length > 0 ? (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:8 }}>
                  <thead>
                    <tr style={{ background:"#faf9ff" }}>
                      {["Batsman","R","B","4s","6s","SR"].map(h => (
                        <th key={h} style={{ padding:"5px 6px", textAlign:"left", fontSize:10, color:"#7065a0", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inn.batsmen.filter(b => b.balls > 0 || !b.out).map((b, i) => {
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : "–";
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid #f0eeff" }}>
                          <td style={{ padding:"6px 6px" }}>
                            <div style={{ fontWeight: b.out ? 400 : 700, color: b.out ? "#c4b8e8" : "#5c35c4", textDecoration: b.out ? "line-through" : "none" }}>{b.name}</div>
                            <div style={{ fontSize:10, color:"#c4b8e8" }}>{b.out ? b.howOut : "not out"}</div>
                          </td>
                          <td style={{ padding:"6px 6px", fontWeight:700 }}>{b.runs}</td>
                          <td style={{ padding:"6px 6px" }}>{b.balls}</td>
                          <td style={{ padding:"6px 6px" }}>{b.fours}</td>
                          <td style={{ padding:"6px 6px" }}>{b.sixes}</td>
                          <td style={{ padding:"6px 6px", color:"#7065a0" }}>{sr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ fontSize:12, color:"#c4b8e8", fontStyle:"italic", marginBottom:8 }}>
                  Detailed batting stats not available for this match.
                </div>
              )}

              {/* Bowling table */}
              {inn.bowlers.filter(b => b.balls > 0).length > 0 && (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#faf9ff" }}>
                      {["Bowler","O","R","W","ER"].map(h => (
                        <th key={h} style={{ padding:"5px 6px", textAlign:"left", fontSize:10, color:"#7065a0", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inn.bowlers.filter(b => b.balls > 0).map((b, i) => {
                      const er = b.balls > 0 ? (b.runs / (b.balls / 6)).toFixed(2) : "–";
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid #f0eeff" }}>
                          <td style={{ padding:"6px 6px", fontWeight:700, color:"#5c35c4" }}>{b.name}</td>
                          <td style={{ padding:"6px 6px" }}>{b.overs}.{b.balls % 6}</td>
                          <td style={{ padding:"6px 6px" }}>{b.runs}</td>
                          <td style={{ padding:"6px 6px", fontWeight:700 }}>{b.wickets}</td>
                          <td style={{ padding:"6px 6px", color:"#7065a0" }}>{er}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Extras */}
              <div style={{ fontSize:11, color:"#7065a0", marginTop:6 }}>
                Extras: {(inn.extras.wide) + (inn.extras.nb) + (inn.extras.byes) + (inn.extras.lb)}
                &nbsp;(WD {inn.extras.wide}, NB {inn.extras.nb}, B {inn.extras.byes}, LB {inn.extras.lb})
              </div>

              {idx === 0 && <hr style={{ border:"none", borderTop:"1px solid #e4ddf7", margin:"16px 0 0" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultBanner({ mobile = false, matchEnded, screen, matchStatus }) {
  return matchEnded && screen === "match"
    ? <div className={`result-banner${mobile ? " result-banner--mobile" : ""}`}>🏆 {matchStatus}</div>
    : null;
}

function PerformerCard({ performer }) {
  if (!performer) return null;
  return (
    <div className="performer-card">
      <div className="performer-card__header">
        <div>
          <div className="performer-card__label">🏅 Man of the Match</div>
          <div className="performer-card__name">{performer.name}</div>
          <div className="performer-card__team">{performer.team} · {performer.role}</div>
        </div>
        <div className="performer-card__badge">Best Player</div>
      </div>
      <div className="performer-card__stats">
        {performer.runs !== 0 && <div><span>Runs</span><strong>{performer.runs}</strong></div>}
        {performer.balls !== 0 && <div><span>Balls</span><strong>{performer.balls}</strong></div>}
        {performer.fours !== 0 && <div><span>4s</span><strong>{performer.fours}</strong></div>}
        {performer.sixes !== 0 && <div><span>6s</span><strong>{performer.sixes}</strong></div>}
        {performer.wickets !== 0 && <div><span>Wkts</span><strong>{performer.wickets}</strong></div>}
        {performer.bowlBalls !== 0 && <div><span>Overs</span><strong>{performer.overs}.{performer.bowlBalls % 6}</strong></div>}
        {performer.runsConceded !== 0 && <div><span>Runs</span><strong>{performer.runsConceded}</strong></div>}
        {performer.strikeRate !== "0.00" && <div><span>SR</span><strong>{performer.strikeRate}</strong></div>}
        {performer.economy !== "0.00" && <div><span>ER</span><strong>{performer.economy}</strong></div>}
      </div>
      <div className="performer-card__summary">{performer.summary}</div>
    </div>
  );
}

function Modal({ scoreboardMatch, onClose }) {
  return scoreboardMatch ? <HistoryScoreboardModal match={scoreboardMatch} onClose={onClose} /> : null;
}

function LiveStatsOverlay({ showLiveStats, innings, inn1BatName, inn1BowlName, inn2BatName, inn2BowlName, inn2Started, onClose }) {
  return showLiveStats ? (
    <LiveStatsModal
      innings={innings}
      inn1BatName={inn1BatName}
      inn1BowlName={inn1BowlName}
      inn2BatName={inn2BatName}
      inn2BowlName={inn2BowlName}
      inn2Started={inn2Started}
      onClose={onClose}
    />
  ) : null;
}

function UserBadge({ currentUser, onSignOut, history = [] }) {
  const savedCount = history.length;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, position:"relative" }}>
      {/* Notification bell */}
      <div style={{ position:"relative" }}>
        <button className="icon-btn notif-bell" onClick={(e) => { e.stopPropagation(); const ev = new CustomEvent('toggle-notifs'); window.dispatchEvent(ev); }} title="Notifications">🔔</button>
        {savedCount > 0 && <div className="notif-badge">{savedCount}</div>}
      </div>

      <div style={{
        width:32, height:32, borderRadius:"50%",
        background:"linear-gradient(135deg,#7c3aed,#a78bfa)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:12, fontWeight:800, flexShrink:0,
      }}>{currentUser.avatar || currentUser.name.slice(0,2).toUpperCase()}</div>
      <button
        onClick={onSignOut}
        style={{
          background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)",
          color:"#fca5a5", borderRadius:8, padding:"5px 12px",
          fontSize:12, fontWeight:700, cursor:"pointer",
        }}
      >Sign Out</button>

      {/* Dropdown is mounted at App level via event — placeholder here for accessibility */}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════ */
export default function App() {
  const { isTablet, isDesktop } = useWindowSize();

  const [screen, setScreen]     = useState("home");
  const [matchTab, setMatchTab] = useState("scoreboard");
  const [scoreboardMatch, setScoreboardMatch] = useState(null);

  const [matchConfig, setMatchConfig] = useState({ ...INIT_MATCH });
  const [tmpConfig, setTmpConfig]     = useState({ ...INIT_MATCH });
  const [team1Players, setT1] = useState(["Devansh","Priyanshu","Utkarsh","Rahul","Shiv","Arjun"]);
  const [team2Players, setT2] = useState(["Kapil","Kaku","Sekhar","Mohit","Shivansh","Raj"]);

  const [inning, setInning]           = useState(1);
  const [battingTeam, setBat]         = useState("team1");
  const [innings, setInnings]         = useState([INIT_INN(), INIT_INN()]);
  const [currentOver, setCurrentOver] = useState([]);
  const [extras, setExtras]           = useState({ ...INIT_EX });
  const [matchStatus, setMatchStatus] = useState("");
  const [matchEnded, setMatchEnded]   = useState(false);
  const [manOfTheMatch, setManOfTheMatch] = useState(null);
  const [runAnim, setRunAnim]         = useState(null);
  const [undoStack, setUndoStack]     = useState([]);
  const [matchStarted, setMatchStarted] = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const onToggle = () => setShowNotifications(s => !s);
    const onDocClick = () => setShowNotifications(false);
    window.addEventListener('toggle-notifs', onToggle);
    document.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('toggle-notifs', onToggle);
      document.removeEventListener('click', onDocClick);
    };
  }, []);

  /* ── On startup: check token → load history ── */
  useEffect(() => {
    getMe()
      .then(user => {
        setCurrentUser(user);
        if (user) {
          return fetchHistory()
            .then(data => setHistory(data))
            .catch(() => setHistory(SAMPLE_HISTORY));
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  /* ── Derived ── */
  const inn        = innings[inning - 1];
  const batName    = battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2;
  const bowlName   = battingTeam === "team1" ? matchConfig.team2 : matchConfig.team1;
  const target     = inning === 2 ? innings[0].runs + 1 : null;
  const runsNeeded = target ? target - inn.runs : null;
  const ballsLeft  = inning === 2 ? matchConfig.overs * 6 - inn.balls : null;
  const rrr        = inning === 2 && ballsLeft > 0 ? (runsNeeded / (ballsLeft / 6)).toFixed(2) : null;

  /* ══ NAVIGATION ══ */
  function goTo(id) {
    setScreen(id === "match" && !matchStarted ? "setup" : id);
    if (id === "match" && !matchStarted) {
      // Fresh setup — clear team names so user types from scratch
      setTmpConfig({ ...INIT_MATCH, team1: "", team2: "" });
    }
  }

  /* Opens setup for a BRAND NEW match regardless of current state */
  function goToNewMatch() {
    setCurrentMatchId(null);
    setMatchStarted(false);
    setTmpConfig({ ...INIT_MATCH, team1: "", team2: "" });
    setScreen("setup");
  }

  /* ══ START MATCH ══ */
  function startMatch() {
    const cfg     = tmpConfig;
    const batting = cfg.tossWon === "team1"
      ? (cfg.optedTo === "bat" ? "team1" : "team2")
      : (cfg.optedTo === "bat" ? "team2" : "team1");
    const bp  = batting === "team1" ? team1Players : team2Players;
    const bwp = batting === "team1" ? team2Players : team1Players;

    setMatchConfig({ ...cfg });
    setBat(batting);
    setInning(1);
    setMatchEnded(false);
    setMatchStatus("");
    setManOfTheMatch(null);
    setCurrentOver([]);
    setExtras({ ...INIT_EX });
    setUndoStack([]);
    setInnings([
      { ...INIT_INN(), batsmen: bp.map(mkBat), bowlers: bwp.map(mkBowl) },
      INIT_INN(),
    ]);
    setMatchStarted(true);
    setMatchTab("scoreboard");
    setScreen("match");
  }

  /* ══ RESUME FROM HISTORY ══
     KEY FIX: safeInn() guarantees extras/batsmen/bowlers/overs
     are always valid arrays/objects even for old partial records.
     If no player data exists, we seed fresh rosters so scoring works.
  ══ */
  function resumeMatch(h) {
    const inn1Data = safeInn(h.inn1);
    const inn2Data = safeInn(h.inn2);

    // Seed rosters when history entry has no player data
    // Use saved battingTeam to assign correct team to each innings
    const savedBat = h.battingTeam || "team1";
    const inn1BatPlayers  = savedBat === "team1" ? team1Players : team2Players;
    const inn1BowlPlayers = savedBat === "team1" ? team2Players : team1Players;
    if (inn1Data.batsmen.length === 0) {
      inn1Data.batsmen = inn1BatPlayers.map(mkBat);
      inn1Data.bowlers = inn1BowlPlayers.map(mkBowl);
    }
    if (inn2Data.balls > 0 && inn2Data.batsmen.length === 0) {
      inn2Data.batsmen = inn1BowlPlayers.map(mkBat); // 2nd inn: who bowled in 1st now bats
      inn2Data.bowlers = inn1BatPlayers.map(mkBowl);
    }

    const inn2HasStarted = inn2Data.balls > 0 || inn2Data.batsmen.some(b => b.balls > 0);
    const ended = !!h.status && (
      h.status.toLowerCase().includes("won") ||
      h.status.toLowerCase().includes("tied")
    );

    setCurrentMatchId(h._id || null);
    setMatchConfig(h.matchConfig ? { ...h.matchConfig } : { ...INIT_MATCH, team1: h.team1 || "Team 1", team2: h.team2 || "Team 2" });
    setBat(h.battingTeam || "team1");
    setInnings([inn1Data, inn2Data]);
    setInning(h.inning || (inn2HasStarted ? 2 : 1));
    setCurrentOver(Array.isArray(h.currentOver) ? [...h.currentOver] : []);
    setExtras({ ...INIT_EX });
    setUndoStack([]);
    setMatchEnded(ended);
    setMatchStatus(ended ? (h.status || "") : "");
    setManOfTheMatch(h.manOfTheMatch || null);
    setMatchStarted(true);
    setMatchTab("scoreboard");
    setScreen("match");
  }

  /* ══ ADD BALL ══ */
  function addBall(runs) {
    if (matchEnded) return;
    const { wide, noBall, byes, legByes, wicket } = extras;

    // Snapshot for undo
    setUndoStack(stack => [
      ...stack,
      { innings: deepCopyInnings(innings), currentOver: [...currentOver], inning, battingTeam },
    ]);

    setRunAnim(runs);
    setTimeout(() => setRunAnim(null), 350);

    // Compute everything synchronously before any setState calls
    const next    = deepCopyInnings(innings);
    const cur     = next[inning - 1];
    const si      = cur.activeBat[0];
    const bi      = cur.activeBowler;
    const striker = cur.batsmen[si];
    const bowler  = cur.bowlers[bi];

    if (!striker || !bowler) return; // guard

    let label = String(runs), counts = true;

    if (wide) {
      const tot = matchConfig.wideBallRun + runs;
      cur.runs += tot; cur.extras.wide += tot; label = "WD"; counts = false;
    } else if (noBall) {
      const tot = matchConfig.noBallRun + runs;
      cur.runs += tot; cur.extras.nb += matchConfig.noBallRun;
      if (!byes && !legByes) {
        striker.runs += runs;
        if (runs === 4) striker.fours++;
        if (runs === 6) striker.sixes++;
      }
      striker.balls++; bowler.balls++; bowler.runs += tot;
      label = "NB"; counts = false;
    } else if (wicket) {
      striker.out = true; striker.howOut = "out"; striker.balls++;
      cur.wickets++; cur.balls++; cur.runs += runs;
      bowler.balls++; bowler.wickets++; bowler.runs += runs; label = "W";
      const ni = cur.batsmen.findIndex((b, idx) => !b.out && idx !== si && idx !== cur.activeBat[1]);
      if (ni !== -1) cur.activeBat = [ni, cur.activeBat[1]];
    } else {
      cur.balls++; striker.balls++; bowler.balls++;
      cur.runs += runs; bowler.runs += runs;
      if (!byes && !legByes) {
        striker.runs += runs;
        if (runs === 4) striker.fours++;
        if (runs === 6) striker.sixes++;
      } else if (byes) { cur.extras.byes += runs; }
      else              { cur.extras.lb   += runs; }
    }

    if (!wide && runs % 2 !== 0) cur.activeBat = [cur.activeBat[1], cur.activeBat[0]];

    // Build the updated current-over array synchronously
    const newOver = [...currentOver, label];
    let nextOver  = newOver; // what currentOver will be after this ball

    if (counts && cur.balls % 6 === 0 && cur.balls > 0) {
      const or = newOver.reduce((s, b) => { const n = parseInt(b); return s + (isNaN(n) ? 0 : n); }, 0);
      cur.overs = [...cur.overs, { balls: newOver, runs: or }];
      bowler.overs = Math.floor(bowler.balls / 6);
      nextOver = []; // over complete — reset
      cur.activeBat = [cur.activeBat[1], cur.activeBat[0]];
    }

    // Commit all state at once — no stale closures
    setInnings(next);
    setCurrentOver(nextOver);
    setExtras({ ...INIT_EX });

    // Save snapshot and check end — pass computed values explicitly
    setTimeout(() => {
      const endResult = checkEnd(next);
      // Only snapshot in-progress if the match neither ended nor transitioned innings
      // (innings transition resets state itself; ended match saves via checkEnd)
      if (endResult === null) {
        saveInProgress(next, nextOver, battingTeam, inning);
      }
    }, 20);
  }

  /* ══ UNDO LAST BALL — full state restore ══ */
  function undoLastBall() {
    if (undoStack.length === 0) return;
    const snap = undoStack[undoStack.length - 1];
    setUndoStack(stack => stack.slice(0, -1));
    setInnings(snap.innings);
    setCurrentOver(snap.currentOver);
    setInning(snap.inning);
    setBat(snap.battingTeam);
    setMatchEnded(false);
    setMatchStatus("");
    setExtras({ ...INIT_EX });
  }

  /* ══ CHECK INNINGS / MATCH END ══ */
  /* ══ SAVE IN-PROGRESS MATCH ══ */
  async function saveInProgress(li, curOver, curBattingTeam, curInning) {
    const breakdown = extractBestPerformances(li, matchConfig.team1, matchConfig.team2, curBattingTeam ?? battingTeam);
    const snap = {
      _id:         currentMatchId,
      date:        new Date().toLocaleDateString("en-IN"),
      time:        new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }),
      team1:       matchConfig.team1,
      team2:       matchConfig.team2,
      inn1:        safeInn(li[0]),
      inn2:        safeInn(li[1]),
      status:      "In Progress",
      battingTeam: curBattingTeam ?? battingTeam,
      inning:      curInning      ?? inning,
      matchConfig: { ...matchConfig },
      currentOver: Array.isArray(curOver) ? [...curOver] : [],
      manOfTheMatch: null,
      bestBatting: breakdown.bestBatting,
      bestBowling: breakdown.bestBowling,
    };
    try {
      const saved = await saveMatch(snap);
      setCurrentMatchId(saved._id);
      setHistory(prev => {
        const idx = prev.findIndex(h => String(h._id) === String(saved._id));
        if (idx !== -1) { const n = [...prev]; n[idx] = saved; return n; }
        return [saved, ...prev];
      });
    } catch (err) {
      console.error("Failed to save to MongoDB:", err);
    }
  }

  function checkEnd(li) {
    if (!li) return;
    const cur     = li[inning - 1];
    const allOut  = cur.wickets >= matchConfig.playersPerTeam - 1;
    const oversUp = cur.balls   >= matchConfig.overs * 6;

    if (inning === 1 && (allOut || oversUp)) {
      const b2  = battingTeam === "team1" ? "team2" : "team1";
      const bp  = b2 === "team1" ? team1Players : team2Players;
      const bwp = b2 === "team1" ? team2Players : team1Players;
      setInnings(prev => {
        const n = deepCopyInnings(prev);
        n[1] = { ...INIT_INN(), batsmen: bp.map(mkBat), bowlers: bwp.map(mkBowl) };
        return n;
      });
      setBat(b2); setInning(2); setCurrentOver([]); setUndoStack([]);
      return "innings_change";
    }

    if (inning === 2) {
      const tgt = li[0].runs + 1;
      if (cur.runs >= tgt || allOut || oversUp) {
        const wName = battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2;
        const lName = battingTeam === "team1" ? matchConfig.team2 : matchConfig.team1;
        let res = cur.runs >= tgt
          ? `${wName} won by ${(matchConfig.playersPerTeam - 1) - cur.wickets} wickets!`
          : li[0].runs > cur.runs ? `${lName} won by ${li[0].runs - cur.runs} runs!`
          : cur.runs > li[0].runs ? `${wName} won!`
          : "Match tied!";
        const performer = findManOfTheMatch(li, matchConfig.team1, matchConfig.team2, battingTeam);
        const breakdown = extractBestPerformances(li, matchConfig.team1, matchConfig.team2, battingTeam);
        setMatchStatus(res); setMatchEnded(true); setManOfTheMatch(performer);
        saveMatch({
          _id: currentMatchId,
          date: new Date().toLocaleDateString("en-IN"),
          time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }),
          team1: matchConfig.team1, team2: matchConfig.team2,
          inn1: safeInn(li[0]), inn2: safeInn(li[1]),
          status: res, battingTeam, inning: 2,
          matchConfig: { ...matchConfig }, currentOver: [],
          manOfTheMatch: performer,
          bestBatting: breakdown.bestBatting,
          bestBowling: breakdown.bestBowling,
        }).then(saved => {
          setCurrentMatchId(saved._id);
          setHistory(prev => {
            const idx = prev.findIndex(h => String(h._id) === String(saved._id));
            if (idx !== -1) { const n = [...prev]; n[idx] = saved; return n; }
            return [saved, ...prev];
          });
        }).catch(err => console.error("Failed to save completed match:", err));
        return "ended";
      }
    }
    return null;
  }

  const swapBat = () => setInnings(p => {
    const n = deepCopyInnings(p);
    const cur = n[inning - 1];
    cur.activeBat = [cur.activeBat[1], cur.activeBat[0]];
    return n;
  });

  const changeBowler = () => setInnings(p => {
    const n = deepCopyInnings(p);
    const cur = n[inning - 1];
    cur.activeBowler = (cur.activeBowler + 1) % cur.bowlers.length;
    return n;
  });

  /* ══ PAGE TITLE ══ */
  const pageTitle = {
    home:"Dashboard", setup:"New Match",
    match:`${matchConfig.team1} vs ${matchConfig.team2}`,
    analysis:"Analysis", history:"Match History",
  }[screen] || "cricX";

  /* ══ SHARED COMPONENT PROPS ══ */
  const ScoreProps = { inn, inning, batName, target, runsNeeded, ballsLeft, rrr, isDesktop };
  const TeamsProps = { innings, t1Name:matchConfig.team1, t2Name:matchConfig.team2, currentInning:inning, battingTeam, matchConfig, isDesktop, onStatsClick: () => setShowLiveStats(true) };
  const MATCH_TABS = [["scoreboard","Score"],["overs","Overs"],["players","Players"],["squads","Squads"]];

  /* ══ HISTORY CARDS (Home screen + History screen) ══ */
  const renderHistoryCards = (showStartBtn = false) => (
    <div className={isDesktop ? "scroll-area scroll-area--desktop" : "scroll-area"}>
      {showStartBtn && !isDesktop && (
        <button className="btn-green btn-green--full" style={{ marginBottom:14, padding:16, fontSize:16 }}
          onClick={goToNewMatch}>🏏 Start New Match</button>
      )}
      <div className={isDesktop ? "grid-2" : ""}>
        {history.map((h, i) => (
          <div key={i} className="card">
            <div style={{ fontSize:11, color:"var(--c-muted)", marginBottom:10, fontWeight:600 }}>{h.date} – {h.time}</div>
            {[[h.team1, h.inn1, false],[h.team2, h.inn2, true]].map(([name, hinn, dark], j) => {
              const si = safeInn(hinn);
              return (
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:j?8:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div className={`team-badge team-badge--sm${dark?" team-badge--dark":""}`}>{name.slice(0,2).toUpperCase()}</div>
                    <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
                  </div>
                  <span style={{ fontWeight:800, fontSize:15 }}>
                    {si.runs}/{si.wickets}
                    <span style={{ color:"var(--c-muted)", fontWeight:400, fontSize:12 }}> ({Math.floor(si.balls/6)}.{si.balls%6})</span>
                  </span>
                </div>
              );
            })}
            <div style={{ marginTop:10, fontSize:13, color:"var(--c-primary)", fontWeight:600 }}>{h.status}</div>
            <hr className="divider" />
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <button className="btn-link" onClick={() => resumeMatch(h)}>▶ Resume</button>
              <button className="btn-link" onClick={() => setScoreboardMatch(h)}>📋 Scoreboard</button>
              <button style={{ background:"none", border:"none", color:"var(--c-faint)", cursor:"pointer", marginLeft:"auto", fontSize:16 }}
                onClick={async () => {
                  try { if (h._id) await deleteMatch(h._id); } catch (e) { console.error(e); }
                  setHistory(prev => prev.filter((_,idx) => idx !== i));
                }}>🗑</button>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">🏏</span>
            <p className="empty-state__title">No matches yet</p>
            <p className="empty-state__sub">Start a new match to get going!</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ══ MATCH LAYOUT COMPONENTS ══ */
  const LeftColumn = () => (
    <div className="match-desktop-left">
      <ScoreHero {...ScoreProps} />
      <TeamsBar  {...TeamsProps} />
      <ActivePlayers inn={inn} />
      {!matchEnded && <>
        <ThisOver currentOver={currentOver} />
        <ExtrasPanel extras={extras} setExtras={setExtras} onSwap={swapBat} onChangeBowler={changeBowler} />
        <RunPad onAddBall={addBall} onUndo={undoLastBall} onAnalysis={() => setScreen("analysis")} runAnim={runAnim} />
      </>}
    </div>
  );

  // Team names per innings — based on who batted first
  const inn1BatName  = battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2;
  const inn1BowlName = battingTeam === "team1" ? matchConfig.team2 : matchConfig.team1;
  const inn2BatName  = battingTeam === "team1" ? matchConfig.team2 : matchConfig.team1;
  const inn2BowlName = battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2;
  const inn2Started  = innings[1].balls > 0 || innings[1].batsmen.some(b => b.balls > 0);

  const RightTabContent = () => {
    if (matchTab === "scoreboard") return (
      <>
        <FullBatCard  inn={innings[0]} batName={inn1BatName + " \u2013 1st Inn"} />
        <FullBowlCard inn={innings[0]} bowlName={inn1BowlName} />
        {inn2Started && <>
          <FullBatCard  inn={innings[1]} batName={inn2BatName + " \u2013 2nd Inn"} />
          <FullBowlCard inn={innings[1]} bowlName={inn2BowlName} />
        </>}
      </>
    );
    if (matchTab === "overs") return (
      <>
        <div className="sec-title" style={{ padding:"0 4px 8px" }}>{inn1BatName} {"\u2013"} 1st Innings</div>
        <Overs completedOvers={innings[0].overs} currentOver={inning === 1 ? currentOver : []} />
        {(innings[1].overs.length > 0 || (inning === 2 && currentOver.length > 0)) && <>
          <div className="sec-title" style={{ padding:"16px 4px 8px" }}>{inn2BatName} {"\u2013"} 2nd Innings</div>
          <Overs completedOvers={innings[1].overs} currentOver={inning === 2 ? currentOver : []} />
        </>}
      </>
    );
    if (matchTab === "players")   return <PlayerList inn={inn} title={`${batName} \u2013 Players`} />;
    if (matchTab === "squads")    return <Squads team1={matchConfig.team1} team2={matchConfig.team2} players1={team1Players} players2={team2Players} isDesktop={isDesktop} />;
    return null;
  };

  const MobileTabContent = () => {
    if (matchTab==="scoreboard") return (<>
      <ScoreHero {...ScoreProps} />
      <ActivePlayers inn={inn} />
      {!matchEnded && <>
        <ThisOver currentOver={currentOver} />
        <ExtrasPanel extras={extras} setExtras={setExtras} onSwap={swapBat} onChangeBowler={changeBowler} />
        <RunPad onAddBall={addBall} onUndo={undoLastBall} onAnalysis={() => setScreen("analysis")} runAnim={runAnim} />
      </>}
      <FullBatCard inn={inn} batName={batName} />
      <FullBowlCard inn={inn} bowlName={bowlName} />
    </>);
    if (matchTab==="overs")   return <Overs completedOvers={inn.overs} currentOver={currentOver} />;
    if (matchTab==="players") return <PlayerList inn={inn} title={`${batName} – Players`} />;
    if (matchTab==="squads")  return <Squads team1={matchConfig.team1} team2={matchConfig.team2} players1={team1Players} players2={team2Players} isDesktop={false} />;
    return null;
  };

  const MatchContent = () => {
    if (isDesktop) return (
      <div className="match-desktop-layout">
        <LeftColumn />
        <div className="match-desktop-right">
          <div className="tab-bar">
            {MATCH_TABS.map(([k,l]) => <button key={k} className={`tab-bar__tab tab-bar__tab--desktop${matchTab===k?" active":""}`} onClick={()=>setMatchTab(k)}>{l}</button>)}
          </div>
          <div className="match-desktop-right__scroll"><RightTabContent /></div>
        </div>
      </div>
    );
    return (<>
      <TeamsBar {...TeamsProps} />
      <div className="tab-bar">
        {MATCH_TABS.map(([k,l]) => <button key={k} className={`tab-bar__tab${matchTab===k?" active":""}`} onClick={()=>setMatchTab(k)}>{l}</button>)}
      </div>
      <div className="scroll-area"><MobileTabContent /></div>
    </>);
  };

  /* ══ AUTH HANDLER ══ */
  async function handleAuth(mode, name, email, password) {
    const user = mode === "signup"
      ? await signUp(name, email, password)
      : await signIn(email, password);
    setCurrentUser(user);
    // Load this user's matches after login
    fetchHistory()
      .then(data => setHistory(data))
      .catch(() => setHistory(SAMPLE_HISTORY));
  }

  function handleSignOut() {
    signOut();
    setCurrentUser(null);
    setHistory([]);
    setMatchStarted(false);
    setCurrentMatchId(null);
    setScreen("home");
  }

  /* ══ RENDER SCREEN ══ */
  const renderScreen = () => {
    switch (screen) {
      case "home":     return renderHistoryCards(true);
      case "setup":    return <MatchSetup config={tmpConfig} setConfig={setTmpConfig} team1Players={team1Players} setTeam1Players={setT1} team2Players={team2Players} setTeam2Players={setT2} onStartMatch={startMatch} isDesktop={isDesktop} />;
      case "match":    return <MatchContent />;
      case "analysis": return <Analysis innings={innings} t1Name={matchConfig.team1} t2Name={matchConfig.team2} isDesktop={isDesktop} history={history} />;
      case "history":  return <History history={history} isDesktop={isDesktop} onResume={resumeMatch} onScoreboard={setScoreboardMatch} onDelete={async (i, h) => {
          try { if (h && h._id) await deleteMatch(h._id); } catch (e) { console.error(e); }
          setHistory(prev => prev.filter((_,idx) => idx !== i));
        }} />;
      default:         return null;
    }
  };

  /* ══ AUTH GATE ══ */
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#1a0e3a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#a78bfa", fontSize:18, fontWeight:700 }}>Loading cricX...</div>
    </div>
  );
  if (!currentUser) return <Auth onAuth={handleAuth} />;

  /* ══ DESKTOP LAYOUT ══ */
  if (isDesktop) return (
    <div className="app-root">
      <NotificationsDropdown visible={showNotifications} history={history} onClose={() => setShowNotifications(false)} onResume={(h) => { resumeMatch(h); setShowNotifications(false); }} onOpenHistory={() => { goTo('history'); setShowNotifications(false); }} />
      <Modal scoreboardMatch={scoreboardMatch} onClose={() => setScoreboardMatch(null)} />
      <LiveStatsOverlay
        showLiveStats={showLiveStats}
        innings={innings}
        inn1BatName={inn1BatName}
        inn1BowlName={inn1BowlName}
        inn2BatName={inn2BatName}
        inn2BowlName={inn2BowlName}
        inn2Started={inn2Started}
        onClose={() => setShowLiveStats(false)}
      />
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">cric<span className="sidebar__logo-x">X</span></div>
          <div className="sidebar__tagline">Cricket Scorer</div>
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`sidebar__nav-btn${screen===item.id||(screen==="setup"&&item.id==="home")?" active":""}`} onClick={() => goTo(item.id)}>
              <span className="sidebar__nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button className="btn-green btn-green--full btn-green--ghost btn-green--sm" onClick={goToNewMatch}>+ New Match</button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <div>
            <h1 className="topbar__title">{pageTitle}</h1>
            {screen==="match" && <p className="topbar__subtitle">Live · {inning===2?"2nd":"1st"} Innings</p>}
          </div>
          <div className="topbar__actions">
            {screen==="match" && <><IconBtn onClick={() => setScreen("analysis")}>📈 Analysis</IconBtn><IconBtn>↗ Share</IconBtn></>}
            <UserBadge currentUser={currentUser} onSignOut={handleSignOut} history={history} onResume={resumeMatch} onOpenHistory={() => goTo('history')} />
          </div>
        </div>
        <ResultBanner matchEnded={matchEnded} screen={screen} matchStatus={matchStatus} />
        {matchEnded && manOfTheMatch && <PerformerCard performer={manOfTheMatch} />}
        <div className="content-area">{renderScreen()}</div>
      </div>
    </div>
  );

  /* ══ TABLET LAYOUT ══ */
  if (isTablet) return (
    <div className="app-root">
      <NotificationsDropdown visible={showNotifications} history={history} onClose={() => setShowNotifications(false)} onResume={(h) => { resumeMatch(h); setShowNotifications(false); }} onOpenHistory={() => { goTo('history'); setShowNotifications(false); }} />
      <Modal scoreboardMatch={scoreboardMatch} onClose={() => setScoreboardMatch(null)} />
      <LiveStatsOverlay
        showLiveStats={showLiveStats}
        innings={innings}
        inn1BatName={inn1BatName}
        inn1BowlName={inn1BowlName}
        inn2BatName={inn2BatName}
        inn2BowlName={inn2BowlName}
        inn2Started={inn2Started}
        onClose={() => setShowLiveStats(false)}
      />
      <aside className="sidebar-compact">
        <div className="sidebar-compact__logo">cX</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`sidebar-compact__btn${screen===item.id?" active":""}`} title={item.label} onClick={() => goTo(item.id)}>{item.icon}</button>
        ))}
      </aside>
      <div className="main-area">
        <div className="topbar topbar--tablet">
          <span className="topbar__title" style={{ fontSize:17 }}>{pageTitle}</span>
          <div className="topbar__actions">
            {screen==="match" && <IconBtn onClick={() => setScreen("analysis")}>📈</IconBtn>}
            <UserBadge currentUser={currentUser} onSignOut={handleSignOut} history={history} onResume={resumeMatch} onOpenHistory={() => goTo('history')} />
          </div>
        </div>
        <ResultBanner matchEnded={matchEnded} screen={screen} matchStatus={matchStatus} />
        {matchEnded && manOfTheMatch && <PerformerCard performer={manOfTheMatch} />}
        <div className="content-area">{renderScreen()}</div>
      </div>
    </div>
  );

  /* ══ MOBILE LAYOUT ══ */
  return (
    <div className="layout-mobile">
      <NotificationsDropdown visible={showNotifications} history={history} onClose={() => setShowNotifications(false)} onResume={(h) => { resumeMatch(h); setShowNotifications(false); }} onOpenHistory={() => { goTo('history'); setShowNotifications(false); }} />
      <Modal scoreboardMatch={scoreboardMatch} onClose={() => setScoreboardMatch(null)} />
      <LiveStatsOverlay
        showLiveStats={showLiveStats}
        innings={innings}
        inn1BatName={inn1BatName}
        inn1BowlName={inn1BowlName}
        inn2BatName={inn2BatName}
        inn2BowlName={inn2BowlName}
        inn2Started={inn2Started}
        onClose={() => setShowLiveStats(false)}
      />
      <header className="mobile-header">
        {screen==="home" ? (
          <span className="mobile-header__logo">cric<span className="mobile-header__logo-x">X</span><span className="mobile-header__scorer"> scorer</span></span>
        ) : (
          <button className="mobile-header__back" onClick={() => screen==="analysis" ? setScreen("match") : setScreen("home")}>←</button>
        )}
        {screen !== "home" && <span className="mobile-header__title">{pageTitle}</span>}
        <div className="mobile-header__actions">
          {screen==="home"  && <UserBadge currentUser={currentUser} onSignOut={handleSignOut} history={history} onResume={resumeMatch} onOpenHistory={() => goTo('history')} />}
          {screen==="match" && <><IconBtn onClick={() => setScreen("analysis")}>📈</IconBtn><IconBtn>↗</IconBtn></>}
          {(screen==="setup"||screen==="history"||screen==="analysis") && <div style={{ width:40 }} />}
        </div>
      </header>
      <ResultBanner mobile matchEnded={matchEnded} screen={screen} matchStatus={matchStatus} />
      {matchEnded && manOfTheMatch && <PerformerCard performer={manOfTheMatch} />}
      <div className="content-area">{renderScreen()}</div>
      {(screen==="home"||screen==="history") && (
        <nav className="bottom-nav">
          {[["home","🏠","Home"],["match","🏏","Match"],["analysis","📈","Analysis"],["history","🕐","History"]].map(([id,icon,label]) => (
            <button key={id} className={`bottom-nav__btn${screen===id?" active":""}`} onClick={() => goTo(id)}>
              {icon}<span className="bottom-nav__label">{label}</span>
            </button>
          ))} 
        </nav>
      )}
    </div>
  );
}