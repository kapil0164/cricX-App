import { useState } from "react";
import "./MatchSetup.css";

/* ── FormRow defined OUTSIDE the component so it never
   remounts on re-render (which caused focus loss) ── */
function FormRow({ label, children }) {
  return (
    <>
      <label className="form-label">{label}</label>
      <div className="card">{children}</div>
    </>
  );
}

export default function MatchSetup({
  config, setConfig,
  team1Players, setTeam1Players,
  team2Players, setTeam2Players,
  onStartMatch, isDesktop,
}) {
  const [step, setStep] = useState(1);

  /* Update any config key — always stores the raw string/value
     so inputs are fully controlled and backspace works */
  const upd = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  /* For number fields, store raw string while typing so the
     user can fully clear the field, then parse on blur */
  const updNum = (k, raw, min, fallback) => {
    // Allow the field to show whatever the user types (including empty)
    upd(k, raw);
  };

  const blurNum = (k, raw, fallback) => {
    const n = parseInt(raw, 10);
    upd(k, isNaN(n) ? fallback : n);
  };

  /* ── Step 2 / 3: player names ── */
  if (step === 2 || step === 3) {
    const is1    = step === 2;
    const players = is1 ? team1Players : team2Players;
    const setP    = is1 ? setTeam1Players : setTeam2Players;
    const tName   = is1 ? config.team1 : config.team2;

    return (
      <div className={`setup-scroll${isDesktop ? " setup-scroll--desktop" : ""}`}>
        <p className="form-label" style={{ marginTop: 0 }}>
          {tName} – Enter Players
        </p>
        <div className="card">
          <div className={isDesktop ? "player-entry-grid" : "player-entry-list"}>
            {players.slice(0, config.playersPerTeam).map((p, i) => (
              <div key={i} className="player-entry-row">
                <span className="player-entry-num">{i + 1}.</span>
                <input
                  className="player-entry-input"
                  value={p}
                  onChange={e => {
                    const n = [...players];
                    n[i] = e.target.value;
                    setP(n);
                  }}
                  placeholder={`Player ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="setup-footer">
          <button
            className="btn-green btn-green--full"
            style={{ padding: 16, fontSize: 15 }}
            onClick={() => step === 2 ? setStep(3) : onStartMatch()}
          >
            {step === 2 ? `Next: ${config.team2 || "Team 2"} Players →` : "🏏 Start Match"}
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn-link" onClick={() => setStep(s => s - 1)}>← Back</button>
        </div>
      </div>
    );
  }

  /* ── Step 1: match config ── */
  return (
    <div className={`setup-scroll${isDesktop ? " setup-scroll--desktop" : ""}`}>
      <div className={isDesktop ? "grid-2-form" : ""}>

        {/* ── Left column ── */}
        <div>
          <FormRow label="Teams">
            {/* KEY FIX: value is the raw string, onChange stores raw string.
                No coercion, no fallback — backspace works naturally. */}
            <input
              className="form-input"
              value={config.team1}
              onChange={e => upd("team1", e.target.value)}
              placeholder="Host Team"
              autoComplete="off"
            />
            <input
              className="form-input"
              value={config.team2}
              onChange={e => upd("team2", e.target.value)}
              placeholder="Visitor Team"
              autoComplete="off"
              style={{ marginTop: 10 }}
            />
          </FormRow>

          <FormRow label="Toss won by?">
            {[
              ["team1", config.team1 || "Host Team"],
              ["team2", config.team2 || "Visitor Team"],
            ].map(([v, l]) => (
              <label key={v} className="form-radio-label">
                <input
                  type="radio"
                  name="toss"
                  checked={config.tossWon === v}
                  onChange={() => upd("tossWon", v)}
                  style={{ accentColor: "var(--c-primary)" }}
                />
                {l}
              </label>
            ))}
          </FormRow>

          <FormRow label="Opted to?">
            {[["bat", "🏏 Bat"], ["bowl", "⚾ Bowl"]].map(([v, l]) => (
              <label key={v} className="form-radio-label">
                <input
                  type="radio"
                  name="opted"
                  checked={config.optedTo === v}
                  onChange={() => upd("optedTo", v)}
                  style={{ accentColor: "var(--c-primary)" }}
                />
                {l}
              </label>
            ))}
          </FormRow>
        </div>

        {/* ── Right column ── */}
        <div>
          <FormRow label="Overs">
            {/* FIX: store raw string while typing, parse only on blur */}
            <input
              className="form-input"
              type="number"
              min={1}
              max={50}
              value={config.overs}
              onChange={e => updNum("overs", e.target.value)}
              onBlur={e  => blurNum("overs", e.target.value, 8)}
            />
          </FormRow>

          <FormRow label="Players per team">
            <input
              className="form-input"
              type="number"
              min={2}
              max={11}
              value={config.playersPerTeam}
              onChange={e => updNum("playersPerTeam", e.target.value)}
              onBlur={e  => blurNum("playersPerTeam", e.target.value, 6)}
            />
          </FormRow>

          <FormRow label="No Ball Run">
            <input
              className="form-input"
              type="number"
              min={0}
              value={config.noBallRun}
              onChange={e => updNum("noBallRun", e.target.value)}
              onBlur={e  => blurNum("noBallRun", e.target.value, 1)}
            />
          </FormRow>

          <FormRow label="Wide Ball Run">
            <input
              className="form-input"
              type="number"
              min={0}
              value={config.wideBallRun}
              onChange={e => updNum("wideBallRun", e.target.value)}
              onBlur={e  => blurNum("wideBallRun", e.target.value, 1)}
            />
          </FormRow>
        </div>
      </div>

      <div className="setup-footer">
        <button
          className="btn-green btn-green--full"
          style={{ padding: 16, fontSize: 15 }}
          onClick={() => setStep(2)}
        >
          Next: Enter Players →
        </button>
      </div>
    </div>
  );
}